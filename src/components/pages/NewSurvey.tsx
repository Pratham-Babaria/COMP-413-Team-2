import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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

    // fetch lesions from API
    const fetchLesions = async () => {
        try {
            const response = await fetch("http://localhost:5050/isic-images");
            const data = await response.json();
            setLesions(data.results || []);
            console.log(data.results);
        } catch (error) {
            console.error("Error fetching lesion images:", error);
        }
    };

    // add a normal question
    const addQuestion = () => {
        const question = prompt("Enter your question:");
        if (question) {
            setQuestions([...questions, { text: question }]);
        }
    };

    // open modal to select a lesion for a diagnostic question
    const addDiagnosticQuestion = () => {
        fetchLesions();
        setShowModal(true);
    };

    // handle lesion selection
    const selectImage = (image: HTMLImageElement) => {
        if (selectedLesion) {
            selectedLesion.style.border = "3px transparent";
        }
        image.style.border = "3px solid blue";
        setSelectedLesion(image);
    };

    // submit selected lesion and question
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

    // create survey and store in localStorage
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
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter survey title" />

            <label>Survey Description:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter a short description"></textarea>

            <hr />

            <h3>Survey Questions:</h3>
            <div>
                {questions.map((q, i) => (
                    <div key={i} className="question">
                        <label>{q.text}</label>
                        {q.image && <img src={q.image} alt="Selected lesion" className="selected-lesion" />}
                        <input type="text" placeholder="Answer here" />
                    </div>
                ))}
            </div>

            <button onClick={addQuestion}>+ Add Question</button>
            <button onClick={addDiagnosticQuestion}>+ Add Diagnostic Question</button>
            <button onClick={createSurvey}>Create Survey</button>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-btn" onClick={() => setShowModal(false)}>&times;</span>
                        <h2>Select a Lesion Image</h2>
                        <div className="lesion-container">
                            {lesions.length === 0 ? (
                                <p>Loading images...</p>
                            ) : (
                                lesions.map((image, index) => (
                                    <div 
                                    key={index}
                                    className="image-wrapper"
                                    onMouseEnter={(e) => {
                                        setHoveredImageId(image.isic_id);
                                        const isLeftEdge = index%4 === 0;
                                        const isRightEdge = index%4 === 3;
                                        
                                        setTooltipPosition(isLeftEdge ? "left-edge" : isRightEdge ? "right-edge" : "");
                                        console.log(isLeftEdge);
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
                                                <p><strong>Anatomic Site:</strong> {image.metadata.clinical.anatom_site_general}</p>
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
