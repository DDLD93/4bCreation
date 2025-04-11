// Interactive Features Model - Optimized and Indexed
const InteractionSchema = new Schema({
    webinar: {
      type: Schema.Types.ObjectId,
      ref: 'Webinar',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['question', 'comment', 'handRaise', 'poll', 'reaction'],
        message: 'Type must be question, comment, handRaise, poll, or reaction'
      },
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'answered', 'dismissed', 'highlighted', 'featured'],
        message: 'Status must be pending, answered, dismissed, highlighted, or featured'
      },
      default: 'pending',
      index: true
    },
    answer: {
      content: String,
      answeredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      answeredAt: Date
    },
    upvotes: {
      type: Number,
      default: 0
    },
    upvotedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    isAnonymous: {
      type: Boolean,
      default: false
    },
    timestamp: { // Time relative to webinar start
      type: Number, // In seconds
      default: 0
    }
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Create compound indexes for common queries
  InteractionSchema.index({ webinar: 1, type: 1, status: 1 });
  InteractionSchema.index({ webinar: 1, timestamp: 1 });
  InteractionSchema.index({ user: 1, webinar: 1 });

  module.exports = mongoose.model('Interaction', InteractionSchema);