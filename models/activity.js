var moogoose = require('mongoose');

module.exports = moogoose.model('Activity', {
  name: String,
  time: Date,
  group: [ {
    artist: String,
    player: String,
    stream: String,
  } ],
}); 
