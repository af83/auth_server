var ms_templates = require('../lib/ms_templates')
  , router = require('connect').router
;
/**
 * Serves the web application html if user logged in.
 * If user not logged in, redirects him for logging.
 *
 */
var serve_web_app = function(oauth2_client) {
  return function(req, res) {
    var user = req.session.user;
    if(!user) return oauth2_client.redirects_for_login('auth_server', res, '/');
    res.writeHead(200, {'Content-Type': 'text/html'});
    var body = ms_templates.render('app', {
      token: req.session.token,
      email : user.email
    });
    res.end(body);
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
    app.get('/', serve_web_app(oauth2_client));
  });
};
