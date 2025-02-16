function login(userType) {
    const username = document.getElementById("username").value;
    
    if (!username) {
        alert("Please enter your name.");
        return;
    }

    localStorage.setItem("username", username);

    if (userType === "admin") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "doctor.html";
    }
}

function logout() {
    localStorage.removeItem("username");
    window.location.href = "index.html";
}

window.onload = function() {
    const userName = localStorage.getItem("username");
    
    if (userName) {
        if (document.getElementById("adminName")) {
            document.getElementById("adminName").textContent = userName;
        }
        if (document.getElementById("doctorName")) {
            document.getElementById("doctorName").textContent = userName;
        }
    }
};

// drop down when create new survey button is clicked
document.getElementById("add-survey-btn").addEventListener("click", function(event) {
    event.stopPropagation(); 
    let dropdown = document.getElementById("survey-dropdown");
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
});

document.getElementById("add-survey-btn").addEventListener("click", function(event) {
    event.stopPropagation(); 

    let dropdown = document.getElementById("survey-dropdown");
    let plusButton = event.target.getBoundingClientRect(); 

    // position dropdown under the + button
    dropdown.style.display = "block";
    dropdown.style.position = "absolute";
    dropdown.style.top = `${plusButton.bottom + window.scrollY}px`; 
    dropdown.style.left = `${plusButton.left + window.scrollX}px`; 
});

// Hide dropdown if clicking outside of it
document.addEventListener("click", function(event) {
    let dropdown = document.getElementById("survey-dropdown");
    if (dropdown.style.display === "block" && !event.target.closest("#add-survey-btn")) {
        dropdown.style.display = "none";
    }
});

// handle click on "create a new survey" in admin
document.getElementById("create-survey").addEventListener("click", function() {
    alert("Redirecting to create survey page...");
    window.location.href = "new_survey.html";
});




