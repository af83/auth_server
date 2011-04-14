var User = Backbone.Model.extend({});
var Users = Backbone.Collection.extend({
  url: '/users',
  model: User
});

var AuthServerUsersView = Backbone.View.extend({
  initialize: function() {
    this.collection.bind('refresh', _.bind(this.render, this));
  },

  render: function() {
    $('#overview').html('<h1>Users</h1>');
    $(this.el).renders('users_index', {users: this.collection.toJSON()});
    return this;
  }
});


var AuthServerUsersController = Backbone.Controller.extend({
  routes: {
    "/u": "users"
  },

  initialize: function() {
    this.users = new Users();
  },
  /**
   * Displays list of users.
   * TODO: handle permissions, no everyone should be able to see list of all users.
   */
  users: function() {
    $('#main').empty().append(new AuthServerUsersView({collection: this.users}).render().el);
    this.users.fetch();
  }
});

