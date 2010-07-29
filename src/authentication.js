
var querystring = require('querystring')

  , oauth2 = require('./oauth2')
  , RFactory = require('./model').RFactory
  , config = require('./config')
  , SELF_CLIENT_ID = config.auth_server.client_id
  ;


exports.init_client_id = function(callback) {
  /* Lookup in DB and set config.auth_server.client_id 
   *
   * Arguments:
   *  - callback: to be called once it's done.
   *
   */
  var R = RFactory()
    , name = config.auth_server.name;
  R.Client.index({query: {name: name}}, function(clients) {
    if(clients.length != 1) throw new Error('There must only be one ' + name);
    SELF_CLIENT_ID = clients[0].id;
    callback();
  });
};


var client_data_attrs = ['client_name', 'client_id', 'redirect_uri', 'state'];


exports.auth_server_login = function(self, next) {
  /* Redirects the user to auth_server page it can login to auth_server using
   * auth_server.
   *
   * Arguments:
   *  - next: an url to redirect to once the process is complete.
   */
  var data = {
    client_id: SELF_CLIENT_ID,
    redirect_uri: config.auth_server.redirect_uri,
    response_type: 'code'
  };
  if(next) data.state = JSON.stringify({next: next});
  var url = config.server.base_url + config.oauth2.authorize_url + '?' +
            querystring.stringify(data);
  self.redirect(url);
};

var login = exports.login = function(self, client_data) {
  /* Renders the login page.
   *
   * Arguments:
   *  - self: grasshoper instance.
   *  - client_data, contains:
   *    - client_id
   *    - client_name
   *    - redirect_uri
   *    - state
   *
   */
  var params = self.params || {};
  client_data_attrs.forEach(function(attr) {
    self.model[attr] = client_data[attr];
  });
  self.model.signature = sign_data(client_data);
  self.model.action = config.oauth2.process_login_url;
  self.model.server_name = config.auth_server.name;
  self.render('oauth_login');
}

var sign_data = function(data) {
  /* Returns signature corresponding to the data
   */
  // TODO
  return "Big signature";
};

var extract_client_data = function(self) {
  /* Returns client_data contained in the request, or null if data corrupted.
   */
  var data = {}
    , params = self.params || {}
    , signature = params.signature
    ;
  if(!signature) return null;
  client_data_attrs.forEach(function(attr) {
    data[attr] = params[attr];
  });
  // TODO: check signature against data
  return data;
}

var fail_login = function(self, client_data) {
  /* Reask the user to login.
   */
  // TODO: msg to tell the login / password are wrong.
  self.status = 401;
  login(self, client_data);
}

exports.process_login = function(self) {
  /* Handles the login credentials given by client.
   * If not authorized, then rerender the login page.
   * If authorized, send the user back to client or the page it came from (or "/").
   *
   * Arguments:
   *  - self: grasshoper instance.
   *
   */
  var params = self.params || {}
    , R = RFactory()
    , client_data = extract_client_data(self)
    ;
  if(!params.email || !params.password)
    return fail_login(self, client_data);

  R.User.index({query: {email: params.email}}, function(users) {
    if(users.length != 1) return fail_login(self, client_data);
    var user = users[0];
    
    // TODO: crypt the password
    if(user.password != params.password) return fail_login(self, client_data);

    if(client_data) return oauth2.send_grant(self, R, user, client_data);
    var base_url = 'http://';
    // TODO: absolute URL for redirect!
    self.redirect(self.params.next || '/');
  }, function(err) {
    unknown_error(self, err);
  });
};

