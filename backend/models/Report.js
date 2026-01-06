const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    default: () => `REP${Date.now()}${Math.floor(Math.random() * 1000)}`
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['harassment', 'safety-threat', 'misbehavior', 'emergency', 'other'],
    default: 'other',
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: 'Location not specified'
    },
    building: String,
    floor: String,
    room: String
  },
  media: {
    images: [String],
    audio: String
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  reporterInfo: {
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      default: 'prefer-not-to-say'
    },
    department: String,
    year: String,
    contact: String
  },
  status: {
    type: String,
    enum: ['pending', 'under-review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  tags: [String],
  followUpNotes: [{
    note: String,
    adminId: mongoose.Schema.Types.ObjectId,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  nlpCategories: [String],
  sentimentScore: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
});

// Update timestamp before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema);