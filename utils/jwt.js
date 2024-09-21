const jwt = require("jsonwebtoken");

const generateAuthToken = (user) => {
  const token = jwt.sign(user, "NEWSECRETKEY", { expiresIn: "1d" });
  return token;
};
const verifyAuthToken = (token) => {
  const decoded = jwt.verify(token, "NEWSECRETKEY");
  return decoded;
};

module.exports = {
  generateAuthToken,
  verifyAuthToken,
};
