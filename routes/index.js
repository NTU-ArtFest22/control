var express = require('express')
  , router = express.Router()
  , User = require('../models/user.js')
  , Activity = require('../models/activity.js')
  , config = require('../config/config.js');

var canAccessAdmin = function (req, res, next){
  //console.log(req);
  if( req.user && ( req.user.isAdmin === true || req.user.fb.id === config.rootadmin_fbid ) )
      next();
  else
    res.send(401, 'Unauthorized');
};

var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
}

module.exports = function(passport, streams){

  /* GET login page. */
  router.get('/', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('index', { message: req.flash('message') , user: req.user});
  });

  router.get('/admin', canAccessAdmin, function(req, res){
    console.log("admin?");
    res.render('admin', {user: req.user});
  });

  router.get('/admin/user', canAccessAdmin, function(req, res){
    res.render('admin-user', { user: req.user });
  });

  router.get('/admin/activity', canAccessAdmin, function(req, res){
    res.render('admin-act', { user: req.user });
  });

  router.get('/about', function(req, res) {
    console.log('Want to know us??');
    res.render('about', { message: req.flash('message') , user: req.user});
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
  router.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] } ));

  // handle the callback after facebook has authenticated the user
  router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/profile/',
    failureRedirect : '/'
  }));

  router.get('/profile', function(req, res){
    if(!req.user)
      res.redirect('/auth/facebook');
    console.log('profile: ', req.user);
    res.render('profile', { message: req.flash('message') , user: req.user});
  });

  router.get('/streams.json', function(req, res){
    var streamList = streams.getStreams();
    // JSON exploit to clone streamList.public
    var data = (JSON.parse(JSON.stringify(streamList))); 

    res.status(200).json(data);
  });

  router.get('/stream', function(req, res){
    res.render('stream', { user: req.user });
  });

  


  //module.exports = router;
  return router;
}


