
var DATA = require('./init').init(exports)
  , assert = DATA.assert
;

var http = require('http')
  , querystring = require('querystring')
  , URL = require('url')
  , util = require('util')
  , oauth2_server = require('oauth2-server')
  , base64 = require('base64')
  , extend = require('../lib/merger').extend
  , request = require('request')
  , qs = require('querystring')
  , config = require('../lib/config_loader').get_config()
  , model = require('../model')
;

var base_url = DATA.base_url
  , authorize_url = base_url + config.oauth2_server.authorize_url
  , login_url = base_url + config.oauth2_server.process_login_url
  , token_url = base_url + config.oauth2_server.token_url
;

/**
 * Returns a function checking the reply is an error.
 * Use assert two times.
 *
 * Arguments:
 *  - type: 'eua' or 'oat'
 *  - error_code: 'invalid_request', 'invalid_client'...
 */
var get_error_checker = function(type, error_code) {
  return function(err, response, body) {
    assert.equal(response.statusCode, 400);
    var error = JSON.parse(body);
    assert.deepEqual(error, {error: {
      type: 'OAuthException',
      message: error_code + ': ' + oauth2_server.ERRORS[type][error_code]
    }});
  };
};

function get(url, querystring, callback) {
  request.get({uri: url+ "?"+ qs.stringify(querystring)}, callback);
}

function post(url, body, callback, headers) {
  headers = headers || {};
  request.post({uri: url,
                headers: extend({'Content-type': 'application/x-www-form-urlencoded'}, headers),
                body: qs.stringify(body)}, callback);
}

exports.tests = [

['/oauth/authorize: no parameter', 2, function() {
  // no params (missing mandatory ones) should give us an error.
  get(authorize_url, null, get_error_checker('eua', 'invalid_request'));
}],


['/oauth/authorize: missing mandatory param', 4, function() {
  // A missing mandatory param should give us an error.
  var qs = {
    client_id: DATA.client_id,
    response_type: "code"
  }
  oauth2_server.PARAMS.eua.mandatory.forEach(function(param) {
    var partial_qs = extend({}, qs);
    delete partial_qs[param];
    get(authorize_url, partial_qs, get_error_checker('eua', 'invalid_request'));
  });
}],


['/oauth/authorize: bad client_id', 2, function() {
  // if the given client id is not in DB, error.
  get(authorize_url, {
    client_id: "c291de4ddd672c4c5b000000",
    response_type: "code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('eua', 'invalid_client'));
}],

['/oauth/authorize: redirect_uri mismatch', 2, function() {
  // if the redirect_uri is not the same as registered: error.
  get(authorize_url, {
    client_id: DATA.client_id,
    response_type: "code",
    redirect_uri: "http://127.0.0.1:8888/login/wrong"
  }, get_error_checker('eua', 'redirect_uri_mismatch'));
}],

['/oauth/authorize: unsupported_response_type', 2, function() {
  // if the response_type is not an accepted value: error.
  get(authorize_url, {
    client_id: DATA.client_id,
    response_type: "wrong",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('eua', 'unsupported_response_type'));
}],

// -------------------------------------------------------------------------
// XXX : The two following tests are NOT norm compliant, cf ../oauth2.js
['/oauth/authorize: token response_type', 1, function() {
  get(authorize_url, {
    client_id: DATA.client_id,
    response_type: "token",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, function(err, response, body) {
    assert.equal(response.statusCode, 501)
  });
}],

['/oauth/authorize: code_and_token response_type', 1, function() {
  get(authorize_url, {
    client_id: DATA.client_id,
    response_type: "code_and_token",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, function(err, response, body) {
    assert.equal(response.statusCode, 501)
  });
}],
// -------------------------------------------------------------------------


['/oauth/authorize: ok', 1, function() {
  // if the response_type is not an accepted value: error.
  get(authorize_url, {
    client_id: DATA.client_id,
    response_type: "code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, function(err, response, body) {
    assert.equal(response.statusCode, 200);
    // TODO: more checks here? -> check we have a form to log in.
  });
}],


['authentication ok', 8, function() {
  post(login_url, {
    email: 'pruyssen@af83.com',
    password: '1234',
    info: base64.encode(new Buffer(JSON.stringify({
      client_id: 'errornot',
      response_type: 'code',
      state:'somestate',
      redirect_uri: 'http://127.0.0.1:8888/login'
    })))
  }, function(err, response, body) {
    assert.equal(response.statusCode, 303);
    var location = response.headers.location.split('?');
    assert.equal(location[0], 'http://127.0.0.1:8888/login');
    var qs = querystring.parse(location[1]);
    assert.equal(qs.state, 'somestate');
    assert.ok(qs.code);
    var id_code = qs.code.split('.');
    assert.equal(id_code.length, 2);
    model.Grant.getById(id_code[0], function(err, grant) {
      assert.equal(err, null);
      assert.ok(grant);
      assert.equal(grant.get('code'), id_code[1]);
    });
  });
}],


['authentication: wrong password', 1, function() {
  post(login_url, {
    state: 'somestate',
    email: 'pruyssen@af83.com',
    password: '123456',
    info: base64.encode(new Buffer(JSON.stringify({
      client_id: 'errornot',
      response_type: 'code',
      state:'somestate',
      redirect_uri: 'http://127.0.0.1:8888/login'
    })))
  }, function(err, response, body) {
    assert.equal(response.statusCode, 401);
  });
}],


['authentication: unknown user', 1, function() {
  post(login_url, {
    email: 'toto@af83.com',
    password: '123456',
    info: base64.encode(new Buffer(JSON.stringify({
      client_id: 'errornot',
      response_type: 'code',
      state:'somestate',
      redirect_uri: 'http://127.0.0.1:8888/login'
    })))
  }, function(err, response, body) {
    assert.equal(response.statusCode, 401);
  });
}],


// -------------------------------------------------------------------------


['/oauth/token: no parameters', 2, function() {
  post(token_url, {}, get_error_checker('oat', 'invalid_request'));
}],


['/oauth/token: missing mandatory param', 8, function() {
  // A missing mandatory param should give us an error.
  var qs = {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }
  oauth2_server.PARAMS.oat.mandatory.forEach(function(param) {
    var partial_qs = extend({}, qs);
    delete partial_qs[param];
    post(token_url, partial_qs, get_error_checker('oat', 'invalid_request'));
  });
}],


['/oauth/token: bad grant_type', 8, function() {
  ["password", "assertion", "refresh_token", "none"].forEach(function(type) {
    post(token_url, {
      grant_type: type,
      client_id: DATA.client_id,
      code: "some code",
      redirect_uri: "http://127.0.0.1:8888/login"
    }, get_error_checker('oat', 'unsupported_grant_type'));
  });
}],


['/oauth/token: no client secret', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_request'));
}],


['/oauth/token: Two client secrets', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login",
    client_secret: "somesecret"
  }, get_error_checker('oat', 'invalid_request'), {"Authorization": "Basic somesecret"});
}],


['/oauth/token: unknown client_id', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: "c291de4ddd672c4c5b000000",
    code: "some code",
    client_secret: "some secret",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_client'));
}],


['/oauth/token: bad secret in param', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    code: "some code",
    client_secret: "some secret",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_client'));
}],


['/oauth/token: bad secret in header', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login",
  }, get_error_checker('oat', 'invalid_client'), {"Authorization": "Basic some secret"});
}],


['/oauth/token: no grant (secrets in param)', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    code: "some code",
    client_secret: "some secret string",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_grant'));
}],


['/oauth/token: no grant (secrets in headers)', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/login"
  }, get_error_checker('oat', 'invalid_grant'), {"Authorization": "Basic some secret string"});
}],


['/oauth/token: bad request_uri', 2, function() {
  post(token_url, {
    grant_type: "authorization_code",
    client_id: DATA.client_id,
    client_secret: "some secret string",
    code: "some code",
    redirect_uri: "http://127.0.0.1:8888/toto"
  }, get_error_checker('oat', 'invalid_grant'));
}],


['/oauth/token: outdated grant', 5, function() {
  var grant = new model.Grant({
    client_id: DATA.client_id,
    time: parseInt(Date.now() - 60100)
  });
  grant.save(function(err) {
    assert.equal(err, null);
    setTimeout(function() { // To be sure the other connexion is aware of this.
      model.Grant.getById(grant.get('id'), function(err, grant) {
        assert.equal(err, null);
        assert.ok(grant != null, "The grand has not been saved yet...");
        // We need to check the grant was actually
        post(token_url, {
          grant_type: "authorization_code",
          client_id: DATA.client_id,
          code: grant.get('id'),
          client_secret: "some secret string",
          redirect_uri: "http://127.0.0.1:8888/login"
        }, get_error_checker('oat', 'invalid_grant'));
      });
    }, 10);
  });
}],

['/oauth/token: ok with secret in params', 6, function() {
  var grant = new model.Grant({
    client_id: DATA.client_id,
    user_id: 'some_user_id',
    time: parseInt(Date.now() - 15000),
    code: "somecode",
    redirect_uri: "http://127.0.0.1:8888/login"
  });
  grant.save(function(err) {
    assert.equal(err, null);
    setTimeout(function() { // To be sure the other connexion is aware of this.
      model.Grant.getById(grant.get('id'), function(err, grant) {
        assert.equal(err, null);
        assert.ok(grant != null, "The grant has not been saved yet...");
        post(token_url, {
          grant_type: "authorization_code",
          client_id: DATA.client_id,
          code: grant.get('id')+'.somecode',
          client_secret: "some secret string",
          redirect_uri: "http://127.0.0.1:8888/login"
        }, function(err, response, body) {
          assert.equal(response.statusCode, 200);
          assert.equal(response.headers['cache-control'], 'no-store');
          var token = JSON.parse(body);
          assert.ok(token.access_token);
        });
      });
    }, 10);
  });
}]
]
