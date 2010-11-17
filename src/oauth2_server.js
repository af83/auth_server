var oauth2 = require('./oauth2');
var authentication = require('./authentication');
var tools = require('./tools');


exports.connector = function(config) {
  /* Returns Oauth2 server connect middleware.
   *
   * This middleware will intercept requests aiming at OAuth2 server
   * and treat them.
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
  var routes = {GET: {}, POST: {}};
  routes.GET[config.authorize_url] = 
    routes.POST[config.authorize_url] = oauth2.authorize;
  routes.POST[config.process_login_url] = authentication.process_login;
  routes.POST[config.token_url] = oauth2.token;
  return tools.get_connector_from_routes(routes);
};

