import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./tailwind.css";

/**
 * Entry point of the React application.
 * 
 * Renders the root App component inside the HTML element with id "root",
 * using React's StrictMode for highlighting potential problems.
 */
export default function main(): void {
    const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

main();
