var crypto = require("crypto");

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

module.exports = sha256_hash;
