const Question = require('../model/QuestionModel');
const CustomError = require('../utils/customError');

class QuestionService {
    async createQuestion(data) {
        const question = new Question(data);
        await question.save();
        return question;
    }

    async getQuestion(id) {
        const question = await Question.findById(id);
        if (!question) {
            throw new CustomError('Question not found', 404);
        }
        return question;
    }

    async getAllQuestions() {
        return await Question.find();
    }
}

module.exports = new QuestionService();
