import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./userMenu";
import { styles } from "../../styles/sharedStyles";

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

export default function Doctor() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [submittedSurveyIds, setSubmittedSurveyIds] = useState<Set<number>>(new Set());
    const navigate = useNavigate();

    const doctorName = localStorage.getItem("username") || "Doctor";
    const doctorId = localStorage.getItem("userId") || "1";

    useEffect(() => {
        // Get assigned surveys
        fetch(`http://localhost:5050/survey-assignments/${doctorId}`)
            .then((res) => res.json())
            .then((data: Survey[]) => setSurveys(data))
            .catch((err) => console.error("Error fetching assigned surveys:", err));

        // Check which surveys have been submitted
        fetch(`http://localhost:5050/responses?user_id=${doctorId}`)
            .then((res) => res.json())
            .then((data: Response[]) => {
                const surveyIds = new Set(data.map((r) => r.survey_id));
                setSubmittedSurveyIds(surveyIds);
            })
            .catch((err) => console.error("Error fetching user responses:", err));
    }, [doctorId]);

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
                                    View Responses
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
                <UserMenu username={doctorName} />
            </div>

            <div className={`${styles.contentAreaClass} ${styles.sectionPadding}`}>
                <div className="flex flex-col gap-4">
                    <div className={`bg-white ${styles.panelClass}`}>
                        <h3 className={styles.cardHeaderClass}>Available Surveys</h3>
                        {renderSurveyList()}
                    </div>
                </div>
            </div>
        </div>
    );
}
