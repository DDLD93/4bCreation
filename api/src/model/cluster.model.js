const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClusterSchema = new Schema({
    name: {
      type: String,
      required: [true, 'Cluster name is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }],
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
    }
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Create index for member lookup
  ClusterSchema.index({ members: 1 });
  module.exports = mongoose.model('Cluster', ClusterSchema);