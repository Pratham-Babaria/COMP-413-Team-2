import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./components/pages/Index";
import Admin from "./components/pages/Admin";
import Doctor from "./components/pages/Doctor";
import NewSurvey from "./components/pages/NewSurvey";
import SignUp from "./components/pages/SignUp";
import TakeSurvey from "./components/pages/TakeSurvey";
import DoctorResponses from "./components/pages/DoctorResponses";
import AdminResponses from "./components/pages/AdminResponses";
import AboutPage from "./components/pages/aboutPage";

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
                <Route path="/signup" element = {<SignUp />} />
                <Route path="/doctor" element={<Doctor />} />
                <Route path="/new-survey" element={<NewSurvey />} />
                <Route path="/doctor/surveys/:surveyId" element={<TakeSurvey />} />
                <Route path="/responses/:surveyId?" element={<DoctorResponses />} />
                <Route path="/surveys/:surveyId/responses" element={<AdminResponses />} />
                <Route path="/about" element={<AboutPage />} />
            </Routes>
        </Router>
    );
}
