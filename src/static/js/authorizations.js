var AuthServerAuthorizationLineView = Backbone.View.extend({
  events: {
    "keyup input[type=text]": "keypress_authorization",
    "click input[type=text]": "stop_propagation",
    "click": "selection",
    "dblclick": "edit"
  },

  tagName: "tr",

  render: function() {
    var tmpl_name = 'authorization_line';
    if(this.options.editable) tmpl_name += '_edit';
    $(this.el).renders(tmpl_name, {
      authorization: this.model
    , selected: this.options.selected
    }).toggleClass('selected', Boolean(this.options.selected));
    return this;
  },

  stop_propagation: function(e) {
    e.stopImmediatePropagation();    
  },

  keypress_authorization: function(e) {
    if (e.keyCode == 13) { // ENTER
      this.save_authorization(e);
    } else if (e.keyCode == 27) { // ECHAP
      this.cancel_authorization();
    }
  },

  save_authorization: function(e) {
    var authorization = this.model;
    var self = this;
    // check client exists:
    var client_input = self.$('input[name=client]');
    var client_name = client_input.val().trim();
    R.Client.index({query: {name: client_name}}, function(clients) {
      if(clients.length < 1) {
        console.error('This client does not exist');
        client_input.focus();
        return;
      }
      authorization.client = clients[0];
      // email and context are "free":
      authorization.email = self.$('input[name=user]').val().trim();
      authorization.context = self.$('input[name=context]').val().trim();
      // save roles:
      authorization.roles = self.$('input[name=roles]').val()
                              .split(',').filter(function(value) {
        return value.trim();
      }).map(function(value) {
        return value.trim();
      });
      authorization.save(function() {
        delete self.options.delete_;
        $.extend(self.options, {
          editable: false,
          selected: false
        });
        self.render();
        self.trigger("Authorization saved");
      }, function() {
        self.trigger("Error while saving authorization");
      });
    });
  },

  cancel_authorization: function() {
    if(this.options.delete_) return this.options.delete_();
    $.extend(this.options, {
      editable: false,
      selected: false
    });
    this.render();
  },

  selection: function(e) {
    var checkbox = this.$('.selector')[0];
    var selected = checkbox.checked;
    if(e.target != checkbox) selected = !selected;
    this.select(selected);
  },

  select: function(selected) {
    this.options.selected = selected;
    this.$('.selector').attr('checked', selected);
    $(this.el).toggleClass('selected', selected);
  },

  edit: function(e) {
    $.extend(this.options, {
      editable: true,
      selected: true
    });
    this.render();
    this.$('input[name=user]').focus();
  }
});

var AuthServerAuthorizationsView = Backbone.View.extend({
  events: {
    "click input.delete": "del",
    "click input.new": "new_authorization",
    "click a[href=#select_all]": "select_all",
    "click a[href=#select_none]": "select_none"
  },

  render: function() {
    $('#overview').html('<h1>Authorizations</h1>');

    $(this.el).renders('authorizations_index');
    var tbody = [];
    _(this.model).each(function(authorization) {
      var line = new AuthServerAuthorizationLineView({
        model: authorization
      }).render();
      tbody.push(line.el);
      authorization.view = line;
    });
    this.$('tbody').append(tbody);
    return this;
  },

  del: function() {
    var self = this;
    var to_delete = [], ids_to_delete = [], to_keep = [];
    _(this.model).each(function(authorization) {
      if(authorization.view.options.selected) {
        to_delete.push(authorization);
        authorization.id && ids_to_delete.push(authorization.id);
      }
      else to_keep.push(authorization);
    });
    R.Authorization.delete_({ids: ids_to_delete}, function() {
      self.model = to_keep;
      to_delete.forEach(function(authorization) {
        authorization.view.remove();
      });
      console.log("Authorization(s) deleted.");
    }, function(err) {
      console.error('Could not delete the authorizations:', err);
    });
  },

  new_authorization: function() {
    var self = this;
    var authorization = new R.Authorization();
    var line = new AuthServerAuthorizationLineView({
      model: authorization,
      editable: true,
      selected: true,
      delete_: function() {
        line.remove();
        self.model = _.without(self.model, authorization);
      }
    }).render();
    authorization.view = line;
    this.model.push(authorization);
    this.$('tbody').append(line.el);
    line.$('input[name=user]').focus();
  },

  select: function(selected) {
    _(this.model).each(function(authorization) {
      authorization.view.select(selected);
    });
    return false;
  },

  select_all: function() {return this.select(true)},
  select_none: function() {return this.select(false)}
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


