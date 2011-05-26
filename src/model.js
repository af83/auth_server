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
  , mongoskin = require('mongoskin')
  , inherits = require('util').inherits
;

var config = require('./lib/config_loader').get_config()
  , hash = require('./lib/hash')
  , _ = require('./lib/merger')
;

var db = exports.db = mongoskin.db(config.db);

var Collection = mongoskin.SkinCollection;

/**
 * Base object for models
 */
function Model(collection, data) {
  Collection.call(this, db, collection);
  data = data || {};
  this.data = data;
}
inherits(Model, Collection);
Model.prototype.get = function(key) {
  if (key == 'id') return this.data['_id'] ? this.data['_id'].toString() : null;
  return this.data[key];
}
Model.prototype.set = function(key, value) {
  if (value == undefined) {
    if (this.data._id)
      key._id = this.data._id;
    this.data = key;
    return;
  }
  return this.data[key] = value;
}
Model.prototype.save = function(callback) {
  var that = this;
  Collection.prototype.save.call(this, this.data, {safe: true}, function(err, result) {
    if (err) return callback(err);
    result = result[0];
    this.data = result;
    callback(null, that);
  });
}
Model.prototype.removeEntry = function(callback) {
  Collection.prototype.removeById.call(this, this.get('id'), callback);
}
Model.prototype.toJSON = function() {
  var id = this.data._id;
  var model = _.extend({}, this.data);
  model.id = id.toString();
  delete model._id;
  return JSON.stringify(model);
}
/**
 * User Model
 */
function User(data) {
  Model.call(this, 'User', data);
  this.ensureIndex('email', true, function(err, name){
      if (err) throw err;
  }); // email is unique
}
inherits(User, Model);
User.prototype.toPortableContact = function() {
  return {
    id: this.data._id.toString(), // TODO: should be an hash of clientid + mongodb id
    displayName: this.data.displayName,
    emails: [{value: this.data.email}]
  };
}
/**
 * Check user password
 */
User.prototype.checkPassword = function(password, callback) {
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
User.prototype.setPassword = function(password, callback) {
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
  new User().findById(id, function(err, result) {
    if (err || !result) return callback(err, null);
    callback(null, result ? new User(result): null);
  });
}
/**
 * Get user by email
 */
User.getByEmail = function(email, callback) {
  new User().findOne({email: email}, function(err, doc) {
    if (err || !doc) return callback(err, null);
    callback(null, new User(doc))
  });
}
/**
 * Get confirmed user by email
 */
User.getByConfirmedEmail = function(email, callback) {
  new User().findOne({email: email, confirmed: 1}, function(err, doc) {
    if (err || !doc) return callback(err, null);
    callback(null, new User(doc));
  });
}

function Users() {
  Collection.call(this, db, 'User');
}
inherits(Users, Collection);
Users.prototype.get = function(callback) {
  this.findItems({}, function(err, result) {
    if (err) return callback(err);
    callback(null, result.map(function(item) {
      return new User(item);
    }));
  });
}

/**
 * Client Model
 */
function Client(data) {
  Model.call(this, 'Client', data);
}
inherits(Client, Model);
Client.getByName = function(name, callback) {
  var clients = db.collection('Client');
  clients.findItems({name: name}, function(err, clients) {
    if (err) return callback(err);
    callback(null, clients.map(function(item) {
      return new Client(item);
    }));
  });
}
Client.getById = function(id, callback) {
  new Client().findById(id, function(err, result) {
    if (err) return callback(err);
    callback(null, result ? new Client(result) : null);
  });
}
/**
 * Clients Model
 * TODO: provide a real collection
 */
function Clients() {
  Collection.call(this, db, 'Client');
}
inherits(Clients, Collection);
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
  db.collection('Grant').findById(id, function(err, result) {
    if (err) return callback(err);
    callback(null, new Grant(result));
  });
}

/**
 * Contact Model
 */
function Contact(data) {
  Model.call(this, 'Contact', data);
}
inherits(Contact, Model);
Contact.prototype.toPortableContact = function() {
  var id = this.data._id.toString();
  var data = _.extend({}, this.data);
  data.id = id;
  delete data._id;
  delete data.user;
  return data;
}
Contact.getById = function(id, callback) {
  db.collection('Contact').findById(id, function(err, result) {
    if (err) return callback(err);
    callback(null, new Contact(result));
  });
}

/**
 * Contacts
 */
function Contacts() {
  Collection.call(this, db, 'Contact');
}
inherits(Contacts, Collection);
Contacts.prototype.search = function(query, callback) {
  this.findItems(query, function(err, items) {
    if (err) return callback(err);
    callback(null, items.map(function(item) {
      return new Contact(item);
    }));
  });
}

exports.db = db;
exports.Client = Client;
exports.Clients = new Clients();
exports.User = User;
exports.Users = new Users();
exports.Grant = Grant;
exports.Contact = Contact;
exports.Contacts = new Contacts();
