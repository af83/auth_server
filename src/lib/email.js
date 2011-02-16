
var config = require('./config_loader').get_config();


if(config.email.method == "smtp") {
  var mail = require('mail').Mail(config.email.conf);

  exports.send = function(destination, subject, body, callback, fallback) {
    /* Send an email.
     *
     * Arguments:
     *   - destination: email address of destination
     *   - subject: email subject.
     *   - body: what's in the email.
     *
     */
    mail.message({ from: "auth_server@af83.com"
                 , to: [destination]
                 , subject: subject
    }).body(body).send(function(err) {
      if(err) fallback && fallback(err) || console.error(err);
      else callback && callback();
    });
  };
}

else if(config.email.method == "dev") {
  exports.send = function(destination, subject, body, callback, fallback) {
    console.log('Send email to ' + destination + ': ' + subject);
    console.log(body + '\n-------------\n');
    if(callback) callback();
  };
}
