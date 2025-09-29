const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
     expiresIn: '1y'
    });
};

module.exports = generateToken;
