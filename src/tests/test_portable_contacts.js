
var DATA = require('./init').init(exports)
  , assert = DATA.assert
;

var oauth2_server = require('oauth2-server')
  , web = require('nodetk/web')
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
      var check_answer = function(statusCode, headers, body) {
        assert.equal(statusCode, 503);
      };
      var params = {filterBy: 'emails.value',
                    filterOp: filterOp,
                    filterValue: 'JDoe@example.com',
                    oauth_token: oauth_token};
      web.GET(base_url + '/portable_contacts/@me/@all', params, check_answer);
      delete params.oauth_token;
      web.GET(base_url + '/portable_contacts/@me/@all', params, check_answer, {
        additional_headers: {'Authorization': 'OAuth '+oauth_token}
      });
    });
  }
}

exports.tests = [

['GET /portable_contacts/@me/@self: return current user info', 5, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var check_answer = function(statusCode, headers, body) {
      assert.equal(statusCode, 200);
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
    web.GET(base_url + '/portable_contacts/@me/@self', {oauth_token: oauth_token}, check_answer);
    web.GET(base_url + '/portable_contacts/@me/@self', {}, check_answer, {
      additional_headers: {'Authorization': 'OAuth '+oauth_token}
    });
  });
}],

['GET /portable_contacts/@me/@all: no param', 9, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var check_answer = function(statusCode, headers, body) {
      assert.equal(statusCode, 200);
      var content = JSON.parse(body);
      assert.equal(content.entry.length, 2);
      assert.ok(!content.entry[0].user);
      assert.ok(!content.entry[0]._pl);
    };
    web.GET(base_url + '/portable_contacts/@me/@all', {oauth_token: oauth_token}, check_answer);
    web.GET(base_url + '/portable_contacts/@me/@all', {}, check_answer, {
      additional_headers: {'Authorization': 'OAuth '+oauth_token}
    });
  });
}],

['GET /portable_contacts/@me/@all: with email', 5, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var check_answer = function(statusCode, headers, body) {
      assert.equal(statusCode, 200);
      var content = JSON.parse(body);
      assert.equal(content.entry.length, 1);
    };
    var params = {filterBy: 'emails.value',
                  filterOp: 'equals',
                  filterValue: 'JDoe@example.com',
                  oauth_token: oauth_token};
    web.GET(base_url + '/portable_contacts/@me/@all', params, check_answer);
    delete params.oauth_token;
    web.GET(base_url + '/portable_contacts/@me/@all', params, check_answer, {
      additional_headers: {'Authorization': 'OAuth '+oauth_token}
    });
  });
}],

['FilterOp contains is not implemented', 3, test_filter_op_not_implemented('contains')],
['FilterOp startwith is not implemented', 3, test_filter_op_not_implemented('startwith')],
['FilterOp present is not implemented', 3, test_filter_op_not_implemented('present')],

['GET /portable_contacts/@me/@all/:id', 4, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var params = {oauth_token: oauth_token};
    var check_answer = function(statusCode, headers, body) {
      var users = JSON.parse(body);
      web.GET(base_url + '/portable_contacts/@me/@all/'+ users.entry[0].id, params, function(statusCode, headers, body) {
        assert.equal(statusCode, 200);
        var user = JSON.parse(body);
        assert.equal(1, user.totalResults);
        assert.equal(users.entry[0].displayName, user.entry.displayName);
      });
    };
    web.GET(base_url + '/portable_contacts/@me/@all', params, check_answer);
  });
}],

['POST /portable_contacts/@me/@all create user', 4, function() {
  create_access_token(function(err, oauth_token) {
    assert.equal(null, err);
    var params = {oauth_token: oauth_token};
    var check_answer = function(statusCode, headers, body) {
      var users = JSON.parse(body);
      var check_post = function (statusCode, headers, body) {
        var user = JSON.parse(body);
        assert.equal(1, user.totalResults);
        assert.equal('Chuck Norris', user.entry.displayName);
        web.GET(base_url + '/portable_contacts/@me/@all', params, function(statusCode, headers, body) {
          assert.equal(JSON.parse(body).entry.length, users.entry.length + 1);
        });
      }
      web.POST(base_url + '/portable_contacts/@me/@all?oauth_token='+ oauth_token, {'displayName': 'Chuck Norris'}, check_post);
    };
    web.GET(base_url + '/portable_contacts/@me/@all', params, check_answer);
  });
}]
]
