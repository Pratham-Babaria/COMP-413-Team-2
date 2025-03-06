import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Index: React.FC = () => {
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    const handleLogin = (userType: "admin" | "doctor") => {
        if (!username.trim()) {
            alert("Please enter your name.");
            return;
        }
        localStorage.setItem("username", username);
        navigate(userType === "admin" ? "/admin" : "/doctor");
    };

    return (
        <div className="login-container">
            <h2>iSurvey Login</h2>
            <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={() => handleLogin("admin")}>Login as Admin</button>
            <button onClick={() => handleLogin("doctor")}>Login as Doctor</button>
        </div>
    );
};

export default Index;
