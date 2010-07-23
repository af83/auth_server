
require.paths.unshift(__dirname + '/..');
require.paths.unshift(__dirname + '/../../vendors/nodetk/src');
require.paths.unshift(__dirname + '/../../vendors/eyes/lib');

var auth_server = require('auth_server')
  , server = auth_server.server
  , assert = require('nodetk/testing/custom_assert')
  , extend = require('nodetk/utils').extend
  , URL = require('url')
  , querystring = require('querystring')
  , http = require('http')
  , eyes = require('eyes')
  , load_data = require('../scripts/load_data').run
  , web = require('nodetk/web')
  , model = require('../model')
  , RFactory = model.RFactory
  //, data = model.data
  ;


server.serve(9999)
var authorize_url = 'http://127.0.0.1:9999/oauth/authorize'
  , login_url = 'http://127.0.0.1:9999/login'
  , token_url = 'http://127.0.0.1:9999/oauth/token'
  ;

var get_error_checker = function(type, error_code) {
  /* Returns a function checking the reply is an error.
   * Use assert two times.
   *
   * Arguments:
   *  - type: 'eua' or 'oat'
   *  - error_code: 'invalid_request', 'invalid_client'...
   */
  return function(statusCode, headers, data) {
    assert.equal(statusCode, 400);
    var error = JSON.parse(data);
    assert.deepEqual(error, {error: {
      type: 'OAuthException',
      message: error_code + ': ' + auth_server.ERRORS[type][error_code]
    }});
  };
};

var get_client_id = function(client_name, callback) {
  /* Calls callback(client_id), client_id corresponding to the given name.
   * If no corresponding client found, throw error.
   */
  R.Client.index({query: {name: client_name}}, function(clients) {
    if(clients.length != 1) throw "There should only be one client!";
    callback(clients[0].id);
  }, function(err) {
    console.log(err.message);
    console.log(err.stack);
    throw err;
  });
};

// available for each test to use:
var errornot_client_id
  , R = RFactory()
  ;

exports.setup = function(callback) {
  R.clear_caches();
  load_data(function() {
    get_client_id("errornot", function(client_id) {
      errornot_client_id = client_id;
      callback();
    });
  });
};


exports.tests = [

['/oauth/authorize: no parameter', 2, function() {
  // no params (missing mandatory ones) should give us an error.
  web.GET(authorize_url, null, get_error_checker('eua', 'invalid_request'));
}],


['/oauth/authorize: missing mandatory param', 6, function() {
  // A missing mandatory param should give us an error.
  var qs = {
    client_id: errornot_client_id,
    response_type: "token",
    redirect_uri: "http://127.0.0.1:8888/login"
  }
  auth_server.PARAMS.eua.mandatory.forEach(function(param) {
    console.log(param);
    var partial_qs = extend({}, qs);
    delete partial_qs[param];
    web.GET(authorize_url, partial_qs, get_error_checker('eua', 'invalid_request'));
  });
}],


['/oauth/authorize: bad client_id', 2, function() {
  // if the given client id is not in DB, error.
  web.GET(authorize_url, {
    client_id: "toto",
    response_type: "code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('eua', 'invalid_client'));
}],

['/oauth/authorize: redirect_uri mismatch', 2, function() {
  // if the redirect_uri is not the same as registered: error.
  web.GET(authorize_url, {
    client_id: errornot_client_id,
    response_type: "code",
    redirect_uri: "http://127.0.0.1:8888/login/wrong"
  }, get_error_checker('eua', 'redirect_uri_mismatch'));
}],

['/oauth/authorize: unsupported_response_type', 2, function() {
  // if the response_type is not an accepted value: error.
  web.GET(authorize_url, {
    client_id: errornot_client_id,
    response_type: "wrong",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('eua', 'unsupported_response_type'));
}],

// -------------------------------------------------------------------------
// XXX : The two following tests are NOT norm compliant, cf auth_server.js
['/oauth/authorize: token response_type', 1, function() {
  web.GET(authorize_url, {
    client_id: errornot_client_id,
    response_type: "token",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, function(statusCode, headers, data) {
    assert.equal(statusCode, 501)
  });
}],

['/oauth/authorize: code_and_token response_type', 1, function() {
  web.GET(authorize_url, {
    client_id: errornot_client_id,
    response_type: "code_and_token",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, function(statusCode, headers, data) {
    assert.equal(statusCode, 501)
  });
}],
// -------------------------------------------------------------------------


['/oauth/authorize: ok', 1, function() {
  // if the response_type is not an accepted value: error.
  web.GET(authorize_url, {
    client_id: errornot_client_id,
    response_type: "code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, function(statusCode, headers, data) {
    assert.equal(statusCode, 200);
    // TODO: more checks here? -> check we have a form to log in.
  });
}],


['authentication ok', 4, function() {
  web.POST(login_url, {
    client_id: 'errornot',
    response_type: 'code',
    redirect_uri: 'http://127.0.0.1:8888/login',
    state: 'somestate',
    email: 'pruyssen@af83.com',
    password: '1234'
  }, function(statusCode, headers, data) {
    assert.equal(statusCode, 302);
    var location = headers.location.split('?');
    assert.equal(location[0], 'http://127.0.0.1:8888/login');
    var qs = querystring.parse(location[1]);
    assert.ok(qs.code);
    assert.equal(qs.state, 'somestate');
  });
}],


['authentication: wrong password', 1, function() {
  web.POST(login_url, {
    client_id: 'errornot',
    response_type: 'code',
    redirect_uri: 'http://127.0.0.1:8888/login',
    state: 'somestate',
    email: 'pruyssen@af83.com',
    password: '123456'
  }, function(statusCode, headers, data) {
    assert.equal(statusCode, 401);
  });
}],


['authentication: unknown user', 1, function() {
  web.POST(login_url, {
    client_id: 'errornot',
    response_type: 'code',
    redirect_uri: 'http://127.0.0.1:8888/login',
    state: 'somestate',
    email: 'toto@af83.com',
    password: '123456'
  }, function(statusCode, headers, data) {
    assert.equal(statusCode, 401);
  });
}],


// -------------------------------------------------------------------------


['/oauth/token: no parameters', 2, function() {
  web.POST(token_url, {}, get_error_checker('oat', 'invalid_request'));
}],


['/oauth/token: missing mandatory param', 8, function() {
  // A missing mandatory param should give us an error.
  var qs = {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }
  auth_server.PARAMS.oat.mandatory.forEach(function(param) {
    var partial_qs = extend({}, qs);
    delete partial_qs[param];
    web.POST(token_url, partial_qs, get_error_checker('oat', 'invalid_request'));
  });
}],


['/oauth/token: bad grant_type', 8, function() {
  ["password", "assertion", "refresh_token", "none"].forEach(function(type) {
    web.POST(token_url, {
      grant_type: type,
      client_id: errornot_client_id,
      code: "some code",
      redirect_uri: "http://127.0.0.1:8888/login"
    }, get_error_checker('oat', 'unsupported_grant_type'));
  });
}],


['/oauth/token: no client secret', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_request'));
}],


['/oauth/token: Two client secrets', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login",
    client_secret: "somesecret"
  }, get_error_checker('oat', 'invalid_request'), {
    additional_headers: {"Authorization": "Basic somesecret"}
  });
}],


['/oauth/token: unknown client_id', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: "toto",
    code: "some code",
    client_secret: "some secret",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_client'));
}],


['/oauth/token: bad secret in param', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    code: "some code",
    client_secret: "some secret",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_client'));
}],


['/oauth/token: bad secret in header', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login",
  }, get_error_checker('oat', 'invalid_client'), {
    additional_headers: {"Authorization": "Basic some secret"}
  });
}],


['/oauth/token: no grant (secrets in param)', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    code: "some code",
    client_secret: "some secret string",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_grant'));
}],


['/oauth/token: no grant (secrets in headers)', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_grant'), {
    additional_headers: {"Authorization": "Basic some secret string"}
  });
}],


['/oauth/token: bad request_uri', 2, function() {
  web.POST(token_url, {
    grant_type: "authorization_code",
    client_id: errornot_client_id,
    client_secret: "some secret string",
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/toto"
  }, get_error_checker('oat', 'invalid_grant'));
}],


['/oauth/token: outdated grant', 2, function() {
  var grant = new R.Grant({
    client_id: errornot_client_id,
    time: Date.now() - 60100
  });
  grant.save(function() {
    web.POST(token_url, {
      grant_type: "authorization_code",
      client_id: errornot_client_id,
      code: grant.id,
      client_secret: "some secret string",
      redirect_uri: "http://127.0.0.1:8888/login"
    }, get_error_checker('oat', 'invalid_grant'));
  });
}],


['/oauth/token: ok with secret in params', 2, function() {
  var grant = new R.Grant({
    client_id: errornot_client_id,
    time: parseInt(Date.now() - 15000)
  });
  console.log('grant:');
  eyes.inspect(grant);
  grant.save(function() {
    eyes.inspect(grant);
    web.POST(token_url, {
      grant_type: "authorization_code",
      client_id: errornot_client_id,
      code: grant.id,
      client_secret: "some secret string",
      redirect_uri: "http://127.0.0.1:8888/login"
    }, function(statusCode, headers, data) {
      console.log(data);
      assert.equal(statusCode, 200);
      assert.deepEqual(JSON.parse(data), {
        access_token: 'secret_token'
      });
    });
  });
}],


]

