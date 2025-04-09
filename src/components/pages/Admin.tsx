import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaCog } from "react-icons/fa";

export default function Admin() {
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
        <div className="flex flex-col h-screen bg-teal-100">
            {/* Navbar */}
            <div className="flex justify-between items-center bg-blue-500 text-white p-4 rounded-lg m-4">
                <div className="flex gap-4">
                    <button 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-400 rounded-full hover:bg-blue-600 transition"
                        onClick={() => navigate("/research")}
                    >
                        Research
                    </button>
                    <button 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-400 rounded-full hover:bg-blue-600 transition"
                        onClick={() => navigate("/new-survey")}
                    > Surveys
                    </button>
                    <button 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-400 rounded-full hover:bg-blue-600 transition"
                        onClick={() => navigate("/approvals")}
                    >
                        Approvals
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">{adminName}</span>
                    <button className="text-white hover:text-gray-200" onClick={logout}>Logout</button>
                    <button className="text-white text-xl">
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow m-4 p-4 bg-gray-200 rounded-lg">
                <div className="flex flex-col gap-4">
                    <div className="p-4 bg-white rounded-lg shadow">
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
                                    <button 
                                        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"
                                    >
                                        View
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-blue-500 text-white text-center p-4 rounded-lg m-4 font-bold text-xl">
                iSurvey
            </div>
        </div>
    );
}
