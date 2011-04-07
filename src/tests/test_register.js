
var DATA = require('./init').init(exports)
  , assert = DATA.assert
  , inspect = DATA.inspect
  ;

var request = require('request')
  , qs = require('querystring')
  , Futures = require('futures')
;

var hash = require('../lib/hash')
  , extend = require('../lib/merger').extend
  , model = require('../model')
;


exports.tests = [

['/register: form to register', 2, function() {
  var url = DATA.base_url + '/register';
  request.get({uri: url}, function(err, response, body) {
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['content-type'], 'text/html');
  });
}],

// ------------------------------------------------------

['/register: post, missing data', 6, function() {
  var url = DATA.base_url + '/register';
  var params = {email: 'ti@ti.com', password: 'toto', password_confirm: 'toto'};
  for(var missing_attr in params) {
    var params2 = extend({}, params);
    delete params2[missing_attr];
    request.post({uri: url,
                  headers: {'Content-type': 'application/x-www-form-urlencoded'},
                  body: qs.stringify(params2)}, function(err, response, body) {
      assert.equal(response.statusCode, 400);
      assert.equal(response.headers['content-type'], 'text/html');
    });
  }
}],

['/register: post, mismatching password', 2, function() {
  var url = DATA.base_url + '/register';
  var params = {email: 'ti@ti.com', password: 'toto', password_confirm: 'titi'};
  request.post({uri: url,
                headers: {'Content-type': 'application/x-www-form-urlencoded'},
                body: qs.stringify(params)}, function(err, response, body) {
    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['content-type'], 'text/html');
  });
}],

['/register: post, already registered user', 3, function() {
  model.User.getByEmail('pruyssen@af83.com', function(err, pierre) {
    var json1 = pierre.toJSON();
    var params = {email: pierre.get('email'), password: 'p', password_confirm: 'p'};
    var url = DATA.base_url + '/register';
    request.post({uri: url,
                  headers: {'Content-type': 'application/x-www-form-urlencoded'},
                  body: qs.stringify(params),
                  followRedirect: false}, function(err, response, body) {
      // If an email is sent, it will trigger an error.
      assert.equal(response.statusCode, 303);
      assert.equal(response.headers['location'], DATA.base_url+'/register/success');
      assert.deepEqual(json1, pierre.toJSON());
    });
  });
}],

['/register: post, success', 10, function() {
  var confirmation_link, new_user;
  var join = Futures.join();
  join.add(function() {
    var future = Futures.future();
    DATA.add_expected_email(function(destination, subject, body) {
      assert.equal(destination, 'ti@ti.com');
      assert.equal(subject, 'AuthServer: registration confirmation');
      confirmation_link = body;
      future.deliver();
    });
    return future;
  }());
  join.add(function() {
    var future = Futures.future();
    var url = DATA.base_url + '/register';
    var params = {email: 'ti@ti.com', password: 'titi', password_confirm: 'titi'};
    request.post({uri: url,
                  headers: {'Content-type': 'application/x-www-form-urlencoded'},
                  body: qs.stringify(params),
                  followRedirect: false},
                 function(err, response, body) {
                   assert.equal(response.statusCode, 303);
                   assert.equal(response.headers['location'], DATA.base_url+'/register/success');
                   // Check the user has been added and is not activated:
                   model.User.getByEmail('ti@ti.com', function(err, user) {
                     new_user = user;
                     future.deliver();
                   });
                 });
    return future;
  }());
  join.when(function() {
    hash.check(new_user.get('password'), 'titi', function(good) {
      assert.ok(good);
    }, function(err) {assert.ok(false, err)});
    assert.equal(new_user.get('confirmed'), undefined);
    // check confirmation_link:
    request.get({uri: confirmation_link,
                 followRedirect: false}, function(err, response, body) {
      assert.equal(response.statusCode, 303);
      assert.equal(response.headers['location'], DATA.base_url+'/');
      var user = model.User.getById(new_user.get('id'), function(err, user) {
        assert.equal(err, null);
        assert.equal(user.get('confirmed'), 1);
      });
    });
  });
}],

// ------------------------------------------------------

['/register/success: success page', 2, function() {
  var url = DATA.base_url + '/register/success';
  request.get({uri: url}, function(err, response, body) {
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['content-type'], 'text/html');
  });
}],

// ------------------------------------------------------

['/register/confirm: Missing parameters', 2, function() {
  var url = DATA.base_url + '/register/confirm';
  var parameters = {email: 'ti@ti.com', code: '123'};
  for(var missing_param in parameters) {
    var params2 = extend({}, parameters);
    delete params2[missing_param];
    request.get({uri: url +"?"+ qs.stringify(params2)}, function(err, response, body) {
      assert.equal(response.statusCode, 400);
    });
  }
}],

['/register/confirm: bad email', 1, function() {
  var url = DATA.base_url + '/register/confirm';
  var parameters = {email: 'unknown@ti.com', code: '123'};
  request.get({uri: url +"?"+ qs.stringify(parameters)}, function(err, response, body) {
    assert.equal(response.statusCode, 400);
  });
}],

['/register/confirm: bad code', 1, function() {
  var url = DATA.base_url + '/register/confirm';
  var parameters = {email: 'pruyssen@af83.com', code: '123'};
  request.get({uri: url +"?"+ qs.stringify(parameters)}, function(err, response, body) {
    assert.equal(response.statusCode, 400);
  });
}],

// Success case made in '/register: post, success'

// ------------------------------------------------------

];
