import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Re-usable component that appears when a user clicks on their username.
 * It will display options to logout, change their settings, and an info page.
 * @param {string} username: current user's display name
 * @returns {JSX.Element} a UserMenu component
 */
export default function UserMenu({ username }: { username: string }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // log the user out
    const logout = () => {
        localStorage.removeItem("username");
        navigate("/");
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-white font-semibold hover:text-gray-200 transition px-4 py-2 bg-blue-400 rounded-full"
            >
                {username}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 text-black">
                    <button
                        onClick={() => navigate("/settings")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                        Settings
                    </button>
                    <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-t"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
