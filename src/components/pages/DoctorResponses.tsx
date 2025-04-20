import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./userMenu";
import { styles } from "../../styles/sharedStyles";

interface Survey {
  id: number;
  title: string;
  description: string;
}

interface Response {
  question_id: number;
  question_text: string;
  response_text: string;
}

const DoctorResponses: React.FC = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userId") || "1";
  const doctorName = localStorage.getItem("username") || "Doctor";

  useEffect(() => {
    fetch(`http://localhost:5050/survey-assignments/${userId}`)
      .then((res) => res.json())
      .then((data) => setSurveys(data))
      .catch((err) => console.error("Error loading surveys:", err));
  }, [userId]);

  const handleSurveySelect = (id: number) => {
    setSelectedSurveyId(id);
    setLoading(true);
    fetch(`http://localhost:5050/responses?survey_id=${id}&user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setResponses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching responses:", err);
        setLoading(false);
      });
  };

  return (
    <div className={styles.fullPageClass}>
      <div className={styles.navBarClass}>
        <div className="flex gap-4">
          <button className={styles.navButtonClass} onClick={() => navigate("/surveys")}>Surveys</button>
          <button className={styles.navButtonClass} onClick={() => navigate("/responses")}>Responses</button>
          <button className={styles.navButtonClass} onClick={() => navigate("/invites")}>Invites</button>
        </div>
        <UserMenu username={doctorName} />
      </div>

      <div className={`${styles.contentAreaClass} ${styles.sectionPadding}`}>
        <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">My Survey Responses</h2>

          <label className="block font-medium mb-2">Select a Survey:</label>
          <select
            onChange={(e) => handleSurveySelect(Number(e.target.value))}
            value={selectedSurveyId ?? ""}
            className="border p-2 rounded mb-4 w-full"
          >
            <option value="" disabled>Select a survey</option>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>

          {loading ? (
            <p className="text-gray-600">Loading responses...</p>
          ) : responses.length > 0 ? (
            <div className="space-y-4">
              {responses.map((r, i) => (
                <div key={i} className="border rounded p-4 bg-gray-50">
                  <p className="font-semibold text-gray-800">{r.question_text}</p>
                  <p className="text-gray-700 mt-2">{r.response_text || <em>No answer provided</em>}</p>
                </div>
              ))}
            </div>
          ) : (
            selectedSurveyId && <p className="text-gray-500 italic">No responses found for this survey.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorResponses;
