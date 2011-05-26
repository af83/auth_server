/*
 * Script to load test/dev data in the application.
 */

var Futures = require('futures')
  , mongoskin = require('mongoskin')
  , fs = require('fs')
;

var server = require('../server')
  , model = require('../model')
  , config = require('../lib/config_loader').get_config()
  , hash = require('../lib/hash')
;

/**
 * Erase all the data (delete the store files) and call callback.
 */
var clear_collections = function(next) {
  var clear_collection_job = function(collection) {
    var future = Futures.future();
    var c = model.db.collection(collection);
    c.remove(future.deliver);
    return future;
  };
  var join = Futures.join();
  join.add(['Client', 'Grant', 'User', 'Contact'].map(clear_collection_job));
  join.when(next);
};

function load_user(email, password, contacts, future) {
  var user = new model.User({
    email: email,
    password: password,
    displayName: email.substring(0, email.indexOf('@')),
    confirmed: 1
  });
  user.save(function(err) {
    if (err) throw err;
    var jobs = contacts.map(function saveContacts(data) {
      delete data.id;
      delete data._id;
      var f = Futures.future();
      var contact = new model.Contact(data);
      contact.set('user', user.get('id'));
      contact.save(f.deliver);
      return f;
    });
    var join = Futures.join();
    join.add(jobs);
    join.when(future.deliver);
  });
}

/**
 * Load end users data in store.
 */
var load_users = function(next) {
  var emails = [
    'pruyssen@af83.com',
    'toto@af83.com',
    'titi@titi.com'
  ];

  var data_file = __dirname +'/../../doc/pcontacts_example.json';
  fs.readFile(data_file, 'utf8', function(err, data) {
    if(err) throw err;
    var contacts = JSON.parse(data).entry;

    hash.hash('1234', function(password) {
      var jobs = emails.map(function(email) {
        var f = Futures.future();
        load_user(email, password, contacts, f);
        return f;
      });
      var join = Futures.join();
      join.add(jobs);
      join.when(next);
    });
  });
};

/**
 * Load the client applications in store.
 */
var load_clients = function(next) {
  var clients = [
    // name, redirect_uri
    [config.oauth2_client.name, config.oauth2_client.client.redirect_uri],
    ["errornot", 'http://127.0.0.1:8888/login'],
    ["text_server", 'http://127.0.0.1:5000/oauth2/process'],
    ["test_client", 'http://127.0.0.1:7070/login/process/'],
    ["geeks", 'http://127.0.0.1:3000/oauth2/process'],
    ['trac', 'http://localhost:8080/trac_env_test/auth_server_process']
  ];
  var name2client = {};
  var jobs = clients.map(function saveClient(t) {
    var client = new model.Client({
      name: t[0],
      redirect_uri: t[1],
      secret: 'some secret string'
    });
    var future = Futures.future();
    client.save(future.deliver);
    name2client[client.get('name')] = client;
    return future;
  });
  var join = Futures.join();
  join.add(jobs);
  join.when(function() {
    config.oauth2_client.client_id = name2client[config.oauth2_client.name].get('id');
    next()
  });
};


var run = exports.run = function() {
  return Futures.sequence().then(clear_collections)
                           .then(load_users)
                           .then(load_clients);
};


if(process.argv[1] == __filename) {
  console.log('Reset data in DB...');
  run().then(function() {
    process.exit()
  });
}
