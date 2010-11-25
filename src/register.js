var URL = require('url');

var ms_templates = require('./lib/ms_templates');
var bcrypt = require('./lib/bcrypt');
var tools = require('./tools');
var email = require('./email');
var RFactory = require('./model').RFactory;

var BASE_URL;


var register_page = function(req, res, options) {
  /* Serve page with form to register to auth_server. 
   *
   * Arguments:
   *  - req
   *  - res
   *  - options, optional hash:
   *    - status_code: an alternative status code for the reply 
   *      (default to 200).
   *    - data: data to prefill the form
   */
  options = options || {};
  res.writeHead(options.status_code || 200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('register_form', options.data);
  res.end(body);
};

var register_success_page = function(req, res) {
  /* Serve the success registration page.
   *
   */
  res.writeHead(200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('register_success');
  res.end(body);
};


var process_register_success = function(res) {
  /* Redirects the user after process_register when user created with success.
   *
   */
  tools.redirect(res, BASE_URL+'/register/success');
};


var send_confirmation_email = function(user) {
  /* Sends confirmation email to user.
   *
   * Arguments:
   *  - user: R User object.
   *
   */
  var url = BASE_URL+'/register/confirm?';
  url += 'email=' + user.email;
  url += '&code=' + user.id; // TODO: real code
  email.send(user.email, 'AuthServer: registration confirmation', url);
};

var confirm_registration = function(req, res) {
  /* Handle registration confirmation (link in email).
   *
   */
  var params = URL.parse(req.url, true).query || {};
  var error = function(){
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end('The request is malformed.');
  }
  var code = params.code;
  var email = params.email;
  if(!code || !email) return error();
  var R = RFactory();
  R.User.index({query: {email: email}}, function(users) {
    if(users.length != 1) return error();
    var user = users[0];
    if(user.id != code) return error();
    // Mark the user as confirmed:
    user.confirmed = 1;
    user.save(function() {
      tools.redirect(res, BASE_URL+'/');
    }, function(err) {tools.server_error(res, err)});
  }, function(err) {tools.server_error(res, err)});
};


var process_register = function(req, res) {
  /* Process data sent from register form.
   *
   */
  if(!req.form) return register_page(req, res, {status_code: 400});
  req.form.complete(function(err, fields, files) {
    if(err) return tools.server_error(res, err);
    var error = false;
    ['email', 'password', 'password_confirm'].forEach(function(attr) {
      if(!fields[attr]) error = true;
    });
    if(fields.password != fields.password_confirm) error = true;
    if(error) {
      fields.message = "There is an error in the form.";
      return register_page(req, res, {status_code: 400, data: fields});
    }
    bcrypt.hash(fields.password, function(hash) {
      // Add the user:
      var R = RFactory();
      var user = new R.User({email: fields.email, password: hash});
      user.save(function() {
        send_confirmation_email(user);
        process_register_success(res);
      }, function(err) {
        // If error is caused by duplicate email, say nothing to user:
        if(err.message.indexOf("E11000 ") == 0) { // duplicate insert
          process_register_success(res);
        }
        else tools.server_error(res, err);
      });
    }, function(err) {tools.server_error(res, err)});
  });
};


exports.connector = function(config) {
  /* Returns auth_server connect middleware for registration process.
   *
   * This middleware will take care of displaying registration form +
   * handling the result, and the confirmation link in email.
   *
   * This middleware must be placed after the following middlewares:
   *  - connect-form
   *
   * Arguments:
   *  - config: hash (non optional)
   *    - base_url: the base url to access the site. ex: http://toto.com
   *
   */
  BASE_URL = config.base_url;
  var routes = {GET: {}, POST: {}};
  routes.GET['/register'] = register_page;
  routes.POST['/register'] = process_register;
  routes.GET['/register/success'] = register_success_page;
  routes.GET['/register/confirm'] = confirm_registration;
  return tools.get_connector_from_routes(routes);
};

