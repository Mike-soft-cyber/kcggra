const mongoose = require('mongoose')

const visitorSchema = new mongoose.Schema({
    visitor_id: { type: String, required: true, unique: true},
    guest_name: { type: String, required: true},
    guest_phone: { type: Number, required: true},
    host_id: { type: mongoose.Schema.Types.ObjectId, ref:'User'},
    visit_date: { type: Date, required: true},
    purpose: { type: String, required: true},
    qr_code: { type: String},
    status: { type: String, enum: ['pending', 'checked_in', 'checked_out', 'expired']},
    check_in_time: { type: Date},
    check_out_time: { type: Date},
    checked_by_guard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, {timestamps: true})

visitorSchema.index({ visitorId: 1})
visitorSchema.index({ visitDate: 1}, { expireAfterSeconds: 86400})

module.exports = mongoose.model('Visitor', visitorSchema)