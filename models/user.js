var mongoose = require('mongoose');
var validate = require('mongoose-validator').validate;

var UserSchema = new mongoose.Schema({
	fb: {
		id: String,
		access_token: String,
		displayName: String,
		email: String
	},
  activities: [ {
    id: String,
    gameName: String,
    player_id: String,
    isAttend: Boolean,
  } ], // Number as the hash of activity
  isAdmin: Boolean,
});

module.exports = mongoose.model('User', UserSchema);
