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
, 'oauth2_client_node/src'
, 'oauth2_server_node/src'
, 'node-base64'
].forEach(function(submodule) {
  require.paths.unshift(__dirname + '/../vendors/' + submodule);
});

exports.get_session_middleware = function() {
  return require('cookie-sessions');
};

var connect = require('connect')
  , connect_form = require('connect-form')

  , CLB = require('nodetk/orchestration/callbacks')
  , bserver = require('nodetk/browser/server')
  , oauth2_client = require('oauth2_client')
  , querystring = require('querystring')
  , randomString = require('nodetk/random_str').randomString  
  , rest_server = require('rest-mongo/http_rest/server')
  , web = require('nodetk/web')

  , oauth2 = require('oauth2/common')
  , oauth2_server = require('oauth2/server')
  , oauth2_resources_server = require('./oauth2/resources_server')
  , delegate = require('./middlewares/delegate')
  , config = require('./lib/config_loader').get_config()
  , registration = require('./middlewares/register')
  , web_app = require('./middlewares/web_app')
  , authentication = require('./authentication')
  , strictTransportSecurity = require('./middlewares/strict_transport_security')
                                  .strictTransportSecurity
  , account = require('./middlewares/account')
  , model = require('./model')
  , RFactory = model.RFactory
  , schema = require('./schema').schema
  , ms_templates = require('./lib/ms_templates')
  ;


var oauth2_client_options = {
  "auth_server": {
    valid_grant: function(data, code, callback, fallback) {
      // Since we are auth_server, we do not use the oauth2 api, but directly
      // request the grant checking function.
      var R = RFactory();
      oauth2_server.valid_grant(R, {
        code: code, 
        client_id: config.oauth2_client.servers[data.oauth2_server_id].client_id,
        redirect_uri: config.oauth2_client.client.redirect_uri
      }, callback, fallback)
    },
    treat_access_token: function(data, req, res, callback, fallback) {
      // Idem, since we are auth_server, directly request get_authorizations
      var info = oauth2.token_info(data.token.access_token);
      oauth2_resources_server.get_info(info.client_id, info.user_id, null, function(info) {
        if(info) {
          req.session.authorizations = info.authorizations;
          req.session.token = randomString(128); // 22 chars length
        }
        // TODO: else display msg 'can only login using auth_server for that'
        callback();
      }, fallback);
    }
  },
  "facebook.com": {
    transform_token_response: function(body) {
      // It seems Facebook does not respect OAuth2 draft 10 here, so we 
      // have to override the method.
      var data = querystring.parse(body);
      if(!data.access_token) return null;
      return data;
    },
    // To get info from access_token and send grant on the other side
    treat_access_token: function(data, req, res, callback, fallback) {
      // Here callback is not called, since we break the normal flow
      // XXX: for now, we only send grant once we have validated
      // grant sent by the other side.
      var params = {access_token: data.token.access_token};
      web.GET('https://graph.facebook.com/me', params, 
              function(status_code, headers, body) {
        if(status_code != 200)
          return oauth2_server.oauth_error(res, 'oat', 'invalid_grant');
        console.log('Info given by FB:', body);
        var info = JSON.parse(body);
        var R = RFactory();
        oauth2_server.send_grant(res, R, 'FB'+info.id, data.state, {
          provider: "facebook.com"
        , name: info.name
        });
      }, fallback);
    }
  }
};

// To serve some nodejs modules to browser:
require.paths.unshift(__dirname);
var serve_modules_connector = bserver.serve_modules_connector({
  modules: ['schema'],
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
  var sessions = exports.get_session_middleware();
  server = exports.server = connect.createServer(
    strictTransportSecurity(365 * 24 * 3600, true)
    , connect.staticProvider({root: __dirname + '/static', cache: false})
    , connect_form({keepExtensions: true})
    , sessions({secret: '123abc', session_key: 'auth_server_session'})
    , oauth2_server.connector(config.oauth2_server, RFactory, authentication)
    , oauth2_resources_server.connector()
    , oauth2_client.connector(config.oauth2_client, oauth2_client_options)
    , delegate.connector()
    , registration.connector(config.server)
    // To serve objects directly (based on schema):
    , rest_server.connector(RFactory, schema, {auth_check: auth_check, 
                                               eventEmitter: model.emitter})
    , serve_modules_connector
    , web_app.connector()
    , account.connector()
  );
};

var serve = exports.serve = function(port, callback) {
  create_server();
  var waiter = CLB.get_waiter(2, function() {
    server.listen(port, callback);
  });
  authentication.init_client_id(waiter);
  ms_templates.generate_templates(waiter, waiter.fall);
};


if(process.argv[1] == __filename) {
  serve(config.server.port, function() {
    console.log('Server listening on ' + config.server.base_url);
  });
}

