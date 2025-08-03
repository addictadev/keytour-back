const express = require('express');
const QuestionController = require('../controllers/questionController');
const router = express.Router();

// Route to create a question
router.post('/', QuestionController.createQuestion);

// Route to get a specific question
router.get('/:id', QuestionController.getQuestion);

// Route to get all questions
router.get('/', QuestionController.getAllQuestions);

module.exports = router;
