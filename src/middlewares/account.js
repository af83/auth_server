var model = require('../model');
var router = require('connect').router;

/**
 * Update password if the current user
 */
var update_password = function(req, res) {
  var session = req.session;
  var user = session.user;
  function send_answer(status, body) {
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(body);
  }
  function send_error() {
    send_answer(500, '{"error": "Server error"}');
  }
  if (!user) {
    send_answer(401, '{"error": "not_authorized"}');
  }
  else {
    req.form.complete(function(err, fields) {
      if(err || !fields.current_password || !fields.new_password) {
        return send_answer(400, '{"error": "Missing parameter or invalid token"}');
      }

      model.User.getById(user.id, function(err, user) {
        if (err || !user) return send_error();
        user.check_password(fields.current_password, function(err, good) {
          if (err) return send_error();
          if(!good) return send_answer(400, '{"error": "Bad current password"}');
          user.set_password(fields.new_password, function(err) {
            if (err) return send_error();
            user.save(function(err, result) {
              if (err) return send_error();
              send_answer(200, '{"result": "ok"}');
            });
          });
        });
      });
    });
  }
};

/**
 *  Returns auth_server web application connect middleware.
 *
 * This middleware will take care of serving the auth_server web app
 * components.
 */
exports.connector = function() {
  return router(function(app) {
    app.post('/me/password', update_password);
  });
};
