/* Middleware taking care of the delegation process */

var URL = require('url')
  , authentication = require('../authentication')
  , extract_client_data = authentication.extract_client_data
  , router = require('connect').router
  ;

/**
 * Delegates authentication to another provider.
 */
var delegate = function(oauth2_client) {
  return function(req, res) {
    var params = URL.parse(req.url, true).query;
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
};

/**
 *  Returns auth_server web application connect middleware.
 *
 * This middleware will take care of serving the auth_server web app
 * components.
 *
 */
exports.connector = function(oauth2_client) {
  return router(function(app) {
    app.get('/login/delegate', delegate(oauth2_client));
  });
};
