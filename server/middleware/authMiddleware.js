const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async(req, res, next) => {
    try {
        const token = req.cookies.token
        if(!token) return res.status(403).json({
            success: false,
            message: 'token not found: Unauthorized access'
        })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select('-password')
        if(!user) return res.status(401).json({
            success: false,
            message: "User not found"
        })

        req.user = user
        req.userId = user._id

        next()
    } catch (error) {
        console.error("Authmiddleware failed", error)
    }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize}