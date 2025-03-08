const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.post('/users', async (req, res) => {
    try {
        const { username, role } = req.body;

        if (!username || !role) {
            return res.status(400).json({ error: "Username and role are required." });
        }

        const newUser = await pool.query(
            "INSERT INTO users (username, role) VALUES ($1, $2) RETURNING *",
            [username, role]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while creating user." });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await pool.query("SELECT * FROM users");
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while fetching users." });
    }
});

app.post('/surveys', async (req, res) => {
    try {
        const { title, description, created_by } = req.body;

        const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [created_by]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: "User ID does not exist." });
        }

        const newSurvey = await pool.query(
            "INSERT INTO surveys (title, description, created_by) VALUES ($1, $2, $3) RETURNING *",
            [title, description, created_by]
        );

        res.json(newSurvey.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while creating survey." });
    }
});



app.get('/surveys/:survey_id', async (req, res) => {
    try {
        const { survey_id } = req.params;
        const surveys = await pool.query("SELECT * FROM surveys WHERE id = $1", [survey_id]);
        if (surveys.rows.length === 0) {
            return res.status(400).json({ error: "Survey ID does not exist." });
        }

        
        res.json(surveys.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while fetching surveys." });
    }
})

app.get('/surveys', async (req, res) => {
    try {
        const surveys = await pool.query("SELECT * FROM surveys");
        res.json(surveys.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while fetching surveys." });
    }
});



app.post('/questions', async (req, res) => {
    try {
        const { survey_id, question_text } = req.body;

        const surveyCheck = await pool.query("SELECT * FROM surveys WHERE id = $1", [survey_id]);
        if (surveyCheck.rows.length === 0) {
            return res.status(400).json({ error: "Survey ID does not exist." });
        }

        const newQuestion = await pool.query(
            "INSERT INTO questions (survey_id, question_text) VALUES ($1, $2) RETURNING *",
            [survey_id, question_text]
        );

        res.json(newQuestion.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while creating question." });
    }
});

app.get('/questions', async (req, res) => {
    try {
        const questions = await pool.query("SELECT * FROM questions");
        res.json(questions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while fetching questions." });
    }
});

app.post('/responses', async (req, res) => {
    try {
        const { survey_id, user_id, question_id, response_text } = req.body;

        const surveyCheck = await pool.query("SELECT * FROM surveys WHERE id = $1", [survey_id]);
        if (surveyCheck.rows.length === 0) {
            return res.status(400).json({ error: "Survey ID does not exist." });
        }

        const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: "User ID does not exist." });
        }

        const questionCheck = await pool.query("SELECT * FROM questions WHERE id = $1", [question_id]);
        if (questionCheck.rows.length === 0) {
            return res.status(400).json({ error: "Question ID does not exist." });
        }

        const newResponse = await pool.query(
            "INSERT INTO responses (survey_id, user_id, question_id, response_text) VALUES ($1, $2, $3, $4) RETURNING *",
            [survey_id, user_id, question_id, response_text]
        );

        res.json(newResponse.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while submitting response." });
    }
});

app.get('/responses/:survey_id', async (req, res) => {
    try {
        const { survey_id } = req.params;

        const surveyCheck = await pool.query("SELECT * FROM surveys WHERE id = $1", [survey_id]);
        if (surveyCheck.rows.length === 0) {
            return res.status(400).json({ error: "Survey ID does not exist." });
        }

        const responses = await pool.query(
            "SELECT * FROM responses WHERE survey_id = $1",
            [survey_id]
        );

        if (responses.rows.length === 0) {
            return res.status(404).json({ error: "No responses found for this survey." });
        }

        res.json(responses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error while fetching responses." });
    }
});
