var oauth2 = require('oauth2-server')
  , RFactory = require('../model').RFactory
  , router = require('connect').router
  , url = require('url')
  , portable_contacts = require('../lib/portable_contacts')
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
var get_user_portable_contact = function(req, res) {
  var query = url.parse(req.url, true).query || {};
  oauth2.check_token(req, res, function(token_info) {
    var user_id = token_info.user_id
      , client_id = token_info.client_id
      ;
    var R = RFactory();
    R.User.get({ids: user_id}, function(user) {
      if(!user) { // The user doesn't exist anymore.
        res.writeHead(404);
        res.end('this user doen\'t exist');
        return null;
      }
      var result = { startIndex: 0
                     , itemsPerPage: 1
                     , totalResults: 1
                     , entry: [user.toPortableContact()]
                   };
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(result));
    });
  });
};

/**
 * Returns OAuth2 resources server connect middleware.
 */
exports.connector = function() {
  return router(function(app) {
    app.get('/portable_contacts/@me/@all/:id', function(req, res) {});
    app.get('/portable_contacts/@me/@all', function(req, res) {});
    app.get('/portable_contacts/@me/@self', get_user_portable_contact);
  });
};
