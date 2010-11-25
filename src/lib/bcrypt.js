var exec  = require('child_process').exec
  ;

var bcrypt_path = __dirname + "/../../vendors/bcrypt_hash/"
  , bcrypt_hash = bcrypt_path + "bcrypt_hash "
  , bcrypt_check = bcrypt_path + "bcrypt_check "
  ;

// Configuration:
var conf = exports.conf = {
  nb_rounds: 10
};


var escape_pwd = function(password) {
  /* Returns password with escaped simple quotes: "'" -> "\'".
   */
  // here we must be carefull to avoid code injection here
  // XXX: do a node bcrypt module to avoid such risk?
  return password.replace(/'/g, "\\'");
};


exports.hash = function(password, callback, fallback) {
  /* Given a password, compute its hash using bcrypt algo.
   *
   * Arguments:
   *  - password: string to be hashed.
   *  - callback: will be called with the hash as first arguments.
   *  - fallback: called in case of error.
   *
   */
  // here we must be carefull to avoid code injection here
  // XXX: do a node module to avoid such risk?
  var cmd = bcrypt_hash +' '+ conf.nb_rounds +" '"+ escape_pwd(password) +"'";
  exec(cmd, function(error, stdout, stderr) {
    if(error) return fallback(error);
    // remove traliling \n from stdout:
    callback(stdout.slice(0, stdout.length-1));
  });
};


exports.check = function(hash, password, callback, fallback) {
  /* Given a password and a hash, check they match.
   *
   * Arguments:
   *  - hash: string, the hash of expected password.
   *  - password: string, the password to check.
   *  - callback: to be called with a boolean as first argument. true if
   *    password match hash, false otherwise.
   *  - fallback: to be called with err as first argument, if something goes
   *    wrong.
   *
   */
  var cmd = bcrypt_check + "'" + hash + "' '" + escape_pwd(password) + "'";
  exec(cmd, function(error, stdout, stderr) {
    if(error) return fallback(error);
    callback(stdout == "1\n");
  });
};

