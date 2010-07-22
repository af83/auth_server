
require.paths.unshift(__dirname + '/../vendors/grasshopper/lib/')
require.paths.unshift(__dirname + '/../vendors/eyes/lib/')


var gh = require('grasshopper')
  , eyes = require('eyes')
  , querystring = require('querystring')
  , model = require('./model')
  , data = model.data
  ;


exports.server = gh;
require('renderer').configure({
  viewsDir: __dirname + '/views'
});
 

var inspect = eyes.inspector({
  maxLength: null
});

// -------------------------------------------------------

var ERRORS = exports.ERRORS = {
  invalid_request: 'The request is missing a required parameter, includes ' +
                   'an unsupported parameter or parameter value, or is ' +
                   'otherwise malformed.',
  invalid_client: 'The client identifier provided is invalid.',
  unauthorized_client: 'The client is not authorized to use the requested ' +
                       'response type.',
  redirect_uri_mismatch: 'The redirection URI provided does not match a ' +
                         'pre-registered value.',
  access_denied: 'The end-user or authorization server denied the request.',
  unsupported_response_type: 'The requested response type is not supported ' +
                             'by the authorization server.',
  invalid_scope: 'The requested scope is invalid, unknown, or malformed.',
};

var oauth_error = function(self, type) {
  /* Render the error type (invalid_request, invalid_client...) using the 
   * grasshoper instance (self).
   */
  self.status = 400;
  self.renderText(JSON.stringify({error: {
    type: 'OAuthException',
    message: type + ': ' + ERRORS[type],
  }}));
};

var unknown_error = function(self, error) {
  /* To call when an unknown error happens (server error).
   */
  console.log(err.message);
  console.log(err.stack);
  self.renderError(500);
};

// Parameters we must/can have in an authorize request:
var PARAMS = exports.PARAMS = {
  mandatory: ['client_id', 'response_type', 'redirect_uri'],
  optional: ['state', 'scope'],
  // possible values for response_type param:
  response_types: {'token': 1, 'code': 1, 'code_and_token': 1},
};
PARAMS.all = PARAMS.mandatory.concat(PARAMS.optional);

// -------------------------------------------------------

gh.get('/', function() {
  this.renderText('Hello !');
});


gh.get('/oauth/authorize', function() {
  /* We must serve an authentication form to the end user at browser.
   */
  var self = this
    , params = self.params;
  // We check there is no invalid_requet error:
  var error = false;
  PARAMS.mandatory.forEach(function(param) {
    if(!params[param]) error = true;
  });
  if(error) return oauth_error(self, 'invalid_request');
  if(!PARAMS.response_types[params.response_type]) 
    oauth_error(self, 'unsupported_response_type');

  // XXX: For now, we only support 'code' response type
  // which is used in case of a web server (Section 1.4.1 in oauth2 spec draft 10)
  // TODO: make it more compliant with the norm
  if(params.response_type != "code") {
    self.status = 501;
    self.renderText('Only code request type supported for now ' +
                    '(schema 1.4.1 in oauth2 spec draft 10).');
  }

  // Fill in the model:
  PARAMS.all.forEach(function(param) {
    self.model[param] = params[param];
  });

  data.clients.get(params.client_id, function(err, client, meta) {
    if(err) {
      // We don't know about the client:
      if(err.errno == 2) return oauth_error(self, 'invalid_client');
      else return unknown_error(self, err);
    }
    
    // Check the redirect_uri is the one we know about:
    if(client.redirect_uri != params.redirect_uri) 
      return oauth_error(self, 'redirect_uri_mismatch');

    // Eveything is allright, ask the user to sign in.
    self.render('auth_form');
  });
});


var unknown_email_password = function(self) {
  /* To reply to the user when the authentication process failed
   * Either because the email or password was not known
   */
  self.status = 401;
  // TODO: represent the auth form with some error
  self.renderText('Email or password not known');
};

// XXX: we might want to put a different URL
// as the POST may have the same behaviour as the GET, according to spec.
gh.post('/login', function() {
  var self = this
    , params = self.params
    ;
  if(!params || !params.email || !params.password) 
    return unknown_email_password(self);
  data.users.get(params.email, function(err, user, meta) {
    if(err) {
      // We don't know about the user:
      if(err.errno == 2) return unknown_email_password(self);
      else return unknown_error(self, err);
    }
    // TODO: crypt the password
    if(user.password != params.password) 
      return unknown_email_password(self);

    // XXX: Do we need to check the parameters the user is giving us back?
    // (it shouldn't be necessary, since it can always alter the redirect we
    // are going to make)
    // But at least check the clientid is the same as we had before
    // XXX: it might be a good idea to put a token in the signing form.

    // Generate some authorization code, and store it in DB
    // We associate with the code: the client_id and the time it was created.
    // Here we rely on nStore to generate a code for us.
    data.issued_codes.save(null, {
      client_id: params.client_id,
      time: Date.now()
    }, function(err, meta) {
      if (err) return unknown_error(self, err);
      // Redirect the user with a code and eventually the state
      var qs = {code: meta.key};
      if(params.state) qs.state = params.state;
      qs = querystring.stringify(qs);
      self.redirect(params.redirect_uri + '?' + qs);
    });
  });
});


if(process.argv[1] == __filename)
  gh.serve(8080);

