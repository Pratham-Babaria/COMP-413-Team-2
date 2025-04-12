import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./userMenu";
import ConfirmDeletionModal from "./confirmDeletion";
import {styles} from "../../styles/sharedStyles";

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

    // Function updates the state of the surveys when user confirms survey deletion
    const confirmSurveyDeletion = () => {
        if (surveyToDeleteIndex === null) {
            return;
        }
        // add the surveys we don't want to delete to a new list
        const updatedSurveys: { title: string; description: string }[] = [];
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
     * Helper functions that helps render the main content in the page (displaying surveys).
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
                                <button
                                    className={styles.takeSurveyBtn}
                                    onClick={() => console.log("View survey", index)}
                                >
                                    View
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
            {/* Navbar */}
            <div className={styles.navBarClass}>
                <div className="flex gap-4">
                    <button className={styles.navButtonClass} onClick={() => navigate("/research")}>Research</button>
                    <button className={styles.navButtonClass} onClick={() => navigate("/new-survey")}>Surveys</button>
                    <button className={styles.navButtonClass} onClick={() => navigate("/approvals")}>Approvals</button>
                </div>
                <UserMenu username={adminName} />
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
        </div>
    );
}
