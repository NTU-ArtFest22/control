var mongoose = require('mongoose');
var validate = require('mongoose-validator').validate;
  //, passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
	fb: {
		id: String,
		access_token: String,
		displayName: String,
		email: String
	},
  activities: [ {
    id: mongoose.Schema.Types.ObjectId,
    gameName: String,
    player_id: String,
  } ], // Number as the hash of activity
  time: Date,
  isAdmin: Boolean,
  isArtist: Boolean,
});

//User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
