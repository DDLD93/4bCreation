const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Admin Model - Extending User with admin-specific fields
const AdminSchema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
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
  role: {
    type: String,
    enum: {
      values: ['super admin', 'admin', 'reviewer'],
      message: 'Admin level must be junior, senior, or super'
    },
    default: 'junior',
    index: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
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