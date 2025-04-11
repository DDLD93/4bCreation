// Quiz Model - Optimized and Indexed
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

  module.exports = mongoose.model('Quiz', QuizSchema);