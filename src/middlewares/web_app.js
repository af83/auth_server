var ms_templates = require('../lib/ms_templates')
  , router = require('connect').router
  , model = require('../model')
;
/**
 * Serves the web application html if user logged in.
 * If user not logged in, redirects him for logging.
 *
 */
var serve_web_app = function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('app', {
    email : req.session.email
  });
  res.end(body);
};

/**
 * List oauth2 clients
 */
function list_clients(req, res) {
  model.Clients.get(function(err, clients) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      return res.end(err.toString());
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end("["+ clients.map(function(client) {
      return client.toJSON();
    })+"]");
  });
}

function check_user(oauth2_client) {
  return function(req, res, next) {
    if(!req.session.user)
      return oauth2_client.redirects_for_login('auth_server', res, '/');
    next();
  }
}

/**
 *  Returns auth_server web application connect middleware.
 *
 * This middleware will take care of serving the auth_server web app
 * components.
 *
 */
exports.connector = function(oauth2_client) {
  return router(function(app) {
    app.get('/', check_user(oauth2_client));
    app.get('/clients', check_user(oauth2_client));
    app.get('/', serve_web_app);
    app.get('/clients', list_clients);
  });
};
