import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaCheck} from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import logo from "../../images/dermiq.png";
import "../../styles/styles.css";

//need more informative error messages

const SignUp: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const navigate = useNavigate();

    const handleSignUp = (userType: "admin" | "doctor") => {
        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
            setShowModal(true);
            return;
        }
        if (password !== confirmPassword) {
            //add something here to make an informative modal
            setShowModal(true);
            return;
        }
        createUserWithEmailAndPassword(auth, username, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                if (user.email != null){
                    localStorage.setItem("username", user.email);
                }
                // ...
            })
            .catch((error) => {
                setShowModal(true);
                // ..
            });
        navigate(userType === "admin" ? "/admin" : "/doctor");
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
    
        // Check if passwords match in real-time
        setPasswordsMatch(e.target.value === password);
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

                <div className="input-icon">
                    <FaCheck />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        style={{
                            borderColor: !passwordsMatch ? "red" : "initial",
                        }}
                    />
                    {!passwordsMatch && (
                        <span style={{ color: "red", fontSize: "12px" }}>
                            Passwords do not match
                        </span>
                    )}
                </div>

                <div className="button-group">
                    <button onClick={() => handleSignUp("admin")}>Register as Admin</button>
                    <button onClick={() => handleSignUp("doctor")}>Register as Doctor</button>
                </div>

                <p className="signup-text">
                    <span onClick={() => navigate("/")} className="signup-link">Back to Login</span>
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

export default SignUp;
