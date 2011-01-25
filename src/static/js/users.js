
var AuthServerUsersView = Backbone.View.extend({
  render: function() {
    $('#overview').html('<h1>Users</h1>');
    $(this.el).renders('users_index', {users: this.model});
    return this;
  }
});


var AuthServerUsersController = Backbone.Controller.extend({
  routes: {
    "/u": "users"
  },

  users: function() {
    /* Displays list of users.
     */
    // TODO: handle permissions, no everyone should be able to see list of all users.
    R.User.index({}, function(users) {
      new AuthServerUsersView({el: $('#content'),
                               model: users}).render();
    });
  }
});

