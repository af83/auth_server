
var querystring = require('querystring')
  , URL = require('url')

  , oauth2 = require('./oauth2')
  , RFactory = require('./model').RFactory
  , ms_templates = require('./lib/ms_templates')
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


exports.auth_server_login = function(req, res, next_url) {
  /* Redirects the user to auth_server page it can login to auth_server using
   * auth_server.
   *
   * Arguments:
   *  - req
   *  - res
   *  - next_url: an url to redirect to once the process is complete.
   */
  var data = {
    client_id: SELF_CLIENT_ID,
    redirect_uri: config.auth_server.redirect_uri,
    response_type: 'code'
  };
  if(next_url) data.state = JSON.stringify({next: next_url});
  var url = config.server.base_url + config.oauth2.authorize_url + '?' +
            querystring.stringify(data);
  res.writeHead(302, {'Location': url});
  res.end();
};

var auth_process_login = exports.auth_process_login = function(req, res) {
  /* Check the grant given by user to login in authserver is a good one.
   *
   * Arguments:
   *  - req
   *  - res
   */
  var params = URL.parse(req.url, true).query || {}
    , R = RFactory()
    , code = params.code
    ;

  if(!code) {
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end('The "code" parameter is missing.');
    return;
  }
  // Since we are text_server, we do not use the oauth2 api, but directly
  // request the grant checking function:
  oauth2.valid_grant(R, {code: code, client_id: SELF_CLIENT_ID}, function(token) {
    if(!token) {
      res.writeHead(400, {'Content-Type': 'text/html'});
      res.end('Invalid grant.');
      return;
    }
    if(params.state) try {
      var next = JSON.parse(params.state).next;
      if(next) {
        res.writeHead(302, {'Location': next});
        res.end();
        return;
      }
    } catch (e) {
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end('An error has occured: ' + err.message);
      return
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('Logged in Text server');
  }, function(err) {
    res.writeHead(500, {'Content-Type': 'text/html'});
    res.end('An error has occured: ' + err);
  });
};


var logout = exports.logout = function(req, res) {
  /* Logout the eventual logged in user.
   */
  req.session = {};
  res.writeHead(302, {'Location': '/'});
  res.end();
};

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
    data.action = config.oauth2.process_login_url;
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
    }, function(err) {
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end('Unknown error: ' + err);
    });
  });
};

