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
  ;


var clear_collections = function(callback) {
  /* Erase all the data (delete the store files) and call callback.
   */
  var collections = [R.Client, R.Grant, R.User];
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
  var user = new R.User({
    email: 'pruyssen@af83.com', 
    password: '1234',
  });
  user.save(callback, function(err) {
    throw err;    
  });
};


var load_clients = function(callback) {
  /* Load the client applications in store.
   */
  var client = new R.Client({
    name: "errornot",
    redirect_uri: 'http://127.0.0.1:8888/login',
    secret: 'some secret string',
  });
  client.save(callback, function(err) {
    throw err;    
  });
};


var run = exports.run = function(callback) {
  clear_collections(function() {
    var waiter = CLB.get_waiter(2, function() {
      callback && callback();
    });
    load_users(waiter);
    load_clients(waiter);
  });
};


if(process.argv[1] == __filename) {
  console.log('Reset data in DB...');
  run();
}

