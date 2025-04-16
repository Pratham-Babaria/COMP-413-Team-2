import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Doctor: React.FC = () => {
    const [surveys, setSurveys] = useState<{ title: string; description: string }[]>([]);
    const navigate = useNavigate();
    const doctorName = localStorage.getItem("username") || "Doctor";

    useEffect(() => {
        const storedSurveys = JSON.parse(localStorage.getItem("surveys") || "[]");
        setSurveys(storedSurveys);
    }, []);

    const logout = () => {
        signOut(auth).then(() => {
            localStorage.removeItem("username");
            navigate("/");
          }).catch((error) => {
            console.log("Error in logout procedure.")
          });
    };

    return (
        <div className="dashboard">
            <div className="sidebar">
                <h3>Doctor Panel</h3>
                <button className="menu-btn">Surveys</button>
                <button className="menu-btn">Responses</button>
                <button className="menu-btn">Invites</button>
            </div>
            <div className="main-content">
                <div className="header">
                    <span>{doctorName}</span>
                    <button onClick={logout}>Logout</button>
                </div>
                <h3>Available Surveys</h3>
                <ul>
                    {surveys.map((survey, index) => (
                        <li key={index}>
                            <strong>{survey.title}</strong> - {survey.description}
                            <button>Take Survey</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Doctor;
