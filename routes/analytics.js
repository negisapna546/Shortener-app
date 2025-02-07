const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');
const Url = require('../models/Url');
/**
 * @swagger
 * /api/analytics/overall:
 *   get:
 *     summary: Get overall analytics
 *     description: Get analytics for all URLs created by the user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall analytics retrieved successfully
 */
router.get('/overall', authenticateJWT, analyticsLimiter, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id });

    const analytics = {
      totalUrls: urls.length,
      totalClicks: 0,
      uniqueUsers: new Set(),
      clicksByDate: {},
      osType: {},
      deviceType: {},
    };

    urls.forEach((url) => {
      analytics.totalClicks += url.clicks;
      url.analytics.uniqueVisitors.forEach((visitor) =>
        analytics.uniqueUsers.add(visitor)
      );

      // Aggregate clicks by date
      url.analytics.visits.forEach((visit) => {
        const date = visit.timestamp.toISOString().split('T')[0];
        analytics.clicksByDate[date] = (analytics.clicksByDate[date] || 0) + 1;

        // Aggregate OS stats
        const os = visit.os;
        if (!analytics.osType[os]) {
          analytics.osType[os] = { uniqueClicks: 0, uniqueUsers: new Set() };
        }
        analytics.osType[os].uniqueClicks++;
        analytics.osType[os].uniqueUsers.add(`${visit.ipAddress}-${visit.userAgent}`);

        // Aggregate device stats
        const device = visit.device;
        if (!analytics.deviceType[device]) {
          analytics.deviceType[device] = { uniqueClicks: 0, uniqueUsers: new Set() };
        }
        analytics.deviceType[device].uniqueClicks++;
        analytics.deviceType[device].uniqueUsers.add(`${visit.ipAddress}-${visit.userAgent}`);
      });
    });

    const response = {
      totalUrls: analytics.totalUrls,
      totalClicks: analytics.totalClicks,
      uniqueUsers: analytics.uniqueUsers.size,
      clicksByDate: Object.entries(analytics.clicksByDate).map(([date, count]) => ({
        date,
        count,
      })),
      osType: Object.entries(analytics.osType).map(([name, stats]) => ({
        name,
        uniqueClicks: stats.uniqueClicks,
        uniqueUsers: stats.uniqueUsers.size,
      })),
      deviceType: Object.entries(analytics.deviceType).map(([name, stats]) => ({
        name,
        uniqueClicks: stats.uniqueClicks,
        uniqueUsers: stats.uniqueUsers.size,
      })),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving overall analytics' });
  }
});


/**
 * @swagger
 * /api/analytics/{alias}:
 *   get:
 *     summary: Get URL analytics
 *     description: Get detailed analytics for a specific URL
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/:alias', authenticateJWT, analyticsLimiter, async (req, res) => {
  try {
    const { alias } = req.params;

    const url = await Url.findOne({ alias, userId: req.user.id });
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Calculate analytics for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVisits = url.analytics.visits.filter(
      visit => visit.timestamp >= sevenDaysAgo
    );

    const clicksByDate = recentVisits.reduce((acc, visit) => {
      const date = visit.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const analytics = {
      totalClicks: url.clicks,
      uniqueUsers: url.analytics.uniqueVisitors.length,
      clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({
        date,
        count,
      })),
      osType: url.analytics.osStats,
      deviceType: url.analytics.deviceStats,
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving analytics'});
  }
});

/**
 * @swagger
 * /api/analytics/topic/{topic}:
 *   get:
 *     summary: Get topic-based analytics
 *     description: Get analytics for all URLs under a specific topic
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topic analytics retrieved successfully
 */
router.get('/topic/:topic', authenticateJWT, analyticsLimiter, async (req, res) => {
  try {
    const { topic } = req.params;
    const urls = await Url.find({ userId: req.user.id, topic });

    const analytics = {
      totalClicks: 0,
      uniqueUsers: new Set(),
      clicksByDate: {},
      urls: [],
    };

    urls.forEach((url) => {
      analytics.totalClicks += url.clicks;
      url.analytics.uniqueVisitors.forEach((visitor) =>
        analytics.uniqueUsers.add(visitor)
      );

      // Add URL-specific data
      analytics.urls.push({
        shortUrl: url.shortUrl,
        totalClicks: url.clicks,
        uniqueUsers: url.analytics.uniqueVisitors.length,
      });

      // Aggregate clicks by date
      url.analytics.visits.forEach((visit) => {
        const date = visit.timestamp.toISOString().split('T')[0];
        analytics.clicksByDate[date] = (analytics.clicksByDate[date] || 0) + 1;
      });
    });

    const response = {
      ...analytics,
      uniqueUsers: analytics.uniqueUsers.size,
      clicksByDate: Object.entries(analytics.clicksByDate).map(([date, count]) => ({
        date,
        count,
      })),
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving topic analytics' });
  }
});


module.exports = router;
