var ms_templates = require('./lib/ms_templates');
var authentication = require('./authentication');
var tools = require('./tools');


var serve_web_app = function(req, res) {
  /* Serves the web application html if user logged in.
   * If user not logged in, redirects him for logging.
   *
   */
  var user = req.session.user;
  if(!user) {
    return authentication.auth_server_login(req, res, '/');
  }
  res.writeHead(200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('app');
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
  return tools.get_connector_from_routes(routes);
};
