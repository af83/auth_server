var URL = require('url');


var app = function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var name = req.session.user_email;
  var loginout = null;
  if(!name) {
    name = 'anonymous';
    loginout = '<a href="/login">Login</a>';
  }
  else {
    loginout = '<a href="/logout">Logout</a>';
  }
  res.end('Hello '+ name +'!<br />'+loginout);
};


exports.connector = function() {
  return function(req, res, next) {
    var url = URL.parse(req.url);
    if(url.pathname == "/") app(req, res);
    else next();
  };
}

