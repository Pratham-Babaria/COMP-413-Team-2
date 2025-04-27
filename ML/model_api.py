from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine
import tensorflow as tf
import pandas as pd
import tensorflow_decision_forests as tfdf
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["*"] to allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
engine = create_engine("postgresql://postgres:comp413team2pwd@localhost:5432/isurvey")

# Load the model once at startup
model = tf.saved_model.load('./ML/model_dir')

def fetch_user_data(user_id: int, survey_id: int, engine):
    gaze_query = f"""
    WITH normalized_gaze AS (
        SELECT
            *,
            gaze_x / NULLIF(image_width, 0) AS norm_x,
            gaze_y / NULLIF(image_height, 0) AS norm_y
        FROM gaze_data
        WHERE user_id = {user_id} AND survey_id = {survey_id}
    ),
    with_center_flag AS (
        SELECT
            *,
            CASE
                WHEN norm_x BETWEEN 0.25 AND 0.75 AND norm_y BETWEEN 0.25 AND 0.75 THEN 1
                ELSE 0
            END AS in_center,
            FLOOR(norm_x * 10)::int AS grid_x,
            FLOOR(norm_y * 10)::int AS grid_y
        FROM normalized_gaze
    ),
    question_times AS (
        SELECT
            user_id,
            survey_id,
            question_id,
            MAX(timestamp) - MIN(timestamp) AS view_time_per_question
        FROM with_center_flag
        GROUP BY user_id, survey_id, question_id
    ),
    aggregated AS (
        SELECT
            user_id,
            survey_id,
            COUNT(*) AS num_gaze_points,
            AVG(norm_x) AS avg_gaze_x,
            AVG(norm_y) AS avg_gaze_y,
            STDDEV(norm_x) AS gaze_std_x,
            STDDEV(norm_y) AS gaze_std_y,
            SUM(in_center)::float / COUNT(*) AS center_focus_ratio,
            1 - (SUM(in_center)::float / COUNT(*)) AS perimeter_focus_ratio,
            COUNT(DISTINCT (grid_x, grid_y))::float / 100 AS unique_area_coverage
        FROM with_center_flag
        GROUP BY user_id, survey_id
    ),
    total_view_time AS (
        SELECT
            user_id,
            survey_id,
            SUM(view_time_per_question) AS total_view_time
        FROM question_times
        GROUP BY user_id, survey_id
    )
    SELECT
        a.*,
        t.total_view_time
    FROM aggregated a
    JOIN total_view_time t
      ON a.user_id = t.user_id AND a.survey_id = t.survey_id;
    """

    demo_query = f"""
    WITH filtered_responses AS (
        SELECT
            r.user_id,
            r.survey_id,
            q.question_text,
            r.response_text
        FROM responses r
        JOIN questions q ON r.question_id = q.id
        WHERE q.question_text IN (
            'How many years of dermatology experience do you have?',
            'Select your position:'
        )
        AND r.user_id = {user_id} AND r.survey_id = {survey_id}
    ),
    pivoted AS (
        SELECT
            user_id,
            survey_id,
            MAX(CASE WHEN question_text = 'How many years of dermatology experience do you have?' 
                     THEN response_text::FLOAT END) AS years_of_experience,
            MAX(CASE WHEN question_text = 'Select your position:' 
                     THEN response_text END) AS title
        FROM filtered_responses
        GROUP BY user_id, survey_id
    )
    SELECT * FROM pivoted;
    """

    gaze_df = pd.read_sql(gaze_query, engine)
    demo_df = pd.read_sql(demo_query, engine)
    final_df = pd.merge(gaze_df, demo_df, on=["user_id", "survey_id"])

    return final_df

class SubmissionRequest(BaseModel):
    user_id: int
    survey_id: int

@app.post("/predict")
def predict_user(data: SubmissionRequest):
    df = fetch_user_data(data.user_id, data.survey_id, engine)

    if df.empty:
        return {"status": "error", "message": "No data found for this user/survey"}

    # Drop identifier columns
    features = df
    
    if features.empty or features.shape[0] == 0:
        return {"status": "error", "message": "No features available for prediction"}
    
    input_data = {
    'avg_gaze_x': tf.convert_to_tensor(features['avg_gaze_x'], dtype=tf.float32),
    'avg_gaze_y': tf.convert_to_tensor(features['avg_gaze_y'], dtype=tf.float32),
    'center_focus_ratio': tf.convert_to_tensor(features['center_focus_ratio'], dtype=tf.float32),
    'gaze_std_x': tf.convert_to_tensor(features['gaze_std_x'], dtype=tf.float32),
    'gaze_std_y': tf.convert_to_tensor(features['gaze_std_y'], dtype=tf.float32),
    'num_gaze_points': tf.convert_to_tensor(features['num_gaze_points'], dtype=tf.int64),
    'perimeter_focus_ratio': tf.convert_to_tensor(features['perimeter_focus_ratio'], dtype=tf.float32),
    'survey_id': tf.convert_to_tensor(features['survey_id'], dtype=tf.int64),
    'title': tf.convert_to_tensor(features['title'], dtype=tf.string),
    'total_view_time': tf.convert_to_tensor(features['total_view_time'], dtype=tf.int64),
    'unique_area_coverage': tf.convert_to_tensor(features['unique_area_coverage'], dtype=tf.float32),
    'user_id': tf.convert_to_tensor(features['user_id'], dtype=tf.int64),
    'years_of_experience': tf.convert_to_tensor(features['years_of_experience'], dtype=tf.int64),
    }
    
    try:
        predict_function = model.signatures['serving_default']
        prediction = predict_function(**input_data)
        predicted_output = prediction['output_1']
        label = tf.cast(predicted_output >= 0.5, tf.int32)
        prediction = 'Expert' if label == 1 else 'Novice'
        print("Predicted output: ", prediction)
    except Exception as e:
        return {"status": "error", "message": f"Prediction failed: {str(e)}"}

    try:
        api_url = "https://isurvey-backend.onrender.com/classifications"
        payload = {
            "user_id": data.user_id,
            "survey_id": data.survey_id,
            "result": str(prediction)
        }
        response = requests.post(api_url, json=payload)
        response.raise_for_status()
        print("hello")
    except requests.RequestException as e:
        return {"status": "warning", "prediction": str(predicted_output), "db_post_error": str(e)}

    return {
        "status": "success",
        "prediction": str(prediction)
    }