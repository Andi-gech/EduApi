const jwt = require('jsonwebtoken');

const generateAuthToken = (user) => {
    console.log(user,"user")
    const token = jwt.sign(
        { 
            _id: user._id, 
            username: user.username, 
            email: user.email,
            role: user.Role 
        }, 
        "NEWSECRETKEY", 
        { expiresIn: '1d' }
    );
    return token;
};
const verifyAuthToken = (token) => {
    const decoded = jwt.verify(token, "NEWSECRETKEY");
    return decoded;
};

module.exports = {
    generateAuthToken,
    verifyAuthToken
};
