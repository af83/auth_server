var ms_templates = require('./lib/ms_templates');
var oauth2_client = require('oauth2_client');
var tools = require('nodetk/server_tools');


var serve_web_app = function(req, res) {
  /* Serves the web application html if user logged in.
   * If user not logged in, redirects him for logging.
   *
   */
  var user = req.session.user;
  if(!user) return oauth2_client.redirects_for_login(res, '/');
  res.writeHead(200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('app', {
    token: req.session.token
  });
  res.end(body);
};


exports.connector = function() {
  /* Returns auth_server web application connect middleware.
   *
   * This middleware will take care of serving the auth_server web app
   * components.
   *
   */
  var routes = {GET: {}};
  routes.GET['/'] = serve_web_app;
  return tools.get_connector_from_str_routes(routes);
};
