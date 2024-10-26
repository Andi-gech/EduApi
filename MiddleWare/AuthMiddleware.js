const { User } = require("../Model/User");
const { verifyAuthToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).send("Access denied. No token provided.");
  try {
    const decoded = verifyAuthToken(token);
    const users = await User.findOne({ auth: decoded._id });
    if (!users) return res.status(400).send("Invalid user");

    req.user = decoded;

    next();
  } catch (err) {
    res.status(400).send("Invalid token");
  }
};
