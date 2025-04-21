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
  const [isCalibrated, setIsCalibrated] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false); // New state for modal visibility
  const [countdown, setCountdown] = useState(180); // 3-minute countdown in seconds

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

  // useEffect(() => {
  //   // heatmapInstances.current = heatmapRefs.current.map((container) =>
  //   //   container
  //   //     ? h337.create({
  //   //         container,
  //   //         radius: 30,
  //   //         maxOpacity: 0.6,
  //   //         minOpacity: 0.2,
  //   //         blur: 0.75,
  //   //       })
  //   //     : null
  //   // );

  //   heatmapInstances.current = heatmapRefs.current.map((container) =>
  //     container
  //       ? h337.create({
  //           container,
  //           radius: 25,         // smaller radius = tighter clusters
  //           maxOpacity: 0.7,    // play around with contrast
  //           minOpacity: 0.1,
  //           blur: 0.9,          // more blur = stronger gradients
  //           gradient: { // play around with gradient
  //             '.0': 'blue',
  //             '.25': 'green',
  //             '.5': 'yellow',
  //             '.75': 'orange',
  //             '1.0': 'red'
  //           }
  //         })
  //       : null
  //   );
    
  // }, [questions]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const startTracking = (index: number) => {
    const imageEl = imageRefs.current[index];
    const heatmap = heatmapInstances.current[index];

    console.log(heatmapRefs.current[index]?.getBoundingClientRect());
    console.log(imageEl?.getBoundingClientRect());

    const imageRect = imageEl?.getBoundingClientRect();
    console.log("imageEl bounds:", imageRect);
  
    if (!gazeApiReady || !imageEl || !heatmap || gazeTrackingActive.current) {
      console.warn("Preconditions not met for eye tracking.");
      return;
    }
  
    console.log("Starting eye tracking");
    window.GazeCloudAPI.StartEyeTracking();
    gazeTrackingActive.current = true;
    setTrackingIndex(index);
    setShowTrackingModal(true);
  
    if (!gazeDotRef.current) {
      const dot = document.createElement("div");
      dot.className = styles.gazeDot;
      document.body.appendChild(dot);
      gazeDotRef.current = dot;
    }
  
    window.GazeCloudAPI.OnResult = (GazeData: any) => {
      if (GazeData.state !== 0) return;

      if (!isCalibrated) {
        setIsCalibrated(true);  // Trigger the countdown to start
      }
  
      // Track relative to modal image
      const modalImage = document.getElementById("modalImage");
      if (!modalImage) return;
  
      const modalRect = modalImage.getBoundingClientRect();
      const gazeX = GazeData.GazeX;
      const gazeY = GazeData.GazeY;
  
      if (
        gazeX >= modalRect.left &&
        gazeY >= modalRect.top &&
        gazeX <= modalRect.right &&
        gazeY <= modalRect.bottom
      ) {
        // Save normalized coordinates (0–1)
        //const normX = (gazeX - modalRect.left) / modalRect.width;
        //const normY = (gazeY - modalRect.top) / modalRect.height;
  
        const point = {
          gaze_x: gazeX - modalRect.left,
          gaze_y: gazeY - modalRect.top,
          timestamp: Date.now(),
        };
  
        console.log("Tracked normalized point", point);
        gazePoints.current.push(point);
  
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
  
    if (gazeDotRef.current) {
      gazeDotRef.current.remove();
      gazeDotRef.current = null;
    }
  
    const imageEl = imageRefs.current[trackingIndex];
    const modalImageEl = document.getElementById("modalImage");
    const heatmap = heatmapInstances.current[trackingIndex];
    const imageWidth = imageEl?.offsetWidth || 0;
    const imageHeight = imageEl?.offsetHeight || 0;

    const modalRect = modalImageEl?.getBoundingClientRect();
    const imageRect = imageEl?.getBoundingClientRect();

    const scaleX = (imageRect?.width || 0) / (modalRect?.width || 1);
    const scaleY = (imageRect?.height || 0) / (modalRect?.height || 1);

    console.log("Scale x: ", scaleX);
    console.log("Scale y: ", scaleY);

    const translatedPoints = gazePoints.current.map(p => ({
      x: p.gaze_x * scaleX,
      y: p.gaze_y * scaleY,
      value: 1,
      timestamp: p.timestamp,
    }));
  
    let maxValue = 1;
    const heatmapData = new Map<string, number>();
  
    for (const point of translatedPoints) {
      const key = `${Math.round(point.x)},${Math.round(point.y)}`;
      const newCount = (heatmapData.get(key) || 0) + 1;
      heatmapData.set(key, newCount);
      if (newCount > maxValue) maxValue = newCount;
    }
  
    heatmap?.setData({ max: maxValue, data: [] });
  
    // Sort and animate
    const sortedPoints = [...translatedPoints].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  
    let i = 0;
    const interval = setInterval(() => {
      if (i >= sortedPoints.length) {
        clearInterval(interval);
        return;
      }
  
      const p = sortedPoints[i];
      heatmap?.addData({ x: Math.round(p.x), y: Math.round(p.y), value: 1 });
      i++;
    }, 30);

    console.log("Gaze points: ", gazePoints.current);
  
    // Save data to backend
    for (const point of gazePoints.current) {
      const payload = {
        user_id: parseInt(userId),
        survey_id: parseInt(surveyId!),
        question_id: questions[trackingIndex].id,
        gaze_x: point.gaze_x,
        gaze_y: point.gaze_y,
        timestamp: point.timestamp,
        image_width: modalImageEl?.offsetWidth || 0,
        image_height: modalImageEl?.offsetHeight || 0,
      };
  
      await fetch("http://localhost:5050/gaze_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    console.log("Rendering heatmap on:", imageEl);
    console.log("Translated points:", translatedPoints.slice(0, 5));
    console.log("Image dimensions:", imageWidth, imageHeight);
    console.log("Heatmap instance:", heatmap);
  
  
    console.log("Saved gaze points:", gazePoints.current.length);
    gazePoints.current = [];
    setTrackingIndex(null);
  };
  

  // const handleSubmit = async () => {
  //   try {
  //     for (const q of questions) {
  //       await fetch("http://localhost:5050/responses", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           survey_id: parseInt(surveyId!),
  //           user_id: parseInt(userId),
  //           question_id: q.id,
  //           response_text: answers[q.id] || "",
  //         }),
  //       });
  //     }
  //     setShowSuccessModal(true); // Show modal instead of immediate redirect
  //   } catch (err) {
  //     console.error("Submission error:", err);
  //   }
  // };
  const handleSubmit = async () => {
    try {
      // Check if the user has already submitted this survey
      const res = await fetch(`http://localhost:5050/responses?survey_id=${surveyId}&user_id=${userId}`);
      const existingResponses = await res.json();
  
      if (existingResponses.length > 0) {
        alert("You have already submitted this survey.");
        return;
      }
  
      // Submit each question response
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
      alert("Failed to submit the survey. Please try again.");
    }
  };
  

  
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate("/doctor");
  };

  useEffect(() => {
    if (isCalibrated && showTrackingModal && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    if (countdown === 0) {
      stopTracking();
    }
  }, [isCalibrated, showTrackingModal, countdown]);

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
                    {/* <img
                      ref={(el) => (imageRefs.current[i] = el)}
                      src={q.image_url}
                      alt="diagnostic"
                      className="rounded mb-2"
                    /> */}
                    <img
                    ref={(el) => (imageRefs.current[i] = el)}
                    src={q.image_url}
                    alt="diagnostic"
                    className="rounded mb-2"
                    onLoad={() => {
                      if (heatmapRefs.current[i]) {
                        heatmapInstances.current[i] = h337.create({
                          container: heatmapRefs.current[i]!,
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
                        console.log("Heatmap initialized for image", i);                
                      }
                    }}
                  />

                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => startTracking(i)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer"
                    >
                      Start Eye Tracking
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
      {showTrackingModal && trackingIndex !== null && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-4xl w-full">
      <h3 className="text-xl font-semibold">Eye Tracking</h3>
      <p className="mt-4">Tracking your gaze on the image...</p>
      <p className="text-lg font-bold mt-2">
        Time Left: {Math.floor(countdown / 60)}:{countdown % 60}
      </p>

      <div className="mt-4">
        <img
          src={questions[trackingIndex].image_url!}
          alt="Diagnostic Image"
          className="w-full max-h-96 object-contain rounded"
          id="modalImage"
        />
      </div>

      <div className="mt-4">
        <button
          onClick={stopTracking}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Stop Eye Tracking
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default TakeSurvey;
