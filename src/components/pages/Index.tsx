import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import logo from "../../images/dermiq.png";
import "../../styles/styles.css";

const Index: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (userType: "admin" | "doctor") => {
        if (!username.trim() || !password.trim()) {
            setShowModal(true);
            return;
        }
        localStorage.setItem("username", username);
        navigate(userType === "admin" ? "/admin" : "/doctor");
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <img src={logo} alt="DermIQ Logo" className="logo" />
                {/* <h2 className="login-title">Login</h2> */}

                <div className="input-icon">
                    <FaUser />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="input-icon">
                    <FaLock />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="button-group">
                    <button onClick={() => handleLogin("admin")}>Login as Admin</button>
                    <button onClick={() => handleLogin("doctor")}>Login as Doctor</button>
                </div>

                <p className="signup-text">
                    Don’t have an account?<span className="signup-link">Sign Up</span>
                </p>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Missing Info</h3>
                        <p>Please enter both a username and password before logging in.</p>
                        <button className="modal-button" onClick={() => setShowModal(false)}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Index;
