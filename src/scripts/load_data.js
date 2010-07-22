/*
 * Script to load test/dev data in the application.
 */

require.paths.unshift(__dirname + '/../../vendors/nodetk/src');
require.paths.unshift(__dirname + '/../../vendors/eyes/lib');

var model = require('../model')
  , data = model.data
  , CLB = require('nodetk/orchestration/callbacks')
  , tkfs = require('nodetk/fs')
  , fs = require('fs')
  , eyes = require('eyes')
  ;


var clear_collections = function(callback) {
  /* Erase all the data (delete the store files) and call callback.
   */
  tkfs.getFilesDirs(model.data_dir, function(files) {
    files = files.filter(function(f) {return f.match(/\.(tmp)?db$/)});
    var waiter = CLB.get_waiter(files.length, function() {
      model.reload_data();
      callback && callback();
    });
    files.forEach(function(f) {
      fs.unlink(f, waiter);
    });
  });
};

var load_users = function(callback) {
  /* Load end users data in store.
   */
  data.users.save('pruyssen@af83.com', {
    password: '1234'
  }, function(err) {
    if (err) throw err;
    callback();
  });
};


var load_clients = function(callback) {
  /* Load the client applications in store.
   */
  data.clients.save('errornot', { // the client application id
    // Once the user is identified, where to send her/him back:
    redirect_uri: 'http://127.0.0.1:8888/login',
  }, function(err) {
    callback();
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

