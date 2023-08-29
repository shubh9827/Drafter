const mongoose = require('mongoose');
const examSchema = new mongoose.Schema({
    term : String,
    maxMarks : Number,
    minMarks : Number,
    numberOfSub : Number,
    totalMarks : Number
})
module.exports = mongoose.model('exam', examSchema)