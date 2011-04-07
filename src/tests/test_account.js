var DATA = require('./init').init(exports)
  , assert = DATA.assert
  , inspect = DATA.inspect
;

var request = require('request')
  , qs = require('querystring')
  , tools = require('nodetk/utils')
  , extend = require('../lib/merger').extend
;

/**
 * Returns fct making 3 asserts.
 */
var assert_json = function(expected_status, callback) {
  return function(err, response, body) {
    assert.equal(response.statusCode, expected_status);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.doesNotThrow(function() {JSON.parse(body)});
    (callback || function() {})();
  }
};

var PASSWORD_URL = DATA.base_url + '/me/password';

function post(url, data, callback) {
  request.post({uri: url,
                headers: {'Content-type': 'application/x-www-form-urlencoded'},
                body: qs.stringify(data)}, callback);
}

exports.tests = [

['No session', 3, function() {
  post(PASSWORD_URL, {}, assert_json(401));
}],

['change password: missing param', 6, function() {
  var data = {current_password: 'cpassword', new_password:'np'};
  DATA.session = {user: {email: "toto@af83.com", id: "123", token: "sometoken"}};
  tools.each(data, function(key) {
    var missing_data = extend({}, data);
    delete missing_data[key];
    post(PASSWORD_URL, missing_data, assert_json(400));
  });
}],

['change password: bad current password', 3, function() {
  var data = {'current_password': 'bad_password', 'new_password':'np'};
  DATA.session = {user: {email: "toto@af83.com", id: DATA.user_id}, token: "sometoken"};
  post(PASSWORD_URL, data, assert_json(400));
}],

['change password: ok', 6, function() {
  var data = {'current_password': '1234', 'new_password':'ABC'};
  DATA.session = {user: {email: "toto@af83.com", id: DATA.user_id}, token: "sometoken"};
  post(PASSWORD_URL,data, assert_json(200, function() {
    data.current_password = 'ABC';
    data.new_password = "1234";
    post(PASSWORD_URL, data, assert_json(200));
  }));
}],
];
