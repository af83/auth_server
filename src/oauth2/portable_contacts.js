var oauth2 = require('oauth2-server')
  , RFactory = require('../model').RFactory
  , router = require('connect').router
  , url = require('url')
  ;

/**
 * Returns basic information about a user
 * for the client (user_id and client_id in given oauth_token).
 *
 * This is kind of specific to auth_server API.
 *
 * TODO: The reply needs some work to be compliant.
 * (have to include token in reply headers?)
 * cf. http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-5.2
 *
 */
function get_current_user_portable_contact(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(formatPortableContact(req.user));
};

function get_one_portable_contact(req, res) {
  var id = req.params.id;
  var R = RFactory();
  R.Contact.get({ids: id}, function(contact) {
    if (contact.user.id == req.user.id) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(formatPortableContact(contact));
    } else {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end();
    }
  }, function(err) {
    console.error(err);
    res.writeHead(500);
    res.end();
  });
}

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
  mongoquery['user.id'] = req.user.id;
  var R = RFactory();
  R.Contact.index({query: mongoquery}, function(contacts) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(formatPortableContacts(contacts));
  }, function(err) {
    console.error(err);
    res.writeHead(500);
    res.end();
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

function create_contact(req, res) {
  var R = RFactory();
  var body = req.body;
  body.user = req.user;
  var contact = new R.Contact(body);
  contact.save(function() {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(formatPortableContact(contact));
  }, function() {
    res.writeHead(500);
    res.end();
  });
}

/**
 * Check oauth2 token
 * Return 404 if user doesn't exist
 */
function check_token(req, res, next) {
  oauth2.check_token(req, res, function(token_info) {
    var user_id = token_info.user_id
    , client_id = token_info.client_id
    ;
    var R = RFactory();
    R.User.get({ids: user_id}, function(user) {
      if(!user) { // The user doesn't exist anymore.
        res.writeHead(404);
        res.send();
      } else {
        req.user_id = user_id;
        req.client_id = client_id;
        req.user = user;
        next();
      }
    }, function(err) {
      res.writeHead(500);
      res.send();
      console.error(err);
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
  });
};
