module.exports = function(io, streams, routes, data) {
  console.log('ready for connection');


  io.on('connection', function(client) {
    //var userid = client.request.session.passport.user;

    console.log('-- ' + client.id);
    client.emit('id', client.id);
// mission system
    // register client id
    client.on('register_client_id', function(info){
      data.id_register(info.act_id, info.user_id, client.id, info.type, function(status){
        client.emit('register_status', status);
      });
    });
    // 




// original
    client.on('message', function (details) {
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
    });
      
    client.on('readyToStream', function(options) {
      console.log('-- ' + client.id + ' is ready to stream --');
      //userToClientId[ userid ] = client.id;  
      streams.addStream(client.id, options.name); 
    });
    
    client.on('update', function(options) {
      streams.update(client.id, options.name);
    });

    // leave
    function leave() {
      console.log('-- ' + client.id + ' left --');
      streams.removeStream(client.id);
    }

    client.on('disconnect', leave);
    client.on('leave', leave);
  });

};
