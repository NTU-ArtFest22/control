var mongoose = require('mongoose');

var AdminSchema = new mongoose.Schema({
  name: String, 
  password: String,
  pin: Number,
});

module.exports = mongoose.model('Admin', AdminSchema);
