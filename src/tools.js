var URL = require("url");


exports.get_connector_from_routes = function(routes) {
  /* Returns connect middleware from given routes.
   *
   * Arguments:
   *  - routes: hash looking like:
   *      {'GET': {"/toto": fct, "/titi": fct},
   *       'POST': {"/toto": fct},
   *       'DELETE': {"/tutu/tata/": fct}
   *       }
   *  
   *  The routes arg is used to search where to route the current req.
   *  If nothing found, next() is called.
   *
   *  NOTE: pathnames must be strings, no regexp.
   *
   */
  return function(req, res, next) {
    var url = URL.parse(req.url);
    var method = routes[req.method] && routes[req.method][url.pathname];
    if(method) method(req, res);
    else next();
  };
}


exports.redirect = function(res, url) {
  /* Send redirection HTTP reply to result.
   *
   * Arguments:
   *  - res: nodejs result object.
   *  - url: where to redirect.
   *
   */
  res.writeHead(303, {'Location': url});
  res.end();
};


exports.server_error = function(res, err) {
  /* Send HTTP 500 result with details about error in body.
   * The content-type is set to text/plain.
   *
   * Arguments:
   *  - res: nodejs result object.
   *  - err: error object or string.
   *
   */
  res.writeHead(500, {'Content-Type': 'text/plain'});
  if(typeof err == "string") res.end(err);
  else {
    res.write('An error has occured: ' + err.message);
    res.write('\n\n');
    res.end(err.stack);
  }
};

