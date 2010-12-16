var URL = require('url');

var oauth2 = require('oauth2/common')
  , RFactory = require('../model').RFactory
  , tools = require('nodetk/server_tools')
  ;


var get_info = exports.get_info = function(client_id, user_id, callback, fallback) {
  /* Get email and authorizations for a client and a user.
   *
   * Arguments:
   *  - client_id: id of the client you want the authorizations for.
   *  - user_id: id of the user. Authorizations will be about this user
   *    on given client.
   *  - callback: to be called with info as first arguments.
   *    info = {email: 'toto@titi.com', authorization: {...}}
   *    Authorizations is a hash such as: {context: [role1, role2,...]}.
   *    If info is null, then the user doesn't exist.
   *  - fallback: to be called with error as first argument in case of problem.
   *
   */
  var R = RFactory();
  var info = {authorizations: {}};
  R.User.get({ids: user_id}, function(user) {
    if(!user) { // The user doesn't exist anymore.
      return callback(null);
    }
    info.email = user.email;
    R.Authorization.index({query: {
      'client.id': client_id,
      'email': user.email
    }}, function(authorizations) {
      authorizations.forEach(function(auth) {
        info.authorizations[auth.context] = auth.roles;
      });
      callback(info);
    }, fallback);
  }, fallback);
};


var get_auths = function(req, res) {
  /* Returns basic information about a user + its authorizations (roles)
   * for the client (user_id and client_id in given oauth_token).
   *
   * This is kind of specific to auth_server API.
   *
   * TODO: The reply needs some work to be compliant.
   * (have to include token in reply headers?)
   * cf. http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-5.2
   *
   */
  oauth2.check_token(req, res, function(token_info) {
    var user_id = token_info.user_id
      , client_id = token_info.client_id
      , info = {id: user_id, authorizations: {}}
      ;
    get_info(client_id, user_id, function(info_) {
      if(info_ == null) {
        res.writeHead('404', {}); res.end();
        return;
      }
      info.email = info_.email;
      info.authorizations = info_.authorizations;
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(JSON.stringify(info));
    }, function(err) {tools.server_error(res, err)});
  });
};


exports.connector = function() {
  /* Returns OAuth2 resources server connect middleware.
   *
   */
  var routes = {GET: {}};
  routes.GET['/auth'] = get_auths;
  return tools.get_connector_from_str_routes(routes);
};

