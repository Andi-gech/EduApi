const { User } = require("../Model/User");
const { verifyAuthToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
  const token = req.headers["authorization"];

  console.log("verifying token nn", token);
  if (!token) return res.status(401).send("Access denied. No token provided.");
  try {
    const decoded = verifyAuthToken(token);
    const users = await User.findOne({ auth: decoded._id });
    if (!users) return res.status(400).send("Invalid user");

    console.log("user", users);

    req.user = decoded;
    req.user.unique = String(users._id);

    next();
  } catch (err) {
    console.log(err);
    res.status(400).send("Invalid token");
  }
};
