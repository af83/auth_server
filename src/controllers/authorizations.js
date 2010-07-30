/* Authorizations handler.
 */

var eyes = require('eyes')
  , RFactory = require('../model').RFactory
  ;



var check_tocken = function(self, expected) {
  /* Check the token within the request to match what is expected.
   * If bad token, sends back an error.
   *
   * Arguments:
   *  - self: grasshoper server instance
   *  - Expected: JSON representation of what the token should match with.
   */
  // TODO: implement it, move it to oauth2.js
  //var token = self.params['oauth_token']; // TODO: check in headers as well
};

exports.get_authorizations = function(self, client_ids, user_ids, contexts) {
  /* Send back a list of authorizations to the client.
   * /users/user_id/authorizations
   * /clients/client_id/authorizations
   *
   * Arguments:
   *  - this: grasshoper server instance.
   *  - client_ids: ids of clients to refine the set of authorizations.
   *  - user_ids: idem with user ids.
   *  - contexts: idem with contexts.
   */
  check_tocken(self, ['READ', 'ROLES', client_ids, user_ids]);
  
  var R = RFactory()
    , query = {}
    ;
  if(client_ids.length > 0) query['client.id'] = {'$in': client_ids};
  // TODO replace user_ids by user_emails ?
  if(user_ids.length > 0) query['user.id'] = {'$in': user_ids};
  if(contexts.length > 0) query['context'] = {'$in': contexts};

  eyes.inspect(query);
  R.Authorization.index({query: query}, function(authorizations) {
    //TODO: self.renderJSON?
    self.renderText(JSON.stringify(authorizations.map(function(auth){
      return auth.json()
    })));
  }, function(err) {
    console.log(err.message);
    console.log(err.stack);
    self.renderError(500);
  });
};


exports.set_roles = function(user_id) {
  /* Sets a list of roles for a given client / end_user.
   */
  var self = this
    , params = self.params
    ;
};
