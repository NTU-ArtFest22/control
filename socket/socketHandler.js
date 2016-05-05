module.exports = function(io, streams, routes, data) {
  console.log('ready for connection');


  io.on('connection', function(client) {
    //var userid = client.request.session.passport.user;

    console.log('-- ' + client.id);
    client.emit('id', client.id);
// mission system
    // register client id
    client.on('register_client_id', function(info){
      console.log("socket client register"+info.character);
      data.id_register(info.act_id, info.character, client.id, info.type, function(status){
        client.emit('register_status', status);
      });
    });
    // new mission
    client.on('new_mission_server', function(content){ //content={act_id:, mission:{name:, requirement}}
      console.log("new mission:"+content);
      data.send_act_mission(content, function(socket_id, mission){  
        //each group will do...
        if (io.sockets.connected[socket_id]) {
            io.sockets.connected[socket_id].emit('new_mission_client', mission);
        }
      })
    })
    // 
    client.on('exchange_request', function(ex_data){ //content={act_id:, mission:{name:, requirement}}
      console.log("exchange_request:"+JSON.stringify(ex_data, 4 , ''));
      data.exchange_status(ex_data, function(socket_id, data){
        if (io.sockets.connected[socket_id]) {
          console.log('new character data'+data);
          io.sockets.connected[socket_id].emit('new_character_data', data);
        }
      });
    })

    client.on('update_request', function(info_data){
      console.log('update_request'+JSON.stringify(info_data, 4 , ''));

    })



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
