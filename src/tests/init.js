/* Initialization stuff to run tests on auth_server.
 * Should be used as such:
 *
 * var DATA = require('./init').init(exports)
 *  , assert = DATA.assert
 *  , R = DATA.R
 *  ;
 *
 */


// Must be imported before server so we get the nodetest on path before
// adding it from vendors.
var assert = require('nodetk/testing/custom_assert');

var port = 8999,
    data = {}
    ;
data.base_url = 'http://127.0.0.1:' + port;
data.assert = assert;

// Tweak a bit the configuration for tests:
var config = require('../config');
config.server.base_url = data.base_url;
config.db.db_name = 'auth_server_test';


var load_data = require('../scripts/load_data').run
  , model = require('../model')
  , server = require('../server')
  , eyes = require('eyes')
  , RFactory = model.RFactory
  , R = RFactory()
  ;
data.R = R;
data.inspect = eyes.inspector();


var get_client_id = function(client_name, callback) {
  /* Calls callback(client_id), client_id corresponding to the given name.
   * If no corresponding client found, throw error.
   */
  R.Client.index({query: {name: client_name}}, function(clients) {
    if(clients.length != 1) throw "There should only be one client!";
    callback(clients[0].id);
  }, function(err) {
    console.log(err.message);
    console.log(err.stack);
    throw err;
  });
};


var setup = function(callback) {
  R.clear_caches();
  load_data(function() {
    get_client_id("errornot", function(client_id) {
      data.client_id = client_id;
      callback();
    });
  });
};


var opened = false;
var module_init = function(callback) {
  if(!opened) setup(function() {
    opened = true;
    server.serve(port, callback);
  });
  else callback();
};


process.on('exit', function () {
  server.server.close();
});


exports.init = function(test_exports) {
  test_exports.setup = setup;
  test_exports.module_init = module_init;
  return data;
};


// -------------------------------------
// redefine the email function for tests:

var email = require('../email')
  , original_send = email.send
  , expected_emails = []
  ;
email.send = function() {
  if(expected_emails.length < 1) throw new Error('Cannot send email!');
  var fct = expected_emails.shift(0);
  fct.apply(this, arguments);
};
data.add_expected_email = function(fct) {
  /* To add an expected email, the given fct will be called when
   * an email is sent, with same args as original one.
   */
  expected_emails.push(fct);
};

// -------------------------------------

