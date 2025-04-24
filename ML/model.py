import pandas as pd
import tensorflow_decision_forests as tfdf
import tensorflow as tf
from sklearn.model_selection import train_test_split


training_data = pd.read_csv('./ML/training_data.csv')
training_data = training_data.loc[:, ~training_data.columns.str.contains('^Unnamed')]
train_df, test_df = train_test_split(training_data, test_size=0.2, random_state=42)
train_ds = tfdf.keras.pd_dataframe_to_tf_dataset(train_df, label="label")
test_ds = tfdf.keras.pd_dataframe_to_tf_dataset(test_df, label="label")
model = tfdf.keras.RandomForestModel()
model.fit(train_ds)

model.evaluate(test_ds)
inspector = model.make_inspector()
importances = inspector.variable_importances()

tf.saved_model.save(model, "./ML/model_dir")