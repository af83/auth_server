var authentication = require('./authentication');
var tools = require('./tools');


exports.connector = function(config) {
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
   *
   */
  var routes = {GET: {}};
  routes.GET[config.process_login_url] = authentication.auth_process_login;
  routes.GET[config.login_url] = authentication.auth_server_login;
  routes.GET[config.logout_url] = authentication.logout;
  return tools.get_connector_from_routes(routes);
};

