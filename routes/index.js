var express = require('express')
  , router = express.Router()
  , User = require('../models/user.js')
  , Activity = require('../models/activity.js')
  , config = require('../config/config.js')
  , mongojs = require('mongojs');

var canAccessAdmin = function (req, res, next){
  //console.log(req);
  if( req.user && ( req.user.isAdmin === true || req.user.fb.id === config.rootadmin_fbid ) )
      next();
  else
    // res.send(401, 'Unauthorized');
    res.redirect('/');
};

var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
};


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
    res.render('admin-user', { user: req.user});
  });

  router.get('/admin/activity', canAccessAdmin, function(req, res){
    res.render('admin-act', { user: req.user});
  });

  // router.get('/admin/stream', canAccessAdmin, function(req, res){
  //   res.render('stream', { user: req.user });
  // });

  router.get('/about', function(req, res) {
    console.log('Want to know us??');
    res.render('about', { message: req.flash('message') , user: req.user});
  });
  router.get('/activity', function(req, res) {
    console.log('Want to know us??');
    res.render('activity', { message: req.flash('message') , user: req.user});
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
  
  router.get('/api/login/:access_id', function(req,res){
    var access_id = req.params.access_id;
    return User
    .findOne({"fb.id": access_id}, function(err, user){
      return res.json(user);
    });
    
  });

  router.get('/api/usr/get_all/', function(req,res){
    
    return User
    .find()
    .exec(function(err, doc){
      return res.json(doc)
    })
  });
  router.get('/api/act/get_all/:access_id', function(req,res){
    var access_id = req.params.access_id;
    // return User
    // .findOne({"fb.id":access_id}, function(err, user){
    //   console.log("========");
    //   console.log(user._id.toString()+' '+user.fb.displayName);
    //   console.log(JSON.stringify(user, 4 , ''))
    //   return 
    // })
    return Activity.find(
              {
                "group.artist.id":"56fec493b158b4162f8ef380",
                // "isRunning": true
              }, 
              function(err, act){
                if(err){
                  console.log('find activity group error: ', err);
                  return res.send( 404, err );
                } else {
                  console.log('got act  :', act);
                  return res.json(act)
                }
              })
  });
  router.get('/api/act/get_act_info/:act_id', function(req,res){
    var act_id = req.params.act_id;
    return Activity
    .findOne({"_id":act_id}, function(err, act){
      return res.json(act)
    })
  });
  
  // route for facebook authentication and login
  // different scopes while logging in
  router.get('/auth/facebook',
    passport.authenticate('facebook', { scope : ['public_profile', 'email'] } )
  );

  // handle the callback after facebook has authenticated the user
  router.get('/auth/facebook/callback', 
      passport.authenticate('facebook', {  failureRedirect : '/' } ),
      function(req, res){
        // var redirect = '/profile';
        var redirect = '/admin/activity';
        if( req.session.redirect_url ){
          redirect = req.session.redirect_url;
          delete req.session.redirect_url;
        }
        res.redirect( redirect );
      }
  );
  
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


