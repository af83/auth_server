var URL = require('url')
  , router = require('connect').router
;

var ms_templates = require('../lib/ms_templates')
  , email = require('../lib/email')
  , model = require('../model')
;

var BASE_URL;

/* Send redirection HTTP reply to result.
 *
 * Arguments:
 *  - res: nodejs result object.
 *  - url: where to redirect.
 *
 */
function redirect(res, url) {
  res.writeHead(303, {'Location': url});
  res.end();
};

/* Send HTTP 500 result with details about error in body.
 * The content-type is set to text/plain.
 *
 * Arguments:
 *  - res: nodejs result object.
 *  - err: error object or string.
 *
 */
function server_error(res, err) {
  res.writeHead(500, {'Content-Type': 'text/plain'});
  if(typeof err == "string") res.end(err);
  else {
    res.write('An error has occured: ' + err.message);
    res.write('\n\n');
    res.end(err.stack);
  }
};



/**
 * Serve page with form to register to auth_server.
 *
 * Arguments:
 *  - req
 *  - res
 *  - options, optional hash:
 *    - status_code: an alternative status code for the reply
 *      (default to 200).
 *    - data: data to prefill the form
 */
var register_page = function(req, res, options) {
  options = options || {};
  res.writeHead(options.status_code || 200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('register_form', options.data);
  res.end(body);
};

/**
 * Serve the success registration page.
 */
var register_success_page = function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var body = ms_templates.render('register_success');
  res.end(body);
};

/**
 * Redirects the user after process_register when user created with success.
 */
var process_register_success = function(res) {
  redirect(res, BASE_URL+'/register/success');
};

/**
 * Sends confirmation email to user.
 *
 * Arguments:
 *  - user: User object.
 *
 */
var send_confirmation_email = function(user) {
  var url = BASE_URL+'/register/confirm?';
  url += 'email=' + user.get('email');
  url += '&code=' + user.get('id'); // TODO: real code
  email.send(user.get('email'), 'AuthServer: registration confirmation', url);
};

/**
 * Handle registration confirmation (link in email).
 */
var confirm_registration = function(req, res) {
  var params = URL.parse(req.url, true).query || {};
  var error = function(){
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.end('The request is malformed.');
  }
  var code = params.code;
  var email = params.email;
  if(!code || !email) return error();

  model.User.getByEmail(email, function(err, user) {
    if(err || !user || user.get('id') != code) return error();
    // Mark the user as confirmed:
    user.set('confirmed', 1);
    user.save(function(err) {
      if (err) server_error(res, err);
      redirect(res, BASE_URL+'/');
    });
  });
};

/**
 * Process data sent from register form.
 */
var process_register = function(req, res) {
  if(!req.form) return register_page(req, res, {status_code: 400});
  req.form.complete(function(err, fields, files) {
    if(err) return server_error(res, err);
    var error = false;
    ['email', 'password', 'password_confirm'].forEach(function(attr) {
      if(!fields[attr]) error = true;
    });
    if(fields.password != fields.password_confirm) error = true;
    if(error) {
      fields.message = "There is an error in the form.";
      return register_page(req, res, {status_code: 400, data: fields});
    }
    // Add the user:
    var user = new model.User({email: fields.email});
    user.setPassword(fields.password, function(err) {
      if (err) return server_error(res, err);
      user.save(function(err) {
        if (err) {
          // If error is caused by duplicate email, say nothing to user:
          if (err.message.indexOf("E11000 ") == 0) { // duplicate insert
            return process_register_success(res);
          }
          return server_error(res, err);
        }
        send_confirmation_email(user);
        process_register_success(res);
      });
    });
  });
};

/**
 *  Returns auth_server connect middleware for registration process.
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
exports.connector = function(config) {
  BASE_URL = config.base_url;
  return router(function(app) {
    app.get('/register', register_page);
    app.post('/register', process_register);
    app.get('/register/success', register_success_page);
    app.get('/register/confirm', confirm_registration);
  });
};
