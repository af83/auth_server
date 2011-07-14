var config = require('./config_loader').get_config();
var postmark = require('../../vendors/node-postmark/node-postmark');

switch (config.email.method) {
    case 'postmark':
        exports.send = function(destination, subject, body, callback, fallback) {
            postmark.send({
                to: destination,
                token: config.email.conf.token,
                from: config.email.conf.sender,
                subject: subject,
                text: body,
            }, function(response){
                console.log('PostMark Response: ' + JSON.stringify(response));
                if(callback) callback();
            });
        };
        break;
    case 'smtp':
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
        break;
    case 'dev':
        exports.send = function(destination, subject, body, callback, fallback) {
          console.log('Send email to ' + destination + ': ' + subject);
          console.log(body + '\n-------------\n');
          if(callback) callback();
        };
        break;
}