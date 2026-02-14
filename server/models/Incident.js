const mongoose = require('mongoose')

const incidentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    type: { type: String, enum: ['burglary', 'fire', 'suspicious', 'environmental']},
    title: { type: String},
    location: { type: String, enum: ['Point'], default: 'Point'},
    coordinates: { type: [Number], required: true},
    address: String,
    description: { type: String},
    media: { type: String},  //Cloudinary URLs
    status: { type: String, enum: ['reported', 'in_progress', 'resolved', 'false_alarm'], default: 'reported'},
    assignedGuard: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    resolvedAt: { type: Date, default: null},
    resolution_notes: { type: String, default: ''}
}, {timestamps: true})

// Geospatial index for finding incidents near a location
incidentSchema.index({ location: '2dsphere'})

module.exports = mongoose.model('Incident', incidentSchema)