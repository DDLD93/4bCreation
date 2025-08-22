const mongoose = require('mongoose');

// Define a schema for the OAuth tokens
const tokenSchema = new mongoose.Schema({
    accessToken: {
        type: String,
        required: true,
        trim: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    scope:{
        type: String,
        required: true,
    },
}, { timestamps: true }); 

module.exports = mongoose.model('ZohoToken', tokenSchema);