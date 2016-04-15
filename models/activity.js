var mongoose = require('mongoose');

var actSchema = mongoose.Schema({
  name: String,
  time: Date,
  isRunning: Boolean,
  location: String,
  group: [ {
    artist: {
      id: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
      name: String,
      gps: {longi:String, lati:String, rectime:Date}
    },
    player: {
      id: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
      name: String,
    },
    character: String,
    stream: String,
  } ],
}, { collection: 'activities' })
module.exports = mongoose.model('Activity', actSchema); 
