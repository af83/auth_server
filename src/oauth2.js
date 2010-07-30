/* This implements a OAuth2 server methods, as specified at:
 *  http://tools.ietf.org/html/draft-ietf-oauth-v2-10
 *
 * Only features the "web server" schema: 
 *  http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-1.4.1
 *
 * Terminology:
 *  http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-1.2
 *
 */

var querystring = require('querystring')

  , authentication = require('./authentication')
  , RFactory = require('./model').RFactory
  ;


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

  apr: { // ap = Accessing a protected resource
    // http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-5.2.1
    invalid_request:
         "The request is missing a required parameter, includes an " +
         "unsupported parameter or parameter value, repeats the same " +
         "parameter, uses more than one method for including an access " +
         "token, or is otherwise malformed.",
    invalid_token: "The access token provided is invalid.",
    expired_token: "The access token provided has expired.",
    insufficient_scope: "The request requires higher privileges than " +
                        "provided by the access token.",
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

var unknown_error = function(self, err) {
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

exports.authorize = function() {
  /* OAuth2 Authorize endp-point.
   * Serve an authentication form to the end user at browser.
   *
   * Arguments:
   *  - this: grasshoper instance.
   */
  var self = this
    , params = self.params || []
    ;
  // We check there is no invalid_requet error:
  var error = false;
  PARAMS.eua.mandatory.forEach(function(param) {
    if(!params[param]) error = true;
  });
  if(error) {
    return oauth_error(self, 'eua', 'invalid_request');
  }
  if(!PARAMS.eua.response_types[params.response_type]) 
    return oauth_error(self, 'eua', 'unsupported_response_type');

  // XXX: For now, we only support 'code' response type
  // which is used in case of a web server (Section 1.4.1 in oauth2 spec draft 10)
  // TODO: make it more compliant with the norm
  if(params.response_type != "code") {
    self.status = 501;
    self.renderText('Only code request type supported for now ' +
                    '(schema 1.4.1 in oauth2 spec draft 10).');
  }

  var R = RFactory();
  R.Client.get({ids: params.client_id}, function(client) {
    if(!client) return oauth_error(self, 'eua', 'invalid_client');
    // Check the redirect_uri is the one we know about:
    if(client.redirect_uri != params.redirect_uri) 
      return oauth_error(self, 'eua', 'redirect_uri_mismatch');
    // Eveything is allright, ask the user to sign in.
    authentication.login(self, {
      client_id: client.id,
      client_name: client.name,
      redirect_uri: params.redirect_uri,
      state: params.state
    });
  }, function(err) {
    unknown_error(self, err);
  });
};


exports.send_grant = function(self, R, user_id, client_data) {
  /* Create a grant and send it to the user.
   *
   * Arguments:
   *  - self: grasshopper instance
   *  - R: rest-mongo instance
   *  - user_id: id of the user
   *  - client_data
   */
  // Here we rely on DB to generate a code (grant.id) for us.
  var grant = new R.Grant({
    client_id: client_data.client_id,
    time: Date.now(),
    user_id: user_id,
  });
  grant.save(function() {
    var qs = {code: grant.id}; // TODO: make a very random authorization code?
    if(client_data.state) qs.state = client_data.state;
    qs = querystring.stringify(qs);
    self.redirect(client_data.redirect_uri + '?' + qs);
  }, function(err) {
    unknown_error(self, err);
  });
};


var valid_grant = exports.valid_grant = function(R, data, callback, fallback) {
  /* Valid the grant, call callback(token|null) or fallback(err).
   * If valid, the grant is invalidated and cannot be used anymore.
   *
   * To be valid, a grant must exist, not be deprecated and have the right
   * associated client.
   *
   * Arguments:
   *  - R: rest-mongo instance
   *  - data:
   *   - code: grant code given by client.
   *   - client_id: the client id giving the grant
   *  - callback: to be called with a token if the grant was valid, 
   *    or null otherwise.
   *  - fallback: to be called in case of error (an invalid grant is not 
   *    an error).
   *
   */
  R.Grant.get({ids: data.code}, function(grant) {
    var minute_ago = Date.now() - 60000;
    if(!grant || grant.time < minute_ago || 
       grant.client_id != data.client_id) return callback(null);
    // Delete the grant so that it cannot be used anymore:
    grant.delete_(function() {
      // Generate and send an access_token to the client:
      var token = {
        // TODO: generate a token with assymetric encryption/signature
        // so that it cannot be forged.
        access_token: grant.user_id
        // optional: expires_in, refresh_token, scope
      };
      callback(token);
    }, fallback);
  });
};


exports.token = function() {
  /* OAuth2 token endpoint.
   * Check the authorization_code, uri_redirect and client secret, issue a token.
   *
   * Arguments:
   *  - this: grasshoper instance.
   */
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
  // either by HTTP basic auth, or by client_secret parameter:
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

    valid_grant(R, {code: params.code, client_id: client.id}, function(token) {
      if(!token) return oauth_error(self, 'oat', 'invalid_grant');
      self.renderText(JSON.stringify(token));
    }, function(err) {
      unknown_error(self, err);
    });
  }, function(err) {return unknown_error(self, err)});
};

