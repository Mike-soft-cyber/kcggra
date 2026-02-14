const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
    projectName: { type: String, required: true},
    targetAmount: { type: Number, required: true},
    currentAmount: { type: Number},
    contributors: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        amount: Number,
        payment: { type : mongoose.Schema.Types.ObjectId, ref: 'Payments'},
        date: Date
    }],
    status: { type: String, enum: ['active', 'completed']},
    startDate: { type: Date, default: Date.now},
    target_completion_date: { type: Date}
}, {timestamps: true})

// Virtual field for progress percentage
projectSchema.virtual('progress_percentage', function() {
    return((this.currentAmount / this.targetAmount) * 100).toFixed(2)
})

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Projects', projectSchema)