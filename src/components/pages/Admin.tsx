import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


/**
 * Admin dashboard component for admins to create, upload,
 * view, and delete surveys.
 * 
 */
export default function Admin() {
    const [surveys, setSurveys] = useState<{ title: string; description: string }[]>([]);
    const navigate = useNavigate();
    const adminName = localStorage.getItem("username") || "Admin";

    // load saved survey from backend
    useEffect(() => {
        const storedSurveys = JSON.parse(localStorage.getItem("surveys") || "[]");
        setSurveys(storedSurveys);
    }, []);

    // logout function to return to main page if user logs out
    const logout = () => {
        localStorage.removeItem("username");
        navigate("/");
    };

    // tailwind css constants
    const navButtonClass = "flex items-center gap-2 px-4 py-2 bg-blue-400 rounded-full hover:bg-blue-600 transition text-white";
    const panelClass = "p-4 rounded-lg shadow";
    const sectionPadding = "m-4 p-4";

    return (
        <div className="flex flex-col h-screen bg-lightblue">
            {/* Navbar */}
            <div className={`flex justify-between items-center bg-blue-500 text-white ${sectionPadding} rounded-lg`}>
                <div className="flex gap-4">
                    <button className={navButtonClass} onClick={() => navigate("/research")}>
                        Research
                    </button>
                    <button className={navButtonClass} onClick={() => navigate("/new-survey")}>
                        Surveys
                    </button>
                    <button className={navButtonClass} onClick={() => navigate("/approvals")}>
                        Approvals
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">{adminName}</span>
                    <button className="hover:text-gray-200" onClick={logout}>Logout</button>
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-grow bg-gray-200 rounded-lg ${sectionPadding}`}>
                <div className="flex flex-col gap-4">
                    <div className={`bg-white ${panelClass}`}>
                        <h3 className="text-2xl text-blue-600 font-bold mb-4">Existing Surveys</h3>
                        <ul className="space-y-2">
                            {surveys.map((survey, index) => (
                                <li
                                    key={index}
                                    className="flex justify-between items-center bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition"
                                >
                                    <div>
                                        <strong>{survey.title}</strong> - {survey.description}
                                    </div>
                                    <button className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition">
                                        View
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
