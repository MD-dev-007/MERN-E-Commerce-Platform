const mongoose = require('mongoose');

exports.checkDbConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: 'Database connection is being established, please try again in a moment'
        });
    }
    next();
}; 