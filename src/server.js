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
, 'node-mail/lib'
].forEach(function(submodule) {
  require.paths.unshift(__dirname + '/../vendors/' + submodule);
});


var connect = require('connect')
  , sessions = require('cookie-sessions')
  , connect_form = require('connect-form')

  , CLB = require('nodetk/orchestration/callbacks')
  , bserver = require('nodetk/browser/server')
  , rest_server = require('rest-mongo/http_rest/server')  

  , config = require('./config')
  , oauth2 = require('./oauth2/common')
  , oauth2_server = require('./oauth2/server')
  , oauth2_resources_server = require('./oauth2/resources_server')  
  , oauth2_client = require('./oauth2/client')
  , registration = require('./register')
  , web_app = require('./web_app')
  , authentication = require('./authentication')
  , RFactory = require('./model').RFactory
  , schema = require('./schema').schema
  , ms_templates = require('./lib/ms_templates')
  , randomString = require('./random_str').randomString
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
  },
  alternative_treat_access_token: function(access_token, req, res, callback, fallback) {
    // Idem, since we are text_server, directly request get_authorizations
    var info = oauth2.token_info(access_token);
    oauth2_resources_server.get_info(info.client_id, info.user_id, function(info) {
      req.session.authorizations = info.authorizations;
      req.session.token = randomString(128); // 22 chars length
      callback();
    }, fallback);
  }
};

// To serve some nodejs modules to browser:
require.paths.unshift(__dirname);
var serve_modules_connector = bserver.serve_modules_connector({
  modules: ['util', 'schema'],
  packages: ['nodetk', 'rest-mongo', 'browser']
});

// To check the user can access resources served by rest-mongo:
var auth_check = function(req, res, next, info) {
  var session = req.session || {}
    , user = session.user
    , auths = session.authorizations || {}
    , roles = auths[config.oauth2_client.name]
    , token = info.data.token
    , expected_token = session.token
    ;
  if(!user) {
    res.writeHead(401, {}); res.end();
  }
  else if(!expected_token || token != expected_token) {
    res.writeHead(400, {}); res.end();
  }
  // For now, only accept users admin on auth_server:
  else if(!roles || roles.indexOf('admin')<0) {
    res.writeHead(403, {}); res.end();
  }
  else {
    delete info.data.token;    
    next();
  }
};

var server;
var create_server = function() {
  server = exports.server = connect.createServer(
    connect.staticProvider({root: __dirname + '/static', cache: false})
    , connect_form({keepExtensions: true})
    , sessions({secret: '123abc', session_key: 'auth_server_session'})
    , oauth2_server.connector(config.oauth2_server)
    , oauth2_resources_server.connector()
    , oauth2_client.connector(config.oauth2_client, oauth2_client_options)
    , registration.connector(config.server)
    // To serve objects directly (based on schema):
    , rest_server.connector(RFactory, schema, auth_check)
    , serve_modules_connector
    , web_app.connector()
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
  serve(config.server.port, function() {
    console.log('Server listning on ' + config.server.base_url);
  });
}

