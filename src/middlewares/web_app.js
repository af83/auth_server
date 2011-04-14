var ms_templates = require('../lib/ms_templates')
  , connect = require('connect')
  , model = require('../model')
;
/**
 * Serves the web application html
 */
function index(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('app', {
    email : req.session.user.email
  });
  res.end(body);
};

/**
 * List oauth2 clients
 */
function listClients(req, res) {
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
 * Create Client
 */
function createClient(req, res) {
  var client = new model.Client(req.body);
  client.save(function(err) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      return res.end(err.toString());
    }
    res.writeHead(200);
    res.end(client.toJSON());
  });
}
/**
 * Update Client
 */
function updateClient(req, res) {
  var body = req.body;
  model.Client.getById(req.params.id, function(err, client) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      return res.end(err.toString());
    }
    if (!client) {
      res.writeHead(404);
      return res.end('');
    }
    client.set('name', body.name);
    client.set('redirect_uri', body.redirect_uri || '');
    client.set('secret', body.secret);
    client.save(function(err) {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        return res.end(err.toString());
      }
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(client.toJSON());
    });
  });
}
/**
 * Delete Client
 */
function deleteClient(req, res) {
  model.Client.getById(req.params.id, function(err, client) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      return res.end(err.toString());
    }
    if (!client) {
      res.writeHead(404);
      return res.end('');
    }
    client.remove(function(err) {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        return res.end(err.toString());
      }
      res.writeHead(204);
      res.end();
    });
  });
}
/**
 * List users
 */
function listUsers(req, res) {
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

function checkUserConnected(oauth2_client) {
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
  return connect.router(function(app) {
    function addRoute(verb, path, fun) {
      app[verb](path, checkUserConnected(oauth2_client));
      if (verb != 'get')
        app[verb](path, connect.bodyParser());
      app[verb](path, fun);
    }
    addRoute('get', '/', index);
    addRoute('get', '/clients', listClients);
    addRoute('post', '/clients', createClient);
    addRoute('put', '/clients/:id', updateClient);
    addRoute('del', '/clients/:id', deleteClient);
    addRoute('get', '/users', listUsers);
  });
};
