var mongoose = require('mongoose');

var actSchema = mongoose.Schema({
  name: String,
  time: Date,
  group: [ {
    artist: {
      id: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
      name: String,
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
