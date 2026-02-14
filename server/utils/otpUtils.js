//generate 6-digit OTP code
exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

//get OTP expiry(10 minutes)
exports.getOTPExpiry = () => {
    return new Date(Date.now() + 10 * 60 * 1000)
}

exports.isOTPExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt)
}