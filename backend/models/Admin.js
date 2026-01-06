const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'moderator'],
    default: 'admin'
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    viewReports: { type: Boolean, default: true },
    editReports: { type: Boolean, default: true },
    deleteReports: { type: Boolean, default: false },
    assignReports: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false }
  },
  fcmToken: String,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);