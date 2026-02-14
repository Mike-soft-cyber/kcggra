const axios = require('axios')
const moment = require('moment')

const MPESA_URLS = {
  sandbox: {
    oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
  },
  production: {
    oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
  },
};

const environment = process.env.MPESA_ENVIRONMENT || 'sandbox'
const urls = MPESA_URLS[environment]

exports.generateAccessToken = async() => {
    try {
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}: ${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64')

        const response = await axios.get(urls.oauth, {
            headers: {
                Authorization: `Basic ${auth}`
            }
        })

        return response.data.access_token
    } catch (error) {
        console.error('M-Pesa OAuth error:', error.response?.data || error.message)
        throw new Error('Failed to generate M-Pesa access token')
    }
}

const generatePassword = () => {
    const timestamp = moment().format('YYYYMMDDHHmmss')
    const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    return {password, timestamp}
}

exports.stkPush = async({phone, amount, accountReference, transactionDesc}) => {
    try {
        const accessToken = await generateAccessToken()
        const { password, timestamp } = generatePassword()
    
        const formattedPhone = phone.replace(/\+/g, '').replace(/^0/, '254');
    
        if (!/^254[0-9]{9}$/.test(formattedPhone)) {
          throw new Error('Invalid phone number format. Use 254XXXXXXXXX');
        }
    
        const payload = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: accountReference || 'KCGGRA',
            TransactionDesc: transactionDesc || 'KCGGRA Subscription Payment',
        }
    
         console.log('STK Push Request:', {
          phone: formattedPhone,
          amount,
          accountReference,
        });
    
        const response = await axios.post(urls.stkPush, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
    
        console.log('STK Push Response:', response.data);
    
        return {
          success: true,
          checkoutRequestID: response.data.CheckoutRequestID,
          merchantRequestID: response.data.MerchantRequestID,
          responseCode: response.data.ResponseCode,
          responseDescription: response.data.ResponseDescription,
          customerMessage: response.data.CustomerMessage,
        };
    } catch (error) {
        console.error('STK Push error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
    }
}

exports.stkQuery = async({ checkoutRequestID }) => {
    try {
        const accessToken = await generateAccessToken();
        const { password, timestamp } = generatePassword();
        
        const payload = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID,
        };
        
        const response = await axios.post(urls.stkQuery, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        
        return response.data;
    } catch (error) {
        console.error('STK Query error:', error.response?.data || error.message);
        throw new Error('Failed to query M-Pesa transaction status');
    }
}