

// Add location of submodules to path:
[ 'nodetk/src'
, 'connect/lib'
, 'cookie-sessions/lib'
].forEach(function(submodule) {
  require.paths.unshift(__dirname + '/../../../vendors/' + submodule);
});


var querystring = require('querystring')

  , app = require('./app')
  , oauth2_client = require('../../oauth2/client')

  , connect = require('connect')
  , sessions = require('cookie-sessions')
  , web = require('nodetk/web')
  ;

var base_url = 'http://127.0.0.1:7070';
var config = {
  oauth2_client: {
    base_url: base_url,
    process_login_url: '/login/process/',
    redirect_uri: base_url + '/login/process/',
    login_url: '/login',
    logout_url: '/logout',
    default_redirection_url: '/',

    server_authorize_endpoint: "https://graph.facebook.com/oauth/authorize",
    server_token_endpoint: 'https://graph.facebook.com/oauth/access_token',
    // These are the client id and secret of a FB application only registered
    // for testing purpose... don't use it in prod!
    client_id: "c5c0789871d6a65e485bc78235639d36",
    client_secret: 'ccd74db270c0b5f1dad0a603d36d6f1b',
  }
};

var oauth2_client_options = {
  // To get info from access_token and set them in session
  alternative_treat_access_token: function(access_token, req, res, callback) {
    var params = {access_token: access_token};
    web.GET('https://graph.facebook.com/me', params, 
            function(status_code, headers, data) {
      console.log('Info given by FB:', data);
      var info = JSON.parse(data);
      req.session.user_name = info.name;
      callback();
    });
  }
, alternative_transform_token_response: function(body) {
    // It seems Facebook does not respect OAuth2 draft 10 here, so we 
    // have to override the method.
    var data = querystring.parse(body);
    if(!data.access_token) return null;
    return data;
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
  serve(7070, function() {
    console.log('OAuth2 client server listning on http://localhost:7070');
  });
}

