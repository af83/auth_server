
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
   *  - self: grasshopper instance.
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

var auth_process_login = exports.auth_process_login = function(self) {
  /* Check the grant given by user to login in authserver is a good one.
   *
   * Arguments:
   *  - self: grasshopper instance.
   */
  var params = self.params || {}
    , R = RFactory()
    , code = params.code
    ;
  if(!code) return self.renderError(400);
  // Since we are text_server, we do not use the oauth2 api, but directly
  // request the grant checking function:
  oauth2.valid_grant(R, {code: code, client_id: SELF_CLIENT_ID}, function(token) {
    if(!token) return self.renderError(400);
    if(params.state) try {
      var next = JSON.parse(params.state).next;
      if(next) return self.redirect(next);
    } catch (e) {}
    self.renderText('Logged in Text server');
  }, function(err) {
    self.renderError(500);
  });
};


var logout = exports.logout = function(self) {
  /* Logout the eventual logged in user.
   */
  // TODO: this doesn't remove the cookie, FIXME!
  self.endSession(function() {
    self.redirect('/');
  });
};

// -------------------------------------------------------------


var login = exports.login = function(self, client_data) {
  /* Renders the login page.
   * If user is already logged in, ask him if he wants to login in
   * the client application.
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
  var params = self.params || {}
    , R = RFactory()
    ;
  client_data_attrs.forEach(function(attr) {
    // XXX: should we encore all the state in a more secure way?
    // XXX: we whould be very prudent not to permit any code injection here.
    var val = client_data[attr];
    if(val) self.model[attr] = val.replace(/"/gmi, '&quot;');
    else self.model[attr] = "";
  });
  self.model.signature = sign_data(client_data);
  self.model.server_name = config.auth_server.name;
  self.getSessionValue('user', function(err, user) {
    if(err) return self.renderError(500);
    if(user) { // The user is already logged in
      // TODO: for a client first time, ask the user
      oauth2.send_grant(self, R, user.id, client_data);
    }
    else { // The user is not logged in
      self.model.action = config.oauth2.process_login_url;
      self.render('oauth_login');
    }
  });
};

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

    // The user is logged in, let's remember:
    self.setSessionValue('user', {email: user.email, id: user.id}, function() {
      oauth2.send_grant(self, R, user.id, client_data);
    });
  }, function(err) {
    unknown_error(self, err);
  });
};

