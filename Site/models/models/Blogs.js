const mongoose = require('mongoose');
const BlogsSchema = new mongoose.Schema({

title : {
    type : String
},
description : {
    type : String
},
userId : {
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
},
imageName : {
    type : String
},
tags : {
    type : [String]
},
isDeleted : {
    type  : Boolean,
    default : false
}
},
{
    timestamps : true
});
module.exports = mongoose.model('BlogsModel',BlogsSchema);
