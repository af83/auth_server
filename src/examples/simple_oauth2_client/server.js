

// Add location of submodules to path:
[ 'nodetk/src'
, 'connect/lib'
, 'cookie-sessions/lib'
].forEach(function(submodule) {
  require.paths.unshift(__dirname + '/../../../vendors/' + submodule);
});


var app = require('./app')
  , oauth2_client = require('../../oauth2/client')

  , connect = require('connect')
  , sessions = require('cookie-sessions')
  , web = require('nodetk/web')
  ;

var base_url = 'http://127.0.0.1:7070';
var config = {
  oauth2_client: {
    base_url: base_url,
    process_login_url: '/login/process',
    redirect_uri: base_url + '/login/process',
    login_url: '/login',
    logout_url: '/logout',
    default_redirection_url: '/',

    server_authorize_endpoint: 'http://localhost:8080/oauth2/authorize',
    server_token_endpoint: 'http://localhost:8080/oauth2/token',

    client_id: null, // TODO: define this before running
    client_secret: 'some secret string',
    name: 'Test client'
  }
};

var oauth2_client_options = {
  // To get info from access_token and set them in session
  alternative_treat_access_token: function(access_token, req, res, callback) {
    var params = {oauth_token: access_token};
    web.GET('http://localhost:8080/auth', params, 
    function(status_code, headers, data) {
      var info = JSON.parse(data);
      req.session.user_email = info.email;
      callback();
    });
  }
};

var server = connect.createServer(
  sessions({secret: '123abc', session_key: 'session'})
, oauth2_client.connector(config.oauth2_client, oauth2_client_options)
, app.connector()
);

var serve = function(port, callback) {
  server.listen(port, callback);
}

if(process.argv[1] == __filename) {
  if(!config.oauth2_client.client_id) {
    console.log('You must set a oauth2 client id in config (cf. README).');
    process.exit(1);
  }
  serve(7070, function() {
    console.log('OAuth2 client server listning on http://localhost:7070');
  });
}

