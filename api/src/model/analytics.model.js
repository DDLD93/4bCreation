// Analytics Model - For tracking and performance metrics
const AnalyticsSchema = new Schema({
    webinar: {
      type: Schema.Types.ObjectId,
      ref: 'Webinar',
      required: true,
      index: true
    },
    totalRegistered: {
      type: Number,
      default: 0
    },
    totalAttended: {
      type: Number,
      default: 0
    },
    averageWatchTime: {
      type: Number,
      default: 0 // In seconds
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    quizAttempts: {
      type: Number,
      default: 0
    },
    quizPassRate: {
      type: Number,
      default: 0 // Percentage
    },
    certificatesIssued: {
      type: Number,
      default: 0
    },
    engagementScore: {
      type: Number,
      default: 0 // 0-100
    },
    peakConcurrentUsers: {
      type: Number,
      default: 0
    },
    userDemographics: {
      ministries: {
        type: Map,
        of: Number
      },
      departments: {
        type: Map,
        of: Number
      }
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }, { 
    timestamps: true 
  });

  module.exports = mongoose.model('Analytics', AnalyticsSchema);
