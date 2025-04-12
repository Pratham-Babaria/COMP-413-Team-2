import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import logo from "../../images/dermiq.png";
import { styles } from "../../styles/sharedStyles";

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

                <div className="flex flex-col gap-3 mb-4">
                    <button
                        onClick={() => handleLogin("admin")}
                        className={styles.loginBtn}
                    >
                        Login as Admin
                    </button>
                    <button
                        onClick={() => handleLogin("doctor")}
                        className={styles.loginBtn}
                    >
                        Login as Doctor
                    </button>
                </div>

                <p className="text-sm text-gray-600">
                    Don’t have an account?
                    <span className="text-blue-600 font-medium ml-1 cursor-pointer hover:underline">
                        Sign Up
                    </span>
                </p>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-80">
                            <h3 className="text-lg font-semibold mb-2">Missing Info</h3>
                            <p className="text-sm mb-4">
                                Please enter both a username and password before logging in.
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

export default Index;
