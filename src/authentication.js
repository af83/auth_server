
var oauth2 = require('./oauth2')
  , RFactory = require('./model').RFactory
  ;


var client_data_attrs = ['client_name', 'client_id', 'redirect_uri', 'state'];


var login = exports.login = function(self, client_data) {
  /* Renders the login page.
   *
   * Arguments:
   *  - self: grasshoper instance.
   *  - client_data: if null, the user has not be sent here by a oauth2 client.
   *    If not null, contains following data:
   *      - client_id
   *      - client_name
   *      - redirect_uri
   *      - state
   *
   */
  var params = self.params || {};
  if(!client_data) {
    // TODO next must be an absolute url! and must belong to this site!
    self.model.next = params.next || '';
    return self.render('login');
  }

  client_data_attrs.forEach(function(attr) {
    self.model[attr] = client_data[attr];
  });
  self.model.signature = sign_data(client_data);
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

