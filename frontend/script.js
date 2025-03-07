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
