/* Users controller
 */

var eyes = require('eyes')
  , RFactory = require('../model').RFactory
  ;


exports.get_users = function() {
  var self = this
    , R = RFactory()
    ;

  // TODO: Check the logged in user is admin on auth_server.
  
  R.User.index({}, function(users) {
    self.renderText(JSON.stringify(users.map(function(user) {
      var u = user.json();
      delete u.password;
      return u;
    })));
  });
};

exports.get_clients = function() {
  /* /users/id/clients
   */
};
