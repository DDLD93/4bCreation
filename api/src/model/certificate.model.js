// Certificate Model - Optimized and Indexed
const CertificateSchema = new Schema({
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
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true
    },
    quizAttempt: {
      type: Schema.Types.ObjectId,
      ref: 'QuizAttempt',
      required: true,
      unique: true
    },
    certificateUrl: {
      type: String,
      required: true
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true
    },
    expiry: {
      type: Date
    },
    metadata: {
      score: Number,
      completionDate: Date,
      webinarTitle: String,
      userName: String
    }
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Create compound indexes for common queries
  CertificateSchema.index({ user: 1, webinar: 1 });

  module.exports = mongoose.model('Certificate', CertificateSchema);