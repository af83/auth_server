/* Where is defined the DB connection.
 *
 * We got the following collections (cf. schema.js):
 *  - User
 *  - Client
 *  - Grant
 *
 */

require.paths.unshift(__dirname + "/../vendors/rest-mongo/src")

var events = require('events')
  , rest_mongo = require("rest-mongo/core")
  , mongo_backend = require("rest-mongo/mongo_backend")
  , config = require('./lib/config_loader').get_config()
  , schema = require('./schema').schema
  , server_schema = require('./server_schema').schema
  ;


var backend = mongo_backend.get_backend(config.db);
exports.RFactory = rest_mongo.getRFactory(schema, backend, {
  additional_schema: server_schema
});
// The RFactory to serve public data:
exports.RFactoryPublic = rest_mongo.getRFactory(schema, backend);


// Ensure indexes are created:
backend.db.createIndex('User', 'email', true, function(){}); // email is unique


// To ensure DB concistency:
var emitter = exports.emitter = new events.EventEmitter();

// When removing a client, remove its authorizations
emitter.on('DELETE:Client', function(ids) {
  var R = exports.RFactory();
  R.Authorization.remove({query: {
    client: {'$in': ids.map(function(id){return {id: id}})}
  }});
});

