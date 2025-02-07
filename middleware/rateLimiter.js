const rateLimit = require('express-rate-limit');

// URL creation rate limiter - 10 requests per minute per user
const urlCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 requests per windowMs
  message: 'Too many URLs created. Please try again later.',
  keyGenerator: (req) => `url-creation-${req.user.id}`,
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, 
  message: 'Too many analytics requests. Please try again later.',
  keyGenerator: (req) => `analytics-${req.user.id}`,
});

module.exports = {
  urlCreationLimiter,
  analyticsLimiter,
};
