const express = require("express");
const { User } = require("../Model/User");
const { Cafe } = require("../Model/Cafe");

const Router = express.Router();
/**
 * @swagger
 * /report/activePersonel:
 *   get:
 *     summary: Retrieve active personnel count
 *     description: Returns the count of users in the compound and the total number of users.
 *     tags: [User Statistics]
 *     responses:
 *       200:
 *         description: The number of users in the compound and total user count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userincomponund:
 *                   type: integer
 *                   description: Count of users in the compound.
 *                   example: 15
 *                 count:
 *                   type: integer
 *                   description: Total user count.
 *                   example: 100
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue.
 *                   example: "Something went wrong."
 */
Router.get("/activePersonel", async (req, res) => {
  const userincomponund = await User.countDocuments({ incomponund: true });
  const count = await User.countDocuments();

  return res.send({
    userincomponund: userincomponund,
    count: count,
  });
});
/**
 * @swagger
 * /report/activeSubscriptions:
 *   get:
 *     summary: Retrieve active subscriptions count
 *     description: Returns the count of active subscriptions and total user count.
 *     tags: [Subscription Statistics]
 *     responses:
 *       200:
 *         description: The count of active subscriptions and total user count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Count of active subscriptions.
 *                   example: 25
 *                 user:
 *                   type: integer
 *                   description: Total user count.
 *                   example: 100
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue.
 *                   example: "Something went wrong."
 */
Router.get("/activeSubscriptions", async (req, res) => {
  const count = await Cafe.countDocuments({
    enddate: { $gt: Date.now() },
  });
  const user = await User.countDocuments();
  return res.send({
    count: count,
    user: user,
  });
});
/**
 * @swagger
 * /report/department:
 *   get:
 *     summary: Retrieve user count by department
 *     description: Returns the count of users in each department along with the percentage of total users.
 *     tags: [Department Statistics]
 *     responses:
 *       200:
 *         description: User count by department along with percentage
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department:
 *                     type: string
 *                     description: Name of the department.
 *                     example: "Computer Science"
 *                   count:
 *                     type: integer
 *                     description: Number of users in the department.
 *                     example: 30
 *                   percentage:
 *                     type: number
 *                     description: Percentage of total users in the department.
 *                     example: 30.0
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue.
 *                   example: "Something went wrong."
 */
Router.get("/department", async (req, res) => {
  const department = [
    "Computer Science",
    "electronics",
    "civil",
    "Mechanical",
    "Electrical",
    "Aeronautical",
    "Production",
    "chemical",
    "Motor Vehicles",
  ];

  const counts = await Promise.all(
    department.map(async (d) => ({
      department: d,
      count: await User.countDocuments({ department: d }),
    }))
  );
  const total = counts.reduce((t, c) => t + c.count, 0);
  const result = counts.map((c) => ({
    department: c.department,
    count: c.count,
    percentage: (c.count / total) * 100,
  }));

  return res.send(result);
});

module.exports = Router;
