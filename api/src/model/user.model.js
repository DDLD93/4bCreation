const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

// User Model - Optimized and Indexed
const UserSchema = new Schema({
  picture: { type: String, trim: true, required: true },
  firstName: { type: String, trim: true, required: true },
  lastName: { type: String, trim: true, required: true },
  fullName: { type: String, trim: true },
  phone: { type: String, trim: true, required: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    // select: false // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['speaker', 'participant'],
      message: 'Role must be speaker or participant'
    },
    default: 'participant',
    index: true
  },
  ministry: {
    type: String,
    trim: true,
    index: true
  },
  department: {
    type: String,
    trim: true,
    index: true
  },
  unit: {
    type: String,
    trim: true,
    index: true
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'disable'],
      message: 'Status must be active or disable'
    },
    default: 'disable'
  },
  lastLogin: {
    type: Date
  },

}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
});

// Create compound indexes for common queries
UserSchema.index({ ministry: 1, department: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1, role: 1 });

UserSchema.pre("save", function (next, opt) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  let { skipHashing } = opt;
  if (!skipHashing) {
    bcrypt.hash(this.password, 10, async (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  } else {
    console.log("Skipping Password Hash !!!");
    next()
  }
});

// Method to check password validity
UserSchema.methods.isValidPassword = function (password) {
  if (!this.password) {
    throw new Error("Password is not set for this user");
  }
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.postLogin = async function () {
  this.lastLogin = Date.now();
  await this.save({ skipHashing: true, isAdmin: true });
};

UserSchema.methods.changePassword = async function (password) {
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) throw new Error(err);;
    this.password = hash;
    await this.save({ skipHashing: true });
  });
};

UserSchema.methods.activateUser = async function (password) {
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) throw new Error(err);;
    this.password = hash;
    this.status = "active"
    await this.save({ skipHashing: true });
  });
};

UserSchema.methods.disableUser = async function () {
  this.status = "disable"
  await this.save({ skipHashing: true });
};

module.exports = mongoose.model('User', UserSchema);