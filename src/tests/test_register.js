
var DATA = require('./init').init(exports)
  , assert = DATA.assert
  , inspect = DATA.inspect
  , R = DATA.R
  ;

var web = require('nodetk/web')
  , extend = require('nodetk/utils').extend
  , CLB = require('nodetk/orchestration/callbacks')
  , hash = require('../lib/hash')
  ;


exports.tests = [

['/register: form to register', 2, function() {
  var url = DATA.base_url + '/register';
  web.GET(url, null, function(status_code, headers, data) {
    assert.equal(headers['content-type'], 'text/html');
    assert.equal(status_code, 200);
  });
}],

// ------------------------------------------------------

['/register: post, missing data', 6, function() {
  var url = DATA.base_url + '/register';
  var params = {email: 'ti@ti.com', password: 'toto', password_confirm: 'toto'};
  for(var missing_attr in params) {
    var params2 = extend({}, params);
    delete params2[missing_attr];
    web.POST(url, params2, function(status_code, headers, data) {
      assert.equal(headers['content-type'], 'text/html');
      assert.equal(status_code, 400);
    });
  }
}],

['/register: post, mismatching password', 2, function() {
  var url = DATA.base_url + '/register';
  var params = {email: 'ti@ti.com', password: 'toto', password_confirm: 'titi'};
  web.POST(url, params, function(status_code, headers, data) {
    assert.equal(headers['content-type'], 'text/html');
    assert.equal(status_code, 400);
  });
}],

['/register: post, already registered user', 4, function() {
  var url = DATA.base_url + '/register';
  R.User.index({query: {email: 'pruyssen@af83.com'}}, function(users) {
    assert.equal(users.length, 1);
    var pierre = users[0]; var json1 = pierre.json();
    var params = {email: pierre.email, password: 'p', password_confirm: 'p'};
    web.POST(url, params, function(status_code, headers, data) {
      // If an email is sent, it will trigger an error.
      assert.equal(status_code, 303);
      assert.equal(headers['location'], DATA.base_url+'/register/success');
      pierre.refresh(function() { // user has not been changed
        assert.deepEqual(json1, pierre.json());
      });
    });
  });
}],

['/register: post, success', 10, function() {
  var url = DATA.base_url + '/register';
  var params = {email: 'ti@ti.com', password: 'titi', password_confirm: 'titi'};
  var confirmation_link, new_user;
  var waiter = CLB.get_waiter(2, function() {
    hash.check(new_user.password, 'titi', function(good) {
      assert.ok(good);
    }, function(err) {assert.ok(false, err)});
    assert.equal(new_user.confirmed, undefined);
    // check confirmation_link:
    web.GET(confirmation_link, null, function(status_code, headers, data) {
      assert.equal(status_code, 303);
      assert.equal(headers['location'], DATA.base_url+'/');
      new_user.refresh(function() {
        assert.equal(new_user.confirmed, 1);
      });
    });
  });
  DATA.add_expected_email(function(destination, subject, body) {
    assert.equal(destination, 'ti@ti.com');
    assert.equal(subject, 'AuthServer: registration confirmation');
    confirmation_link = body;
    waiter();
  });
  web.POST(url, params, function(status_code, headers, data) {
    assert.equal(status_code, 303);
    assert.equal(headers['location'], DATA.base_url+'/register/success');
    // Check the user has been added and is not activated:
    R.User.index({query: {email: 'ti@ti.com'}}, function(users) {
      assert.equal(users.length, 1);
      new_user = users[0];
      waiter();
    });
  });
}],

// ------------------------------------------------------

['/register/success: success page', 2, function() {
  var url = DATA.base_url + '/register/success';
  web.GET(url, null, function(status_code, headers, data) {
    assert.equal(headers['content-type'], 'text/html');
    assert.equal(status_code, 200);
  });
}],

// ------------------------------------------------------

['/register/confirm: Missing parameters', 2, function() {
  var url = DATA.base_url + '/register/confirm';
  var parameters = {email: 'ti@ti.com', code: '123'};
  for(var missing_param in parameters) {
    var params2 = extend({}, parameters);
    delete params2[missing_param];
    web.GET(url, params2, function(status_code, headers, data) {
      assert.equal(status_code, 400);
    });
  }
}],

['/register/confirm: bad email', 1, function() {
  var url = DATA.base_url + '/register/confirm';
  var parameters = {email: 'unknown@ti.com', code: '123'};
  web.GET(url, parameters, function(status_code, headers, data) {
    assert.equal(status_code, 400);
  });
}],

['/register/confirm: bad code', 1, function() {
  var url = DATA.base_url + '/register/confirm';
  var parameters = {email: 'pruyssen@af83.com', code: '123'};
  web.GET(url, parameters, function(status_code, headers, data) {
    assert.equal(status_code, 400);
  });
}],

// Success case made in '/register: post, success'

// ------------------------------------------------------

];

