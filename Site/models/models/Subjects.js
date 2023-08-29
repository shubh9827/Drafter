const mongoose = require('mongoose');
const subjectSchema = new mongoose.Schema({
    subjectName : String,
    teacher : String,
    departmentName : String
})
module.exports = mongoose.model('subject', subjectSchema)