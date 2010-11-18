var URL = require('url');

var web = require('nodetk/web');
var authentication = require('./authentication');
var tools = require('./tools');

// OAuth2 client config.
var config;


var valid_grant = function(code, callback, fallback) {
  /* Valid the grant given by user requesting the OAuth2 server 
   * at OAuth2 token endpoint.
   *
   * Arguments:
   *    - code: the authorization code given by OAuth2 server to user.
   *    - callback: function to be called once grant is validated/rejected.
   *      Called with the access_token returned by OAuth2 server as first
   *      parameter. If given token might be null, meaning it was rejected
   *      by OAuth2 server.
   *    - fallback: function to be called in case of error, with err argument.
   *
   */
  web.POST(config.server_token_endpoint, {
    grant_type: "authorization_code",
    client_id: config.client_id,
    code: code,
    client_secret: config.client_secret,
    redirect_uri: config.redirect_uri
  }, function(statusCode, headers, data) {
    if(statusCode == 200) {
      try {
        var token = JSON.parse(data);
        callback(token);
      } catch(err) {
        fallback(err);
      }
    }
    else callback(null);
    // TODO: check if error code indicates problem on the client,
    // and if so, calls fallback(err) instead of callback(null).
  });
};


var auth_process_login = exports.auth_process_login = function(req, res) {
  /* Check the grant given by user to login in authserver is a good one.
   *
   * Arguments:
   *  - req
   *  - res
   */
  var params = URL.parse(req.url, true).query || {}
    , code = params.code
    ;

  if(!code) {
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end('The "code" parameter is missing.');
    return;
  }
  valid_grant(code, function(token) {
    if(!token) {
      res.writeHead(400, {'Content-Type': 'text/html'});
      res.end('Invalid grant.');
      return;
    }
    if(params.state) try {
      var next = JSON.parse(params.state).next;
      if(next) return tools.redirect(res, next);
    } catch (e) {
      return tools.server_error(res, e);
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('Logged in Text server');
  }, function(err){tools.server_error(res, err)});
};


exports.connector = function(conf, alternative_valid_grant) {
  /* Returns OAuth2 client connect middleware.
   *
   * This middleware will intercep requests aiming at OAuth2 client
   * and treat them.
   *
   * Arguments:
   *  - config: hash containing:
   *    - process_login_url: the URL where to the OAuth2 server must redirect
   *      the user when authenticated.
   *    - login_url: the URL where the user must go to be redirected
   *      to OAuth2 server for authentication.
   *    - logout_url: the URL where the user must go so that his session is
   *      cleared, and he is unlogged from client.
   *    - server_token_endpoint: full URL, OAuth2 server token endpoint.
   *
   *  - alternative_valid_grant: a function which will replace the default one
   *    to check the grant is ok. You might want to use this shortcut if you
   *    have a faster way of checking than requesting the OAuth2 server
   *    with an HTTP request.
   *
   */
  config = conf;
  if(alternative_valid_grant) valid_grant = alternative_valid_grant;

  var routes = {GET: {}};
  routes.GET[conf.process_login_url] = auth_process_login;
  routes.GET[conf.login_url] = authentication.auth_server_login;
  routes.GET[conf.logout_url] = authentication.logout;
  return tools.get_connector_from_routes(routes);
};

