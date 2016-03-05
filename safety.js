var crypto = require('crypto');

module.exports.encrypt = function(id, text){
  var cipher = crypto.createCipher('aes-256-cbc',id.toString());
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}

module.exports.decrypt = function(id, text){
  var decipher = crypto.createDecipher('aes-256-cbc',id.toString());
  try {
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch ( ex ){
    console.log('Wrong input: ', text);
    return;
  }
}

