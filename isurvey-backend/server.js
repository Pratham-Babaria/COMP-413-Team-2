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

app.post('/surveys', async (req, res) => {
    try {
        const { title, description, created_by } = req.body;
        const newSurvey = await pool.query(
            "INSERT INTO surveys (title, description, created_by) VALUES ($1, $2, $3) RETURNING *",
            [title, description, created_by]
        );
        res.json(newSurvey.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.get('/surveys', async (req, res) => {
    try {
        const surveys = await pool.query("SELECT * FROM surveys");
        res.json(surveys.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.post('/responses', async (req, res) => {
    try {
        const { survey_id, user_id, question_id, response_text } = req.body;
        const newResponse = await pool.query(
            "INSERT INTO responses (survey_id, user_id, question_id, response_text) VALUES ($1, $2, $3, $4) RETURNING *",
            [survey_id, user_id, question_id, response_text]
        );
        res.json(newResponse.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.get('/responses/:survey_id', async (req, res) => {
    try {
        const { survey_id } = req.params;
        const responses = await pool.query(
            "SELECT * FROM responses WHERE survey_id = $1",
            [survey_id]
        );
        res.json(responses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

