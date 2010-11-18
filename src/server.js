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
  , oauth2_client = require('./oauth2_client')
  , authentication = require('./authentication')
  , authorizations = require('./controllers/authorizations')
  , users = require('./controllers/users')
  , clients = require('./controllers/clients')
  , RFactory = require('./model').RFactory
  , schema = require('./schema').schema
  , ms_templates = require('./lib/ms_templates')

  , app_model = {} // containing data to render app '/'
  ;


var inspect = eyes.inspector({
  maxLength: null
});


// ---------------------------------------------------------

var dispatcher = {

  // Serve the JS web application:
  '/': function(req, res, next) {
    if(req.method != 'GET') return next();
    var user = req.session.user;
    if(!user && config.server.skip_auth_app) {
      user = req.session = {user: {id: 1, email: 'admin@authserver'}};
    }
    if(!user) {
      return authentication.auth_server_login(req, res, '/');
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    var body = ms_templates.render('app');
    res.end(body);
  }
};


// ---------------------------------------------------------
// Auth server specific API (resource server):

dispatcher['/auth'] = function(req, res, next) {
  /* Returns basic information about a user + its authorizations (roles)
   * for the client (user_id and client_id in given oauth_token).
   *
   * TODO: The reply need some work to be compliant.
   * cf. http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-5.2
   *
   */
  if(req.method != 'GET') return next();
  var params = URL.parse(req.url, true).query
    , oauth_token = params.oauth_token
    ;
  if(req.headers.authorization) {
    // XXX: support for getting oauth_token from header might not be complete
    // http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-5.1.1
    var match = req.headers.authorization.match(/OAuth\s+(.*)/);
    if(match) {
      if(oauth_token) {
        res.writeHead(400, {'Content-Type': 'text/html'});
        res.end('oauth_token can only be given using one method.');
        return;
      }
      oauth_token = match[1];
    }
  }
  var token_info = oauth2.token_info(oauth_token);
  if(!token_info) {
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end('Invalid oauth_token.');
    return;
  }
  var R = RFactory()
    , user_id = token_info.user_id
    , client_id = token_info.client_id
    , info = {id: user_id, authorizations: {}}
    ;
  R.User.get({ids: user_id}, function(user) {
    if(!user) { // The user doesn't exist anymore.
      res.writeHead('404', {});
      res.end();
      return;
    }
    info.email = user.email;
    R.Authorization.index({query: {
      'client.id': client_id,
      'email': user.email
    }}, function(authorizations) {
      authorizations.forEach(function(auth) {
        info.authorizations[auth.context] = auth.roles;
      });
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(JSON.stringify(info));
    }, function() {res.writeHead(500, {}); res.end()});
  }, function() {res.writeHead(500, {}); res.end()});
};


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
  , oauth2_client.connector(config.oauth2_client)
  , dispatch(dispatcher)
  );

var serve = exports.serve = function(port, callback) {
  var waiter = CLB.get_waiter(2, function() {
    server.listen(port, callback);
  });
  authentication.init_client_id(waiter);
  ms_templates.generate_refresh_templates(app_model, waiter, waiter.fall);
}


if(process.argv[1] == __filename) {
  serve(8080, function() {
    console.log('Server listning on http://localhost:8080');
  });
}

