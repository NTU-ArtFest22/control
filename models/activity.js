var mongoose = require('mongoose');

var actSchema = mongoose.Schema({
  name: String,
  time: Date,
  isRunning: Boolean,
  location: String,
  acttype:{type:Number, min:1, max:3}, //1 for beyond the map @paotsunyan 2 for beyond @ dadochen, 3 for ear worm
  group: [ {
    artist: {
      id: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
      name: String,
      gps: {longi:String, lati:String, rectime:Date, battery:String}
    },
    player: {
      id: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
      name: String,
    },
    character: String,
    sclass:{type:Number, min:0, max:6} //0: unset, 1:farmer, 2, merchant, 3:geisha, 4:mock, 5:king 6, fortune teller
    stream: String,
  } ],
}, { collection: 'activities' })
module.exports = mongoose.model('Activity', actSchema); 
