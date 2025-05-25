require('dotenv').config()
const mongoose = require("mongoose")

exports.connectToDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/E-commerce-horizon', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4,
            retryWrites: true,
            retryReads: true
        });

        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('❌ MongoDB disconnected');
        });

        return conn;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        // Don't exit process, let the application handle the error
        throw error;
    }
}