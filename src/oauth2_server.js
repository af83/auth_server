var URL = require('url');

var oauth2 = require('./oauth2');
var authentication = require('./authentication');


exports.connector = function(config) {
  /* Returns Oauth2 server connect middleware.
   *
   * Arguments:
   *  - config, hash containing:
   *    - authorize_url: end-user authorization endpoint,
   *      the URL the end-user must be redirected to to be served the 
   *      authentication form.
   *    - process_login_url: the url the authentication form will POST to.
   *    - token_url: OAuth2 token endpoint,
   *      the URL the client will use to check the authorization_code given by
   *      user and get a token.
   *
   */
  var dispatcher = {GET: {}, POST: {}};
  dispatcher.GET[config.authorize_url] = 
    dispatcher.POST[config.authorize_url] = oauth2.authorize;
  dispatcher.POST[config.process_login_url] = authentication.process_login;
  dispatcher.POST[config.token_url] = oauth2.token;
  return function(req, res, next) {
    var url = URL.parse(req.url);
    var method = dispatcher[req.method][url.pathname];
    if(method) method(req, res);
    else next();
  }
};

