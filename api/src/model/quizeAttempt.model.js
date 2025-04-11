const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Quiz Attempts Model - Optimized and Indexed
const QuizAttemptSchema = new Schema({
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    webinar: {
      type: Schema.Types.ObjectId,
      ref: 'Webinar',
      required: true,
      index: true
    },
    answers: [{
      questionIndex: Number,
      selectedOption: Number,
      isCorrect: Boolean,
      pointsEarned: Number
    }],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    passed: {
      type: Boolean,
      required: true,
      index: true
    },
    certificateGenerated: {
      type: Boolean,
      default: false,
      index: true
    },
    certificateUrl: String,
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    completionTime: { // In seconds
      type: Number
    }
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Create compound indexes for common queries
  QuizAttemptSchema.index({ quiz: 1, user: 1, attemptNumber: 1 });
  QuizAttemptSchema.index({ webinar: 1, passed: 1 });
  QuizAttemptSchema.index({ user: 1, passed: 1 });

  module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);