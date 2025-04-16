import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import logo from "../../images/dermiq.png";
import "../../styles/styles.css";

const Index: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (userType: "admin" | "doctor") => {
        if (!username.trim() || !password.trim()) {
            setErrorMsg("Missing info: Please enter both a username and password before logging in.")
            setShowModal(true);
            return;
        }
        signInWithEmailAndPassword(auth, username, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                if (user.email != null){
                    localStorage.setItem("username", username);
                    navigate(userType === "admin" ? "/admin" : "/doctor");
                }
                // ...
            })
            .catch((error) => {
                if (error.code ===  "auth/invalid-email") {
                    setErrorMsg("Invalid email address. Please try again.")
                }
                if (error.code ===  "auth/invalid-credential") {
                    setErrorMsg("Incorrect username or password. Please try again.")
                }
                console.log('Error signing in:', error.code);
                setShowModal(true);
            });
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
                    Don’t have an account?<span onClick={() => navigate("/signup")} className="signup-link">Sign Up</span>
                </p>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Error</h3>
                        <p>{errorMsg}</p>
                        <button className="modal-button" onClick={() => setShowModal(false)}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Index;
