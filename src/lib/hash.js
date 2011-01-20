var crypto = require("crypto");

var bcrypt = require('./bcrypt');
var config = require('./config_loader').get_config();

var bcrypt_hash = {
  check: bcrypt.check
, hash: bcrypt.hash
};

var sha256_hash = {
  check: function(expected_hash, given_password, callback, fallback) {
    var hash = crypto.createHash('sha256').update(given_password).digest("hex");
    callback(expected_hash == hash);
  }
, hash: function(password, callback, fallback) {
    var hash = crypto.createHash('sha256').update(password).digest("hex");
    callback(hash);
  }
};

if(config.hash_lib == "crypto") module.exports = sha256_hash;
else module.exports = bcrypt_hash;
