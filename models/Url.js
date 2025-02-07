const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  longUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true,
  },
  alias: {
    type: String,
    required: true,
    unique: true,
  },
  topic: {
    type: String,
    enum: ['acquisition', 'activation', 'retention', null],
    default: null,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  analytics: {
    visits: [{
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      os: String,
      device: String,
      location: {
        country: String,
        city: String,
      },
    }],
    uniqueVisitors: [{
      type: String, // Store unique identifiers (IP + UserAgent hash)
    }],
    osStats: [{
      name: String,
      clicks: Number,
      uniqueUsers: Number,
    }],
    deviceStats: [{
      name: String,
      clicks: Number,
      uniqueUsers: Number,
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups
urlSchema.index({ alias: 1 });
urlSchema.index({ userId: 1, topic: 1 });
urlSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Url', urlSchema);
