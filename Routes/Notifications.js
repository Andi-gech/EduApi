const express = require("express");
const { Notifications } = require("../Model/Notifications");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { roleAuth } = require("../MiddleWare/RoleAuth");
const { User } = require("../Model/User");

/**
 * @swagger
 * /notification/:
 *   get:
 *     summary: Retrieve notifications for a student
 *     description: Fetches notifications for the authenticated student user.
 *     tags: [Notifications]
 *     security:
 *       - tokenAuth: []  # Assuming you're using bearer token authentication
 *     responses:
 *       200:
 *         description: A list of notifications for the student.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Unique identifier for the notification.
 *                   message:
 *                     type: string
 *                     description: The notification message.
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the notification was created.
 *       404:
 *         description: No notifications found for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No notifications found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong."
 */

Router.get("/", Authetication, roleAuth("student"), async (req, res) => {
  try {
    const notifications = await Notifications.find({
      user: req.user._id,
    });
    res.send(notifications);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});

module.exports = Router;
