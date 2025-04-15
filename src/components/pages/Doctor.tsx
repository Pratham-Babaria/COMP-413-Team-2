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


/**
 * Doctor dashboard component. Doctor users should
 * be able to view and submit surveys.
 */
export default function Doctor() {

    // Surveys available to the doctor
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const navigate = useNavigate();
    const doctorName = localStorage.getItem("username") || "Doctor";
    const doctorId = "1"; // To do: get doctor id when log in

    useEffect(() => {
        
        fetch(`http://localhost:5050/survey-assignments/${doctorId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error("Failed to fetch assigned surveys");
            }
            return res.json();
          })
          .then((data: Survey[]) => {
            // The endpoint returns an array of surveys assigned to this doctor
            setSurveys(data);
          })
          .catch((err) => {
            console.error("Error fetching assigned surveys:", err);
          });
      }, [doctorId]);

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
                            onClick={() => navigate(`/doctor/surveys/${survey.id}`)}
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
