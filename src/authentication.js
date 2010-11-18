
var oauth2 = require('./oauth2')
  , tools = require('./tools')
  , RFactory = require('./model').RFactory
  , ms_templates = require('./lib/ms_templates')
  , config = require('./config')
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
    config.oauth2_client.client_id = clients[0].id;
    callback();
  });
};


var client_data_attrs = ['client_name', 'client_id', 'redirect_uri', 'state'];


// -------------------------------------------------------------


var login = exports.login = function(req, res, client_data, code_status) {
  /* Renders the login page.
   * If user is already logged in, ask him if he wants to login in
   * the client application.
   *
   * Arguments:
   *  - req
   *  - res
   *  - client_data, contains:
   *    - client_id
   *    - client_name
   *    - redirect_uri
   *    - state
   *  - code_status: int, http code to put on http response (default: 200).
   *
   */
  var R = RFactory();
  var data = {};
  client_data_attrs.forEach(function(attr) {
    // XXX: should we encode all the state in a more secure way?
    // XXX: we whould be very prudent not to permit any code injection here.
    var val = client_data[attr];
    data[attr] = val || "";
  });
  data.signature = sign_data(client_data);
  data.server_name = config.auth_server.name;
  user = req.session.user;
  if(user) { // The user is already logged in
    // TODO: for a client first time, ask the user
    oauth2.send_grant(res, R, user.id, client_data);
  }
  else { // The user is not logged in
    data.action = config.oauth2_server.process_login_url;
    var body = ms_templates.render('oauth_login', data);
    res.writeHead(code_status || 200, {'Content-Type': 'text/html'});
    res.end(body)
  }
};

var sign_data = function(data) {
  /* Returns signature corresponding to the data
   */
  // TODO
  return "Big signature";
};

var extract_client_data = function(fields) {
  /* Returns client_data contained in the request, or null if data corrupted.
   *
   * Arguments:
   *  - fields: form data
   *
   */
  var data = {}
    , signature = fields.signature;
  if(!signature) return null;
  client_data_attrs.forEach(function(attr) {
    data[attr] = fields[attr];
  });
  // TODO: check signature against data
  return data;
}

var fail_login = function(req, res, client_data) {
  /* Reask the user to login.
   */
  // TODO: msg to tell the login / password are wrong.
  login(req, res, client_data, 401);
}


exports.process_login = function(req, res) {
  /* Handles the login credentials given by client.
   * If not authorized, then rerender the login page.
   * If authorized, send the user back to client or the page it came from (or "/").
   *
   * POST to config.oauth2.process_login_url
   *
   * Arguments:
   *  - req
   *  - res
   *
   */
  if(!req.form) {
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end('Invalid data.');
  }
  req.form.complete(function(err, fields, files) {
    client_data = extract_client_data(fields);
    if(!client_data) {
      res.writeHead(400, {'Content-Type': 'text/html'});
      res.end('Invalid data.');
    }
    if(!fields.email || !fields.password) 
      return fail_login(req, res, client_data);
    var R = RFactory();
    R.User.index({query: {email: fields.email}}, function(users) {
      if(users.length != 1) return fail_login(req, res, client_data);
      var user = users[0];
      
      // TODO: crypt the password
      if(user.password != fields.password) 
        return fail_login(req, res, client_data);

      // The user is logged in, let's remember:
      req.session.user = {email: user.email, id: user.id};
      oauth2.send_grant(res, R, user.id, client_data);
    }, function(err) {tools.server_error(res, err)});
  });
};

