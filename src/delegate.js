/* Middleware taking care of the delegation process */

var URL = require('url')
  , oauth2_client = require('oauth2_client')
  , tools = require('nodetk/server_tools')
  , authentication = require('./authentication')
  , extract_client_data = authentication.extract_client_data
  , pack_data = authentication.pack_data
  ;


var delegate = function(req, res) {
  /* Delegates authentication to another provider.
   *
   */
  var params = URL.parse(req.url, true).query || {};
  if(!params.provider) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    return res.end('Missing "provider" parameter.');
  }
  // TODO: check provider exists
  var info = extract_client_data(params.info);
  console.log("before redirecting to delegation server: ",
              JSON.stringify(info));
  var redirect_uri = null; // not needed, normal flow should be intercepted
  oauth2_client.redirects_for_login(params.provider, res, redirect_uri, info);
};


exports.connector = function() {
  /* Returns auth_server web application connect middleware.
   *
   * This middleware will take care of serving the auth_server web app
   * components.
   *
   */
  var routes = {GET: {}};
  routes.GET['/login/delegate'] = delegate;
  return tools.get_connector_from_str_routes(routes);
};

