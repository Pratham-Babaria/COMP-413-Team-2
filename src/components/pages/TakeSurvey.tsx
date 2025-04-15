import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Survey {
  id: number;
  title: string;
  description: string;
  created_by: number;
}

interface Question {
  id: number;
  survey_id: number;
  question_text: string;
}

const TakeSurvey: React.FC = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [message, setMessage] = useState("");

  // To do: get user id when login
  const userId = "1";

  // Fetch the survey and its questions
  useEffect(() => {
    if (!surveyId) return;

    // Load survey details
    fetch(`http://localhost:5050/surveys/${surveyId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load survey");
        return res.json();
      })
      .then((data: Survey) => setSurvey(data))
      .catch((err) => console.error("Error fetching survey:", err));

    // Load questions (short answer only)
    fetch(`http://localhost:5050/surveys/${surveyId}/questions`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions");
        return res.json();
      })
      .then((data: Question[]) => setQuestions(data))
      .catch((err) => console.error("Error fetching questions:", err));
  }, [surveyId]);


  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Submit all answers to the backend
  const handleSubmit = async () => {
    if (!surveyId || !userId) {
      alert("No valid surveyId or userId. Are you logged in?");
      return;
    }

    setMessage("");

    try {
      for (const question of questions) {
        const responseText = answers[question.id] || "";

        const payload = {
          survey_id: parseInt(surveyId, 10),
          user_id: parseInt(userId, 10),
          question_id: question.id,
          response_text: responseText,
        };

        const res = await fetch("http://localhost:5050/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to submit response");
        }
      }

      alert("All answers submitted successfully!");
      navigate("/doctor");
    } catch (err: any) {
      console.error("Error submitting answers:", err);
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      {survey ? (
        <>
          <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>{survey.title}</h2>
          <p style={{ marginBottom: "20px" }}>{survey.description}</p>

          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "bold" }}>{q.question_text}</label>
              <br />
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginTop: "5px",
                }}
              />
            </div>
          ))}

          <button
            onClick={handleSubmit}
            style={{
              backgroundColor: "#4f46e5",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Submit
          </button>

          {message && (
            <div style={{ marginTop: "20px" }}>
              <p>{message}</p>
            </div>
          )}
        </>
      ) : (
        <p>Loading survey...</p>
      )}
    </div>
  );
};

export default TakeSurvey;
