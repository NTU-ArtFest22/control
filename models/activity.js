var mongoose = require('mongoose');

var actSchema = mongoose.Schema({
  name: String,
  time: Date,
  group: [ {
    artist: {
      id: String,
      name: String,
    },
    player: {
      id: String,
      name: String
    },
    character: String,
    stream: String,
  } ],
}, { collection: 'activities' })
module.exports = mongoose.model('Activity', actSchema); 
