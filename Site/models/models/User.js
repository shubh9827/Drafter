const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
userName:{
    type:String,
    required:true
},
email:{
    type:String,
    required:true,
    unique:true
},
password:{
    type:String,
    required:true
},
phoneNo:{
    type:String,
    required:true,
    unique:true
},
gender:{
    type:String,
    required:true,
    enum:['male','female']
},
key:{
    type:String
},
resetTime:{
    type:Date
}
},
{
    timestamps:true
});

module.exports = mongoose.model('UserModel', UserSchema);