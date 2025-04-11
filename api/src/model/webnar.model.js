// Webinar Model - Optimized and Indexed
const WebinarSchema = new Schema({
    title: {
      type: String,
      required: [true, 'Webinar title is required'],
      trim: true,
      index: 'text' // Enable text search
    },
    description: {
      type: String,
      required: [true, 'Webinar description is required'],
      trim: true
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      index: true
    },
    speaker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'completed', 'rejected', 'cancelled'],
        message: 'Status must be pending, approved, completed, rejected, or cancelled'
      },
      default: 'pending',
      index: true
    },
    recordingUrl: {
      type: String,
      trim: true
    },
    transcription: {
      type: String
    },
    automatedSummary: {
      type: String
    },
    aiNotes: {
      type: String
    },
    discussionPoints: [String],
    actionItems: [String],
    materials: [{
      title: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    allowedClusters: [{
      type: Schema.Types.ObjectId,
      ref: 'Cluster',
      index: true
    }],
    participants: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      registered: {
        type: Date,
        default: Date.now
      },
      attended: {
        type: Boolean,
        default: false
      },
      attendanceTime: Date,
      exitTime: Date,
      watched: {
        type: Boolean,
        default: false
      },
      watchDuration: {
        type: Number,
        default: 0 // In seconds
      }
    }],
    participantCount: {
      type: Number,
      default: 0
    },
    maxCapacity: {
      type: Number,
      default: 1000
    },
    tags: [{
      type: String,
      index: true
    }]
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Create compound indexes for common queries
  WebinarSchema.index({ status: 1, startTime: 1 });
  WebinarSchema.index({ speaker: 1, status: 1 });
  WebinarSchema.index({ 'participants.user': 1, 'participants.attended': 1 });
  WebinarSchema.index({ allowedClusters: 1, status: 1 });
  
  // Virtual for checking if webinar is currently live
  WebinarSchema.virtual('isLive').get(function() {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime;
  });
  
  // Virtual for checking if webinar is past
  WebinarSchema.virtual('isPast').get(function() {
    const now = new Date();
    return now > this.endTime;
  });
  
  // Add a middleware to update participant count
  WebinarSchema.pre('save', function(next) {
    if (this.participants) {
      this.participantCount = this.participants.length;
    }
    next();
  });

  module.exports = mongoose.model('Webinar', WebinarSchema);
  