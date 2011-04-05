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
    email : req.session.user.email
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
/**
 * List users
 */
function list_users(req, res) {
  model.Users.get(function(err, users) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      return res.end(err.toString());
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end("["+ users.map(function(user) {
      return user.toJSON();
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
    function addRoute(path, fun) {
      app.get(path, check_user(oauth2_client));
      app.get(path, fun);
    }
    addRoute('/', serve_web_app);
    addRoute('/clients', list_clients);
    addRoute('/users', list_users);
  });
};
