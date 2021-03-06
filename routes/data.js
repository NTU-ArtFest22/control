//var app = require('express')();
var config = require('../config/config.js');
var mongojs = require('mongojs');
var User = require('../models/user.js');
var Activity = require('../models/activity.js');
var safety = require('../config/safety.js');

var canAccessAdmin = function (req, res, next){
  //console.log(req);
  if( req.user && ( req.user.isAdmin === true || req.user.fb.id === config.rootadmin_fbid ) )
      next();
  else
    // res.send(401, 'Unauthorized');
  res.redirect('/')
};

var errorfunc = function( req, res ){
  res.render('profile', {
    error: req.flash('error', 'The code is invalid, please check the url or contact us'),
    user: req.user
  });
};

var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/auth/facebook');
};


module.exports = function( app , db ){

  app.get('/user', function(req, res){
    console.log('getting user: ', req.user);
    res.json(req.user);
  });

  app.get('/register/:act_id/:code', function(req,res){
    var act_id = req.params.act_id;
    var code = req.params.code;

    if( !req.user ){
      req.session.redirect_url = '/register/' + act_id + '/' + code;
      res.redirect('/auth/facebook');
    }else{
      var player_id = safety.decrypt( act_id , code );
      if(! player_id ){
        errorfunc(req, res);
      }else{
        db.activities.findOne(
          { "_id": mongojs.ObjectId( act_id ) },
          function( err, act ){
            console.log( 'check if ok:     ', act );
            if(err || !act){
              console.log(err);
              res.redirect('/profile');
              return;
            } else {
              var act_name = act.name;
              console.log('===============================================');
              for( var groupid in act.group ){
                var group = act.group[ groupid ];
                console.log( group.character , '  []  ', player_id.toString() );
                if( group.character == player_id.toString() ){
                  console.log('++++++ found group +++++');
                  if( group.player && group.player.id){
                    console.log('found user already in group ', group.player);
                    res.redirect('/profile');
                    return;
                  }else{
                    console.log('found user not in group ', group.player);
                    break;
                  }
                }
              }

              db.activities.findAndModify({
                query: { 
                  _id: mongojs.ObjectId( act_id ),
                  group: {
                    "$elemMatch": { character: player_id.toString() }
                  }
                },
                update: { 
                  "$set": {
                    "group.$.player.id": req.user._id.toString(),
                    "group.$.player.name": req.user.fb.displayName
                  } 
                }, new: true }, function (err, doc) {
                  if(err){
                    errorfunc(req, res);
                  }
                  else{
                    console.log(req.user);
                    db.users.findAndModify({ 
                      query: { _id: mongojs.ObjectId( req.user._id.toString() ) },
                      update: { 
                        $push: {
                          activities: {
                            id: act_id,
                            gameName: act_name,
                            player_id: player_id,
                          }
                        } 
                      }, new: true
                    }, function( err, doc ){
                      if(err){
                        console.log('user add activity error: ', err);
                        res.send( 404, 'user add activity error' );
                      } else {
                        res.redirect( '/profile');
                        console.log( doc );
                      }
                    });
                  }
                });
            }
          }
        )

      }
    }
  });


  app.post('/user/addActivity', function(req, res){
    var act = req.body.act;
    var player_id = safety.decrypt( act._id , req.body.code );
    if(! player_id ){
      res.render('profile', {
        error: req.flash('error', 'The code is invalid'),
        user: req.user
      });
    }else{
      console.log(req.body.code , ' --> ', player_id);

      db.activities.findAndModify({
        query: { 
          _id: mongojs.ObjectId( act._id ),
          group: {
            "$elemMatch": { character: player_id.toString() }
          }
        },
        update: { 
          "$set": {
            "group.$.player.id": req.user._id.toString(),
            "group.$.player.name": req.user.fb.displayName
          } 
        }, new: true }, function (err, doc) {
          if(err){
            res.render('profile', {
              error: req.flash('error', 'The code is invalid'),
              user: req.user,
            });
          }
          else{
            console.log('============== >>> Found character: ', player_id, ' in activity: ', act.name);
            console.log(req.user);
            db.users.findAndModify({ 
              query: { _id: mongojs.ObjectId( req.user._id.toString() ) },
              update: { 
                $push: {
                  activities: {
                    id: act._id,
                    gameName: act.name,
                    player_id: player_id,
                  }
                } 
              }, new: true
            }, function( err, doc ){
              if(err){
                console.log('user add activity error: ', err);
                res.send( 404, 'user add activity error' );
              } else {
                res.json( doc );
                console.log( doc );
              }
            });
          }
        });
    }
  });

  app.get('/activitylist', function(req, res){
    db.activities.find(function(err, docs){
      if(err){
        console.log('get activitylist error: ', err);
        res.send(404, err);
      }else{
        res.json(docs);
        console.log('============================');
        console.log(docs);
      }
    });
  });


  app.all('/admin/*', canAccessAdmin);

  app.get('/admin/artistlist', function(req, res){
    User.find(
      { isArtist : true },
      function(err, list){
        if(err){
          console.log('Getting artist list err: ', err);
          res.send( 404, 'fetch artist list err' );
        }else{
          res.json( list ) ;
          console.log('artists: ', list);
        }
      }
    )
  });

  app.get('/admin/artistlist/:act_id', function(req, res){
    User.find(
      { $nor: [ 
        { isArtist: false },
        { group: 
          { $elemMatch: {
          "id": mongojs.ObjectId( req.params.act_id )
        }
        }  
        } 
      ]
      },
      function(err, list){
        if(err){
          console.log('Getting artist list err: ', err);
          res.send( 404, err );
        }else{
          res.json( list ) ;
          console.log('artists: ', list);
        }
      }
    )
  });

  

  // no creation of user

  app.delete('/admin/userlist/:id', function (req, res) {
    var id = req.params.id;
    console.log(id);
    db.users.remove({"_id": mongojs.ObjectId(id)}, function (err, doc) {
      if(err)
        res.send(401, 'Database connection fail');
      else
        res.json(doc);
    });
  });

  app.get('/admin/userlist/:id', function (req, res) {
    var id = req.params.id;
    db.users.findOne( {"_id": mongojs.ObjectId(id)}, function (err, doc) {
      // mongojs.ObjectId can work!! instead of using ObjectId(id) or id.toString()...
      if(err){
        console.log(err); 
        res.send(401, 'Database connection fail');
      }
      else{
        res.json(doc);
      }
    });
  });


  app.get('/admin/userlist', function(req, res){
    console.log('try to get userlist');
    db.users.find(function(err, docs){
      if(err){
        console.log(err, 'failed');
        res.send(401, 'Database connection fail');
      }
      else
        res.json(docs);
    });
    console.log('try to get userlist done');
  });

  /*************
   * add activity to user
   * ++ act._id & gameName
   *************/
  app.post('/admin/userlist/:id', function (req, res) {
    var id = req.params.id;

    //console.log(req.body.name);
    db.users.findAndModify({
      query: {  _id: mongojs.ObjectId( id ) },
      update: { // update
        $push: {
          activities: {
            id: req.body._id,
            gameName: req.body.name,
            player_id: req.body.character,
          }
        }
      },
      new: true,
    }, 
    function (err, doc) {
      if(err)
        res.send(401, 'Database connection fail');
      else
        res.json(doc);
    });
  });

  app.get('/admin/activitylist', function(req, res){
    db.activities.find(function(err, docs){
      if(err)
        res.send(401, 'Database connection fail');
      else
        res.json(docs);
    });
  });

  app.delete('/admin/clearall', function(req, res){
    db.activities.remove({}, function(err, docs){
      if(err){
        console.log(err);
        res.send(404, err);
      }else{
        User.update({}, { $set: { activities: [] } }, function(err, doc){
          if(err){
            console.log(err);
            res.send(404, err);
          }else{
            console.log(doc);
            res.json(doc);
          }
        });
      }
    });
  })

  app.get('/admin/activitylist/:id', function( req, res ){
    db.activities.findOne({ "_id": mongojs.ObjectId( req.params.id ) }, function(err, doc){
      if(err){
        console.log(err);
        res.send(401, 'Database connection fail');
      } else {
        res.json( doc );
      }
    });
  });


  app.put('/admin/activitylist/:id', function( req, res ){
    db.activities.findAndModify({
      query: { "_id": mongojs.ObjectId( req.params.id ) },
      update: { $set: {
        name: req.body.name,
        time: req.body.time,
        location: req.body.location,
        acttype: req.body.acttype,
      }}, new: true}, function(err, doc){
        if(err){
          console.log('put err: ', err);
          res.send(404, 'put activity error');
        } else {
          console.log( 'edit act : ', doc);
          res.json( doc );
        }
      });
  });

  app.put('/admin/activitylist/:id/removeuser', function(req, res){
    var user = req.body;
    console.log('+++++++++++++++++ removeuser +++++++++++++++++++++');
    console.log(user);
    if( user.isArtist ){
      db.activities.findAndModify({
        query: { 
          _id: mongojs.ObjectId( req.params.id ),
          group: {
            "$elemMatch": { "artist.id": user._id }
          }
        },
        update: { 
          "$unset": {
            "group.$.artist": "",
          } 
        }, new: true }, function(err, doc){
          if(err){
            console.log(err);
            res.send( 404, 'remove user from activity' );
          } else {
            console.log(doc);
            res.json( doc );
          }
        });
    }else{
      console.log(' Removing player from activity....');
      db.activities.findAndModify({
        query: { 
          _id: mongojs.ObjectId( req.params.id ),
          group: {
            "$elemMatch": { "player.id": user._id }
          }
        },
        update: { 
          "$unset": {
            "group.$.player": "",
          } 
        }, new: true }, function(err, doc){
          if(err){
            console.log(err);
            res.send( 404, 'remove user from activity' );
          } else {
            console.log( 'remove user from activity: ', doc);
            res.json( doc );
          }
        });
    }
  });

  app.put('/admin/activitylist/:id/setgroup', function(req, res){
    console.log('group setting!!!!!!!!!!!');
    var group = req.body;
    db.activities.findAndModify({
      query: { 
        _id: mongojs.ObjectId( req.params.id ),
        group: {
          "$elemMatch": { character: group.character }
        }
      },
      update: { 
        "$set": {
          "group.$.artist.id": group.artist.id,
          "group.$.artist.name": group.artist.name,
          "group.$.stream": group.stream,
          "group.$.sclass": group.sclass
        } 
      }, new: true }, function(err, doc){
        if(err){
          console.log(err);
          res.send( 404, 'changing artist in activity' );
        } else {
          console.log(doc);
          res.json( doc );
        }
      });
  });


  app.put('/admin/activitylist/:id/:put', function(req, res){
    var setput = req.params.put == 'y' ? true : false;
    db.activities.findAndModify({
      query: { "_id": mongojs.ObjectId( req.params.id ) },
      update: { $set: {
        isRunning: setput
      } }, new: true}, function(err, doc){
        if(err){
          console.log('toggle activity: ', err);
          res.send(404, err);
        }else {
          res.json( doc );
        }
      }
    );
  });

// new activity
  app.post('/admin/activitylist', function( req, res ){
    var act = new Activity();
    act.name = req.body.name;
    act.location = req.body.location;
    act.time = req.body.time;
    act.acttype = req.body.acttype
    console.log('act type: ', act.acttype);
    act.save(function(err, doc){
      if(err){
        res.send(500, err);
        console.log('new act error: ', err);
      } else {
        res.json( doc );
        console.log('new act: ', doc);
      }
    })
  });

  app.post('/admin/activitylist/:id', function(req, res){
    console.log("act sclass"+req.body.sclass);
    db.activities.findAndModify({
      query: { _id: mongojs.ObjectId( req.params.id ) },
      update: { $push: {
        group: { 
          artist: {
            id: req.body.artist.id,
            name: req.body.artist.name
          },
          character: req.body.character,
          stream: req.body.stream,
          sclass: req.body.sclass
        }
      }},
      new: true,
    }, function( err, doc ){
      if( err ){
        console.log( err );
        res.send( 404, 'push group into activity error' );
      } else {
        db.users.findAndModify({
          query: { _id: mongojs.ObjectId( req.body.artist.id ) },
          update: { $push: {
            activities: {
              id: req.params.id,
              gameName: req.body.gameName,
              player_id: 'artist',
            }  
          }},
          new: true,
          upsert: true
        }, function( err, doc ){
          if(err){
            console.log(err);
            res.send( 404, 'push group into artist error' );
          } else {
            res.json(doc);
          }
        });
      }
    });
  });

  app.delete('/admin/activitylist/:id', function(req, res){
    db.activities.findOne({"_id": mongojs.ObjectId(req.params.id)}, function(err, doc){
      for(var groupid in doc.group){
        var group = doc.group[ groupid ];
        if(group.artist){
          db.users.findAndModify({
            query: { "_id": mongojs.ObjectId( group.artist.id ) },
            update: { $pull: { 'activities': { 'id': req.params.id } } },
          },function( err, doc ){
            if(err)
              console.log('delete activity from user: ', err);
            else{
              console.log(doc);
            }
          });
        }
        if(group.player){
          db.users.findAndModify({
            query: { "_id": mongojs.ObjectId( group.player.id ) },
            update: { $pull: { 'activities': { 'id': req.params.id } } },
          },function( err, doc ){
            if(err)
              console.log('delete activity from user: ', err);
          });
        }
      }
    });
    db.activities.remove({ "_id": mongojs.ObjectId( req.params.id )}, function( err, doc ){
      if(err){
        res.send(404, 'remove activity error: ', err);
        console.log(err);
      } else {
        res.json( doc );
      }
    })
  });

  app.delete('/admin/activitylist/:id/:character', function(req, res){
    db.activities.findAndModify({
      query: {"_id": mongojs.ObjectId( req.params.id )} ,
      update: {
        $pull: {
          'group': {
            'character': req.params.character
          }
        }
      }
    }, function( err, doc ){
      if(err){
        console.log( 'deleting group err: ', err );
        res.send( 404, err );
      } else {
        console.log( 'removing group success: ', doc );
        res.json( doc );
      }
    });
  });

  // need: user id
  app.put('/admin/activitylist/:id/:character', function(req, res){
    var player = req.body;
    db.activities.findAndModify({
      query: { 
        "_id": mongojs.ObjectId( req.params.id ), 
        "group": { 
          $elemMatch: { character: req.params.character }
        }
      },
      update: {
        $set: {
          "group.$.player.id": player.id.toString(),
          "group.$.player.name": player.name
        }
      }, 
      new: true
    }, function(err, doc){
      if(err){
        console.log('putting character error: ', err);
        res.send( 404, err );
      } else {
        console.log('putting character: ', doc);
        res.json( doc );
      }
    });
  });

  /********
   * delete act in user
   ********/
  app.delete('/admin/userlist/:id/:act_id', function(req, res){
    db.users.findAndModify({
      query: { "_id": mongojs.ObjectId( req.params.id ) },
      update: { 
        $pull: {
          'activities': {
            'id': req.params.act_id
          }
        }
      },
    },function( err, doc ){
      if(err){
        console.log('delete activity from user: ', err);
        res.send( 404, err );
      } else {
        console.log('delect activity from user success: ', doc);
        res.json( doc );
      }
    });
  });

  app.get('/admin/invite/:act_id/:character', function(req, res){
    res.json( safety.encrypt( req.params.act_id, req.params.character ) );
  });

  app.put('/admin/:cmd/:id', function(req, res){

    var id = req.params.id;
    User.findOne(
      { "_id": mongojs.ObjectId( id ) },
      function(err, user){
        if(err)
          console.log(err, "**********************************");
        else{
          if( req.params.cmd == 'makeadmin' )
            user.isAdmin = !user.isAdmin;
          else if (req.params.cmd == 'makeartist')
            user.isArtist = !user.isArtist;
          else if( req.params.cmd == 'makedoll' ){
            if( user.isDoll )
              user.isDoll = false;
            else
              user.isDoll = true;
          }


          user.save(function(err, doc){
            if(err){
              res.send(500, 'user.save error');
            }else{
              res.json( doc );
            }
          });
        }
      }
    );

  });
  app.get('/admin/stream/:act', function(req, res){
        console.log( "act monitoring:", req.params.act );

        db.activities.findOne(
          { "_id": mongojs.ObjectId( req.params.act )},
          function(err, act){
            if(err){
              console.log('find activity error: ', err);
              res.send( 404, err );
            } else {
              console.log('                   got act  :', act);
              if( act.isRunning )
                res.render('stream', { act: act, user:req.user});
              else
                res.redirect('/admin/activity');
            }
          })  
  });




  /* type: artist / [ character ] */
  app.get('/profile/:act/:type', isAuthenticated, function(req, res){

    var query = ( req.params.type == "artist" ) ? 
      { "_id": mongojs.ObjectId( req.params.act ), "group.artist.id": req.user._id.toString() }
        : { "_id": mongojs.ObjectId( req.params.act ), "group.player.id": req.user._id.toString() };

        console.log( "query", query );

        db.activities.findOne(
          query,
          { 'group.$': 1 , 'isRunning':1},
          function(err, act){
            if(err){
              console.log('find activity group error: ', err);
              res.send( 404, err );
            } else {
              console.log('                   got act  :', act);
              console.log('got user activity group: ', act.group[0]);
              if( act.isRunning )
                res.render('stream-talk', { group:  act.group[0] , user: req.user});
              else
                res.render('profile', { warning: 'hasnot start' , user: req.user});
            }
          })  
  });

  /* type: artist / [ character ] */
  app.get('/group/:act/:type', isAuthenticated, function(req, res){

    var query = ( req.params.type == "artist" ) ? 
      { "_id": mongojs.ObjectId( req.params.act ), "group.artist.id": req.user._id.toString() }
        : { "_id": mongojs.ObjectId( req.params.act ), "group.player.id": req.user._id.toString() };

        db.activities.findOne(
          query,
          function(err, act){
            if(err){
              res.send( 404, err );
            } else {
              res.json( act );
            }
          })  
  })
  app.get('/adminact/:act', isAuthenticated, function(req, res){

        db.activities.findOne(
          {"_id": mongojs.ObjectId( req.params.act )},
          function(err, act){
            if(err){
              res.send( 404, err );
            } else {
              res.json( act );
            }
          })  
  })

  app.put('/group/:act/artist', isAuthenticated, function(req, res){
    db.activities.findAndModify({
      query: { 
        "_id": mongojs.ObjectId( req.params.act ), 
        "group": { 
          $elemMatch: { "artist.id": req.user._id.toString() }
        }
      },
      update: {
        $set: {
          "group.$.stream": req.body.link
        }
      }, 
      new: true
    }, function(err, doc){
      if(err){
        console.log('putting character error: ', err);
        res.send( 404, err );
      } else {
        console.log('putting character: ', doc);
        res.json( doc );
      }
    });
  });
  app.get('/api/act/update_stream/:access_id/:act_id/:callid', function(req,res){
    var access_id = req.params.access_id;
    var act_id = req.params.act_id;
    var callid = req.params.callid;

    User.findOne({"fb.id": access_id}, function(err, user){

      db.activities.findAndModify({
        query: { 
          "_id": mongojs.ObjectId(act_id), 
          "group": { 
            $elemMatch: { "artist.id": user._id.toString() }
          }
        },
        update: {
          $set: {
            "group.$.stream": callid
          }
        }, 
        new: true
      }, function(err, doc){
        if(err){
          console.log('putting character error: ', err);
          res.send( 404, err );
        } else {
          console.log('putting character: ', doc);
          res.json( doc );
        }
      });

    });

  });
  // auto sync by github webhook.
  app.post('/git/autosync', function(req, res){
    var content = req.body.ref;
    if (content=='refs/heads/master') {
      console.log("=====code update=====");
      console.log("commit by "+'unknown');
      console.log("time: "+(new Date()).toString());
      console.log("updating...");
      test  = new run_cmd(
        'git', ['pull'],
        function (me, buffer) { me.stdout += buffer.toString() },
          function () { console.log("git sync finished...");console.log(test.stdout);console.log("=====code update=====\n\n"); }
      );
    }
    return res.json(true);
  });
  app.get('/api/act/gpslog/:act_id/:artist_id/:longi/:lati/:battery/:acc', function(req, res){
    var act_id = req.params.act_id;
    var access_id = req.params.artist_id;
    var longi = req.params.longi;
    var lati = req.params.lati;
    var battery = req.params.battery;
    var acc = req.params.acc;
    var time = new Date();
    User.findOne({"fb.id": access_id}, function(err, user){

      db.activities.findAndModify({
        query: { 
          "_id": mongojs.ObjectId(act_id), 
          "group": { 
            $elemMatch: { "artist.id": user._id.toString() }
          }
        },
        update: {
          $set: {
            "group.$.artist.gps.longi": longi,
            "group.$.artist.gps.lati": lati,
            "group.$.artist.gps.time.work": time,
            "group.$.artist.gps.battery.work": battery,
            "group.$.artist.gps.acc": acc,
          }
        }, 
        new: true
      }, function(err, doc){
        if(err){
          console.log('putting character error: ', err);
          res.send( 404, err );
        } else {
          console.log('GPS-logger', 'act_id:'+act_id+', artist_id:'+access_id+', '+time)

          res.json( true );
        }
      });

    });
  });

  app.get('/api/act/gpslog/batonly/:act_id/:artist_id/:battery', function(req, res){
    var act_id = req.params.act_id;
    var access_id = req.params.artist_id;
    var battery = req.params.battery;
    var time = new Date();
    User.findOne({"fb.id": access_id}, function(err, user){

      db.activities.findAndModify({
        query: { 
          "_id": mongojs.ObjectId(act_id), 
          "group": { 
            $elemMatch: { "artist.id": user._id.toString() }
          }
        },
        update: {
          $set: {
            "group.$.artist.gps.battery.stream": battery,
            "group.$.artist.gps.time.stream": time,
          }
        }, 
        new: true
      }, function(err, doc){
        if(err){
          console.log('putting character error: ', err);
          res.send( 404, err );
        } else {
          console.log('GPS-logger', 'act_id:'+act_id+', artist_id:'+access_id+', '+time)

          res.json( true );
        }
      });

    });
  });
  return {
    id_register : function(act_id, character, socket_id, type, callback) {
      // type 1:admin 2:web user 3:android user
      var temp = function(err, doc){
          if(err){
            console.log('putting character error: ', err);
            callback('fail');
            
          } else {
            console.log('id-register done:'+act_id+', '+character);
            callback('success');
            
          }
        }
      switch(type){
        case 1:
          db.activities.findAndModify({
            query: { 
              "_id": mongojs.ObjectId(act_id), 
            },
            update: {
              $set: {
                "admin_socket_id": socket_id,
              }
            }, 
            new: true
          }, temp);
          break;
        case 2://web user
          db.activities.findAndModify({
            query: { 
              "_id": mongojs.ObjectId(act_id), 
              "group": { 
                $elemMatch: { "character": character }
              }
            },
            update: {
              $set: {
                "group.$.player.socket_id": socket_id,
              }
            }, 
            new: true
          }, temp);
          break;
        case 3:
          db.activities.findAndModify({
            query: { 
              "_id": mongojs.ObjectId(act_id), 
              "group": { 
                $elemMatch: { "character": character }
              }
            },
            update: {
              $set: {
                "group.$.artist.socket_id": socket_id,
              }
            },
            new: true
          }, temp);
          break;
      }
        
    },
    send_act_mission: function(content, callback){
      Activity
      .findOne({"_id":content.act_id}, function(err, act){
        if (err) {
          console.log('no such act');
        }else{
          console.log('get act info')
          for (var i = act.group.length - 1; i >= 0; i--) {
            callback(act.group[i].player.socket_id, content.mission);
          }
          
        } 
      });
    },
    exchange_status: function(ex_data, callback){
      console.log("===start exchange in data===");
      db.activities.find({ 
          "_id": mongojs.ObjectId(ex_data.act_id), 
          }, 
        function(err, doc){
        if(err||!doc){
          console.log('exchange character error: ', err);
          
        } else {
          // console.log('data found'+JSON.stringify(doc, 4 , ''));
          console.log('data found'+doc[0].group.length);
          var self_index=-1, other_index=-1;

          for (var i = doc[0].group.length - 1; i >= 0; i--) {
            if (doc[0].group[i].character==ex_data.self_character) {
              self_index = i;

            }else if(doc[0].group[i].character==ex_data.other_character){
              other_index = i;
            }
          }
          if (self_index!=-1&&other_index!=-1) {
            self_sclass = doc[0].group[self_index].sclass;
              other_sclass = doc[0].group[other_index].sclass;
              db.activities.findAndModify({
                query: { 
                  "_id": mongojs.ObjectId(ex_data.act_id), 
                  "group": { 
                    $elemMatch: { "character": doc[0].group[other_index].character }
                  }
                },
                update: {
                  $set: {
                    "group.$.sclass": self_sclass,
                  }
                },
                new: true
              }, temp);
              db.activities.findAndModify({
                query: { 
                  "_id": mongojs.ObjectId(ex_data.act_id), 
                  "group": { 
                    $elemMatch: { "character": doc[0].group[self_index].character }
                  }
                },
                update: {
                  $set: {
                    "group.$.sclass": other_sclass,
                  }
                },
                new: true
              }, temp);
            }else{
            console.log("something wrong")
          }
          function temp(err, doc){
              if (err) {
                console.log("failed to exchange:"+err);
              }else{
                console.log("successfully exchange");
                for (var i = doc.group.length - 1; i >= 0; i--) {
                  if( doc.group[i].artist.socket_id )
                    callback(doc.group[i].artist.socket_id, doc);
                  if( doc.group[i].player && doc.group[i].player.socket_id )
                    callback(doc.group[i].player.socket_id, doc); 
                }
                if( doc.admin_socket_id )
                  callback(doc.admin_socket_id, doc);

              }
            }
        }
      });
    },
    update_act: function(info_data, callback){
      // console.log("start exchange in data", info_data);
      function temp(err, doc){
        if (err) {
          console.log("failed to exchange:"+err);
        }else if(!doc){
          console.log("empty doc for ", info_data);
        }else{
          console.log("successfully exchange");
          for (var i = doc.group.length - 1; i >= 0; i--) {
            if (doc.group[i].character==decodeURI(info_data.self_character)) {
              console.log('===updating'+info_data.self_character+'===');
              console.log('doc:', doc);
              if( doc.group[i].artist.socket_id )
                callback(doc.group[i].artist.socket_id, doc);
              if( doc.group[i].player && doc.group[i].player.socket_id )
                callback(doc.group[i].player.socket_id, doc);  
            }
          }
        }
      }
      Activity.findOne({"_id": mongojs.ObjectId(info_data.act_id)}, temp);
    },
    gps_log: function(info_data, callback){
      // console.log("gps log coming!!!");
      
      var act_id = info_data.act_id;
      var character = info_data.self_character;
      var longi = info_data.longi;
      var lati = info_data.lati;
      var battery = info_data.battery;
      var acc = info_data.acc;
      var time = new Date();
      db.activities.findAndModify({
        query: { 
          "_id": mongojs.ObjectId(act_id), 
          "group": { 
            $elemMatch: { "character": character }
          }
        },
        update: {
          $set: {
            "group.$.artist.gps.longi": longi,
            "group.$.artist.gps.lati": lati,
            "group.$.artist.gps.time.work": time,
            "group.$.artist.gps.battery.work": battery,
            "group.$.artist.gps.acc": acc,
          }
        }, 
        new: true
      }, function(err, doc){
        if(err){
          console.log('putting character error: ', err);
        } else {
          // console.log('===GPS-logger', 'act_id:'+act_id+', charac:'+character+', lati:'+longi+', '+time+'===')
          for (var i = doc.group.length - 1; i >= 0; i--) {
            if (doc.group[i].character==decodeURI(info_data.self_character)) {
              // console.log('===updating'+info_data.self_character+'===');
              
              // if( doc.group[i].artist.socket_id )
              //   console.log('send gps data artist')
              //   callback(doc.group[i].artist.socket_id, doc);
              if( doc.group[i].player&&doc.group[i].player.socket_id) {
                  // console.log('send gps data to player')  
                  callback(doc.group[i].player.socket_id, doc);  
                }
            }
          }
          if( doc.admin_socket_id )
            callback(doc.admin_socket_id, doc);
        }
      })
    }
  }
}

function run_cmd(cmd, args, cb, end) {
  var spawn = require('child_process').spawn,
    child = spawn(cmd, args),
    me = this;
  child.stdout.on('data', function (buffer) { cb(me, buffer) });
  child.stdout.on('end', end);
}
