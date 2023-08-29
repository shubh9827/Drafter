const mongoose = require('mongoose');
const marksSchema = new mongoose.Schema({
    studentId :{ type : mongoose.Schema.Types.ObjectId, ref: 'student' } ,
    subjectId : { type : mongoose.Schema.Types.ObjectId, ref: 'subject'},
    examId : {type : mongoose.Schema.Types.ObjectId, ref: 'exam'},
    marks : Number
})
module.exports = mongoose.model('mark', marksSchema)