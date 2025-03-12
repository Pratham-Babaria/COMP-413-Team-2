import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Admin: React.FC = () => {
    const [surveys, setSurveys] = useState<{ title: string; description: string }[]>([]);
    const navigate = useNavigate();
    const adminName = localStorage.getItem("username") || "Admin";

    useEffect(() => {
        const storedSurveys = JSON.parse(localStorage.getItem("surveys") || "[]");
        setSurveys(storedSurveys);
    }, []);

    const logout = () => {
        localStorage.removeItem("username");
        navigate("/");
    };

    return (
        <div className="dashboard">
            <div className="sidebar">
                <h3>Admin Panel</h3>
                <button className="menu-btn">Approvals</button>
                <button className="menu-btn" onClick={() => navigate("/new-survey")}>
                    Surveys <span className="plus-circle">+</span>
                </button>
                <button className="menu-btn">Research</button>
            </div>
            <div className="main-content">
                <div className="header">
                    <span>{adminName}</span>
                    <button onClick={logout}>Logout</button>
                </div>
                <p>Welcome to the Admin Dashboard</p>
                <div id="survey-list">
                    <h3>Existing Surveys</h3>
                    <ul>
                        {surveys.map((survey, index) => (
                            <li key={index}>
                                <strong>{survey.title}</strong> - {survey.description}
                                <button>View</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Admin;
