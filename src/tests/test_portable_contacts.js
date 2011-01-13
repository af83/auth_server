var assert = require('./init').assert;

var portable_contacts = require('../lib/portable_contacts')
,   get_entry = portable_contacts.get_entry
,   discovery = require('../lib/discovery')
,   web = require('nodetk/web')
;

var _discover = discovery.discover;
var _GET = web.GET;

exports.setup = function(callback) {
  discovery.discover = function(host, service, callback, fallback) {
    callback('');
  }
  callback();
};

exports.module_close = function(callback) {
  discovery.discover = _discover;
  web.get = _GET;
  callback();
};

exports.tests = [

['entry not found', 5, function() {
  var result = {
    "startIndex": 0,
    "itemsPerPage": 10,
    "totalResults": 0,
    "entry": []
  };
  discovery.discover = function(host, service, callback, fallback) {
    assert.equal(host, 'example.com');
    assert.equal(service, 'http://portablecontacts.net/spec/1.0');
    callback('http://example.com/portablecontacts/');
  };
  web.GET = function(url, query, callback, fallback) {
    assert.equal(url, 'http://example.com/portablecontacts/');
    assert.deepEqual(query, {filterBy: 'emails.value',
                             filterOp: 'equals',
                             filterValue: 'plop@example.com',
                             count: 1});
    callback(200, {}, JSON.stringify(result));
  };
  get_entry("example.com", "plop@example.com", function(entry) {
    assert.equal(entry, null);
  });
}],

['email found with single email', 1, function() {
  var result = {
    "startIndex": 0,
    "itemsPerPage": 10,
    "totalResults": 1,
    "entry": [
      {"id": "ABC",
       "displayName": "Wendy Wellesley",
       "emails": [
         {
           "value": "wendy.wellesley@example.com",
           "type": "work",
           "primary": "true"
         }
       ]
      }
    ]
  };
  discovery.discover = function(host, service, callback, fallback) {
    callback('http://example.com/portablecontacts/');
  };
  web.GET = function(url, query, callback, fallback) {
    callback(200, {}, JSON.stringify(result));
  };
  get_entry("example.com", "john@example.com", function(res) {
    assert.deepEqual(res, result.entry[0]);
  });
}],
];
