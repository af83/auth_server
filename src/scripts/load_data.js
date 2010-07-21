/*
 * Script to load test/dev data in the application.
 */

require.paths.unshift(__dirname + '/../../vendors/nstore/lib');

var nStore = require('nstore');


var load_users = function() {
  var users = nStore(__dirname + '/../../data/users.db');

  users.save('pruyssen@af83.com', {
    password: '1234'
  }, function(err) {
    if (err) throw err;
  });
};


var load_clients = function() {
  /* Load the client applications in store.
   */
  var clients = nStore(__dirname + '/../../data/clients.db');

  clients.save('errornot', { // the client application id
    // Once the user is identified, where to send her/him back:
    redirect_uri: 'http://127.0.0.1:8888/login',
  });
};


load_users();
load_clients();
