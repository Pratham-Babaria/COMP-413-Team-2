import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const NewSurvey: React.FC = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<string[]>([]);
    const navigate = useNavigate();

    const addQuestion = () => {
        const question = prompt("Enter your question:");
        if (question) setQuestions([...questions, question]);
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
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter survey title" />

            <label>Survey Description:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter a short description"></textarea>

            <hr />

            <h3>Survey Questions:</h3>
            <div>
                {questions.map((q, i) => (
                    <div key={i} className="question">
                        <label>{q}</label>
                        <input type="text" placeholder="Answer here" />
                    </div>
                ))}
            </div>

            <button onClick={addQuestion}>+ Add Question</button>
            <button onClick={createSurvey}>Create Survey</button>
        </div>
    );
};

export default NewSurvey;
