/* OAuth2 server entry point.
 *
 * For more info on what from the oauth2 spec is implemented,
 * see oauth2.js.
 *
 */
require.paths.unshift(__dirname + '/../vendors/grasshopper/lib/')
require.paths.unshift(__dirname + '/../vendors/eyes/lib/')
require.paths.unshift(__dirname + '/../vendors/nodetk/src')


var gh = require('grasshopper')
  , eyes = require('eyes')

  , config = require('./config')
  , oauth2 = require('./oauth2')
  , authentication = require('./authentication')
  , authorizations = require('./controllers/authorizations')
  , users = require('./controllers/users')
  , clients = require('./controllers/clients')
  , RFactory = require('./model').RFactory
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

gh.get('/', function() {
  var self = this;
  self.getSessionValue('user', function(err, user) {
    if(err) return renderError(500);
    if(!user) return authentication.auth_server_login(self, '/');
    self.render('app');
  });
});

// ---------------------------------------------------------
// This is specific to auth server logic:
// A typical end-user logging in a client using auth_server
// should not have to access these urls:
gh.get(config.server.login_url, function() {
  authentication.auth_server_login(this); //, '/toto');
});
gh.get(config.server.process_login_url, function() {
  authentication.auth_process_login(this);
});
gh.get(config.server.logout_url, function() {
  authentication.logout(this);
});
// ---------------------------------------------------------


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


if(process.argv[1] == __filename) {
  authentication.init_client_id(function() {
    gh.serve(8080);
  });
}

