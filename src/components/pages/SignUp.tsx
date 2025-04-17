import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaCheck} from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import logo from "../../images/dermiq.png";
import { styles } from "../../styles/sharedStyles";

//need more informative error messages

const SignUp: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const navigate = useNavigate();

    const handleSignUp = (userType: "admin" | "doctor") => {
        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
            setErrorMsg("Missing info: Please enter both a username and password before logging in.");
            setShowModal(true);
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match! Try again.")
            setShowModal(true);
            return;
        }
        createUserWithEmailAndPassword(auth, username, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                if (user.email != null){
                    console.log(user.email)
                    localStorage.setItem("username", user.email);
                    navigate(userType === "admin" ? "/admin" : "/doctor");
                }
                // ...
            })
            .catch((error) => {
                if (error.code ===  "auth/invalid-email") {
                    setErrorMsg("Invalid email address. Please try again.")
                }
                if (error.code === "auth/password-does-not-meet-requirements"){
                    setErrorMsg("Password must be between 6 and 20 characters. Please try again.")
                }
                console.log('Error signing up:', error.code);
                setShowModal(true);
                // ..
            });

    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
    
        // Check if passwords match in real-time
        setPasswordsMatch(e.target.value === password);
      };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-gray-100">
            <div className="bg-white p-10 rounded-2xl shadow-lg w-[360px] text-center">
                <img src={logo} alt="DermIQ Logo" className="w-[150px] mb-6 mx-auto" />

                <div className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 h-11 mb-4">
                    <FaUser className="text-gray-500 mr-3 text-sm" />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-transparent outline-none text-sm w-full"
                    />
                </div>

                <div className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 h-11 mb-4">
                    <FaLock className="text-gray-500 mr-3 text-sm" />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-transparent outline-none text-sm w-full"
                    />
                </div>

                <div className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 h-11 mb-4">
                    <FaCheck className="text-gray-500 mr-3 text-sm" />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="bg-transparent outline-none text-sm w-full"
                    />
                    {!passwordsMatch && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                        Passwords do not match
                    </span>
                    )}
                </div>

                <div className="flex flex-col gap-3 mb-4">
                    <button
                        onClick={() => handleSignUp("admin")}
                        className={styles.loginBtn}
                    >
                        Sign Up as Admin
                    </button>
                    <button
                        onClick={() => handleSignUp("doctor")}
                        className={styles.loginBtn}
                    >
                        Sign Up as Doctor
                    </button>
                </div>

                <p className="text-sm text-gray-600">
                    <span onClick={() => navigate("/")} className="text-blue-600 font-medium ml-1 cursor-pointer hover:underline">
                        Back to Login
                    </span>
                </p>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-80">
                            <h3 className="text-lg font-semibold mb-2">Error</h3>
                            <p className="text-sm mb-4">
                                {errorMsg}
                            </p>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                                onClick={() => setShowModal(false)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignUp;
