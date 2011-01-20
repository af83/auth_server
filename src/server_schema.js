var hash = require('./lib/hash');

exports.schema = {
  User: {
    schema: {
      properties: {
        password: {type: "string"},
      }
    },
    methods: {
      check_password: function(password, callback, fallback) {
        hash.check(this.password, password, callback, fallback);
      },
      set_password: function(password, callback, fallback) {
        var self = this;
        hash.hash(password, function(hash) {
            self.password = hash;
            callback();
        }, fallback);
      }
    }
  },

}
