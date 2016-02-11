var express = require('express');
var router = express.Router();



var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
}

module.exports = function(passport){

  /* GET login page. */
  router.get('/', function(req, res) {
    console.log("here");
    // Display the Login page with any flash message, if any
    res.render('index', { message: req.flash('message') });
  });

  /* Handle Login POST */
  router.post('/auth', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash : true  
  }));

  /* Handle Logout */
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // route for facebook authentication and login
  // different scopes while logging in
  router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' } ));

  // handle the callback after facebook has authenticated the user
  router.get('/auth/facebook/callback',
             passport.authenticate('facebook', {
               successRedirect : '/',
               failureRedirect : '/'
             })
            );


            //module.exports = router;
            return router;
}


