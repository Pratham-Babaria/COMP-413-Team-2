import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./userMenu";
import ConfirmDeletionModal from "./confirmDeletion";

/**
 * Admin dashboard component for admins to create, upload,
 * view, and delete surveys.
 */
export default function Admin() {

    // keeps track of the state of the page
    const [surveys, setSurveys] = useState<{ title: string; description: string }[]>([]); // surveys
    const [showDeleteModal, setShowDeleteModal] = useState(false); // admin decides to delete a survey

    // keeps track of idx of survey to delete
    const [surveyToDeleteIndex, setSurveyToDeleteIndex] = useState<number | null>(null); 
    const navigate = useNavigate();
    
    const adminName = localStorage.getItem("username") || "admin";

    // Load saved surveys
    useEffect(() => {
        const storedSurveys = JSON.parse(localStorage.getItem("surveys") || "[]");
        setSurveys(storedSurveys);
    }, []);


    const handleDeleteSurvey = (index: number) => {
        setSurveyToDeleteIndex(index);
        setShowDeleteModal(true);
    };

    const confirmSurveyDeletion = () => {
        if (surveyToDeleteIndex === null) {
            return;
        }
        // add the surveys we don't want to delete to a new list
        const updatedSurveys: {title: string; description: string}[] = [];
        for (let i = 0; i < surveys.length; i++) {
            if (i !== surveyToDeleteIndex) {
                updatedSurveys.push(surveys[i]);
            }
        }
        // update the current set of surveys, and remove delete pop-up
        setSurveys(updatedSurveys);
        localStorage.setItem("surveys", JSON.stringify(updatedSurveys)) // TODO: INTEGRATE W BACKEND
        setShowDeleteModal(false);
        setSurveyToDeleteIndex(null);

    }

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSurveyToDeleteIndex(null);
    };

    // Helper function to render content based on whether there are surveys
    const renderSurveyList = () => {
        if (surveys.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-lg text-gray-700 mb-4">
                        There are no surveys uploaded. Be the first to upload one!
                    </p>
                    <button
                        onClick={() => navigate("/new-survey")}
                        className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition"
                    >
                        + Create Survey
                    </button>
                </div>
            );
        }

        return (
            <>
                <ul className="space-y-2">
                    {surveys.map((survey, index) => (
                        <li
                            key={index}
                            className="flex justify-between items-center bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition"
                        >
                            <div>
                                <strong>{survey.title}</strong> - {survey.description}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"
                                    onClick={() => console.log("View survey", index)}
                                >
                                    View
                                </button>
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition"
                                    onClick={() => handleDeleteSurvey(index)}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="mt-6 flex justify-start">
                    <button
                        onClick={() => navigate("/new-survey")}
                        className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition"
                    >
                        + New Survey
                    </button>
                </div>
            </>
        );
    };

    const navButtonClass = "flex items-center gap-2 px-4 py-2 bg-blue-400 rounded-full hover:bg-blue-600 transition text-white";
    const panelClass = "p-4 rounded-lg shadow";
    const sectionPadding = "m-4 px-4 py-6";

    return (
        <div className="flex flex-col h-screen bg-[#e5f2fb]">
            {/* Navbar */}
            <div className={`flex justify-between items-center bg-blue-500 text-white ${sectionPadding}`}>
                <div className="flex gap-4">
                    <button className={navButtonClass} onClick={() => navigate("/research")}>Research</button>
                    <button className={navButtonClass} onClick={() => navigate("/new-survey")}>Surveys</button>
                    <button className={navButtonClass} onClick={() => navigate("/approvals")}>Approvals</button>
                </div>
                <UserMenu username={adminName} />
            </div>

            {/* Content Area */}
            <div className={`flex-grow bg-gray-200 rounded-lg ${sectionPadding}`}>
                <div className="flex flex-col gap-4">
                    <div className={`bg-white ${panelClass}`}>
                        <h3 className="text-2xl text-blue-600 font-bold mb-4">Surveys</h3>
                        {renderSurveyList()}
                    </div>
                </div>
            </div>

            {/* Modular Delete Confirmation Modal */}
            {showDeleteModal && (
                <ConfirmDeletionModal
                    title="Delete Survey"
                    message="Are you sure you want to delete this survey? This action cannot be undone."
                    onCancel={cancelDelete}
                    onConfirm={confirmSurveyDeletion}
                />
            )}
        </div>
    );
}