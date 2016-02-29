var mongoose = require('mongoose');
var validate = require('mongoose-validator').validate;

var SignupSchema = new Schema({
  activity_id: Number,
  signup_time: {type: Date, default: Date.now },
  success: {type: Boolean, default: false},
  words: {
    type: String,
    validate: validate('max', 128 ),
  }, 
});
var UserSchema = new Schema({
	fb: {
		id: String,
		access_token: String,
		displayName: String,
		email: String
	},
  activities: [ Number ], // Number as the hash of activity
  signups: [ SignupSchema ],
});

module.exports = mongoose.model('User', UserSchema);

