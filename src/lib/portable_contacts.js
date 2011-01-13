var discovery = require('../lib/discovery')
,   web = require('nodetk/web')
;

var PORTABLE_CONTACTS_TYPE = 'http://portablecontacts.net/spec/1.0';

var get_portable_contact_entry = exports.get_entry = function(authority, email, callback) {
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
                  filterOp: 'equals',
                  filterValue: email,
                  count: 1}, function(status, headers, body) {
                    if (status == 200) {
                      var contacts = JSON.parse(body);
                      if (contacts.totalResults == 1) callback(contacts.entry[0]);
                      else callback(null);
                    }
                    else {
                      callback(null);
                    }
                  })
  });
}

var get_account_userid = exports.get_account_userid = function(domain, authority, email, callback) {
  /* Get userid corresponding to email for given domain using specified authority.
   *
   * Arguments:
   *  - domain: string, ex: trac.example.com
   *  - authority: string, ex: example.com
   *  - email: string, ex: john@example.com
   *  - callback: to be call with userid or null.
   *
   */
  get_portable_contact_entry(authority, email, function(entry) {
    if(!entry) return callback(null);
    var accounts = entry.accounts || {};
    var domains = accounts.filter(function(account) {return account.domain == domain});
    if(domains.length != 1) return callback(null);
    callback(domains[0].userid || null);
  });
};
