import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import h337 from 'heatmap.js';

interface Doctor {
    id: number;
    username: string;
    role: string;
  }

const NewSurvey: React.FC = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<{ 
        text: string, 
        type: 'short_answer' | 'multiple_choice' | 'dropdown' | 'date' | 'static',
        options?: string[],
        image?: string 
    }[]>([
        { text: "Enter your name:", type: 'short_answer' },
        { text: "Select your date of birth:", type: 'date' },
        { text: "How many years of dermatology experience do you have?", type: 'short_answer' },
        { text: "Select your position:", type: 'dropdown', options: ['Nurse', 'Doctor', 'Medical Student', 'Other'] }
    ]);
    const [newQuestionText, setNewQuestionText] = useState("");
    const [newQuestionType, setNewQuestionType] = useState<'short_answer' | 'multiple_choice' | 'dropdown' | 'date'>("short_answer");
    const [newQuestionOptions, setNewQuestionOptions] = useState("");
    const [lesions, setLesions] = useState<any[]>([]);
    const [selectedLesion, setSelectedLesion] = useState<HTMLImageElement | null>(null);
    const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<string | null>(null);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showAddDiagnosticQuestionModal, setShowAddDiagnosticQuestionModal] = useState(false);
    const navigate = useNavigate();
    const heatmapRefs = useRef<(HTMLDivElement | null)[]>([]);
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
    const heatmapInstances = useRef<any[]>([]);
    const gazeTrackingActive = useRef(false);
    const [trackingIndex, setTrackingIndex] = useState<number | null>(null);
    const gazePoints = useRef<any[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://api.gazerecorder.com/GazeCloudAPI.js";
        script.async = true;
        script.onload = () => {
            console.log("GazeCloudAPI loaded");
        };
        script.onerror = () => {
            console.error("Failed to load GazeCloudAPI");
        };
        document.body.appendChild(script);
    
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        heatmapInstances.current = heatmapRefs.current.map((container) =>
            container
                ? h337.create({
                    container,
                    radius: 30,
                    maxOpacity: 0.6,
                    minOpacity: 0.2,
                    blur: 0.75,
                })
                : null
        );        
    }, [questions]);

    useEffect(() => {
        const fetchDoctors = async () => {
          try {
            const res = await fetch("https://comp-413-team-2.onrender.com/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const allUsers = await res.json();
            
            const docs = allUsers.filter((u: any) => u.role === "doctor");
            setDoctors(docs);
          } catch (err) {
            console.error("Error fetching doctors:", err);
          }
        };
        fetchDoctors();
      }, []);
    
    const toggleDoctor = (username: string) => {
        setSelectedUsernames((prev) =>
          prev.includes(username)
            ? prev.filter((u) => u !== username)
            : [...prev, username]
        );
      };
    
    const isDoctorSelected = (username: string) =>
        selectedUsernames.includes(username);

    const saveGazeData = async (questionIndex: number) => {
        console.log("Saving gaze points");

        const userId = localStorage.getItem("userId");
        const surveyId = localStorage.getItem("currentSurveyId");
        const questionId = questionIndex + 1; // assuming it's 1-indexed in DB
        const imageEl = imageRefs.current[questionIndex];

        if (!userId || !surveyId || !questionId || !imageEl) {
            console.warn("Missing values:");
            if (!userId) console.warn("userId is missing");
            if (!surveyId) console.warn("surveyId is missing");
            if (!questionId) console.warn("questionId is missing");
            if (!imageEl) console.warn("imageEl is missing");
            return;
        }

        const imageWidth = imageEl.offsetWidth;
        const imageHeight = imageEl.offsetHeight;

        if (!gazePoints.current.length) {
            console.warn("No gaze points to save");
            return;
        }

        for (const point of gazePoints.current) {
            const payload = {
                user_id: parseInt(userId),
                survey_id: parseInt(surveyId),
                question_id: questionId,
                gaze_x: point.gaze_x,
                gaze_y: point.gaze_y,
                timestamp: point.timestamp,
                image_width: imageWidth,
                image_height: imageHeight
            };

            console.log("saving gaze point", payload); // debugging

            try {
                await fetch("https://comp-413-team-2.onrender.com/gaze-data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                console.error("Failed to store gaze data", error);
            }
        }

        gazePoints.current = [];
    };


    const startTracking = (index: number) => {
        if (gazeTrackingActive.current) return;
    
        const imageEl = imageRefs.current[index];
        const heatmap = heatmapInstances.current[index];
        if (!imageEl || !heatmap) return;
    
        if (!window.GazeCloudAPI || !window.GazeCloudAPI.StartEyeTracking) {
            console.warn("GazeCloudAPI is not ready yet.");
            return;
        }
    
        console.log("Starting gaze tracking for image", index);
        window.GazeCloudAPI.StartEyeTracking(); // This triggers calibration normally
        gazeTrackingActive.current = true;
        setTrackingIndex(index);
    
        window.GazeCloudAPI.OnResult = (GazeData: any) => {
            if (GazeData.state !== 0) return;
            const gazeX = GazeData.GazeX;
            const gazeY = GazeData.GazeY;
    
            const rect = imageEl.getBoundingClientRect();
            const left = rect.left + window.scrollX;
            const top = rect.top + window.scrollY;
            const right = left + rect.width;
            const bottom = top + rect.height;
    
            if (gazeX >= left && gazeX <= right && gazeY >= top && gazeY <= bottom) {
                const localX = gazeX - left;
                const localY = gazeY - top;
                gazePoints.current.push({ gaze_x: localX, gaze_y: localY, timestamp: Date.now() });
                console.log("Gaze point:", { localX, localY, timestamp: Date.now() });
                heatmap.addData({ x: localX, y: localY, value: 1 });
            }
        };
    };
    

    const stopTracking = async () => {
        if (!gazeTrackingActive.current) return;
        window.GazeCloudAPI.StopEyeTracking();
        gazeTrackingActive.current = false;

        if (trackingIndex !== null) {
            console.log("Stopping tracking for question", trackingIndex);
            console.log("Number of gaze points:", gazePoints.current.length); 
            await saveGazeData(trackingIndex); 
        }
        setTrackingIndex(null);
    };

    const fetchLesions = async () => {
        try {
            const response = await fetch("https://comp-413-team-2.onrender.com/isic-images");
            const data = await response.json();
            setLesions(data.results || []);
        } catch (error) {
            console.error("Error fetching lesion images:", error);
        }
    };

    const addQuestion = () => {
        const options =
            (newQuestionType === "multiple_choice" || newQuestionType === "dropdown")
                ? newQuestionOptions.split(',').map(opt => opt.trim()).filter(Boolean)
                : undefined;
    
        setQuestions([...questions, {
            text: newQuestionText,
            type: newQuestionType,
            options,
            image: selectedLesion?.src || undefined
        }]);
    
        // reset everything
        setSelectedLesion(null);
        setNewQuestionText("");
        setNewQuestionType("short_answer");
        setNewQuestionOptions("");
        setSelectedLesion(null); // clear lesion after submit
        setShowAddQuestionModal(false);
    };

    const addDiagnosticQuestion = () => {
        fetchLesions();
        setShowAddDiagnosticQuestionModal(true);
    };

    const handleAddDiagnosticQuestion = () => {
        if (!selectedLesion) {
            alert("Please select an image before submitting.");
            return;
        }
    
        setNewQuestionType("short_answer");
        setNewQuestionText("");
        setShowAddQuestionModal(true);
    };

    const selectImage = (image: HTMLImageElement) => {
        if (selectedLesion) selectedLesion.style.border = "3px transparent";
        image.style.border = "3px solid blue";
        setSelectedLesion(image);
    };

    const submitDiagnosticQuestion = () => {
        if (!selectedLesion) {
            alert("Please select an image before submitting.");
            return;
        }
        setShowAddDiagnosticQuestionModal(false);
        handleAddDiagnosticQuestion();
    };


    const createSurvey = async () => {
        if (!title.trim() || !description.trim()) {
          alert("Please enter a survey title and description!");
          return;
        }
      
        
        const userId = localStorage.getItem("userId");
        if (!userId) {
          alert("You must be logged in or have a valid userId before creating a survey.");
          return;
        }
      
        try {
          // Create the survey in the DB
          const surveyRes = await fetch("https://comp-413-team-2.onrender.com/surveys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description,
              created_by: parseInt(userId),
            }),
          });
      
          if (!surveyRes.ok) {
            const errorData = await surveyRes.json();
            throw new Error(errorData.error || "Failed to create survey.");
          }
      
          const newSurvey = await surveyRes.json(); 
          // newSurvey should have { id, title, description, created_by }
      
          // Create each question in the DB (POST /questions with survey_id)
          for (const q of questions) {
            const questionRes = await fetch("https://comp-413-team-2.onrender.com/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  survey_id: newSurvey.id,
                  question_text: q.text,
                  question_type: q.type,
                  options: q.options || null,
                  image_url: q.image || null
                }),
            });
      
            if (!questionRes.ok) {
              const errorData = await questionRes.json();
              throw new Error(errorData.error || "Failed to create question.");
            }
          }


            for (const username of selectedUsernames) {
              try {
                const assignRes = await fetch("https://comp-413-team-2.onrender.com/survey-assignments/username", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    survey_id: newSurvey.id,
                    username: username,
                  }),
                });
                if (!assignRes.ok) {
                  const errData = await assignRes.json();
                  console.warn(`Failed to assign survey to ${username}:`, errData.error);
                }
              } catch (assignError) {
                console.error("Error assigning survey:", assignError);
              }
            }
          
      
          // Store newSurvey.id in localStorage for later usage (e.g., gaze tracking)
          localStorage.setItem("currentSurveyId", newSurvey.id);
          setShowSuccessModal(true);

        //   navigate("/admin");
        } catch (error: any) {
          console.error("Error creating survey:", error.message);
          alert(`Failed to create survey: ${error.message}`);
        }
      };

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-8 flex justify-center">
            {/* Survey header "Create a New Survey" */}
            <div className="w-full max-w-3xl bg-white rounded-lg shadow p-8">
                <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
                    Create a New Survey
                </h2>
    
                {/* Survey title */}
                <label className="block text-lg font-semibold text-gray-700 mb-2">Survey Title:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
    
                {/* Survey description */}
                <label className="block text-lg font-semibold text-gray-700 mb-2">Survey Description:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows={4}
                />

                {/* doctor checklist */}
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Assign to Doctors:</h3>
                {doctors.length ? (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 mb-6">
                    {doctors.map((d) => (
                    <label key={d.id} className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded">
                        <input type="checkbox" checked={isDoctorSelected(d.username)} onChange={() => toggleDoctor(d.username)} />
                        <span className="text-gray-700">{d.username}</span>
                    </label>
                    ))}
                </div>
                ) : (
                <p className="mb-6 text-sm text-gray-500">Loading doctors…</p>
                )}

                <h3 className="text-xl text-blue-600 font-semibold mb-4">Survey Questions:</h3>
                <div className="space-y-6">
                    {questions.map((q, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <label className="block font-semibold text-gray-800 mb-2">{q.text}</label>
                            {q.image && (
                                <div className="mb-4">
                                    <div ref={(el) => { heatmapRefs.current[i] = el; }} className="relative w-fit">
                                        <img
                                            ref={(el) => { imageRefs.current[i] = el; }}
                                            src={q.image}
                                            alt={`Lesion ${i}`}
                                            className="rounded-lg max-w-full"
                                        />
                                    </div>
                                    {/* <div className="mt-2 flex gap-4">
                                        <button onClick={() => startTracking(i)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                            Start Eye Tracking
                                        </button>
                                        <button onClick={stopTracking} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                                            Stop Eye Tracking
                                        </button>
                                    </div> */}
                                </div>
                            )}
                            {/* {q.text === "Select your date of birth:" ? (
                                    <input type="date" disabled/>
                                ) : q.text === "Select your position:" ? (
                                    <select disabled>
                                        <option value="">Select</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="medical student">Medical Student</option>
                                        <option value="other">Other</option>
                                    </select>
                                ) : (

                                    <input type="text" placeholder="Answer here" className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled/>
                                )} */}
                            {q.type === "date" ? (
                                <input type="date" disabled />
                            ) : q.type === "dropdown" && q.options ? (
                                <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                    <option value="">Select</option>
                                    {q.options.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : q.type === "multiple_choice" && q.options ? (
                                <div className="space-y-1">
                                    {q.options.map((opt, idx) => (
                                        <label key={idx} className="flex items-center space-x-2 text-gray-700">
                                            <input type="radio" name={`q${i}`} disabled />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Answer here"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    disabled
                                />
                            )}
                        </div>
                    ))}
                </div>
    
                {/* Add Question Buttons */}
                <div className="mt-6 flex flex-wrap gap-4">
                    <button onClick={() => setShowAddQuestionModal(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200">
                        + Add Question
                    </button>
                    <button onClick={addDiagnosticQuestion} className="bg-purple-100 text-purple-700 px-4 py-2 rounded hover:bg-purple-200">
                        + Add Diagnostic Question
                    </button>
                    <button onClick={createSurvey} className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 ml-auto">
                        Create Survey
                    </button>
                </div>


{showAddQuestionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-xl">
                <h2 className="text-lg font-semibold mb-4">Add a New Question</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Question Text</label>
                    <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="e.g., What is your name?"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Question Type</label>
                    <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value as any)}
                    className="w-full mt-1 p-2 border rounded"
                    >
                    <option value="short_answer">Short Answer</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="date">Date Picker</option>
                    </select>
                </div>

                {(newQuestionType === "multiple_choice" || newQuestionType === "dropdown") && (
                    <div className="mb-4">
                    <label className="block text-sm font-medium">Options (comma-separated)</label>
                    <input
                        type="text"
                        value={newQuestionOptions}
                        onChange={(e) => setNewQuestionOptions(e.target.value)}
                        className="w-full mt-1 p-2 border rounded"
                        placeholder="e.g., Option 1, Option 2, Option 3"
                    />
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <button
                    onClick={() => setShowAddQuestionModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                    Cancel
                    </button>
                    <button
                    onClick={addQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                    Add Question
                    </button>
                </div>
                </div>
            </div>
            )}

    
                {/* Modal for Lesion Selection */}
                {showAddDiagnosticQuestionModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col relative">
                        <span
                            className="absolute top-4 right-4 text-xl cursor-pointer text-gray-600 hover:text-black"
                            onClick={() => setShowAddDiagnosticQuestionModal(false)}
                        >
                            &times;
                        </span>
                        <h2 className="text-xl font-bold mb-4 text-center">Select a Lesion Image</h2>

                        {/* Scrollable image section */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                            {lesions.length === 0 ? (
                            <p className="text-center col-span-full">Loading images...</p>
                            ) : (
                            lesions.map((image, index) => (
                                <div
                                  key={index}
                                  className="relative cursor-pointer group"
                                  onMouseEnter={() => {
                                    setHoveredImageId(image.isic_id);
                                    const isLeftEdge = index % 4 === 0;
                                    const isRightEdge = index % 4 === 3;
                                    setTooltipPosition(isLeftEdge ? "left-0" : isRightEdge ? "right-0" : "left-1/2 -translate-x-1/2");
                                  }}
                                  onMouseLeave={() => setHoveredImageId(null)}
                                >
                                  <img
                                    src={image.files.thumbnail_256.url}
                                    alt={image.attribution || 'Lesion'}
                                    className={`w-full rounded-md border-2 ${
                                      selectedLesion?.src === image.files.thumbnail_256.url
                                        ? 'border-blue-500'
                                        : 'border-transparent'
                                    } group-hover:opacity-75`}
                                    onClick={(e) => selectImage(e.currentTarget)}
                                  />
                              
                                  {hoveredImageId === image.isic_id && (
                                    <div className={`absolute top-full mt-1 ${tooltipPosition} bg-white text-sm text-gray-800 border rounded shadow p-2 z-10`}>
                                      <p><strong>Diagnosis:</strong> {image.metadata.clinical.diagnosis_1 || "Unknown"}</p>
                                    </div>
                                  )}
                                </div>
                                ))
                            )}
                        </div>

                        {/* Fixed footer */}
                        <div className="mt-4 pt-4 border-t sticky bottom-0 bg-white z-10">
                            <div className="flex justify-end">
                            <button
                                onClick={submitDiagnosticQuestion}
                                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                            >
                                Submit
                            </button>
                            </div>
                        </div>
                        </div>
                    </div>
                    )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center">
                        <h3 className="text-lg font-semibold mb-2 text-green-700">Survey Created!</h3>
                        <p className="text-sm mb-4">Your survey has been successfully created.</p>
                        <button
                            className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                            onClick={() => {
                                setShowSuccessModal(false);
                                navigate("/admin");
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}


            </div>
        </div>
    );
};

export default NewSurvey;