/**
 * Middleware to add Strict-Transport-Security header
 * http://tools.ietf.org/html/draft-hodges-strict-transport-sec-02
 *
 * Arguments:
 *  - maxAge: int, the time in seconds the browser should remember the directive.
 *  - includeSubdomains: bool, set to true to set includeSubdomains directive.
 *
 */
exports.strictTransportSecurity = function(maxAge, includeSubdomains) {
  return function(req, res, next) {
    var originalWriteHead = res.writeHead;
    res.writeHead = function(status, headers) {
      headers = headers || {};
      headers['Strict-Transport-Security'] = "max-age=" + maxAge +
                                             (includeSubdomains ? "; includeSubDomains" : "");
      originalWriteHead.call(res, status, headers);
    };
    next();
  }
};
