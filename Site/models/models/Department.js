const mongoose = require('mongoose');
const departmentSchema = new mongoose.Schema({
    departmentName : String,
    hod : String
})
module.exports = mongoose.model('department', departmentSchema)