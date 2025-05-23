import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./userMenu";
import ConfirmDeletionModal from "./confirmDeletion";
import {styles} from "../../styles/sharedStyles";
import { FaUserShield } from "react-icons/fa"


interface Survey {
    id: number;
    title: string;
    description: string;
    created_by: number;
  }

/**
 * Admin dashboard component for admins to create, upload,
 * view, and delete surveys.
 */
export default function Admin() {

    // keeps track of the state of the page
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false); // admin decides to delete a survey

    // keeps track of idx of survey to delete
    const [surveyToDeleteIndex, setSurveyToDeleteIndex] = useState<number | null>(null); 
    const navigate = useNavigate();
    
    const adminName = localStorage.getItem("username") || "admin";

    // Load surveys
    useEffect(() => {
        fetch("https://comp-413-team-2.onrender.com/surveys")
          .then((res) => res.json())
          .then((data: Survey[]) => {
            setSurveys(data);
          })
          .catch(console.error);
      }, []);

    // Function updates the state of the surveys when user confirms survey deletion
    const confirmSurveyDeletion = async () => {
        if (surveyToDeleteIndex === null) {
            return;
        }

        // Get the `id` of the survey we want to delete
        const surveyId = surveys[surveyToDeleteIndex]?.id;
        if (!surveyId) {
            console.error("Survey ID not found in state");
            return;
        }

        try {
            const response = await fetch(`fetch("https://comp-413-team-2.onrender.com/surveys/${surveyId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete survey.");
            }

            const result = await response.json();
            console.log("Survey deleted:", result);

            // Remove from local state
            const updatedSurveys = surveys.filter((_, idx) => idx !== surveyToDeleteIndex);
            setSurveys(updatedSurveys);

            // Close modal
            setShowDeleteModal(false);
            setSurveyToDeleteIndex(null);
        } catch (err) {
            console.error("Error deleting survey");
            alert("Failed to delete survey. Check console for more details.");
        }
    };

    // Triggers when user cancels the deletion of their survey
    const cancelDeleteSurvey = () => {
        setShowDeleteModal(false);
        setSurveyToDeleteIndex(null);
    };

    // Upon pressing the delete survey button, we display the delete modal and find the idx to delete.
    const handleDeleteSurvey = (index: number) => {
        setSurveyToDeleteIndex(index);
        setShowDeleteModal(true);
    };

    /**
     * Helper function that helps render the main content in the page (displaying surveys).
     * When there are no available surveys, we will have a more intuitive layout for admins
     * to add a survey.
     */
    const renderSurveyList = () => {
        if (surveys.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className={styles.emptyStateText}>
                        There are no surveys uploaded. Be the first to upload one!
                    </p>
                    <button
                        onClick={() => navigate("/new-survey")}
                        className={styles.createSurveyBtn}
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
                            className={styles.surveyCardClass}
                        >
                            <div>
                                <strong>{survey.title}</strong> - {survey.description}
                            </div>
                            <div className="flex gap-2">
                                {/* <button
                                    className={styles.takeSurveyBtn}
                                    onClick={() => console.log("View survey", index)}
                                >
                                    View
                                </button> */}
                                <button
                                    className={styles.takeSurveyBtn}
                                    onClick={() => navigate(`/surveys/${survey.id}/responses`)}
                                    >
                                    View Responses
                                </button>
                                <button
                                    className={styles.deleteSurveyBtn}
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
                        className={styles.createSurveyBtn}
                    >
                        + New Survey
                    </button>
                </div>
            </>
        );
    };

    return (
        <div className={styles.fullPageClass}>

            {/* Navigation Bar */}
            <div className={styles.navBarClass}>
                <div className="flex gap-4">
                    { /* <button className={styles.navButtonClass} onClick={() => navigate("/research")}>Research</button> */}
                    { /* <button className={styles.navButtonClass} onClick={() => navigate("/new-survey")}>Surveys</button> */}
                    <button className={styles.navButtonClass} onClick={() => navigate("/approvals")}>Approvals</button>
                </div>
                <div className="flex items-center gap-2 relative group">
                    {/* Admin icon with tooltip */}
                    <div className="relative group">
                        <FaUserShield className="text-white text-xl cursor-pointer" />
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            Admin Role
                        </div>
                    </div>
                    <UserMenu username={adminName} />
                </div>
            </div>

            {/* Content Area */}
            <div className={`${styles.contentAreaClass} ${styles.sectionPadding}`}>
                <div className="flex flex-col gap-4">
                    <div className={`bg-white ${styles.panelClass}`}>
                        <h3 className={styles.cardHeaderClass}>Surveys</h3>
                        {renderSurveyList()}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <ConfirmDeletionModal
                    title="Delete Survey"
                    message="Are you sure you want to delete this survey? This action cannot be undone."
                    onCancel={cancelDeleteSurvey}
                    onConfirm={confirmSurveyDeletion}
                />
            )}

            {/* Footer */}
            <footer className="text-right text-sm text-gray-500 pr-6 py-4">
                &copy; 2025 DermiQ. All rights reserved.
            </footer>
        </div>
    );
}
