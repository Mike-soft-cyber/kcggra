const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema({
    title: { type: String},
    details: { type: String}
})

module.exports = mongoose.model('Topic', topicSchema)