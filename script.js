document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("admin-login")?.addEventListener("click", function () {
        login("admin");
    });

    document.getElementById("doctor-login")?.addEventListener("click", function () {
        login("doctor");
    });

    function login(userType) {
        const usernameInput = document.getElementById("username");
        const username = usernameInput ? usernameInput.value.trim() : null;

        if (!username) {
            alert("Please enter your name.");
            return;
        }

        localStorage.setItem("username", username);
        window.location.href = userType === "admin" ? "admin.html" : "doctor.html";
    }

    function logout() {
        localStorage.removeItem("username");
        window.location.href = "index.html";
    }

    const userName = localStorage.getItem("username");
    if (userName) {
        if (document.getElementById("adminName")) {
            document.getElementById("adminName").textContent = userName;
        }
        if (document.getElementById("doctorName")) {
            document.getElementById("doctorName").textContent = userName;
        }
    }

    const addSurveyBtn = document.getElementById("add-survey-btn");

    if (addSurveyBtn) {
        addSurveyBtn.addEventListener("click", function () {
            window.location.href = "new_survey.html";
        });
    }

    const surveyQuestionsContainer = document.getElementById("survey-questions");
    const addQuestionButton = document.getElementById("add-question-btn");
    const createSurveyButton = document.getElementById("create-survey-btn");
    let questions = [];

    addQuestionButton?.addEventListener("click", function () {
        let newQuestion = prompt("Enter your question:");
        if (newQuestion) {
            let questionDiv = document.createElement("div");
            questionDiv.classList.add("question");
            questionDiv.innerHTML = `<label>${newQuestion}</label>
                                     <input type="text" placeholder="Answer here">`;
            surveyQuestionsContainer.appendChild(questionDiv);
            questions.push(newQuestion);
        }
    });

    createSurveyButton?.addEventListener("click", function () {
        const title = document.getElementById("survey-title").value.trim();
        const description = document.getElementById("survey-desc").value.trim();

        if (!title || !description) {
            alert("Please enter a survey title and description!");
            return;
        }

        let surveys = JSON.parse(localStorage.getItem("surveys")) || [];
        surveys.push({ title, description, questions });
        localStorage.setItem("surveys", JSON.stringify(surveys));

        alert("Survey created successfully!");
        window.location.href = "admin.html";
    });

    if (document.getElementById("surveys-container")) {
        const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
        surveys.forEach((survey, index) => {
            let li = document.createElement("li");
            li.innerHTML = `<strong>${survey.title}</strong> - ${survey.description} 
                            <button onclick="viewSurvey(${index})">View</button>`;
            document.getElementById("surveys-container").appendChild(li);
        });
    }

    window.viewSurvey = function (index) {
        localStorage.setItem("currentSurveyIndex", index);
        window.location.href = "view_survey.html";
    };

    if (document.getElementById("doctor-surveys")) {
        const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
        surveys.forEach((survey, index) => {
            let li = document.createElement("li");
            li.innerHTML = `<strong>${survey.title}</strong> - ${survey.description} 
                            <button onclick="fillSurvey(${index})">Take Survey</button>`;
            document.getElementById("doctor-surveys").appendChild(li);
        });
    };

    window.fillSurvey = function (index) {
        localStorage.setItem("currentSurveyIndex", index);
        window.location.href = "fill_survey.html";
    };

    if (document.getElementById("survey-title") && document.getElementById("survey-desc")) {
        const index = localStorage.getItem("currentSurveyIndex");
        const surveys = JSON.parse(localStorage.getItem("surveys")) || [];

        if (surveys[index]) {
            document.getElementById("survey-title").innerText = surveys[index].title;
            document.getElementById("survey-desc").innerText = surveys[index].description;

            const form = document.getElementById("survey-form");
            surveys[index].questions.forEach((q, i) => {
                let div = document.createElement("div");
                div.innerHTML = `<label>${q}</label> <input type="text" id="q${i}">`;
                form.appendChild(div);
            });
        }
    }

    window.submitSurvey = function () {
        const index = localStorage.getItem("currentSurveyIndex");
        const surveys = JSON.parse(localStorage.getItem("surveys")) || [];

        let responses = [];
        surveys[index].questions.forEach((q, i) => {
            responses.push(document.getElementById(`q${i}`).value);
        });

        let storedResponses = JSON.parse(localStorage.getItem("responses")) || {};
        storedResponses[index] = responses;
        localStorage.setItem("responses", JSON.stringify(storedResponses));

        alert("Survey submitted!");
        window.location.href = "doctor.html";
    };
});
