/**
 * Where is defined the DB connection and models
 *
 *  - User
 *  - Client
 *  - Grant
 *  - Contact
 *
 */

var events = require('events')
  , provider = require('mongodb-provider')
  , MongoProvider = provider.MongoProvider
  , inherits = require('util').inherits
;

var config = require('./lib/config_loader').get_config()
  , hash = require('./lib/hash');
;

var db = provider.connect(config.db);

var ObjectID = db.bson_serializer.ObjectID;
/**
 * Base object for models
 */
function Model(collection, data) {
  MongoProvider.call(this, db, collection);
  data = data || {};
  this.data = data;
}
inherits(Model, MongoProvider);
Model.prototype.get = function(key) {
  if (key == 'id') return this.data['_id'].toString();
  return this.data[key];
}
Model.prototype.set = function(key, value) {
  return this.data[key] = value;
}
Model.prototype.save = function(callback) {
  var that = this;
  MongoProvider.prototype.save.call(this, this.data, function(err, result) {
    if (err) return callback(err);
    result = result[0];
    this.data = result;
    callback(null, that);
  });
}
Model.prototype.remove = function(callback) {
  MongoProvider.prototype.remove.call(this, {_id: new ObjectID(this.get('id'))}, callback);
}
Model.prototype.toJSON = function() {
  return JSON.stringify(this.data);
}
/**
 * User Model
 */
function User(data) {
  Model.call(this, 'User', data);
}
inherits(User, Model);
/**
 * Check user password
 */
User.prototype.check_password = function(password, callback) {
  var good = function(r) {
    callback(null, r);
  };
  var bad = function(r) {
    callback(r);
  }
  hash.check(this.get('password'), password, good, bad);
}
/**
 * Set user password with the current hashing methid
 */
User.prototype.set_password = function(password, callback) {
  var self = this;
  var good = function(r) {
    self.set('password', r);
    callback(null);
  };
  var bad = function(r) {
    callback(r);
  }
  hash.hash(password, good, bad);
}

User.getById = function(id, callback) {
  new User().findOne({_id: new ObjectID(id)}, function(err, result) {
    if (err) return callback(err);
    callback(null, new User(result));
  });
}

function Users() {
  MongoProvider.call(this, db, 'User');
}
inherits(Users, MongoProvider);
/**
 * Get confirmed users by email
 */
Users.prototype.getByEmail = function(email, callback) {
   this.findItems({email: email, confirmed: 1}, function(err, items) {
     if (err) return callback(err);
     callback(null, items.map(function(item) {
       return new User(item);
     }));
   });
}
/**
 * Client Model
 */
function Client(data) {
  Model.call(this,'Client', data);
}
inherits(Client, Model);
Client.getByName = function(name, callback) {
  var clients = new MongoProvider(db, 'Client');
  clients.find({name: name}, function(err, clients) {
    if (err) return callback(err);
    clients.toArray(callback);
  });
}
Client.getById = function(id, callback) {
  new Client().findOne({_id: new ObjectID(id)}, function(err, result) {
    if (err) return callback(err);
    callback(null, new Client(result));
  });
}
/**
 * Clients Model
 * TODO: provide a real collection
 */
function Clients() {
  MongoProvider.call(this, db, 'Client');
}
inherits(Clients, MongoProvider);
Clients.prototype.get = function(callback) {
  this.findItems({}, function(err, result) {
    if (err) return callback(err);
    callback(null, result.map(function(item) {
      return new Client(item);
    }));
  });
}
/**
 * Grant Model
 */
function Grant(data) {
  Model.call(this, 'Grant', data);
}
inherits(Grant, Model);
Grant.getById = function(id, callback) {
  new MongoProvider(db, 'Grant').findOne({_id: new ObjectID(id)}, function(err, result) {
    if (err) return callback(err);
    callback(null, new Grant(result));
  });
}

exports.db = db;
exports.Client = Client;
exports.Clients = new Clients();
exports.User = User;
exports.Users = new Users();
exports.Grant = Grant;
