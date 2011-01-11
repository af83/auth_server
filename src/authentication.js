
var oauth2_server = require('oauth2/server')
  , tools = require('nodetk/server_tools')
  , RFactory = require('./model').RFactory
  , ms_templates = require('./lib/ms_templates')
  , config = require('./lib/config_loader').get_config()
  , base64 = require('base64')
  , URL = require('url')
  ;

exports.init_client_id = function(callback) {
  /* Lookup in DB and set config.oauth2_client.client_id 
   *
   * Arguments:
   *  - callback: to be called once it's done.
   *
   */
  var R = RFactory()
    , name = config.oauth2_client.name;
  R.Client.index({query: {name: name}}, function(clients) {
    if(clients.length != 1) 
      throw new Error('There must be one and only one ' + name);
    config.oauth2_client.servers['auth_server'].client_id = clients[0].id;
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
  var data = {}, info = {};
  client_data_attrs.forEach(function(attr) {
    // XXX: should we encode all the state in a more secure way?
    // XXX: we whould be very prudent not to permit any code injection here.
    var val = client_data[attr];
    info[attr] = val || "";
  });
  data.client_name = client_data.client_name;
  data.server_name = config.oauth2_server.name;
  user = req.session.user;
  if(user) { // The user is already logged in
    // TODO: for a client first time, ask the user
    oauth2_server.send_grant(res, R, user.id, client_data);
  }
  else { // The user is not logged in
    data.action = config.oauth2_server.process_login_url;
    data.login_url = config.oauth2_client.client.login_url;
    data.info = pack_data(info);
    var body = ms_templates.render('oauth_login', data);
    res.writeHead(code_status || 200, {'Content-Type': 'text/html'});
    res.end(body)
  }
};

var pack_data = exports.pack_data = function(data) {
  /* Returns data (obj) packed and signed as a string.
   */
  // TODO: sign data
  return base64.encode(JSON.stringify(data));
};

var extract_client_data = exports.extract_client_data = function(info) {
  /* Returns client_data contained in the info str, or null if data corrupted.
   *
   * Arguments:
   *  - info: string containing the information
   *
   */
  // TODO: check signature against data  
  if(!info) return null;
  try {
    var data = base64.decode(info);
    data = JSON.parse(data);
    return data;
  } catch(err) {
    console.error(err.message + ": " + info);
    console.error(err.stack);
    return null;
  }
};

var fail_login = function(req, res, client_data) {
  /* Reask the user to login.
   */
  // TODO: msg to tell the login / password are wrong.
  login(req, res, client_data, 401);
};


exports.process_login = function(req, res) {
  /* Handles the login credentials given by user.
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
    client_data = extract_client_data(fields.info);
    if(!client_data) {
      res.writeHead(400, {'Content-Type': 'text/plain'});
      res.end('Invalid data.');
    }
    if(!fields.email || !fields.password)
      return fail_login(req, res, client_data);
    var R = RFactory();
    R.User.index({query: {email: fields.email, confirmed: 1}}, function(users) {
      if(users.length != 1) return fail_login(req, res, client_data);
      var user = users[0];
      
      user.check_password(fields.password, function(good) {
        if(!good) return fail_login(req, res, client_data);

        // The user is logged in, let's remember:
        req.session.user = {email: user.email, id: user.id};
        oauth2_server.send_grant(res, R, user.id, client_data);
      }, function(err) {tools.server_error(res, err)});
    }, function(err) {tools.server_error(res, err)});
  });
};


exports.process_login_proxy = function(req, res) {
  /* The user want to login using another oauth2 provider
   *
   * GET to config.oauth2.process_login_url
   */
  var params = URL.parse(req.url, true).query;
  if(!params.info || !params.tierce) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    return res.end('Missing parameter(s) "info" and/or "tierce".');
  }
  // TODO: check the info is not altered
  if(params.tierce != 'facebook') {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    return res.end('Unsupported tierce');
  }

};

