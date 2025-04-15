const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Model - Optimized and Indexed
const UserSchema = new Schema({
  picture: { type: String, trim: true, required: true },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    index: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
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
    select: false // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'superuser', 'speaker', 'participant'],
      message: 'Role must be admin, superuser, speaker, or participant'
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
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    select: false // Don't return MFA secret in queries by default
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date
  },
  profilePicture: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes for common queries
UserSchema.index({ ministry: 1, department: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1, role: 1 });

UserSchema.pre("save", function (next, opt) {
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