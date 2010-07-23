/* This implements a OAuth2 server, as specified at:
 *  http://tools.ietf.org/html/draft-ietf-oauth-v2-10
 *
 *  Only features the "web server" schema: 
 *    http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-1.4.1
 *
 * Terminaology:
 *  http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-1.2
 *
 */
require.paths.unshift(__dirname + '/../vendors/grasshopper/lib/')
require.paths.unshift(__dirname + '/../vendors/eyes/lib/')


var gh = require('grasshopper')
  , eyes = require('eyes')
  , querystring = require('querystring')
  , RFactory = require('./model').RFactory
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
  eua: { // eua = end user authorization
    // http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-3.2.1
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
  },

  oat: { // oat = Obtaining an access token
    // http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-4.3.1
    invalid_request: 'The request is missing a required parameter, includes ' +
                     'an unsupported parameter or parameter value, repeats ' +
                     'a parameter, includes multiple credentials, utilizes ' +
                     'more than one mechanism for authenticating the client, ' +
                     'or is otherwise malformed.',
    invalid_client: 'The client identifier provided is invalid, ' +
                    'the client failed to authenticate, the client did not ' +
                    'include its credentials, provided multiple client ' +
                    'credentials, or used unsupported credentials type.',
    unauthorized_client: 'The authenticated client is not authorized to use ' +
                         'the access grant type provided.',
    invalid_grant: 'The provided access grant is invalid, expired, or ' +
                   'revoked (e.g. invalid assertion, expired authorization' + 
                    'token, bad end-user password credentials, or ' +
                    'mismatching authorization code and redirection URI).',
    unsupported_grant_type: 'The access grant included - its type or another ' +
                           'attribute - is not supported by the ' +
                           'authorization server.',
    invalid_scope: 'The requested scope is invalid, unknown, malformed, ' +
                   'or exceeds the previously granted scope.'
  },
};

var oauth_error = function(self, type, id) {
  /* Render a particula error.
   *
   * Arguments:
   *  - self: grasshoper instance to render to.
   *  - type: the class of the error ('eua' or 'oat').
   *  - id: the id of the error (invalid_request, invalid_client...).
   */
  self.status = 400;
  self.renderText(JSON.stringify({error: {
    type: 'OAuthException',
    message: id + ': ' + ERRORS[type][id],
  }}));
};

var unknown_error = function(self, error) {
  /* To call when an unknown error happens (server error).
   */
  console.log(err.message);
  console.log(err.stack);
  self.renderError(500);
};

// Parameters we must/can have in different kinds of requests:
var PARAMS = exports.PARAMS = {
  eua: { // eua = end user authorization
    mandatory: ['client_id', 'response_type', 'redirect_uri'],
    optional: ['state', 'scope'],
    // possible values for response_type param:
    response_types: {'token': 1, 'code': 1, 'code_and_token': 1},
  },

  oat: { // oat = Obtaining an access token
    mandatory: ['grant_type', 'client_id', 'code', 'redirect_uri'],
    // client_secret might be provided with the 'Authorization: Basic ...' header
    optional: ['scope', 'client_secret'],
  },
};
PARAMS.eua.all = PARAMS.eua.mandatory.concat(PARAMS.eua.optional);

// -------------------------------------------------------

gh.get('/', function() {
  this.renderText('Hello !');
});


gh.get('/oauth/authorize', function() {
  /* We must serve an authentication form to the end user at browser.
   */
  var self = this
    , params = self.params
    ;
  // We check there is no invalid_requet error:
  var error = false;
  params && PARAMS.eua.mandatory.forEach(function(param) {
    if(!params[param]) error = true;
  });
  if(error || !params) return oauth_error(self, 'eua', 'invalid_request');
  if(!PARAMS.eua.response_types[params.response_type]) 
    oauth_error(self, 'eua', 'unsupported_response_type');

  // XXX: For now, we only support 'code' response type
  // which is used in case of a web server (Section 1.4.1 in oauth2 spec draft 10)
  // TODO: make it more compliant with the norm
  if(params.response_type != "code") {
    self.status = 501;
    self.renderText('Only code request type supported for now ' +
                    '(schema 1.4.1 in oauth2 spec draft 10).');
  }

  // Fill in the model:
  PARAMS.eua.all.forEach(function(param) {
    self.model[param] = params[param];
  });

  var R = RFactory();
  R.Client.get({ids: params.client_id}, function(client) {
    if(!client) return oauth_error(self, 'eua', 'invalid_client');
    // Check the redirect_uri is the one we know about:
    if(client.redirect_uri != params.redirect_uri) 
      return oauth_error(self, 'eua', 'redirect_uri_mismatch');
    // Eveything is allright, ask the user to sign in.
    self.render('auth_form');
  }, function(err) {
    unknown_error(self, err);
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
    , R = RFactory()
    ;
  if(!params || !params.email || !params.password) 
    return unknown_email_password(self);

  R.User.index({query: {email: params.email}}, function(users) {
    if(users.length != 1) return unknown_email_password(self);
    var user = users[0];
    
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
    
    // Here we rely on DB to generate a code (grant.id) for us.
    var grant = new R.Grant({
      client_id: params.client_id,
      time: Date.now()
    });
    grant.save(function() {
      var qs = {code: grant.id}; // TODO: make a very random authorization code?
      if(params.state) qs.state = params.state;
      qs = querystring.stringify(qs);
      self.redirect(params.redirect_uri + '?' + qs);
    }, function(err) {
      unknown_error(self, err);
    });
  
  }, function(err) {
    unknown_error(self, err);
  });
});



// Token endpoint
// We check the authorization_code and uri_redirect match, and the client secret
// then issue a token.
gh.post('/oauth/token', function() {
  var self = this
    , params = self.params
    , R = RFactory()
    ;

  // We check there is no invalid_requet error:
  var error = false;
  params && PARAMS.oat.mandatory.forEach(function(param) {
    if(!params[param]) error = true;
  });
  if(error || !params) return oauth_error(self, 'oat', 'invalid_request');

  // We do only support 'authorization_code' as grant_type:
  if(params.grant_type != 'authorization_code')
    return oauth_error(self, 'oat', 'unsupported_grant_type');

  // Check the client_secret is given once (and only once),
  // eith by HTTP basic auth, or by client_secret parameter:
  var secret = self.request.headers['authorization'];
  if(secret) {
    if(params.client_secret) return oauth_error(self, 'oat', 'invalid_request');
    params.client_secret = secret.slice(6); // remove the leading 'Basic'
  }
  else if(!params.client_secret) {
    return oauth_error(self, 'oat', 'invalid_request');
  }

  // Check the client_id exists and does have correct client_secret:
  R.Client.get({ids: params.client_id}, function(client) {
    if(!client) return oauth_error(self, 'oat', 'invalid_client');
    // TODO: encrypt password
    if(client.secret != params.client_secret) 
      return oauth_error(self, 'oat', 'invalid_client');

    // Check the redirect_uri:
    // XXX: in cases we decide the redirect_uri is not binded to the client,
    // but can vary, this should be associated with the grant (and store
    // in issued_codes).
    if(client.redirect_uri != params.redirect_uri)
      return oauth_error(self, 'oat', 'invalid_grant');

    // check the grant exist, is not deprecated and corresponds to the client:
    inspect(params.code);
    R.Grant.get({ids: params.code}, function(grant) {
      inspect(grant);
      var minute_ago = Date.now() - 60000;
      if(!grant || grant.time < minute_ago)
        return oauth_error(self, 'oat', 'invalid_grant');
      
      // Delete the grant so that it cannot be used anymore:
      grant.delete_(function() {
        // Generate and send an access_token to the client:
        self.renderText(JSON.stringify({
          // TODO: generate a token with assymetric encryption/signature
          access_token: 'secret_token'
          // optional: expires_in, refresh_token, scope
        }));
      }, function(err) {return unknown_error(self, err)});

    }, function(err) {return unknown_error(self, err)});
  }, function(err) {return unknown_error(self, err)});
});


if(process.argv[1] == __filename)
  gh.serve(8080);

