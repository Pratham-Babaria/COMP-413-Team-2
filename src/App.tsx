import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./components/pages/Index";
import Admin from "./components/pages/Admin";
import Doctor from "./components/pages/Doctor";
import NewSurvey from "./components/pages/NewSurvey";
import TakeSurvey from "./components/pages/TakeSurvey";

/**
 * Root application component that sets up routing for the different user views.
 * 
 * @returns {JSX.Element} The application with defined routes different pages.
 */
export default function App(): JSX.Element {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/doctor" element={<Doctor />} />
                <Route path="/new-survey" element={<NewSurvey />} />
                <Route path="/doctor/surveys/:surveyId" element={<TakeSurvey />} />
            </Routes>
        </Router>
    );
}