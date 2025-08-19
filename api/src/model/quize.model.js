const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuizSchema = new Schema({
    webinar: {
      type: Schema.Types.ObjectId,
      ref: 'Webinar',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true
    },
    questions: [{
      question: {
        type: String,
        required: true
      },
      options: [{
        type: String,
        required: true
      }],
      correctAnswer: {
        type: Number,
        required: true,
        min: 0
      },
      points: {
        type: Number,
        default: 1,
        min: 0
      }
    }],
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    timeLimit: {
      type: Number, // In minutes
      default: 30,
      min: 5
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1
    },
    totalPoints: {
      type: Number,
      default: 0
    }
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Add middleware to calculate total points before saving
  QuizSchema.pre('save', function(next) {
    this.totalPoints = this.questions.reduce((total, question) => {
      return total + question.points;
    }, 0);
    next();
  });

  // Virtual for getting attempts for a specific user
  QuizSchema.virtual('userAttempts', {
    ref: 'QuizAttempt',
    localField: '_id',
    foreignField: 'quiz',
    justOne: false,
    options: {
      sort: { createdAt: -1 }
    },
    // Will be populated with specific user ID when needed
    match: function(userId) {
      if (userId) {
        return { user: userId };
      }
      return {};
    }
  });

  // Method to get quiz with user's attempt information
  QuizSchema.methods.getWithUserAttempts = async function(userId) {
    await this.populate({
      path: 'userAttempts',
      match: { user: userId },
      options: { sort: { createdAt: -1 } }
    });
    
    const quiz = this.toObject();
    
    // Add user-specific fields
    quiz.hasPassed = quiz.userAttempts && 
                    quiz.userAttempts.some(attempt => attempt.passed === true);
    
    quiz.latestAttempt = quiz.userAttempts && quiz.userAttempts.length > 0 ? 
                        quiz.userAttempts[0] : null;
    
    quiz.totalAttempts = quiz.userAttempts ? quiz.userAttempts.length : 0;
    
    quiz.canAttempt = quiz.totalAttempts < quiz.maxAttempts && 
                      (!quiz.hasPassed || quiz.allowRetakesAfterPassing);
    
    return quiz;
  };

  module.exports = mongoose.model('Quiz', QuizSchema);