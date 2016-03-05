
var canAccessAdmin = function (req, res, next){
  console.log(req);
  if( req.user && req.user.isAdmin === true)
    next();
  else
    res.send(401, 'Unauthorized');
};

module.exports = function( app ){

  app.get('/user', function(req, res){
    console.log('getting user: ', req.user);
    res.json(req.user);
  });

  app.post('/user/addActivity', function(req, res){
    var player_id = safety.decrypt( req.body.act , req.body.code );
    if(! player_id ){
      res.render('/profile', {
        error: req.flash('error', 'The code is invalid'),
        user: req.user
      });
    }else{
      console.log(req.body.code , ' --> ', player_id);
      req.db.get('Activity').findOne({ _id: req.body.act.toString() }, function(err, doc){
        if( err ){
          res.render('/profile', {
            error: req.flash('error', 'The code is invalid'),
            user: req.user,
          } );
        } else {
          req.db.get('User').findAndModify({
            query: {_id: req.user._id.toString()},
            update: { $addToSet: 
              { activities:{
                id: req.body.act,
                gameName: doc.name,
                player_id: player_id,
                isAttend: true,
                }}},  new: true}, function (err, doc) {
              if(err)
                res.send(401, 'Database connection fail');
              else
                res.json(doc);
            });
        }
      });
    } });


  app.all('/admin/*', canAccessAdmin);

  
  app.get('/admin/userlist', function(req, res){
    req.db.get('User').find(function(err, docs){
      if(err)
        res.send(401, 'Database connection fail');
      else
        res.json(docs);
    });
  });

  
  // no creation of user

  app.delete('/admin/userlist/:id', function (req, res) {
    var id = req.params.id;
    console.log(id);
    req.db.get('User').remove({"_id": id.toString()}, function (err, doc) {
      if(err)
        res.send(401, 'Database connection fail');
      else
        res.json(doc);
    });
  });

  app.get('/admin/userlist/:id', function (req, res) {
    var id = req.params.id;
    console.log(id);
    req.db.get('User').find({"_id": id.toString()}, function (err, doc) {
      if(err)
        res.send(401, 'Database connection fail');
      else
        res.json(doc);
    });
  });

  app.put('/admin/userlist/:id', function (req, res) {
    var id = req.params.id;

    req.db.get('User').findAndModify({
      query: {_id: id.toString()},
      update: {$set: {isAdmin: req.body.isAdmin}},
      new: true}, function (err, doc) {
        if(err)
          res.send(401, 'Database connection fail');
        else
          res.json(doc);
      });
  });

  app.put('/admin/userlist/:id/:activity', function (req, res) {
    var id = req.params.id,
      ac = req.params.activity;

    //console.log(req.body.name);
    req.db.get('User').findAndModify({
      query: {
        _id: id.toString(),
        activities: {
          $elemMatch: {id: ObjectId(ac)}
        }
      },
      update: {
        $set: { 
          'activities.$.gameName': req.body.gameName,
          'activities.$.isAttend': req.body.isAttend
        }
      },
      new: true}, function (err, doc) {
        if(err)
          res.send(401, 'Database connection fail');
        else
          res.json(doc);
      });
  });

  app.get('/admin/activitylist', function(req, res){
    req.db.get('Activity').find(function(err, docs){
      if(err)
        res.send(401, 'Database connection fail');
      else
        res.json(docs);
    });
  });


};
