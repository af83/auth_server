/* OAuth2 server entry point.
 *
 * For more info on what from the oauth2 spec is implemented,
 * see oauth2.js.
 *
 */

// Add location of submodules to path:
require.paths.unshift(__dirname + '/../vendors/');

exports.get_session_middleware = function() {
  return require('cookie-sessions');
};

var connect = require('connect')
  , connect_form = require('connect-form')
  , CLB = require('nodetk/orchestration/callbacks')
  , bserver = require('nodetk/browser/server')
  , oauth2_client = require('oauth2-client')
  , querystring = require('querystring')
  , randomString = require('nodetk/random_str').randomString
  , web = require('nodetk/web')

  , oauth2_server = require('oauth2-server')
  , portable_contacts_server = require('./oauth2/portable_contacts')
  , delegate = require('./middlewares/delegate')
  , config = require('./lib/config_loader').get_config()
  , registration = require('./middlewares/register')
  , web_app = require('./middlewares/web_app')
  , authentication = require('./authentication')
  , strictTransportSecurity = require('connect-sts')
  , account = require('./middlewares/account')
  , model = require('./model')
  , ms_templates = require('./lib/ms_templates')
  ;

var oauth2_client_options = {
  "auth_server": {
    valid_grant: function(data, code, callback) {
      // Since we are auth_server, we do not use the oauth2 api, but directly
      // request the grant checking function.
      oauth2_server.valid_grant(model.Grant, {
        code: code,
        client_id: config.oauth2_client.servers[data.oauth2_server_id].client_id,
        redirect_uri: config.oauth2_client.client.redirect_uri
      }, callback)
    },
    treat_access_token: function(data, req, res, callback) {
      // Idem, since we are auth_server, directly request get_authorizations
      var info = oauth2_server.token_info(data.token.access_token);
      req.session.authorizations = {'auth_server': 'admin'};
      req.session.token = randomString(128); // 22 chars length
      callback();
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
        oauth2_server.send_grant(res, model.Grant, 'FB'+info.id, data.state, {
          provider: "facebook.com"
        , name: info.name
        });
      }, fallback);
    }
  }
};

var client = oauth2_client.createClient(config.oauth2_client, oauth2_client_options);

var server;
var create_server = function() {
  var sessions = exports.get_session_middleware();
  server = exports.server = connect.createServer(
    strictTransportSecurity(365 * 24 * 3600, true)
    , connect.static(__dirname + '/static')
    , connect_form({keepExtensions: true})
    , sessions({secret: '123abc', session_key: 'auth_server_session'})
    , function(req, res, next) {
      if (req.session === undefined) {
        req.session = {};
      }
      next();
    }
    , oauth2_server.connector(config.oauth2_server, model, authentication)
    , portable_contacts_server.connector()
    , client.connector()
    , delegate.connector(client)
    , registration.connector(config.server)
    , web_app.connector(client)
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
