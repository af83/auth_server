var DATA = require('./init').init(exports)
  , assert = DATA.assert
  , inspect = DATA.inspect
;

var web = require('nodetk/web')
  , tools = require('nodetk/utils')
  , extend = require('../lib/merger').extend
;

/**
 * Returns fct making 3 asserts.
 */
var assert_json = function(expected_status, callback) {
  return function(status, headers, body) {
    assert.equal(expected_status, status);
    assert.equal(headers['content-type'], 'application/json');
    assert.doesNotThrow(function() {JSON.parse(body)});
    (callback || function() {})();
  }
};

var PASSWORD_URL = DATA.base_url + '/me/password';

exports.tests = [

['No session', 3, function() {
  web.POST(PASSWORD_URL, {}, assert_json(401));
}],

['change password: missing param', 6, function() {
  var data = {current_password: 'cpassword', new_password:'np'};
  DATA.session = {user: {email: "toto@af83.com", id: "123", token: "sometoken"}};
  tools.each(data, function(key) {
    var missing_data = extend({}, data);
    delete missing_data[key];
    web.POST(PASSWORD_URL, missing_data, assert_json(400));
  });
}],

['change password: bad current password', 3, function() {
  var data = {'current_password': 'bad_password', 'new_password':'np'};
  DATA.session = {user: {email: "toto@af83.com", id: DATA.user_id}, token: "sometoken"};
  web.POST(PASSWORD_URL, data, assert_json(400));
}],

['change password: ok', 6, function() {
  var data = {'current_password': '1234', 'new_password':'ABC'};
  DATA.session = {user: {email: "toto@af83.com", id: DATA.user_id}, token: "sometoken"};
  web.POST(PASSWORD_URL, data, assert_json(200, function() {
    data.current_password = 'ABC'; data.new_password = "1234";
    web.POST(PASSWORD_URL, data, assert_json(200));
  }));
}],
];
