import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import h337 from 'heatmap.js';

const NewSurvey: React.FC = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<{ text: string, image?: string }[]>([]);
    const [lesions, setLesions] = useState<any[]>([]);
    const [selectedLesion, setSelectedLesion] = useState<HTMLImageElement | null>(null);
    const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    

    const heatmapRefs = useRef<(HTMLDivElement | null)[]>([]);
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
    const heatmapInstances = useRef<any[]>([]);
    const gazeTrackingActive = useRef(false);
    const [trackingIndex, setTrackingIndex] = useState<number | null>(null);
    const gazePoints = useRef<any[]>([]);

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
                await fetch("http://localhost:5050/gaze-data", {
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
            const response = await fetch("http://localhost:5050/isic-images");
            const data = await response.json();
            setLesions(data.results || []);
        } catch (error) {
            console.error("Error fetching lesion images:", error);
        }
    };

    const addQuestion = () => {
        const question = prompt("Enter your question:");
        if (question) {
            setQuestions([...questions, { text: question }]);
        }
    };

    const addDiagnosticQuestion = () => {
        fetchLesions();
        setShowModal(true);
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
        const question = prompt("Enter your diagnostic question:");
        if (question) {
            setQuestions([...questions, { text: question, image: selectedLesion.src }]);
        }
        setShowModal(false);
        setSelectedLesion(null);
    };

    const createSurvey = () => {
        if (!title.trim() || !description.trim()) {
            alert("Please enter a survey title and description!");
            return;
        }
        const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
        surveys.push({ title, description, questions });
        localStorage.setItem("surveys", JSON.stringify(surveys));
        alert("Survey created successfully!");
        navigate("/admin");
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
                                    <div className="mt-2 flex gap-4">
                                        <button onClick={() => startTracking(i)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                            Start Eye Tracking
                                        </button>
                                        <button onClick={stopTracking} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                                            Stop Eye Tracking
                                        </button>
                                    </div>
                                </div>
                            )}
                            <input type="text" placeholder="Answer here" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                    ))}
                </div>
    
                {/* Add Question Buttons */}
                <div className="mt-6 flex flex-wrap gap-4">
                    <button onClick={addQuestion} className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200">
                        + Add Question
                    </button>
                    <button onClick={addDiagnosticQuestion} className="bg-purple-100 text-purple-700 px-4 py-2 rounded hover:bg-purple-200">
                        + Add Diagnostic Question
                    </button>
                    <button onClick={createSurvey} className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 ml-auto">
                        Create Survey
                    </button>
                </div>
    
                {/* Modal for Lesion Selection */}
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                            <span className="absolute top-4 right-4 text-xl cursor-pointer text-gray-600 hover:text-black" onClick={() => setShowModal(false)}>&times;</span>
                            <h2 className="text-xl font-bold mb-4 text-center">Select a Lesion Image</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {lesions.length === 0 ? (
                                    <p className="text-center">Loading images...</p>
                                ) : (
                                    lesions.map((image, index) => (
                                        <div key={index} className="relative cursor-pointer group">
                                            <img
                                                src={image.files.thumbnail_256.url}
                                                alt={image.attribution || 'Lesion'}
                                                className={`w-full rounded-md border-2 ${selectedLesion?.src === image.files.thumbnail_256.url ? 'border-blue-500' : 'border-transparent'} group-hover:opacity-75`}
                                                onClick={(e) => selectImage(e.currentTarget)}
                                            />
                                            {hoveredImageId === image.isic_id && (
                                                <div className={`absolute bg-white text-sm text-gray-800 border rounded shadow p-2 z-10 ${tooltipPosition}`}>
                                                    <p><strong>Age:</strong> {image.metadata.clinical.age_approx || "N/A"}</p>
                                                    <p><strong>Diagnosis:</strong> {image.metadata.clinical.diagnosis_1 || "Unknown"}</p>
                                                    <p><strong>Site:</strong> {image.metadata.clinical.anatom_site_general}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={submitDiagnosticQuestion}
                                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewSurvey;