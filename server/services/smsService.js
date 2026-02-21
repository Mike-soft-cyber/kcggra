const africastalking = require('africastalking')

const credentials = {
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME
}

const AT = africastalking(credentials)
const sms = AT.SMS

// ✅ Helper to build SMS options (no sender ID in sandbox)
const buildOptions = (to, message) => {
    const options = {
        to: Array.isArray(to) ? to : [to],
        message,
    }

    // ✅ Only use sender ID in production - sandbox rejects custom sender IDs
    if (process.env.NODE_ENV === 'production' && process.env.AFRICASTALKING_SENDER_ID) {
        options.from = process.env.AFRICASTALKING_SENDER_ID
    }

    return options
}

// ✅ Send OTP via SMS
exports.sendOTP = async (phone, otp) => {
    try {
        const message = `Your KCGGRA verification code is ${otp}. Valid for 10 minutes. DO NOT SHARE THIS CODE.`
        const options = buildOptions(phone, message)

        const result = await sms.send(options)
        console.log('✅ OTP SMS sent:', JSON.stringify(result))

        // Check if SMS was actually delivered
        const recipient = result?.SMSMessageData?.Recipients?.[0]
        if (recipient && recipient.status !== 'Success') {
            console.warn('⚠️ SMS delivery issue:', recipient.status)
        }

        return result
    } catch (error) {
        console.error('❌ SMS OTP error:', error)
        throw new Error('Failed to send OTP via SMS')
    }
}

// ✅ Incident alert to A-Team guards
exports.sendIncidentAlert = async (phones, incidentData) => {
    try {
        const message = `🚨 URGENT INCIDENT ALERT
Type: ${incidentData.type.toUpperCase()}
Location: ${incidentData.address}
Time: ${new Date().toLocaleTimeString('en-KE')}
View: ${process.env.FRONTEND_URL}/dashboard/incidents/${incidentData._id}`

        const options = buildOptions(phones, message)

        const result = await sms.send(options)
        console.log('✅ Incident alert sent to A-Team:', JSON.stringify(result))
        return result
    } catch (error) {
        console.error('❌ Incident alert SMS error:', error)
        // Don't throw - incident should still be saved even if SMS fails
        return null
    }
}

// ✅ Payment confirmation message
exports.sendPaymentConfirmation = async (phone, amount, transactionId) => {
    try {
        const message = `✅ Payment Received! KES ${Number(amount).toLocaleString()} for KCGGRA Subscription. Receipt: ${transactionId}. Thank you!`
        const options = buildOptions(phone, message)

        const result = await sms.send(options) // ✅ Fixed: was missing await
        console.log('✅ Payment confirmation sent:', JSON.stringify(result))
        return result
    } catch (error) {
        console.error('❌ Payment confirmation SMS error:', error)
        return null
    }
}

// ✅ Visitor pass notification to guest
exports.sendVisitorPassSMS = async (phone, visitorData) => {
    try {
        const message = `🎫 KCGGRA Visitor Pass
Guest: ${visitorData.guest_name}
Date: ${new Date(visitorData.visit_date).toLocaleDateString('en-KE')}
ID: ${visitorData.visitor_id}
Show this at the gate: ${process.env.FRONTEND_URL}/visitor/${visitorData.visitor_id}`

        const options = buildOptions(phone, message)

        const result = await sms.send(options)
        console.log('✅ Visitor pass SMS sent:', JSON.stringify(result))
        return result
    } catch (error) {
        console.error('❌ Visitor pass SMS error:', error)
        return null
    }
}

// ✅ Subscription reminder SMS
exports.sendSubscriptionReminder = async (phone, username, dueDate) => {
    try {
        const message = `Hi ${username}, your KCGGRA subscription of KES 60,000 is due on ${new Date(dueDate).toLocaleDateString('en-KE')}. Pay via M-Pesa Paybill 123456. Thank you!`
        const options = buildOptions(phone, message)

        const result = await sms.send(options)
        console.log('✅ Subscription reminder sent:', JSON.stringify(result))
        return result
    } catch (error) {
        console.error('❌ Subscription reminder SMS error:', error)
        return null
    }
}