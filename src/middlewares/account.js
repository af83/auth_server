var tools = require('nodetk/server_tools');
var RFactory = require('../model').RFactory;

var update_password = function(req, res) {
  /* Update password if the current user */
  var session = req.session;
  var user = session.user;
  function send_answer(status, body) {
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(body);
  }
  function send_error() {
    send_answer(500, '{"error": "Server error"}');
  }
  if(!user) {
    send_answer(401, '{"error": "not_authorized"}');
  }
  else {
    req.form.complete(function(err, fields) {
      if(err || !fields.current_password || !fields.new_password ||
         !fields.token || fields.token != session.token) {
        return send_answer(400, '{"error": "Missing parameter or invalid token"}');
      }
      var R = RFactory();
      R.User.get({ids: user.id}, function(user) {
        if (!user) return send_error();
        user.check_password(fields.current_password, function(good) {
          if(!good) return send_answer(400, '{"error": "Bad current password"}');
          user.set_password(fields.new_password, function() {
            user.save(function() {
              send_answer(200, '{"result": "ok"}');
            }, send_error);
          }, send_error);
        }, send_error);
      });
    });
  }

};


exports.connector = function() {
  /* Returns auth_server web application connect middleware.
   *
   * This middleware will take care of serving the auth_server web app
   * components.
   *
   */
  var routes = {POST: {}};
  routes.POST['/me/password'] = update_password;
  return tools.get_connector_from_str_routes(routes);
};
