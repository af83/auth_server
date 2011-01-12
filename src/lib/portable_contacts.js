var discovery = require('../lib/discovery')
,   web = require('nodetk/web')
;

var PORTABLE_CONTACTS_TYPE = 'http://portablecontacts.net/spec/1.0';

exports.get_entry = function get_portable_contact_entry(authority, email, callback) {
  /**
   * Get portable contact entry corresponding to email for authority
   * callback with user entry or null
   * {
   *  "id": "ABC",
   *  "displayName": "Wendy Wellesley",
   *  "emails": [
   *    {
   *      "value": "wendy.wellesley@example.com",
   *      "type": "work",
   *      "primary": "true"
   *    }
   *  ],
   *  "accounts": [
   *    {
   *      "domain": "trac.example.com",
   *      "userid": "WWellesley"
   *    }
   *  ]
   * }
   */
  discovery.discover(authority, PORTABLE_CONTACTS_TYPE, function(url) {
    web.GET(url, {filterBy: 'emails.value',
                  filterOp: 'contains',
                  filterValue: email,
                  count: 1}, function(status, headers, body) {
                    if (status == 200) {
                      var contacts = JSON.parse(body);
                      if (contacts.totalResults == 1) callback(contacts.entry[0]);
                      else callback(null);
                    }
                  })
  });
}
