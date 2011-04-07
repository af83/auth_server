
var DATA = require('./init').init(exports)
  , assert = DATA.assert
;

var oauth2_server = require('oauth2-server')
  , request = require('request')
  , qs = require('querystring')
;

var model = require('../model')
;

var base_url = DATA.base_url;

function create_access_token(callback) {
  model.User.getByEmail('pruyssen@af83.com', function(err, user) {
    if (err) return callback(err);
    callback(null, oauth2_server.create_access_token(user.get('id'), DATA.client_id));
  });
}

function test_filter_op_not_implemented(filterOp) {
  return function() {
    create_access_token(function(err, oauth_token) {
      assert.equal(null, err);
      var check_answer = function(err, response, body) {
        assert.equal(response.statusCode, 503);
      };
      var params = {filterBy: 'emails.value',
                    filterOp: filterOp,
                    filterValue: 'JDoe@example.com',
                    oauth_token: oauth_token};
      request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params)}, check_answer);
      delete params.oauth_token;
      request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params),
                   headers: {'Authorization': 'OAuth '+oauth_token}}, check_answer);
    });
  }
}

exports.tests = [

['GET /portable_contacts/@me/@self: return current user info', 5, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var check_answer = function(err, response, body) {
      assert.equal(response.statusCode, 200);
      var content = JSON.parse(body);
      delete content.entry.id;
      assert.deepEqual(content, {
        startIndex: 0,
        itemsPerPage: 1,
        totalResults: 1,
        entry: {
            displayName: 'pruyssen',
            emails: [
              {value: 'pruyssen@af83.com'}
            ]
        }
      });
    };
    request.get({uri: base_url + '/portable_contacts/@me/@self?'+ qs.stringify({oauth_token: oauth_token})}, check_answer);
    request.get({uri: base_url + '/portable_contacts/@me/@self',
                 headers: {'Authorization': 'OAuth '+oauth_token}}, check_answer);
  });
}],

['GET /portable_contacts/@me/@all: no param', 9, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var check_answer = function(err, response, body) {
      assert.equal(response.statusCode, 200);
      var content = JSON.parse(body);
      assert.equal(content.entry.length, 2);
      assert.ok(!content.entry[0].user);
      assert.ok(!content.entry[0]._pl);
    };
    request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify({oauth_token: oauth_token})}, check_answer);
    request.get({uri: base_url + '/portable_contacts/@me/@all',
                 headers: {'Authorization': 'OAuth '+oauth_token}}, check_answer);
  });
}],

['GET /portable_contacts/@me/@all: with email', 5, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var check_answer = function(err, response, body) {
      assert.equal(response.statusCode, 200);
      var content = JSON.parse(body);
      assert.equal(content.entry.length, 1);
    };
    var params = {filterBy: 'emails.value',
                  filterOp: 'equals',
                  filterValue: 'JDoe@example.com',
                  oauth_token: oauth_token};
    request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params)}, check_answer);
    delete params.oauth_token;
    request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params),
                 headers: {'Authorization': 'OAuth '+oauth_token}}, check_answer);
  });
}],

['FilterOp contains is not implemented', 3, test_filter_op_not_implemented('contains')],
['FilterOp startwith is not implemented', 3, test_filter_op_not_implemented('startwith')],
['FilterOp present is not implemented', 3, test_filter_op_not_implemented('present')],

['GET /portable_contacts/@me/@all/:id', 4, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var params = {oauth_token: oauth_token};
    var check_answer = function(err, response, body) {
      var users = JSON.parse(body);
      request.get({uri: base_url + '/portable_contacts/@me/@all/'+ users.entry[0].id +"?"+ qs.stringify(params)}, function(err, response, body) {
        assert.equal(response.statusCode, 200);
        var user = JSON.parse(body);
        assert.equal(1, user.totalResults);
        assert.equal(users.entry[0].displayName, user.entry.displayName);
      });
    };
    request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params)}, check_answer);
  });
}],

['POST /portable_contacts/@me/@all create user', 4, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var params = {oauth_token: oauth_token};
    var check_answer = function(err, response, body) {
      var users = JSON.parse(body);
      var check_post = function (err, response, body) {
        var user = JSON.parse(body);
        assert.equal(1, user.totalResults);
        assert.equal('Chuck Norris', user.entry.displayName);
        request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params)}, function(err, response, body) {
          assert.equal(JSON.parse(body).entry.length, users.entry.length + 1);
        });
      }
      request.post({uri: base_url + '/portable_contacts/@me/@all?oauth_token='+ oauth_token,
                json: {'displayName': 'Chuck Norris'}}, check_post);
    };
    request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params)}, check_answer);
  });
}],

['PUT /portable_contacts/@me/@all/:id update user', 5, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var params = {oauth_token: oauth_token};
    var check_answer = function(statusCode, headers, body) {
      var users = JSON.parse(body);
      request.put({uri: base_url + '/portable_contacts/@me/@all/'+ users.entry[0].id +"?oauth_token="+ oauth_token,
                   json: {'displayName': 'Bruce Lee'}}, function(err, response, body) {
        assert.equal(response.statusCode, 200);
        assert.equal(JSON.parse(body).entry.displayName, "Bruce Lee");
                     request.get({uri: base_url + '/portable_contacts/@me/@all/'+ users.entry[0].id+"?"+ qs.stringify(params)}, function(err, response, body) {
          assert.equal(response.statusCode, 200);
          assert.equal(JSON.parse(body).entry.displayName, "Bruce Lee");
        });
      });
    };
    request.get({uri: base_url + '/portable_contacts/@me/@all?'+ qs.stringify(params)}, check_answer);
  });
}]
]
