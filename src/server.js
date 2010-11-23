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
, 'cookie-sessions/lib'
, 'connect-form/lib'
, 'mustache/lib'
].forEach(function(submodule) {
  require.paths.unshift(__dirname + '/../vendors/' + submodule);
});


var connect = require('connect')
  , sessions = require('cookie-sessions')
  , connect_form = require('connect-form')

  , CLB = require('nodetk/orchestration/callbacks')
  , rest_server = require('rest-mongo/http_rest/server')  

  , config = require('./config')
  , oauth2_server = require('./oauth2/server')
  , oauth2_resources_server = require('./oauth2/resources_server')  
  , oauth2_client = require('./oauth2/client')
  , registration = require('./register')
  , web_app = require('./web_app')
  , authentication = require('./authentication')
  , RFactory = require('./model').RFactory
  , schema = require('./schema').schema
  , ms_templates = require('./lib/ms_templates')
  ;


var oauth2_client_options = {
  alternative_valid_grant: function(code, callback, fallback) {  
    // Since we are text_server, we do not use the oauth2 api, but directly
    // request the grant checking function.
    var R = RFactory();
    oauth2_server.valid_grant(R, {
      code: code, 
      client_id: config.oauth2_client.client_id
    }, callback, fallback)
  }
};


var server;
var create_server = function() {
  server = exports.server = connect.createServer(
    connect.staticProvider({root: __dirname + '/static', cache: false})
    // To serve objects directly (based on schema):
    , rest_server.connector(RFactory, schema)
    , connect_form({keepExtensions: true})
    , sessions({secret: '123abc', session_key: 'auth_server_session'})
    , oauth2_server.connector(config.oauth2_server)
    , oauth2_resources_server.connector()
    , oauth2_client.connector(config.oauth2_client, oauth2_client_options)
    , web_app.connector()
    , registration.connector(config.server)
  );
};

var serve = exports.serve = function(port, callback) {
  create_server();
  var waiter = CLB.get_waiter(2, function() {
    server.listen(port, callback);
  });
  authentication.init_client_id(waiter);
  ms_templates.generate_refresh_templates(waiter, waiter.fall);
};


if(process.argv[1] == __filename) {
  serve(8080, function() {
    console.log('Server listning on http://localhost:8080');
  });
}

