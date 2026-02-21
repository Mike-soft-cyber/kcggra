const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: { type: String, required: true},
    email: { type : String, unique: true, sparse: true},
    password: { type: String, required: function() { return !this.googleId && !this.phone}},
    googleId: { type: String, unique: true, sparse: true},
    phone: { type: String, unique: true, sparse: true},
    role: { type: String, required: true, enum: ['guard', 'resident', 'admin'], default: 'resident'},
    subStatus: { type: String, required: true, default: 'unpaid'},
    lastPayment: { type: Date, default: null},
    otp: { code: String, expiresAt: Date},
    proxy_user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    receipts: [{ type: String}],
    street: { type: String},
    profilePic: { type: String, default: null},
    isActive: { type: Boolean},
    notification_preferences: {
    security_alerts: { type: Boolean, default: true },      // Emergency notifications
    payment_reminders: { type: Boolean, default: true },    // Subscription due dates
    community_updates: { type: Boolean, default: true },    // Events and announcements
    sms_notifications: { type: Boolean, default: false },   // Receive via text message
  },
  active_sessions: [{
    device: String,
    ip_address: String,
    last_active: Date,
    login_time: Date,
  }],
}, {timestamps: true})

userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true})

module.exports = mongoose.model('User', userSchema)