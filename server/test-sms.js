// server/test-sms.js
require('dotenv').config()

const africastalking = require('africastalking')

console.log('Testing with:')
console.log('Username:', process.env.AFRICASTALKING_USERNAME)
console.log('Key:', process.env.AFRICASTALKING_API_KEY?.slice(0, 20) + '...')

const AT = africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME
})

AT.SMS.send({
    to: ['+254746163071'],
    message: 'Test OTP: 123456'
})
.then(result => {
    console.log('✅ SUCCESS:', JSON.stringify(result, null, 2))
})
.catch(err => {
    console.log('❌ FAILED:', err.response?.data || err.message)
})