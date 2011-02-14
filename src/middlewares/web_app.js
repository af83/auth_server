var ms_templates = require('../lib/ms_templates')
  , oauth2_client = require('oauth2-client')
  , router = require('connect').router
;

var serve_web_app = function(req, res) {
  /* Serves the web application html if user logged in.
   * If user not logged in, redirects him for logging.
   *
   */
  var user = req.session.user;
  if(!user) return oauth2_client.redirects_for_login('auth_server', res, '/');
  res.writeHead(200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('app', {
    token: req.session.token,
    email : user.email
  });
  res.end(body);
};

/**
 *  Returns auth_server web application connect middleware.
 *
 * This middleware will take care of serving the auth_server web app
 * components.
 *
 */
exports.connector = function() {
  return router(function(app) {
    app.get('/', serve_web_app);
  });
};
