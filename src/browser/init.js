/* To be ran on browser side, when all dependencies have been loaded. */
var rest_mongo = require("rest-mongo/core")
  , schema = require('schema').schema
  , jbackend = require('rest-mongo/http_rest/jquery_backend')
  ;

var backend = jbackend.get_backend({additional_params: {token: TOKEN}});
var RFactory = rest_mongo.getRFactory(schema, backend)
R = RFactory();

callbacks = require('nodetk/orchestration/callbacks');

new AuthServerClientsController();
new AuthServerUsersController();
new AuthServerAuthorizationsController();
new AuthServerAccountController();
Backbone.history.start();

// To (re)generate client secret:
var randomString = require('nodetk/random_str').randomString;
$('.generate_secret').live('click', function() {
  $('input[name=secret]').val(randomString(256));
  return false;
});
