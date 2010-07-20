
require.paths.unshift(__dirname + '/../vendors/nstore/lib')
require.paths.unshift(__dirname + '/../vendors/grasshopper/lib/')
require.paths.unshift(__dirname + '/../vendors/eyes/lib/')


var gh = require('grasshopper')
  , eyes = require('eyes')
  , nStore = require('nstore')
  ;


exports.server = gh;
 

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
  self.renderText(JSON.stringify({error: {
    type: 'OAuthException',
    message: type + ': ' + ERRORS[type],
  }}));
};

// Parameters we must/can have in an authorize request:
var PARAMS = exports.PARAMS = {
  mandatory: ['client_id', 'response_type', 'redirect_uri'],
  optional: ['state', 'scope'],
  // possible values for response_type param:
  response_types: {'token': 1, 'code': 1, 'code_and_token': 1},
};

// -------------------------------------------------------

var USERS = nStore(__dirname + '/../data/users.db')
  , CLIENTS = nStore(__dirname + '/../data/clients.db')
  ;

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
    self.model[param] = params[param];
  });
  if(error) return oauth_error(self, 'invalid_request');
  if(!PARAMS.response_types[params.response_type]) 
    oauth_error(self, 'unsupported_response_type');

  CLIENTS.get(params.client_id, function(err, client, meta) {
    if(err) {
      // We don't know about the client:
      if(err.errno == 2) return oauth_error(self, 'invalid_client');
      else {
        console.log(err.message);
        console.log(err.stack);
        self.renderError(500);
      };
    }
    
    // Check the redirect_uri is the one we know about:
    if(client.redirect_uri != params.redirect_uri) 
      return oauth_error(self, 'redirect_uri_mismatch');

    // Eveything is allright, ask the user to sign in.
    self.render('views/auth_form');
  });
});

gh.post('/oauth/authorize', function() {
  this.renderText('loged in');
});


if(process.argv[1] == __filename)
  gh.serve(8080);

