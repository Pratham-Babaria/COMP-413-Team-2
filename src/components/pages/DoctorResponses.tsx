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

const DoctorResponses: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [surveyTitle, setSurveyTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [heatmapData, setHeatmapData] = useState<{ x: number; y: number; value: number; timestamp: number }[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);

  const userId = localStorage.getItem("userId") || "1";

  useEffect(() => {
    if (!surveyId) return;

    fetch(`https://comp-413-team-2.onrender.com/surveys/${surveyId}`)
      .then(res => res.json())
      .then(data => setSurveyTitle(data.title));

    fetch(`https://comp-413-team-2.onrender.com/surveys/${surveyId}/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data));

    fetch(`https://comp-413-team-2.onrender.com/responses?survey_id=${surveyId}&user_id=${userId}`)
      .then(res => res.json())
      .then((data: Response[]) => setResponses(data));
  }, [surveyId, userId]);

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

    heatmapInstance.setData({ max: trueMax, data: [] });

    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= sorted.length) {
        clearInterval(timer);
        return;
      }
      const { x, y } = sorted[idx++];
      heatmapInstance.addData({ x: Math.round(x), y: Math.round(y), value: 1 });
    }, 100);

    return () => clearInterval(timer);
  }, [showHeatmapModal, heatmapData]);

  const fetchGazeData = async (questionId: number, imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedQuestionId(questionId);
    setShowHeatmapModal(true);

    setTimeout(async () => {
      const res = await fetch(
        `https://comp-413-team-2.onrender.com/gaze_data?survey_id=${surveyId}&user_id=${userId}&question_id=${questionId}`
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
    }, 0);
  };

  const getResponseText = (questionId: number) => {
    const resp = responses.find(r => r.question_id === questionId);
    return resp ? resp.response_text : "";
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">My Responses for {surveyTitle}</h2>

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

export default DoctorResponses;