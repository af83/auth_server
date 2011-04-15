var oauth2 = require('oauth2-server')
  , router = require('connect').router
  , url = require('url')
;

var model = require('../model')
;

/**
 * Returns basic information about a user
 * for the client (user_id and client_id in given oauth_token).
 */
function get_current_user_portable_contact(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(formatPortableContact(req.user));
};

/**
 * Return one contact formatted with portablecontacts
 */
function get_one_portable_contact(req, res) {
  var id = req.params.id;
  model.Contact.getById(id, function(err, contact) {
    if (err) {
      console.error(err);
      res.writeHead(500);
      res.end();
    }
    if (contact.get('user') == req.user.get('id')) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(formatPortableContact(contact));
    } else {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end();
    }
  });
}

/**
 * Return a list of all or filtered portable contacts for the client
 */
function get_filter_portable_contacts(req, res) {
  var query = url.parse(req.url, true).query;
  var mongoquery = {};
  if (query.filterBy && query.filterValue) {
    if (query.filterOp == 'equals') {
      mongoquery[query.filterBy] = query.filterValue;
    } else {
      res.writeHead(503, {'Content-Type': 'application/json'});
      res.end();
      return;
    }
  }
  mongoquery['user'] = req.user.get('id');
  model.Contacts.search(mongoquery, function(err, contacts) {
    if (err) {
      console.error(err);
      res.writeHead(500);
      return res.end();
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(formatPortableContacts(contacts));
  });
}

function formatPortableContact(contact) {
  var result = { startIndex: 0
               , itemsPerPage: 1
               , totalResults: 1
               , entry: contact.toPortableContact()
               };
  return JSON.stringify(result);
}

function formatPortableContacts(contacts) {
  var result = { startIndex: 0
               , itemsPerPage: contacts.length
               , totalResults: contacts.length
               , entry: contacts.map(function(contact) {
                 return contact.toPortableContact();
               })
               };
  return JSON.stringify(result);
}

/**
 * Create a contact for the client
 */
function create_contact(req, res) {
  var body = req.body;
  body.user = req.user.get('id');
  var contact = new model.Contact(body);
  contact.save(function(err) {
    if (err) {
      res.writeHead(500);
      res.end();
      return console.error(err);
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(formatPortableContact(contact));
  });
}

/**
 * Update one contact
 */
function update_contact(req, res) {
  var id = req.params.id;
  model.Contact.getById(id, function(err, contact) {
    if (err) {
      console.error(err);
      res.writeHead(500);
      return res.end();
    }
    if (contact.get('user') == req.user.get('id')) {
      var body = req.body;
      body.user = req.user.get('id');
      contact.set(body);
      contact.save(function(err) {
        if (err) {
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(formatPortableContact(contact));
      });
    } else {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end();
    }
  });
}
/**
 * Delete on contact
 */
function delete_contact(req, res) {
  var id = req.params.id;
  model.Contact.getById(id, function(err, contact) {
    if (err) {
      console.error(err);
      res.writeHead(500);
      return res.end();
    }
    if (contact.get('user') == req.user.get('id')) {
      contact.remove(function(err) {
        if (err) {
          res.writeHead(500);
          res.end();
          return console.error(err);
        }
        res.writeHead(204);
        res.end();
      });
    } else {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end();
    }
  });
}
/**
 * Check oauth2 token
 * Return 404 if user doesn't exist
 *
 * TODO: The reply needs some work to be compliant.
 * (have to include token in reply headers?)
 * cf. http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-5.2
 */
function check_token(req, res, next) {
  oauth2.check_token(req, res, function(token_info) {
    var user_id = token_info.user_id
    , client_id = token_info.client_id
    ;
    model.User.getById(user_id, function(err, user) {
      if (err) {
        res.writeHead(500);
        res.send();
        return console.error(err);
      }
      if (!user) { // The user doesn't exist anymore.
        res.writeHead(404);
        res.send();
      } else {
        req.user_id = user_id;
        req.client_id = client_id;
        req.user = user;
        next();
      }
    });
  });
};

/**
 * Returns OAuth2 resources server connect middleware.
 */
exports.connector = function() {
  function create_route(app, verb, path, callback) {
    app[verb](path, check_token);
    app[verb](path, callback);
  }
  return router(function(app) {
    create_route(app, 'get','/portable_contacts/@me/@self', get_current_user_portable_contact);
    create_route(app, 'get', '/portable_contacts/@me/@all/:id', get_one_portable_contact);
    create_route(app, 'get', '/portable_contacts/@me/@all', get_filter_portable_contacts);
    var connect = require('connect');
    app.post('/portable_contacts/@me/@all', connect.bodyParser());
    create_route(app, 'post', '/portable_contacts/@me/@all', create_contact);
    app.put('/portable_contacts/@me/@all/:id', connect.bodyParser());
    create_route(app, 'put', '/portable_contacts/@me/@all/:id', update_contact);
    create_route(app, 'del', '/portable_contacts/@me/@all/:id', delete_contact);
  });
};
