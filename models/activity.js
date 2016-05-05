var mongoose = require('mongoose');

var actSchema = mongoose.Schema({
  name: String,
  time: Date,
  isRunning: Boolean,
  location: String,
  admin_socket_id:String,
  acttype:{type:Number, min:1, max:3}, //1 for beyond the map @paotsunyan 2 for beyond @ dadochen, 3 for ear worm
  group: [ {
    artist: {
      id: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
      name: String,
      socket_id:String,
      gps: {
          longi:String, 
          lati:String, 
          time:{
            work:String,
            time:String
          }, 
          battery:{
            work:String,
            stream:String,
          },
          acc:String}
    },
    player: {
      id: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
      name: String,
      socket_id:String,
    },
    character: String,
    sclass:{type:Number, min:0, max:6}, //0: unset, 1:farmer, 2, merchant, 3:mock, 4:king
    stream: String,
  } ],
}, { collection: 'activities' })
module.exports = mongoose.model('Activity', actSchema); 
