var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/user');
var FBconfig = require('../config/fb');

module.exports = function(passport) {

  passport.use( new FacebookStrategy({
    clientID        : FBconfig.api_key,
    clientSecret    : FBconfig.api_secret,
    callbackURL     : FBconfig.callback_url,
    profileFields   : ['id', 'displayName', 'emails'],
    enableProof     : true
  },

  // facebook will send back the tokens and profile
  function(accessToken, refreshToken, profile, done) {

    console.log('profile', profile);
    console.log(accessToken);

    // asynchronous
    process.nextTick(function() {

      // find the user in the database based on their facebook id
      User.findOne({ 'fb.id' : profile.id }, function(err, user) {

        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err){
          return done(err);
        }
        // if the user is found, then log them in
        if (user) {
          console.log('=========================== user ', profile.displayName ,' found in database');
          return done(null, user); // user found, return that user
        } else {
          console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& new user ', profile.displayName ,' join us!!!!');
          // if there is no user found with that facebook id, create them
          var newUser = new User();

          // set all of the facebook information in our user model
          newUser.fb.id           =   profile.id; // set the users facebook id
          newUser.fb.access_token =   accessToken; // we will save the token that facebook provides to the user
          newUser.fb.displayName  =   profile.displayName;
          newUser.fb.email        =   profile.emails[0].value; // facebook can return multiple emails so we'll take the first
          newUser.time            =   new Date().toISOString();
          newUser.isAdmin         =   false;
          newUser.isArtist        =   false;

          // save our user to the database
          newUser.save(function(err) {
            if (err)
              throw err;

            // if successful, return the new user
            return done(null, newUser);
          });
        }
      });
    });
  }));
};

