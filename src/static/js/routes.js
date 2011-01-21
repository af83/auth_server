var AuthServerClientsIndexView = Backbone.View.extend({
  render: function() {
    // Display a list of clients for the user to choose.
    $('#overview').html('<h1>Clients</h1>');
    $(this.el).renders('clients_index', {clients: this.model});
    return this;
  }
});

var AuthServerClientsNewView = Backbone.View.extend({
  events: {
    "input": "update_model",
    "submit": "save"
  },

  render: function() {
    $('#overview').html('<h1>Create a new client</h1>');
    $(this.el).renders('client_new');
    return this;
  },

  update_model: function(e) {
    var input = $(e.originalTarget);
    this.model[input.attr('name')] = input.val();
  },

  save: function(e) {
    e.preventDefault();
    var self = this;
    this.model.save(function() {
      self.trigger("success");
    }, function(err) {
      self.trigger("error");
    });
  }
});

var AuthServerClientShowView = Backbone.View.extend({
  events: {
    "input": "update_model",
    "submit": "save",
    "click .delete": "del"
  },

  render: function() {
    $('#overview').html('<h1>' + this.model.name + '</h1>');
    var data = {
      client: this.model,
    };
    $(this.el).renders('client_show', data);
    return this;
  },

  update_model: function(e) {
    var input = $(e.originalTarget);
    this.model[input.attr('name')] = input.val();
  },

  save: function(e) {
    e.preventDefault();
    var self = this;
    this.model.save(function() {
      self.trigger("saved");
    }, function(err) {
      self.trigger("error");
    });
  },

  del: function(e) {
    e.preventDefault();
    var self = this;
    var name = this.model.name;
    var redirect_uri = this.model.redirect_uri;
    var client_label = '"'+name+'" ['+redirect_uri+']';
    var msg = "Are you sure you want to delete the client " +
      client_label + "?" +
      "\nAll corresponding authorizations will also be deleted!";
    if(confirm(msg)) {
      this.model.delete_(function() {
        self.trigger("deleted");
      }, function() {
        self.trigger("error");
      });
    }
  }
});

var AuthServerUsersView = Backbone.View.extend({
  render: function() {
    $('#overview').html('<h1>Users</h1>');
    $(this.el).renders('users_index', {users: this.model});
    return this;
  }
});

var AuthServerAuthorizationsView = Backbone.View.extend({
  render: function() {
    $('#overview').html('<h1>Authorizations</h1>');
    $(this.el).renders('authorizations_index', {authorizations: this.model});
    return this;
  }
});

var AuthServerClientsController = Backbone.Controller.extend({
  routes: {
    "": "index",
    "/c": "clients",
    "/c/new": "new",
    "/c/:id": "show"
  },

  index: function() {
    document.location.hash = "/c";
  },

  clients: function() {
    R.Client.index({}, function(clients) {
      new AuthServerClientsIndexView({model: clients,
                                      el: $("#content")}).render();
    });
  },

  new: function() {
    new AuthServerClientsNewView({el: $("#content"),
                                  model: new R.Client()}).render()
      .bind("success", function() {
        console.log("on success");
      }).bind("error", function() {
        console.log("on error");
      });
  },

  show: function(id) {
    R.Client.get({ids: id}, function(client) {
      new AuthServerClientShowView({el: $("#content"),
                                    model: client}).render();
    });
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

var AuthServerAuthorizationsController = Backbone.Controller.extend({
  routes: {
    "/a": "authorizations"
  },

  authorizations: function() {
    /* Displays list of all authorizations. */
    var authorizations;
    var waiter = callbacks.get_waiter(2, function() {
      new AuthServerAuthorizationsView({el: $('#content'),
                                        model: authorizations}).render();
    });
    R.Client.index({}, waiter);
    R.Authorization.index({}, function(auths) {
      authorizations = auths;
      waiter();
    });
  }
});

var AuthServerAccountView = Backbone.View.extend({
  events: {
    "submit": "update"
  },

  render: function() {
    /** Display account page */
    $('#overview').html('<h1>Your account</h1>');
    $(this.el).renders('account');
  },

  update: function(e) {
    /** Process password update */
    e.preventDefault();
    this.$(".errors").html('');
    var params = {};
    _($(e.target).serializeArray()).each(function(p) {
      params[p.name] = p.value;
    });
    var self = this;
    if (params.new_password != params.new_password_confirm) {
      this.$(".errors").html('Passwords do not match.');
    } else {
      $.ajax({url: "/me/password",
              type: 'post',
              dataType: 'json',
              data: {current_password: params.current_password,
                     new_password    : params.new_password,
                     token           : TOKEN},
              success: function() {
                self.trigger("saved");
              },
              error: function(xhr) {
                $(".errors").html(JSON.parse(xhr.responseText).error);
              }});
    }
  }
});

var AuthServerAccountController = Backbone.Controller.extend({
  routes: {
    "/account": "account"
  },

  account: function() {
    new AuthServerAccountView({el: $("#content")}).render();
  }
});
