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
   *
   */
  var routes = {GET: {}};
  routes.GET[config.process_login_url] = authentication.auth_process_login;
  return tools.get_connector_from_routes(routes);
};

