/* OAuth2 server entry point.
 *
 * For more info on what from the oauth2 spec is implemented,
 * see oauth2.js.
 *
 */

// Add location of submodules to path:
[ 'node-formidable/lib'
, 'eyes/lib'
, 'nodetk/src'
, 'rest-mongo/src'
, 'connect/lib'
, 'dispatch/lib'
, 'cookie-sessions/lib'
, 'connect-form/lib'
, 'mustache/lib'
].forEach(function(submodule) {
  require.paths.unshift(__dirname + '/../vendors/' + submodule);
});


var connect = require('connect')
  , sessions = require('cookie-sessions')
  , dispatch = require('dispatch')
  , connect_form = require('connect-form')
  , URL = require('url')

  , eyes = require('eyes')

  , CLB = require('nodetk/orchestration/callbacks')
  , rest_server = require('rest-mongo/http_rest/server')  

  , config = require('./config')
  , oauth2 = require('./oauth2')
  , oauth2_server = require('./oauth2_server')
  , oauth2_resources_server = require('./oauth2_resources_server')  
  , oauth2_client = require('./oauth2_client')
  , web_app = require('./web_app')
  , authentication = require('./authentication')
  , authorizations = require('./controllers/authorizations')
  , users = require('./controllers/users')
  , clients = require('./controllers/clients')
  , RFactory = require('./model').RFactory
  , schema = require('./schema').schema
  , ms_templates = require('./lib/ms_templates')
  ;


var inspect = eyes.inspector({
  maxLength: null
});


// ---------------------------------------------------------
// Only for auth_server GUI:

// TODO: DEPRECETED
//gh.get('/authorizations', function(args) {
//  var params = this.params || {}
//    , client_ids = (params.clients)? params.clients.split(',') : []
//    , user_ids = (params.user_ids)? params.users.split(',') : []
//    , contexts = (params.contexts)? params.contexts.split(',') : []
//  authorizations.get_authorizations(this, client_ids, user_ids, contexts);
//});
//
//gh.get('/clients/{client_id}/contexts', clients.get_client_contexts);
//
//gh.get('/users', users.get_users);
//gh.get('/clients', clients.get_clients);
//gh.get('/clients/{client_id}', clients.get_client);
//gh.post('/clients/{client_id}', clients.update_client);
//
//gh.get('/users/{user_id}/profile', function(user_id) {
//  /* To get the profile information of the user.
//   */
//});


var server = exports.server = connect.createServer(
    connect.staticProvider({root: __dirname + '/static', cache: false})
  // To serve objects directly (based on schema):
  , rest_server.connector(RFactory, schema)
  , connect_form({keepExtensions: true})
  , sessions({secret: '123abc', session_key: 'auth_server_session'})
  , oauth2_server.connector(config.oauth2_server)
  , oauth2_resources_server.connector()
  , oauth2_client.connector(config.oauth2_client)
  , web_app.connector()
  );

var serve = exports.serve = function(port, callback) {
  var waiter = CLB.get_waiter(2, function() {
    server.listen(port, callback);
  });
  authentication.init_client_id(waiter);
  ms_templates.generate_refresh_templates(waiter, waiter.fall);
}


if(process.argv[1] == __filename) {
  serve(8080, function() {
    console.log('Server listning on http://localhost:8080');
  });
}

