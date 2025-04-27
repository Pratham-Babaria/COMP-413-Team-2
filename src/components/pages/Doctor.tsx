import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./userMenu";
import { styles } from "../../styles/sharedStyles";
import { FaUserMd } from "react-icons/fa";


interface Survey {
    id: number;
    title: string;
    description: string;
    created_by: number;
}

interface Response {
    survey_id: number;
    user_id: number;
}

/**
 * Doctor dashboard component for doctors to take surveys
 * and upload them.
 */
export default function Doctor() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [submittedSurveyIds, setSubmittedSurveyIds] = useState<Set<number>>(new Set());
    const navigate = useNavigate();

    const doctorName = localStorage.getItem("username") || "Doctor";
    const doctorId = localStorage.getItem("userId") || "1";

    useEffect(() => {
        // Get assigned surveys
        fetch(`https://comp-413-team-2.onrender.com/survey-assignments/${doctorId}`)
            .then((res) => res.json())
            .then((data: Survey[]) => setSurveys(data))
            .catch((err) => console.error("Error fetching assigned surveys:", err));

        // Check which surveys have been submitted
        fetch(`https://comp-413-team-2.onrender.com/responses?user_id=${doctorId}`)
            .then((res) => res.json())
            .then((data: Response[]) => {
                const surveyIds = new Set(data.map((r) => r.survey_id));
                setSubmittedSurveyIds(surveyIds);
            })
            .catch((err) => console.error("Error fetching user responses:", err));
    }, [doctorId]);


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
                        No surveys available at the moment.
                    </p>
                </div>
            );
        }
        return (
            <ul className="space-y-2">
                {surveys.map((survey) => {
                    const alreadySubmitted = submittedSurveyIds.has(survey.id);
                    return (
                        <li key={survey.id} className={styles.surveyCardClass}>
                            <div>
                                <strong>{survey.title}</strong> - {survey.description}
                            </div>
                            {alreadySubmitted ? (
                                <button
                                    className={styles.takeSurveyBtn}
                                    onClick={() => navigate(`/responses/${survey.id}`)}
                                >
                                    View Your Response
                                </button>
                            ) : (
                                <button
                                    className={styles.takeSurveyBtn}
                                    onClick={() => navigate(`/doctor/surveys/${survey.id}`)}
                                >
                                    Take Survey
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className={styles.fullPageClass}>
            <div className={styles.navBarClass}>
                <div className="flex gap-4">
                    <button className={styles.navButtonClass} onClick={() => navigate("/surveys")}>Surveys</button>
                    <button className={styles.navButtonClass} onClick={() => navigate("/responses")}>Responses</button>
                    <button className={styles.navButtonClass} onClick={() => navigate("/invites")}>Invites</button>
                </div>
                <div className="flex items-center gap-2 relative group">
                    <div className="relative group">
                        <FaUserMd className="text-white text-xl cursor-pointer" />
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            Doctor Role
                        </div>
                    </div>

                    <UserMenu username={doctorName} />
                </div>
            </div>

            <div className={`${styles.contentAreaClass} ${styles.sectionPadding}`}>
                <div className="flex flex-col gap-4">
                    <div className={`bg-white ${styles.panelClass}`}>
                        <h3 className={styles.cardHeaderClass}>Available Surveys</h3>
                        {renderSurveyList()}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-right text-sm text-gray-500 pr-6 py-4">
                &copy; 2025 DermiQ. All rights reserved.
            </footer>
        </div>
    );
}
