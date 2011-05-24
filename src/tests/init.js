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
var assert = exports.assert = require('nodetk/testing/custom_assert');

var port = 8999,
    data = {}
;

data.base_url = 'http://127.0.0.1:' + port;
data.assert = assert;
data.session = {};

// Tweak a bit the configuration for tests:
var config = require('../lib/config_loader').get_config();
config.server.base_url = data.base_url;
config.db = 'db://localhost/auth_server_test';

var eyes = require('eyes')
;

var load_data = require('../scripts/load_data').run
  , model = require('../model')
  , server = require('../server')
  ;

data.inspect = eyes.inspector();

server.get_session_middleware = function() {
  return function() {
    return function(req, res, next) {
      req.session = data.session;
      next();
    }
  }
};

/**
 * Calls callback(client_id), client_id corresponding to the given name.
 * If no corresponding client found, throw error.
 */
var get_client_id = function(client_name, callback) {
  model.Client.getByName(client_name, function(err, clients) {
    if (err) throw new Error(err);
    if (clients.length != 1) throw new Error("There should only be one client!");
    callback(clients[0].get('id'));
  });
};

/**
 * Call callback(user_id), user_id corresponding to given name.
 * If no user, throw an error.
 */
var get_user_id = function(user_email, callback) {
  model.User.getByEmail(user_email, function(err, user) {
    if (err) throw new Error(err);
    callback(user.get('id'));
  });
};

var setup = function(callback) {
  reinit_session();
  load_data().then(function(next) {
    get_client_id("errornot", function(client_id) {
      data.client_id = client_id;
      next();
    });
  }).then(function(next) {
    get_user_id("pruyssen@af83.com", function(user_id) {
      data.user_id = user_id;
      next();
    });
  }).then(callback);
};


var opened = false;
var module_init = function(callback) {
  if(!opened) setup(function() {
    opened = true;
    server.serve(port).then(callback);
  });
  else callback();
};

var reinit_session = function() {
  Object.keys(data.session).forEach(function(key) {
    delete data.session[key];
  });
};

process.on('exit', function () {
  // server.server might be undefined if we run a particular test file
  // which doesn't initialize it.
  if(server.server) server.server.close();
});


exports.init = function(test_exports) {
  test_exports.setup = setup;
  test_exports.module_init = module_init;
  //test_exports.module_clode = module_close;
  return data;
};


// -------------------------------------
// redefine the email function for tests:

var email = require('../lib/email')
  , original_send = email.send
  , expected_emails = []
  ;
email.send = function() {
  if (expected_emails.length < 1) throw new Error('Cannot send email!');
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

