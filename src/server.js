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
  this.render('app');
});

// ---------------------------------------------------------
// This is specific to auth server logic:
// A typical end-user logging in a client using auth_server
// should not have to access these urls:
gh.get(config.server.login_url, function() {
  //authentication.login(this);
  authentication.auth_server_login(this); //, '/toto');
});
gh.get(config.server.process_login_url, function() {
  this.renderText('Logged in Text server');
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

gh.get('/authorizations', function(args) {
  var params = this.params || {}
    , client_ids = (params.clients)? params.clients.split(',') : []
    , user_ids = (params.user_ids)? params.users.split(',') : []
    , contexts = (params.contexts)? params.contexts.split(',') : []
  inspect(client_ids, user_ids, contexts);
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

