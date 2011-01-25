var AuthServerAuthorizationLineView = Backbone.View.extend({
  events: {
    "click .roles": "edit_roles",
    "keypress .roles": "update_roles",
    "focusout .roles": "save_roles"
  },

  tagName: "tr",

  render: function() {
    $(this.el).renders('authorization_line', {authorization: this.model});
    return this;
  },

  edit_roles: function(e) {
    if ($(e.target).closest(".roles").hasClass('edit')) return;
    var input = this.make('input', {name: "roles", value: this.model.roles.join(', ')});
    $(e.target).closest(".roles").html(input).addClass('edit');
    input.focus();
  },

  update_roles: function(e) {
    if (e.keyCode == 13) { // ENTER
      this.save_roles(e);
    } else if (e.keyCode == 27) { // ECHAP
      this.cancel_roles();
    }
  },

  save_roles: function(e) {
    this.model.roles = _($(e.target).val().split(',')).filter(function(value) {
      return value.trim();
    }).map(function(value) {
      return value.trim();
    });
    var self = this;
    this.model.save(function() {
      self.render();
      self.trigger("saved");
    }, function() {
      self.trigger("error");
    });
  },

  cancel_roles: function() {
    this.render();
  }
});

var AuthServerAuthorizationsView = Backbone.View.extend({
  render: function() {
    $('#overview').html('<h1>Authorizations</h1>');

    $(this.el).renders('authorizations_index');
    var tbody = [];
    _(this.model).each(function(authorization) {
      var line = new AuthServerAuthorizationLineView({model: authorization}).render();
      tbody.push(line.el);
    });
    this.$('tbody').append(tbody);
    return this;
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


