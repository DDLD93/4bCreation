const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Admin Model - Extending User with admin-specific fields
const AdminSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  permissions: {
    type: [{
      type: String,
      enum: {
        values: ['manage_users', 'manage_content', 'manage_quizes', 'manage_webnars', 'manage_certificates', 'view_analytics', 'full_access'],
        message: 'Invalid permission type'
      }
    }],
    default: []
  },
  adminLevel: {
    type: String,
    enum: {
      values: ['junior', 'senior', 'super'],
      message: 'Admin level must be junior, senior, or super'
    },
    default: 'junior',
    index: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    index: true
  },
  dashboardAccess: {
    type: Boolean,
    default: true
  },
  canManageAdmins: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes for common queries
AdminSchema.index({ adminLevel: 1, department: 1 });
AdminSchema.index({ user: 1, adminLevel: 1 });

// Virtual for full admin information
AdminSchema.virtual('fullInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Admin', AdminSchema); 