document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = "http://localhost:5050"; 

    const addSurveyBtn = document.getElementById("add-survey-btn");

    if (addSurveyBtn) {
        addSurveyBtn.addEventListener("click", function () {
            window.location.href = "new_survey.html"; 
        });
    }

    document.getElementById("admin-login")?.addEventListener("click", function () {
        login("admin");
    });

    document.getElementById("doctor-login")?.addEventListener("click", function () {
        login("doctor");
    });

    function login(userType) {
        const username = document.getElementById("username")?.value.trim();
        if (!username) {
            alert("Please enter your name.");
            return;
        }

        fetch(`${API_BASE_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, role: userType })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                localStorage.setItem("user_id", data.id);
                localStorage.setItem("username", username);
                window.location.href = userType === "admin" ? "admin.html" : "doctor.html";
            }
        })
        .catch(err => console.error("Error logging in:", err));
    }

    function loadSurveys() {
        fetch(`${API_BASE_URL}/surveys`)
            .then(response => response.json())
            .then(surveys => {
                const container = document.getElementById("surveys-container");
                if (!container) return;
                container.innerHTML = "";
                surveys.forEach(survey => {
                    let li = document.createElement("li");
                    li.innerHTML = `<strong>${survey.title}</strong> - ${survey.description} 
                                    <button onclick="viewSurvey(${survey.id})">View</button>`;
                    container.appendChild(li);
                });
            })
            .catch(err => console.error("Error fetching surveys:", err));
    }

    document.getElementById("create-survey-btn")?.addEventListener("click", function () {
        const title = document.getElementById("survey-title").value.trim();
        const description = document.getElementById("survey-desc").value.trim();
        const created_by = localStorage.getItem("user_id");

        if (!title || !description) {
            alert("Please enter survey title and description.");
            return;
        }

        fetch(`${API_BASE_URL}/surveys`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, created_by })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert("Survey created successfully!");
                window.location.href = "admin.html";
            }
        })
        .catch(err => console.error("Error creating survey:", err));
    });

    function viewSurvey(surveyId) {
        localStorage.setItem("currentSurveyId", surveyId);
        window.location.href = "view_survey.html";
    }

    if (document.getElementById("survey-title") && document.getElementById("survey-desc")) {
        const surveyId = localStorage.getItem("currentSurveyId");
        fetch(`${API_BASE_URL}/questions?survey_id=${surveyId}`)
            .then(response => response.json())
            .then(questions => {
                document.getElementById("survey-questions").innerHTML = "";
                questions.forEach(q => {
                    let div = document.createElement("div");
                    div.innerHTML = `<label>${q.question_text}</label> <input type="text" id="q${q.id}">`;
                    document.getElementById("survey-questions").appendChild(div);
                });
            })
            .catch(err => console.error("Error fetching questions:", err));
    }

    document.getElementById("submit-survey-btn")?.addEventListener("click", function () {
        const surveyId = localStorage.getItem("currentSurveyId");
        const userId = localStorage.getItem("user_id");
        let responses = [];

        document.querySelectorAll("#survey-questions input").forEach(input => {
            let questionId = input.id.replace("q", "");
            responses.push({
                survey_id: surveyId,
                user_id: userId,
                question_id: questionId,
                response_text: input.value.trim()
            });
        });

        responses.forEach(response => {
            fetch(`${API_BASE_URL}/responses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Response submitted successfully!");
                    window.location.href = "doctor.html";
                }
            })
            .catch(err => console.error("Error submitting response:", err));
        });
    });

    loadSurveys();
});
