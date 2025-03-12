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
    const lesionContainer = document.getElementById("lesion-container");
    const lesionFilter = document.getElementById("lesion-filter");
    const lesionSelectionModal = document.getElementById('lesion-modal');
    const closeModal = document.getElementById('close-lesion-selection');
    const submitImage = document.getElementById('submit-image');
    let questions = [];
    let selectedLesion = null;

    // fetch the lesion images and display them
    function fetchLesions() {
        return fetch("http://localhost:5050/isic-images")
            .then(response => response.json())
            .then(data => {
                console.log('Fetched data:', data);
                return data;
            })
            .catch(error => {
                console.error("Error fetching lesion images:", error);
                return {}; 
            });
    }

    // display lesion images
    function displayImages(images) {
        lesionContainer.innerHTML = '';

        if (images.length === 0) {
            lesionContainer.innerHTML = "<p>No images found for the selected filter.</p>";
        }

        images.forEach(image => {
            const img = document.createElement('img');
            img.src = image.files.thumbnail_256.url;
            img.alt = image.attribution || 'No attribution available';
            img.classList.add('thumbnail');
            img.style.border = "3px transparent";
            img.addEventListener("click", () => selectImage(img));
            lesionContainer.appendChild(img);
        });
    };

    // handle image selection
    function selectImage(image) {
        if (selectedLesion) {
            selectedLesion.style.border = "3px transparent";
        }
        image.style.border = "3px solid blue";
        selectedLesion = image;
    };
    
    // change lesion filter
    lesionFilter?.addEventListener("change", function () {
        const filterValue = document.getElementById('lesion-filter').value;
        fetchLesions().then(data => {
            let filteredImages = data.results;

            // filter based on diagnosis_1 (Malignant or Benign)
            if (filterValue !== 'all') {
                filteredImages = filteredImages.filter(image => {
                    const diagnosis = image.metadata?.clinical?.diagnosis_1 || '';
                    return diagnosis.toLowerCase() === filterValue;
                });
            }

            // display the images in the modal after filtering
            displayImages(filteredImages);
            lesionSelectionModal.style.display = "block";
        });
    });

    // close image selection modal
    closeModal?.addEventListener("click", function () {
        lesionSelectionModal.style.display = "none";
    });

    // submit an image
    submitImage?.addEventListener("click", function () {
        if (!selectedLesion) {
            alert("Please select an image first.");
            return;
        }
    
        lesionSelectionModal.style.display = "none";
    
        const imgContainer = document.getElementById('selected-image-container');
        imgContainer.innerHTML = '';
    
        // create and append the selected image
        const selectedImg = document.createElement('img');
        selectedImg.src = selectedLesion.src;
        selectedImg.alt = selectedLesion.alt || 'No attribution available';
        selectedImg.classList.add('selected-image');
        imgContainer.appendChild(selectedImg);
    
        // create and append the "Change Image" button
        const changeImg = document.createElement('button');
        changeImg.id = "change-image";
        changeImg.textContent = "Change Image";
        imgContainer.appendChild(changeImg);
    
        // add event listener to the "Change Image" button
        changeImg?.addEventListener("click", function () {
            lesionSelectionModal.style.display = "block"; // Show the image selection modal again
        });
    });

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

// eye tracking stuff
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded. Waiting for user to start gaze tracking...");

    let gazeTrackingActive = false;

    // create heatmap instance over the entire document
    let heatmapInstance = h337.create({
        container: document.body,
        radius: 30,
        maxOpacity: 0.6,
        minOpacity: 0.2,
        blur: 0.75
    });

    function startGazeTracking() {
        if (!gazeTrackingActive) {
            console.log("Starting GazeCloudAPI eye tracking...");
            GazeCloudAPI.StartEyeTracking();
            gazeTrackingActive = true;

            // get the start eye tracking button position
            let button = document.getElementById("start-tracking-btn");
            if (button) {
                let buttonTop = button.getBoundingClientRect().top + window.scrollY;

                // scroll to the button
                window.scrollTo({ top: buttonTop - 100, behavior: "smooth" });

                console.log("Scrolling to Start Eye Tracking button at:", buttonTop);
            } else {
                console.error("Start Eye Tracking button not found.");
            }

            GazeCloudAPI.OnResult = function (GazeData) {
                if (GazeData.state === 0) { // 0 means valid gaze data
                    let x = GazeData.docX;
                    let y = GazeData.docY + window.scrollY; 

                    console.log(`Gaze detected at: (${x}, ${y})`);

                    // add data to heatmap
                    heatmapInstance.addData({ x: x, y: y, value: 1 });
                }
            };

            GazeCloudAPI.OnError = function (error) {
                console.error("GazeCloudAPI Error:", error);
            };
        } else {
            console.log("Gaze tracking is already active.");
        }
    }

    function stopGazeTracking() {
        if (gazeTrackingActive) {
            console.log("Stopping GazeCloudAPI eye tracking...");
            GazeCloudAPI.StopEyeTracking();
            gazeTrackingActive = false;
        } else {
            console.log("Gaze tracking is not active.");
        }
    }

    // Attach event listeners
    document.getElementById("start-tracking-btn").addEventListener("click", startGazeTracking);
    document.getElementById("stop-tracking-btn").addEventListener("click", stopGazeTracking);
});
