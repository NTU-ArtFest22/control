var moogoose = require('mongoose');

var UserStreamSchema = new Schema({
  id: String, // fb.id
  stream: String,
});

var GroupSchema = new Schema({
  artist: Number, 
  user_stream: [ UserStreamSchema ], 
});


module.exports = moogoose.model('Activity', {
  id: Number,
  name: String,
  description: String,
  img: String,
  signups: [ String ], // fb.id
  groups: [ GroupSchema ],
}); 
