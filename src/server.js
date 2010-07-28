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

  , oauth2 = require('./oauth2')
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
  this.renderText('Hello on auth_server!');
});

gh.get('/oauth/authorize', oauth2.authorize);

// XXX: we might want to put a different URL
// as the POST may have the same behaviour as the GET, according to spec.
gh.post('/login', oauth2.login);

gh.post('/oauth/token', oauth2.token);

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


if(process.argv[1] == __filename)
  gh.serve(8080);

