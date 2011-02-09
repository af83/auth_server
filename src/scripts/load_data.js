/*
 * Script to load test/dev data in the application.
 */

var server = require('../server')
  , model = require('../model')
  , CLB = require('nodetk/orchestration/callbacks')
  , tkfs = require('nodetk/fs')
  , fs = require('fs')
  , R = model.RFactory()
  , config = require('../lib/config_loader').get_config()
  , hash = require('../lib/hash')

  // indexes:
  , email2user = {}
  , name2client = {}
  ;

var DEBUG = false;


var clear_collections = function(callback) {
  /* Erase all the data (delete the store files) and call callback.
   */
  var collections = [R.Client, R.Grant, R.User];
  var waiter = CLB.get_waiter(collections.length, function() {
    callback && callback();
  });
  collections.forEach(function(collection) {
    collection.remove(waiter);
  });
};

var load_users = function(callback) {
  /* Load end users data in store.
   */
  var emails = [
    'pruyssen@af83.com',
    'toto@af83.com',
    'titi@titi.com'
  ];

  var data_file = __dirname +'/../../doc/pcontacts_example.json';
  fs.readFile(data_file, 'utf8', function(err, data) {
    if(err) throw err;
    var json_users = JSON.parse(data).entry;

    hash.hash('1234', function(password) {
      var users = emails.map(function(email) {
        var user =  new R.User({
          email: email,
          password: password,
          displayName: email.substring(0, email.indexOf('@')),
          confirmed: 1,
          contacts: json_users
        });
        email2user[user.email] = user;
        return user;
      });
      R.save(users, callback, function(err) {
        throw err;
      });
    });
  });
};


var load_clients = function(callback) {
  /* Load the client applications in store.
   */
  var clients = [
    // name, redirect_uri
    [config.oauth2_client.name, config.oauth2_client.client.redirect_uri],
    ["errornot", 'http://127.0.0.1:8888/login'],
    ["text_server", 'http://127.0.0.1:5000/oauth2/process'],
    ["test_client", 'http://127.0.0.1:7070/login/process/'],
    ["geeks", 'http://127.0.0.1:3000/oauth2/process'],
    ['trac', 'http://localhost:8080/trac_env_test/auth_server_process']
  ];
  clients = clients.map(function(t) {
    var client = new R.Client({
      name: t[0],
      redirect_uri: t[1],
      secret: 'some secret string'
    });
    name2client[client.name] = client;
    return client;
  });
  R.save(clients, function() {
    config.oauth2_client.client_id = name2client[config.oauth2_client.name].id;
    callback()
  }, function(err) {
    throw err;
  });
};


var run = exports.run = function(callback) {
  clear_collections(function() {
    var waiter = CLB.get_waiter(2, function() {
      callback();
    });
    load_users(waiter);
    load_clients(waiter);
  });
};


if(process.argv[1] == __filename) {
  DEBUG = true;
  console.log('Reset data in DB...');
  run(function() {
    process.exit()
  });
}
