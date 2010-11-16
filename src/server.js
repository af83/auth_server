/* OAuth2 server entry point.
 *
 * For more info on what from the oauth2 spec is implemented,
 * see oauth2.js.
 *
 */
require.paths.unshift(__dirname + '/../vendors/node-formidable/lib/')
require.paths.unshift(__dirname + '/../vendors/grasshopper/grasshopper/lib/')
require.paths.unshift(__dirname + '/../vendors/eyes/lib/')
require.paths.unshift(__dirname + '/../vendors/nodetk/src')

require.paths.unshift(__dirname + '/../vendors/connect/lib')
require.paths.unshift(__dirname + '/../vendors/dispatch/lib')
require.paths.unshift(__dirname + '/../vendors/cookie-sessions/lib')
require.paths.unshift(__dirname + '/../vendors/mustache/lib')

var gh = require('grasshopper')
  , connect = require('connect')
  , sessions = require('cookie-sessions')
  , dispatch = require('dispatch')
  , eyes = require('eyes')

  , CLB = require('nodetk/orchestration/callbacks')

  , config = require('./config')
  , oauth2 = require('./oauth2')
  , authentication = require('./authentication')
  , authorizations = require('./controllers/authorizations')
  , users = require('./controllers/users')
  , clients = require('./controllers/clients')
  , RFactory = require('./model').RFactory
  , ms_templates = require('./lib/ms_templates')

  , app_model = {} // containing data to render app '/'
  ;


exports.server = gh;
gh.configure({
  viewsDir: __dirname + '/views',
  staticsDir: __dirname + "/static"
});
 

var inspect = eyes.inspector({
  maxLength: null
});


// ---------------------------------------------------------

var dispatcher = dispatch({

  '/': function(req, res, next) {
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

  // ---------------------------------------------------------
  // This is specific to auth server logic:
  // A typical end-user logging in a client using auth_server
  // should not have to access these urls:
, config.server.login_url: function(req, res, next) {
    authentication.auth_server_login(res, res); //, '/toto');
  }
, config.server.process_login_url: function(req, res, next) {
    authentication.auth_process_login(req, res);
  }
, config.server.logout_url: function(req, res, next) {
    authentication.logout(req, res);
  }
  // ---------------------------------------------------------


});


// ---------------------------------------------------------
// This is specific to the oauth2 implementation:

// The end-user access these:
gh.get(config.oauth2.authorize_url, oauth2.authorize);
gh.post(config.oauth2.authorize_url, oauth2.authorize);

gh.post(config.oauth2.process_login_url, function() {
  authentication.process_login(this);
});

// The client access these:
gh.post(config.oauth2.token_url, oauth2.token);



// ---------------------------------------------------------
// Auth server specific API:

gh.get('/auth', function(args) {
  /* Returns basic information about a user + its authorizations (roles)
   * for the client (user_id and client_id in given oauth_token).
   */
  var self = this
    , params = self.params || {}
    // TODO: support getting the token from headers
    , token_info = oauth2.token_info(params.oauth_token)
    ;
  if(!token_info) return self.renderError(400);
  var R = RFactory()
    , user_id = token_info.user_id
    , client_id = token_info.client_id
    , info = {id: user_id, authorizations: {}}
    ;
  R.User.get({ids: user_id}, function(user) {
    if(!user) return self.renderError(404); // The user doesn't exist anymore.
    info.email = user.email;
    R.Authorization.index({query: {
      'client.id': client_id,
      'email': user.email
    }}, function(authorizations) {
      authorizations.forEach(function(auth) {
        info.authorizations[auth.context] = auth.roles;
      });
      self.renderText(JSON.stringify(info));
    }, function() {self.renderError(500)});
  }, function() {self.renderError(500)});
});


// ---------------------------------------------------------
// Only for auth_server GUI:

gh.get('/authorizations', function(args) {
  var params = this.params || {}
    , client_ids = (params.clients)? params.clients.split(',') : []
    , user_ids = (params.user_ids)? params.users.split(',') : []
    , contexts = (params.contexts)? params.contexts.split(',') : []
  authorizations.get_authorizations(this, client_ids, user_ids, contexts);
});

gh.get('/clients/{client_id}/contexts', clients.get_client_contexts);

gh.get('/users', users.get_users);
gh.get('/clients', clients.get_clients);
gh.get('/clients/{client_id}', clients.get_client);
gh.post('/clients/{client_id}', clients.update_client);

gh.get('/users/{user_id}/profile', function(user_id) {
  /* To get the profile information of the user.
   */
});


var serve = function() {
  server = connect.createServer(
    connect.staticProvider({root: __dirname + '/static', cache: false})
  , sessions({secret: '123abc', session_key: 'auth_server_session'})
  , dispatcher
  );
  server.listen(8080)
  console.log('Server listning on http://localhost:8080')
}


if(process.argv[1] == __filename) {
  var waiter = CLB.get_waiter(2, function() {
    //gh.serve(8080);
    serve();
  });
  authentication.init_client_id(waiter);
  ms_templates.generate_refresh_templates(app_model, waiter, waiter.fall);
}

