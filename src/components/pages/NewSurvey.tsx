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
        <div className="survey-container">
            <h2>Create a New Survey</h2>

            <label>Survey Title:</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

            <label>Survey Description:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

            <hr />

            <h3>Survey Questions:</h3>
            {questions.map((q, i) => (
                <div key={i} className="question">
                    <label>{q.text}</label>
                    {q.image && (
                        <>
                            <div
                                ref={(el) => { heatmapRefs.current[i] = el; }}
                                style={{ position: "relative", width: "fit-content" }}
                            >
                                <img
                                    ref={(el) => { imageRefs.current[i] = el; }}
                                    src={q.image}
                                    alt={`Lesion ${i}`}
                                    className="selected-lesion"
                                />
                            </div>
                            <>
                                <button onClick={() => startTracking(i)}>Start Eye Tracking</button>
                                <button onClick={stopTracking} style={{ marginLeft: "10px" }}>
                                    Stop Eye Tracking
                                </button>
                            </>
                        </>
                    )}
                    <input type="text" placeholder="Answer here" />
                </div>
            ))}

            <button onClick={addQuestion}>+ Add Question</button>
            <button onClick={addDiagnosticQuestion}>+ Add Diagnostic Question</button>
            <button onClick={createSurvey}>Create Survey</button>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-btn" onClick={() => setShowModal(false)}>&times;</span>
                        <h2>Select a Lesion Image</h2>
                        <div className="lesion-container">
                            {lesions.length === 0 ? <p>Loading images...</p> : (
                                lesions.map((image, index) => (
                                    <div
                                        key={index}
                                        className="image-wrapper"
                                        onMouseEnter={() => {
                                            setHoveredImageId(image.isic_id);
                                            const isLeftEdge = index % 4 === 0;
                                            const isRightEdge = index % 4 === 3;
                                            setTooltipPosition(isLeftEdge ? "left-edge" : isRightEdge ? "right-edge" : "");
                                        }}
                                        onMouseLeave={() => setHoveredImageId(null)}
                                        style={{ position: "relative" }}
                                    >
                                        <img
                                            src={image.files.thumbnail_256.url}
                                            alt={image.attribution || 'Lesion'}
                                            className={`thumbnail ${selectedLesion?.src === image.files.thumbnail_256.url ? "selected" : ""}`}
                                            onClick={(e) => selectImage(e.currentTarget)}
                                        />
                                        {hoveredImageId === image.isic_id && (
                                            <div className={`tooltip ${tooltipPosition}`}>
                                                <p><strong>Age:</strong> {image.metadata.clinical.age_approx || "N/A"}</p>
                                                <p><strong>Diagnosis:</strong> {image.metadata.clinical.diagnosis_1 || "Unknown"}</p>
                                                <p><strong>Site:</strong> {image.metadata.clinical.anatom_site_general}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={submitDiagnosticQuestion}>Submit</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewSurvey;