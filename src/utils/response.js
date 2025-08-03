const response = (res, status, data, message,analysis) => {
    res.status(status).json({
        status: status === 200 || status === 201 ? 'success' : 'error',
        analysis,
        message,
        data
    });
};

module.exports = response;
