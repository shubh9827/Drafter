const mongoose = require('mongoose');
const DummySchema = new mongoose.Schema({
    Name : String,
    PhoneNo : String,
    Gender : String,
    Email : String,
    PinCode : Number,
    randomDate : Date, 
    Address : String
  });
module.exports = mongoose.model('Dummy', DummySchema);