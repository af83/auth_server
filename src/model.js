/* Where are defined the DB collections  + some helpers.
 * Uses nStore, so only key -> values, on disk, append only.
 *
 * We got the following stores:
 *  - users.db
 *  - clients.db
 *  - issued_codes.db
 *
 */

require.paths.unshift(__dirname + '/../vendors/nstore/lib');


var nStore = require('nstore')
  ;


// Where is stored the data:
var data_dir = exports.data_dir = __dirname + '/../data/';

var stores = ['users', 'clients', 'issued_codes']
  , data = {}
  ;

var reload_data = exports.reload_data = function() {
  /* Recreate the stores from files 
   * in case they have been changed from the outside.
   *
   * This function should be synchronous.
   */
  stores.forEach(function(store) {
    var fpath = data_dir + store + '.db';
    data[store] = nStore(fpath);
    data[store].fpath = fpath;
  });
};
reload_data();

exports.data = data;


