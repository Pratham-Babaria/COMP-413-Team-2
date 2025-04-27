import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import h337 from "heatmap.js";

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options?: string[];
  image_url?: string;
}

interface Response {
  id: number;
  survey_id: number;
  user_id: number;
  question_id: number;
  response_text: string;
}

interface User {
  id: number;
  username: string;
}

const AdminResponses: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [surveyTitle, setSurveyTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [classification, setClassification] = useState<string | null>(null);

  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [heatmapData, setHeatmapData] = useState<{ x: number; y: number; value: number; timestamp: number }[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);


useEffect(() => {
    if (!surveyId) return;
  
    fetch(`https://isurvey-backend.onrender.com/surveys/${surveyId}`)
      .then(res => res.json())
      .then(data => setSurveyTitle(data.title));
  
    fetch(`https://isurvey-backend.onrender.com/surveys/${surveyId}/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data));
  
    fetch(`https://isurvey-backend.onrender.com/responses?survey_id=${surveyId}`)
      .then(res => res.json())
      .then((data: Response[]) => {
        setResponses(data);
  
        // extract unique user IDs from the responses
        const userIds = Array.from(new Set(data.map(r => r.user_id)));
  
        // fetch all users, then match the relevant ones
        fetch("https://isurvey-backend.onrender.com/users")
          .then(res => res.json())
          .then((allUsers: User[]) => {
            const relevantUsers = allUsers.filter(u => userIds.includes(u.id));
            setUsers(relevantUsers);
            if (relevantUsers.length > 0) setSelectedUserId(relevantUsers[0].id);
          });
      });
  }, [surveyId]);

  useEffect(() => {
    if (selectedUserId !== null) {
      const fetchClassification = async () => {
        try {
          const response = await fetch(
            `https://isurvey-backend.onrender.com/classifications?user_id=${selectedUserId}&survey_id=${surveyId}`
          );
          if (!response.ok) throw new Error("Failed to fetch classification");
          const data = await response.json();
          setClassification(data[0].result);
        } catch (error) {
          console.error(error);
          setClassification(null);
        }
      };
  
      fetchClassification();
    }
  }, [selectedUserId, surveyId]);

useEffect(() => {
    if (!showHeatmapModal || heatmapData.length === 0) return;
  
    const container = document.getElementById("heatmap-modal-container");
    if (!container) return;
  
    const heatmapInstance = h337.create({
      container,
      radius: 25,
      maxOpacity: 0.7,
      blur: 0.9,
      gradient: {
        '.0': 'blue',
        '.25': 'green',
        '.5': 'yellow',
        '.75': 'orange',
        '1.0': 'red',
      },
    });
  
    const sorted = [...heatmapData].sort((a, b) => a.timestamp - b.timestamp);
    const freq = new Map<string, number>();
    let trueMax = 0;
  
    // Build full map first
    sorted.forEach(({ x, y }) => {
      const key = `${Math.round(x)},${Math.round(y)}`;
      const count = (freq.get(key) || 0) + 1;
      freq.set(key, count);
      trueMax = Math.max(trueMax, count);
    });
  
    const finalData = Array.from(freq.entries()).map(([key, value]) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, value };
    });
  
    // Start blank
    heatmapInstance.setData({ max: trueMax, data: [] });

    console.log(`Rendering heatmap with ${sorted.length} gaze points.`);
  
    let idx = 0;
    const ANIMATION_INTERVAL = 100;
  
    const timer = setInterval(() => {
      if (idx >= sorted.length) {
        clearInterval(timer);
        // Don't call setData here. The heatmap is already populated via addData.
        return;
      }
  
      const { x, y } = sorted[idx++];
      heatmapInstance.addData({ x: Math.round(x), y: Math.round(y), value: 1 });
    }, ANIMATION_INTERVAL);
  
    return () => clearInterval(timer);
  }, [showHeatmapModal, heatmapData]);

const fetchGazeData = async (questionId: number, imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedQuestionId(questionId);
    setShowHeatmapModal(true);
  
    // Wait for the modal to render
    setTimeout(async () => {
      const res = await fetch(
        `https://isurvey-backend.onrender.com/gaze_data?survey_id=${surveyId}&user_id=${selectedUserId}&question_id=${questionId}`
      );
      const data = await res.json();
  
      const img = document.querySelector("#heatmap-modal-container img");
      if (!img) return;
  
      const imgWidth = img.clientWidth;
      const imgHeight = img.clientHeight;
  
      const formatted = data.map((d: any) => ({
        x: Math.round((d.gaze_x / d.image_width) * imgWidth),
        y: Math.round((d.gaze_y / d.image_height) * imgHeight),
        value: 1,
        timestamp: d.timestamp,
      }));
  
      setHeatmapData(formatted);
    }, 0); // wait 1 frame for DOM render
  };
  
  const filteredResponses = responses.filter(
    r => r.user_id === selectedUserId
  );

  const getResponseText = (questionId: number) => {
    const resp = filteredResponses.find(r => r.question_id === questionId);
    return resp ? resp.response_text : "";
  };

return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{surveyTitle} Responses</h2>
  
      {users.length > 0 ? (
        <div className="mb-6">
          <label className="block font-semibold mb-2">Select User</label>
          <select
            className="border rounded p-2 w-full"
            value={selectedUserId ?? ""}
            onChange={e => setSelectedUserId(Number(e.target.value))}
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-gray-600 italic mb-4">
          No responses have been submitted for this survey yet.
        </div>
      )}

{classification && (
  <div className="mb-6 p-6 bg-white border border-gray-400 rounded-xl shadow-xl">
  <p className="text-xl text-blue-500 font-bold mb-4">
    Classification Result: <span className="font-bold text-gray-700">{classification}</span>
  </p>
</div>
)}
  
      {questions.map(q => (
        <div key={q.id} className="mb-6">
          <label className="block font-semibold mb-1">{q.question_text}</label>
  
          {q.image_url && (
            <img
              src={q.image_url}
              alt="Question"
              className="mb-2 rounded max-h-48"
            />
          )}
          {q.image_url && (
            <button
                onClick={() => fetchGazeData(q.id, q.image_url!)}
                className="mt-2 bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700"
            >
                View Heatmap Data
            </button>
            )}

  
          <input
            type="text"
            className="w-full border rounded p-2 bg-gray-100"
            value={getResponseText(q.id)}
            readOnly
          />
        </div>
      ))}

        {showHeatmapModal && selectedImageUrl && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-2">Gaze Heatmap</h2>
            <div
                id="heatmap-modal-container"
                className="relative w-full max-h-[600px] overflow-hidden"
            >
                <img
                src={selectedImageUrl}
                alt="Gaze Heatmap"
                className="w-full object-contain rounded"
                />
            </div>
            <div className="mt-4 flex justify-end">
                <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => setShowHeatmapModal(false)}
                >
                Finish
                </button>
            </div>
            </div>
        </div>
        )}

    </div>
  );
};  
export default AdminResponses;