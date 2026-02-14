const africastalking = require('africastalking')

const credentials = {
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME
}

const AT = africastalking(credentials)
const sms = AT.SMS

//Sending OTP via SMS
exports.sendOTP = async(phone, otp) => {
    try {
        const message = `Your KCGGRA verification code is ${otp}. Valid for 10 minutes. DO NOT SHARE THIS CODE`
        
        const options = {
            to: [phone],
            message: message,
            from: process.env.AFRICASTALKING_SENDER_ID
        }

        const result = await sms.send(options)
        console.log("SMS sent:", result)
        return result
    } catch (error) {
        console.error("SMS error", error)
        throw new Error('Failed to send OTP')
    }
}

//Incident alert to A-team
exports.sendIncidentAlert = async(phones, incidentData) => {
    try {
        const message = ` URGENT INCIDENT ALERT
        Type: ${incidentData.type}
        Location: ${incidentData.address}
        Time: ${new Date().toLocaleTimeString}
        View Details: ${process.env.FRONTEND_URL}/incidents/${incidentData._id}`

        const options = {
            to: phones,
            message: message,
            from: process.env.AFRICASTALKING_SENDER_ID
        }

        const result = await sms.send(options)
        console.log("Alert sent to A-team", result)
        return result
    } catch (error) {
        console.error("Alert SMS Error", error)
        throw new Error('Failed to send alert')
    }
}

//Payment confirmation message
exports.sendPaymentConfirmation = async(phone, amount, transactionId) => {
    try {
        const message = `Payment Received! KES ${amount.toLocaleString()} for KCGGRA Subscription. Receipt ${transactionId}. Thank you!`
        const options ={
            to: phone,
            message: message,
            from: process.env.AFRICASTALKING_SENDER_ID
        }

        const result = sms.send(options)
        console.log("Payment Confirmation sent", result)
        return result
    } catch (error) {
        console.log("Payment Confirmation error", error)
        return null
    }
}