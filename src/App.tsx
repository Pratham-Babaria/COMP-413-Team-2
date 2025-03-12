import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./components/pages/Index";
import Admin from "./components/pages/Admin";
import Doctor from "./components/pages/Doctor";
import NewSurvey from "./components/pages/NewSurvey";
import "./styles/styles.css";


const App: React.FC = () => (
    <Router>
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/new-survey" element = {<NewSurvey />} />
        </Routes>
    </Router>
);

export default App;
