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
  // const [message, setMessage] = useState("");
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
  const [showTrackingModal, setShowTrackingModal] = useState(false); // New state for modal visibility
  const [countdown, setCountdown] = useState(180); // 3-minute countdown in seconds
  const [showCalibrationModal, setShowCalibrationModal] = useState(true);
  const [heatmapResults, setHeatmapResults] = useState<{
    [qIndex: number]: { data: { x:number; y:number; value:number }[]; max: number };
  }>({});
  const [isViewing, setIsViewing] = useState(false);

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

    fetch(`https://comp-413-team-2.onrender.com/surveys/${surveyId}`)
      .then((res) => res.json())
      .then((data: Survey) => setSurvey(data));

    fetch(`https://comp-413-team-2.onrender.com/surveys/${surveyId}/questions`)
      .then((res) => res.json())
      .then((data: Question[]) => setQuestions(data));
  }, [surveyId]);


  // once the API is ready, set up the global OnResult handler
  useEffect(() => {
    if (!gazeApiReady) return;
    window.GazeCloudAPI.OnResult = (data: any) => {
      if (data.state !== 0 || !gazeTrackingActive.current) return;
      const container = document.getElementById("heatmap-modal-container");
      const rect = container?.getBoundingClientRect();
      if (!rect) return;
      const { GazeX, GazeY } = data;
      if (
        GazeX >= rect.left && GazeX <= rect.right &&
        GazeY >= rect.top  && GazeY <= rect.bottom
      ) {
        gazePoints.current.push({
          gaze_x: GazeX - rect.left,
          gaze_y: GazeY - rect.top,
          timestamp: Date.now(),
        });
        if (gazeDotRef.current) {
          gazeDotRef.current.style.left = `${GazeX}px`;
          gazeDotRef.current.style.top  = `${GazeY}px`;
        }
      }
    };
  }, [gazeApiReady]);

  useEffect(() => {
    if (showTrackingModal && isViewing && heatmapResults[trackingIndex!]) {
      const hm = heatmapInstances.current[trackingIndex!]!;
      hm.setData({ max: heatmapResults[trackingIndex!].max, data: [] });
      heatmapResults[trackingIndex!].data.forEach(pt =>
        hm.addData({ x: Math.round(pt.x), y: Math.round(pt.y), value: 1 })
      );
    }
  }, [showTrackingModal, isViewing, trackingIndex, heatmapResults]);
  

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const startTracking = (index: number) => {
    const imageEl = imageRefs.current[index];
    // const heatmap = heatmapInstances.current[index];

    console.log(heatmapRefs.current[index]?.getBoundingClientRect());
    console.log(imageEl?.getBoundingClientRect());

    const imageRect = imageEl?.getBoundingClientRect();
    console.log("imageEl bounds:", imageRect);
  
    if (!gazeApiReady || !imageEl || gazeTrackingActive.current) {
      console.warn("Preconditions not met for eye tracking.");
      return;
    }
  
    console.log("Starting eye tracking");
    window.GazeCloudAPI.StartEyeTracking();
    gazeTrackingActive.current = true;
    setTrackingIndex(index);
    setCountdown(180);
    setShowTrackingModal(true);
  
    if (!gazeDotRef.current) {
      const dot = document.createElement("div");
      dot.className = styles.gazeDot;
      document.body.appendChild(dot);
      gazeDotRef.current = dot;
      console.log("Gaze dot created");
    }
  };
 
  const stopTracking = async () => {
    if (!gazeTrackingActive.current || trackingIndex === null) return;
    console.log("Stopping eye tracking");
  
    // shut off the API
    window.GazeCloudAPI.StopEyeTracking();
    gazeTrackingActive.current = false;
  
    // remove the little dot
    if (gazeDotRef.current) {
      gazeDotRef.current.remove();
      gazeDotRef.current = null;
    }
  
    // grab your raw gaze points
    // ensure we have x,y,timestamp on each
    const raw: { x: number; y: number; timestamp: number }[] = gazePoints.current.map(p => ({
      x: p.gaze_x,
      y: p.gaze_y,
      timestamp: p.timestamp
    }));
  
    // build a frequency map so you get the true max
    const freq = new Map<string, number>();
    let trueMax = 0;
    raw.forEach(({ x, y }) => {
      const key = `${Math.round(x)},${Math.round(y)}`;
      const count = (freq.get(key) || 0) + 1;
      freq.set(key, count);
      trueMax = Math.max(trueMax, count);
    });
  
    // save for “View Heatmap” (strip off timestamp, provide value)
    const savedData: { x: number; y: number; value: number }[] = raw.map(({ x, y }) => ({
      x,
      y,
      value: 1
    }));
  
    setHeatmapResults(prev => ({
      ...prev,
      [trackingIndex]: { data: savedData, max: trueMax }
    }));
  
    // clear the canvas with the true max (so scale is correct)
    const hm = heatmapInstances.current[trackingIndex]!;
    hm.setData({ max: 0, data: [] });

    const sorted = [...raw].sort((a, b) => a.timestamp - b.timestamp);
    let idx = 0;
    const ANIMATION_INTERVAL = 100;
    const timer = setInterval(() => {
      if (idx >= sorted.length) {
        clearInterval(timer);
        hm.configure({ max: trueMax });
        return;
      }
      const { x, y } = sorted[idx++];
      hm.addData({ x: Math.round(x), y: Math.round(y), value: 1 });
    }, ANIMATION_INTERVAL);

    // send to backend
    const container = document.getElementById("heatmap-modal-container");
    await Promise.all(raw.map(pt =>
      fetch("https://comp-413-team-2.onrender.com/gaze_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: +userId,
          survey_id: +surveyId!,
          question_id: questions[trackingIndex].id,
          gaze_x: pt.x,
          gaze_y: pt.y,
          timestamp: pt.timestamp,
          image_width: container?.clientWidth ?? 0,
          image_height: container?.clientHeight ?? 0
        })
      })
    ));
  
    // reset your buffer
    gazePoints.current = [];
  };

  const handleSubmit = async () => {
    try {
      // Check if the user has already submitted this survey
      const res = await fetch(`https://comp-413-team-2.onrender.com/responses?survey_id=${surveyId}&user_id=${userId}`);
      const existingResponses = await res.json();
  
      if (existingResponses.length > 0) {
        alert("You have already submitted this survey.");
        return;
      }
  
      // Submit each question response
      const responsePromises = questions.map(async (q) => {
        await fetch("https://comp-413-team-2.onrender.com/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            survey_id: parseInt(surveyId!),
            user_id: parseInt(userId),
            question_id: q.id,
            response_text: answers[q.id] || "",
          }),
        });
      });

      await Promise.all(responsePromises);

      const classification_response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: parseInt(userId), survey_id: parseInt(surveyId!) }),
      });
  
      const classification_data = await classification_response.json();
      console.log(classification_data)
  
      setShowSuccessModal(true); // Show modal instead of immediate redirect
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit the survey. Please try again.");
    }
  };
  
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate("/doctor");
  };

  useEffect(() => {
    if (showTrackingModal && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    if (countdown === 0) {
      stopTracking();
    }
  }, [showTrackingModal, countdown]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-3xl font-extrabold text-blue-600 mb-4 text-center">
              Gaze Tracking Disclaimer
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6 text-center">
              This survey collects gaze tracking data for diagnostic questions.
              Your responses and eye movements may be analyzed for research purposes.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowCalibrationModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-shadow shadow hover:shadow-lg"
              >
                Begin Survey
              </button>
            </div>
          </div>
        </div>
      )}
      {!showCalibrationModal && survey && (
        <>
          <h2 className="text-2xl font-bold mb-2">{survey.title}</h2>
          <p className="mb-4 text-gray-600">{survey.description}</p>

          {questions.map((q, i) => (
            <div key={q.id} className="mb-6">
              <label className="font-semibold block mb-1">
                {q.question_text}
              </label>

              {q.image_url && (
                <>
                  {/* thumbnail */}
                  <div
                    ref={el => (heatmapRefs.current[i] = el)}
                    className="relative w-fit"
                    style={{ pointerEvents: "none" }}
                  >
                    <img
                      ref={el => (imageRefs.current[i] = el)}
                      src={q.image_url}
                      alt="diagnostic"
                      className="rounded mb-2"
                    />
                  </div>

                  {/* either Start or View */}
                  <div className="flex gap-2 mt-2">
                    {!heatmapResults[i] ? (
                      <button
                        onClick={() => startTracking(i)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Start Eye Tracking
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setTrackingIndex(i);
                          setIsViewing(true);
                          setShowTrackingModal(true);
                        }}
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                      >
                        View Heatmap
                      </button>
                    )}
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
      {showTrackingModal && trackingIndex !== null && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-4xl w-full">
          <h3 className="text-xl font-semibold">Eye Tracking</h3>
          <p className="mt-4">Tracking your gaze on the image...</p>
          <p className="text-lg font-bold mt-2">
            Time Left: {Math.floor(countdown / 60)}:{countdown % 60}
          </p>

          <div className="mt-4">
            <div
              id="heatmap-modal-container"
              ref={(el) => {
                if (el && trackingIndex !== null) {
                  // Always create a fresh heatmap.js instance on this exact node
                  heatmapInstances.current[trackingIndex] = h337.create({
                    container: el,
                    radius: 25,
                    maxOpacity: 0.7,
                    minOpacity: 0.1,
                    blur: 0.9,
                    gradient: {
                      '.0': 'blue',
                      '.25': 'green',
                      '.5': 'yellow',
                      '.75': 'orange',
                      '1.0': 'red',
                    },
                  });
                }
              }}              
              className="relative w-full max-h-96"
              style={{ pointerEvents: "none", position: "relative" }} // explicitly declare position
            >
              <img
                src={questions[trackingIndex].image_url!}
                alt="Diagnostic Image"
                className="w-full max-h-96 object-contain rounded"
                id="modalImage"
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
          </div>
          <div className="mt-4">
            {!gazeTrackingActive.current && (
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  // setIsCalibrated(false);
                  setCountdown(180);
                  setTrackingIndex(null);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Finish
              </button>
            )}
            {gazeTrackingActive.current && (
              <button
                onClick={stopTracking}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Stop Eye Tracking
              </button>
            )}
          </div>
    </div>
  </div>
)}
    </div>
  );
};

export default TakeSurvey;
