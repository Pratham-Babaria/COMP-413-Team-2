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
