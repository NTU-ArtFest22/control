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
    res.send(401, 'Unauthorized');
};


module.exports = function( app , db ){

  app.get('/user', function(req, res){
    console.log('getting user: ', req.user);
    res.json(req.user);
  });

  app.post('/user/addActivity', function(req, res){
    var act = req.body.act;
    var player_id = safety.decrypt( act._id , req.body.code );
    if(! player_id ){
      res.render('/profile', {
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
            res.render('/profile', {
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

  app.put('/admin/makeadmin/:id', function(req, res){
    var id = req.params.id;
    User.findOne(
      { "_id": mongojs.ObjectId( id ) },
      function(err, user){
        if(err)
          console.log(err, "**********************************");
        else{
          console.log(user, "**********************************");
          console.log( "put makeAdmin" );

          user.isAdmin = !user.isAdmin;

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

  app.put('/admin/makeartist/:id', function(req, res){
    var id = req.params.id;
    User.findOne(
      { "_id": mongojs.ObjectId( id ) },
      function(err, user){
        if(err)
          console.log(err, ' error make artist..........');
        else{
          console.log(user, ' sucuccess make artist..........');
          console.log( "put makeAdmin" );

          user.isArtist = !user.isArtist;
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
      }}, new: true}, function(err, doc){
        if(err){
          console.log('put err: ', err);
          res.send(404, 'put activity error');
        } else {
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
          "group.$.stream": group.stream
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

  app.post('/admin/activitylist', function( req, res ){
    var act = new Activity();
    act.name = req.body.name;
    act.time = req.body.time;
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
    db.activities.findAndModify({
      query: { _id: mongojs.ObjectId( req.params.id ) },
      update: { $push: {
        group: { 
          artist: {
            id: req.body.artist.id,
            name: req.body.artist.name
          },
          character: req.body.character,
          stream: req.body.stream
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
    }
                          );
  });

  app.get('/admin/invite/:act_id/:character', function(req, res){
    res.json( safety.encrypt( req.params.act_id, req.params.character ) );
  });

  /* type: artist / [ character ] */
  app.get('/profile/:act/:type', function(req, res){
    
    var query = ( req.params.type == "artist" ) ? 
      { "_id": mongojs.ObjectId( req.params.act ), "group.artist.id": req.user._id.toString() }
    : { "_id": mongojs.ObjectId( req.params.act ), "group.player.id": req.user._id.toString() };
    
    console.log( "query", query );
      
    db.activities.findOne(
      query,
      { 'group.$': 1 },
      function(err, act){
        if(err){
          console.log('find activity group error: ', err);
          res.send( 404, err );
        } else {
          console.log('                   got act  :', act);
          console.log('got user activity group: ', act.group[0]);
          res.render('stream-talk', { group:  act.group[0] , user: req.user});
        }
    })  
  });

  /* type: artist / [ character ] */
  app.get('/group/:act/:type', function(req, res){
    
    var query = ( req.params.type == "artist" ) ? 
      { "_id": mongojs.ObjectId( req.params.act ), "group.artist.id": req.user._id.toString() }
    : { "_id": mongojs.ObjectId( req.params.act ), "group.player.id": req.user._id.toString() };
      
    db.activities.findOne(
      query,
      { 'group.$': 1 },
      function(err, act){
        if(err){
          res.send( 404, err );
        } else {
          res.json( act.group[0] );
        }
    })  
  })

  app.put('/group/:act/artist', function(req, res){
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
};
