const QuestionService = require('../services/questionService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class QuestionController {
    createQuestion = catchAsync(async (req, res, next) => {
        const question = await QuestionService.createQuestion(req.body);
        response(res, 201, question, 'Question created successfully');
    });

    getQuestion = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const question = await QuestionService.getQuestion(id);
        response(res, 200, question, 'Question retrieved successfully');
    });

    getAllQuestions = catchAsync(async (req, res, next) => {
        const questions = await QuestionService.getAllQuestions();
        response(res, 200, questions, 'Questions retrieved successfully');
    });
}

module.exports = new QuestionController();
