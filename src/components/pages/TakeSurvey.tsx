import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { styles } from "../../styles/sharedStyles";
import h337 from "heatmap.js";

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
  question_type: string;
  options?: string[];
  image_url?: string;
}

const TakeSurvey: React.FC = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [message, setMessage] = useState("");
  const userId = localStorage.getItem("userId") || "1";

  const heatmapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const heatmapInstances = useRef<any[]>([]);
  const gazePoints = useRef<any[]>([]);
  const gazeTrackingActive = useRef(false);
  const [trackingIndex, setTrackingIndex] = useState<number | null>(null);
  const [gazeApiReady, setGazeApiReady] = useState(false);
  const gazeDotRef = useRef<HTMLDivElement | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://api.gazerecorder.com/GazeCloudAPI.js";
    script.async = true;

    script.onload = () => {
      console.log("GazeCloudAPI loaded successfully.");
      setGazeApiReady(true);
    };

    script.onerror = () => {
      console.error("Failed to load GazeCloudAPI.");
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!surveyId) return;

    fetch(`http://localhost:5050/surveys/${surveyId}`)
      .then((res) => res.json())
      .then((data: Survey) => setSurvey(data));

    fetch(`http://localhost:5050/surveys/${surveyId}/questions`)
      .then((res) => res.json())
      .then((data: Question[]) => setQuestions(data));
  }, [surveyId]);

  useEffect(() => {
    // heatmapInstances.current = heatmapRefs.current.map((container) =>
    //   container
    //     ? h337.create({
    //         container,
    //         radius: 30,
    //         maxOpacity: 0.6,
    //         minOpacity: 0.2,
    //         blur: 0.75,
    //       })
    //     : null
    // );

    heatmapInstances.current = heatmapRefs.current.map((container) =>
      container
        ? h337.create({
            container,
            radius: 25,         // smaller radius = tighter clusters
            maxOpacity: 0.7,    // play around with contrast
            minOpacity: 0.1,
            blur: 0.9,          // more blur = stronger gradients
            gradient: { // play around with gradient
              '.0': 'blue',
              '.25': 'green',
              '.5': 'yellow',
              '.75': 'orange',
              '1.0': 'red'
            }
          })
        : null
    );
    
  }, [questions]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const startTracking = (index: number) => {
    const imageEl = imageRefs.current[index];
    const heatmap = heatmapInstances.current[index];
  
    if (!gazeApiReady || !imageEl || !heatmap || gazeTrackingActive.current) {
      console.warn("Preconditions not met for eye tracking.");
      return;
    }
  
    console.log("Starting eye tracking");
    window.GazeCloudAPI.StartEyeTracking();
    gazeTrackingActive.current = true;
    setTrackingIndex(index);
  
    // Create gaze dot
    if (!gazeDotRef.current) {
      const dot = document.createElement("div");
      dot.className = styles.gazeDot;
      document.body.appendChild(dot);
      gazeDotRef.current = dot;
    }
  
    window.GazeCloudAPI.OnResult = (GazeData: any) => {
      if (GazeData.state !== 0) return;
      const rect = imageEl.getBoundingClientRect();
      const gazeX = GazeData.GazeX - rect.left;
      const gazeY = GazeData.GazeY - rect.top;
  
      if (
        gazeX >= 0 &&
        gazeY >= 0 &&
        gazeX <= rect.width &&
        gazeY <= rect.height
      ) {
        const point = { gaze_x: gazeX, gaze_y: gazeY, timestamp: Date.now() };
        console.log("Tracked point", point);
        gazePoints.current.push(point);
  
        // Move gaze dot
        if (gazeDotRef.current) {
          gazeDotRef.current.style.left = `${GazeData.GazeX}px`;
          gazeDotRef.current.style.top = `${GazeData.GazeY}px`;
        }
      }
    };
  };


  const stopTracking = async () => {
    if (!gazeTrackingActive.current || trackingIndex === null) return;
    console.log("Stopping eye tracking");
  
    window.GazeCloudAPI.StopEyeTracking();
    gazeTrackingActive.current = false;
  
    // Remove the gaze dot from screen
    if (gazeDotRef.current) {
      gazeDotRef.current.remove();
      gazeDotRef.current = null;
    }
  
    const imageEl = imageRefs.current[trackingIndex];
    const heatmap = heatmapInstances.current[trackingIndex];
    const imageWidth = imageEl?.offsetWidth;
    const imageHeight = imageEl?.offsetHeight;
  
    // Aggregate frequency of gaze points
    // const heatmapData = new Map<string, number>();
    // for (const point of gazePoints.current) {
    //   const key = `${Math.round(point.gaze_x)},${Math.round(point.gaze_y)}`;
    //   heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
    // }
    // Calculate dynamic max based on aggregated gaze counts
    let maxValue = 1;
    const heatmapData = new Map<string, number>();

    for (const point of gazePoints.current) {
      const key = `${Math.round(point.gaze_x)},${Math.round(point.gaze_y)}`;
      const newCount = (heatmapData.get(key) || 0) + 1;
      heatmapData.set(key, newCount);
      if (newCount > maxValue) maxValue = newCount;
    }
  
    // Render heatmap after eye tracking is done
    // for (const [key, count] of heatmapData.entries()) {
    //   const [x, y] = key.split(',').map(Number);
    //   heatmap?.addData({ x, y, value: count });
    // }
    // Sort points by timestamp
   
    // Clear previous heatmap before replaying time series
    heatmap?.setData({ max: maxValue, data: [] });

    // Sort points by timestamp
    const sortedPoints = [...gazePoints.current].sort((a, b) => a.timestamp - b.timestamp);

    // Gradually add points to heatmap like a time series
    let i = 0;
    const interval = setInterval(() => {
      if (i >= sortedPoints.length) {
        clearInterval(interval);
        return;
      }

      const p = sortedPoints[i];
      heatmap?.addData({ x: Math.round(p.gaze_x), y: Math.round(p.gaze_y), value: 1 });
      i++;
    }, 30);


  
    // Save gaze data to backend
    for (const point of gazePoints.current) {
      const payload = {
        user_id: parseInt(userId),
        survey_id: parseInt(surveyId!),
        question_id: questions[trackingIndex].id,
        gaze_x: point.gaze_x,
        gaze_y: point.gaze_y,
        timestamp: point.timestamp,
        image_width: imageWidth,
        image_height: imageHeight,
      };
  
      await fetch("http://localhost:5050/gaze_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  
    console.log("Saved gaze points:", gazePoints.current.length);
    gazePoints.current = [];
    setTrackingIndex(null);
  };

  const handleSubmit = async () => {
    try {
      for (const q of questions) {
        await fetch("http://localhost:5050/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            survey_id: parseInt(surveyId!),
            user_id: parseInt(userId),
            question_id: q.id,
            response_text: answers[q.id] || "",
          }),
        });
      }
      setShowSuccessModal(true); // Show modal instead of immediate redirect
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate("/doctor");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {survey && (
        <>
          <h2 className="text-2xl font-bold mb-2">{survey.title}</h2>
          <p className="mb-4 text-gray-600">{survey.description}</p>

          {questions.map((q, i) => (
            <div key={q.id} className="mb-6">
              <label className="font-semibold block mb-1">{q.question_text}</label>

              {q.image_url && (
                <>
                  <div
                    ref={(el) => (heatmapRefs.current[i] = el)}
                    className="relative w-fit"
                    style={{ pointerEvents: "none" }}
                  >
                    <img
                      ref={(el) => (imageRefs.current[i] = el)}
                      src={q.image_url}
                      alt="diagnostic"
                      className="rounded mb-2"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => startTracking(i)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer"
                    >
                      Start Eye Tracking
                    </button>
                    <button
                      onClick={stopTracking}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 cursor-pointer"
                    >
                      Stop Eye Tracking
                    </button>
                  </div>
                </>
              )}

              {q.question_type === "short_answer" && (
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}

              {q.question_type === "date" && (
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}

              {q.question_type === "dropdown" && (
                <select
                  className="w-full border rounded p-2"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                >
                  <option value="">Select...</option>
                  {q.options?.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {q.question_type === "multiple_choice" && (
                <div className="space-y-2">
                  {q.options?.map((opt, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Submit Survey
          </button>
        </>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4 text-center text-green-700">
              Survey Submitted!
            </h2>
            <p className="text-gray-700 mb-4 text-center">
              Your responses have been recorded successfully.
            </p>
            <button
              onClick={handleCloseModal}
              className="block mx-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeSurvey;
