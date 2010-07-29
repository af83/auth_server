/*
 * Script to load test/dev data in the application.
 */

require.paths.unshift(__dirname + '/../../vendors/nodetk/src');
require.paths.unshift(__dirname + '/../../vendors/eyes/lib');

var model = require('../model')
  , CLB = require('nodetk/orchestration/callbacks')
  , tkfs = require('nodetk/fs')
  , fs = require('fs')
  , eyes = require('eyes')
  , R = model.RFactory()
  , config = require('../config')

  // indexes:
  , email2user = {}
  , name2client = {}
  ;


var clear_collections = function(callback) {
  /* Erase all the data (delete the store files) and call callback.
   */
  var collections = [R.Client, R.Grant, R.User, R.Authorization];
  var waiter = CLB.get_waiter(collections.length, function() {
    callback && callback();
  });
  collections.forEach(function(collection) {
    collection.clear_all(waiter);
  });
};

var load_users = function(callback) {
  /* Load end users data in store.
   */
  var emails = [
    'pruyssen@af83.com',
    'toto@af83.com',
    'titi@titi.com',
  ];
  var users = emails.map(function(email) {
    var user =  new R.User({
      email: email,
      password: '1234',
    });
    email2user[user.email] = user;
    return user;
  });
  R.save(users, callback, function(err) {
    throw err;    
  });
};


var load_clients = function(callback) {
  /* Load the client applications in store.
   */
  var clients = [
    // name, redirect_uri
    [config.auth_server.name, config.auth_server.redirect_uri],
    ["errornot", 'http://127.0.0.1:8888/login'],
    ["Text server", 'http://127.0.0.1:5000/oauth2/process'],
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
    config.auth_server.client_id = name2client[config.auth_server.name].id;
    callback()
  }, function(err) {
    throw err;
  });
};


var load_authorizations = function(callback) {
  /* Load authorizations in DB.
   */
  var auths = [
   // user email , client name, context, roles
    ['pruyssen@af83.com', 'errornot', 'errornot', ['user', 'admin']],
    ['pruyssen@af83.com', 'errornot', 'text_server', ['user', 'admin']],
    ['pruyssen@af83.com', 'errornot', 'auth_server', ['user', 'admin']],
    ['pruyssen@af83.com', 'Text server', 'auth_server', ['user', 'admin']],
    ['pruyssen@af83.com', 'Text server', 'text_server', ['user', 'admin']],
  ];
  auths = auths.map(function(auth) {
    return new R.Authorization({
      user: email2user[auth[0]],
      client: name2client[auth[1]],
      context: auth[2],
      roles: auth[3]
    })
  });
  R.save(auths, callback, function(err) {
    throw err;
  });
};


var run = exports.run = function(callback) {
  clear_collections(function() {
    var waiter = CLB.get_waiter(2, function() {
      load_authorizations(callback);
    });
    load_users(waiter);
    load_clients(waiter);
  });
};


if(process.argv[1] == __filename) {
  console.log('Reset data in DB...');
  run(function() {
    process.exit()    
  });
}

