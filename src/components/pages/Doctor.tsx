import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./userMenu";
import { styles } from "../../styles/sharedStyles";

/**
 * Doctor dashboard component. Doctor users should
 * be able to view and submit surveys.
 */
export default function Doctor() {

    // Surveys available to the doctor
    const [surveys, setSurveys] = useState<{ title: string; description: string }[]>([]);
    const navigate = useNavigate();
    const doctorName = localStorage.getItem("username") || "Doctor";

    // Load saved surveys
    useEffect(() => {
        // need to integrate with backend!!!
        const storedSurveys = JSON.parse(localStorage.getItem("surveys") || "[]");
        setSurveys(storedSurveys);
    }, []);

    // Renders either the list of surveys or a helpful empty-state message
    const renderSurveyList = () => {

        // display a message if there are no surveys
        if (surveys.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className={styles.emptyStateText}>
                        No surveys available at the moment.
                    </p>
                </div>
            );
        }

        // display all available surveys to the doctor
        return (
            <ul className="space-y-2">
                {surveys.map((survey, index) => (
                    <li
                        key={index}
                        className={styles.surveyCardClass}
                    >
                        <div>
                            <strong>{survey.title}</strong> - {survey.description}
                        </div>
                        <button
                            className={styles.takeSurveyBtn}
                            onClick={() => console.log("Taking survey", index)}
                        >
                            Take Survey
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className={styles.fullPageClass}>
            {/* Navbar */}
            <div className={styles.navBarClass}>
                <div className="flex gap-4">
                    <button className={styles.navButtonClass} onClick={() => navigate("/surveys")}>Surveys</button>
                    <button className={styles.navButtonClass} onClick={() => navigate("/responses")}>Responses</button>
                    <button className={styles.navButtonClass} onClick={() => navigate("/invites")}>Invites</button>
                </div>
                <UserMenu username={doctorName} />
            </div>

            {/* Content Area */}
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
