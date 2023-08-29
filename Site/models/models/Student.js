const mongoose = require('mongoose');
const StudentSchema = new mongoose.Schema({
rollno : String,
age : Number,
name : String,
branch : String,
address : 
{
    city : String,
    state : String
},
hobbies : [String],
courseFee : Number,
dob : Date
},
{
    timestamps : true
});
module.exports =  mongoose.model('Student', StudentSchema);



