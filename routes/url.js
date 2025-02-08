const express = require('express');
const { nanoid } = require('nanoid');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const router = express.Router();

const { authenticateJWT } = require('../middleware/auth');
const { urlCreationLimiter } = require('../middleware/rateLimiter');
const Url = require('../models/Url');
/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Create short URL
 *     description: Create a new shortened URL with optional custom alias and topic
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - longUrl
 *             properties:
 *               longUrl:
 *                 type: string
 *               customAlias:
 *                 type: string
 *               topic:
 *                 type: string
 *                 enum: [acquisition, activation, retention]
 *     responses:
 *       201:
 *         description: Short URL created successfully
 */
router.post('/', authenticateJWT, urlCreationLimiter, async (req, res) => {
  try {
    const { longUrl, customAlias, topic } = req.body;
    const userId = req.user.id;
   
    if (!longUrl) {
      return res.status(400).json({ error: 'Long URL is required' });
    }

    // Generate or use custom alias
    const alias = customAlias || nanoid(8);
    const existingUrl = await Url.findOne({ alias });
    if (existingUrl) {
      return res.status(400).json({ error: 'Alias already in use' });
    }
    
    const url = await Url.create({
      userId,
      longUrl,
      shortUrl: `${process.env.BASE_URL}/${alias}`,
      alias,
      topic,
    });

    res.status(201).json({
      shortUrl: url.shortUrl,
      createdAt: url.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating short URL',error });
  }
});

/**
 * @swagger
 * /api/shorten/{alias}:
 *   get:
 *     summary: Redirect to original URL
 *     description: Redirects to the original URL and logs analytics data
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to original URL
 */
router.get('/:alias', authenticateJWT, async (req, res) => {
  try {
    const { alias } = req.params;
    
      const url = await Url.findOne({ alias });
      if (!url) {
        return res.status(404).json({ error: 'URL not found' });
      }
      let longUrl = url.longUrl;

      

    // Parse user agent and get location data
    const ua = new UAParser(req.headers['user-agent']);
    const ip = req.ip || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);

    // Update analytics
    const analyticsData = {
      timestamp: new Date(),
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
      os: ua.getOS().name || 'Unknown',
      device: ua.getDevice().type || 'desktop',
      location: geo ? {
        country: geo.country,
        city: geo.city,
      } : null,
    };
    Url.findOneAndUpdate(
      { alias },
      {
        $inc: { clicks: 1 },
        $push: { 'analytics.visits': analyticsData },
        $addToSet: { 'analytics.uniqueVisitors': `${ip}-${req.headers['user-agent']}` },
      },
      { new: true }
    ).exec();
    if (req.headers['user-agent'].includes('Swagger') || 
    req.headers['user-agent'].includes('Mozilla') ) {
      
      return res.json({ longUrl: longUrl }); // Swagger-friendly response
    } else {
      res.redirect(longUrl); // Normal redirect for browsers/Postman
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Error redirecting to URL' });
  }
});

module.exports = router;
