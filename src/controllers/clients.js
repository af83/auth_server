/* Clients controller
 */

var eyes = require('eyes')
  , RFactory = require('../model').RFactory
  ;


exports.get_clients = function() {
  var self = this
    , R = RFactory()
    ;

  // TODO: Check the logged in user is admin on auth_server.
  
  R.Client.index({}, function(clients) {
    self.renderText(JSON.stringify(clients.map(function(client) {
      return client.json();
    })));
  });
};


exports.get_client = function(args) {
  var self = this
    , R = RFactory()
    , client_id = args.client_id
    ;

  R.Client.get({ids: client_id}, function(client) {
    if(!client) return self.renderError(404);
    self.renderText(JSON.stringify(client.json()));
  }, function(err) {
    self.renderError(500);
  });
};

exports.update_client = function(args) {
  /* POST /clients/id
   */
  var self = this
    , params = self.params || {}
    , R = RFactory()
    , client_id = args.client_id
    ;
  
  // TODO: check the user is admin of the application on auth_server.
  ['name', 'redirect_uri', 'secret'].forEach(function(param) {
    if(!params[param]) abort(400);
  });
  R.Client.update({ids: [client_id], data: {
    name: params.name,
    redirect_uri: params.redirect_uri,
    secret: params.secret
  }}, function(data) {
    self.renderText(JSON.stringify({status: "ok", msg: 'Client updated.'}));
  }, function(err) {
    self.renderError(500);
  });
};


exports.get_client_contexts = function(args) {
  /* GET /clients/id/contexts
   */
  var self = this
    , client_id = args.client_id
    , R = RFactory()
    ;
  // TODO: check token or user logged in + rights to see it
  R.Authorization.distinct({key: "context", query:{
    "client.id": client_id
  }}, function(res) {
    self.renderText(JSON.stringify(res));
  }, function(err) {
    self.renderError(500);
  });
};

