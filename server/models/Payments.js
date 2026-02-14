const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    month_year: { type: String, required: true},
    payment_method: { type: String, enum: ['mpesa', 'bank', 'cash']},
    mpesa_phone: { type: String},
    payment_type: { type: String, required: true, enum:['subscription', 'project_donation']},
    status: { type: String, enum: ['pending', 'completed', 'failed']},
    amount: { type: Number, required: true},
    transaction_id: {type: String, required: true, unique: true},
    mpesa_receipt: { type: String}
}, {timestamps: true})

paymentSchema.index({ user_id: 1, month_year: 1 });

module.exports = mongoose.model('Payment', paymentSchema)