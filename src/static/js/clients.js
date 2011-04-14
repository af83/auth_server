var Client = Backbone.Model.extend({
  urlRoot: '/clients'
});
var Clients = Backbone.Collection.extend({
  url: '/clients',
  model: Client
});

var AuthServerClientsIndexView = Backbone.View.extend({
  initialize: function() {
    this.collection.bind('refresh', _.bind(this.render, this));
    this.collection.bind('remove', _.bind(this.render, this));
    this.collection.bind('add', _.bind(this.render, this));
  },
  render: function() {
    // Display a list of clients for the user to choose.
    $('#overview').html('<h1>Clients</h1>');
    $(this.el).renders('clients_index', {clients: this.collection.toJSON()});
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
    var key = input.attr('name');
    var obj = {};
    obj[key] = input.val();
    this.model.set(obj);
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

  initialize: function() {
    this.model.bind('change:name', _.bind(this.renderTitle, this));
  },

  renderTitle: function() {
    $('#overview').html('<h1>' + this.model.get('name') + '</h1>');
  },

  render: function() {
    this.renderTitle();
    var data = {
      client: this.model.toJSON(),
    };
    $(this.el).renders('client_show', data);
    return this;
  },

  update_model: function(e) {
    var input = $(e.originalTarget);
    var key = input.attr('name');
    var obj = {};
    obj[key] = input.val();
    this.model.set(obj);
  },

  save: function(e) {
    e.preventDefault();
    var self = this;
    this.model.save({}, {success: function() {
      self.model.trigger('updated', self.model);
    }});
  },

  del: function(e) {
    e.preventDefault();
    var name = this.model.get('name');
    var redirect_uri = this.model.get('redirect_uri') || '';
    var client_label = '"'+name+'" ['+redirect_uri+']';
    var msg = "Are you sure you want to delete the client " + client_label + "?";
    if(confirm(msg)) {
      this.model.destroy();
    }
  }
});


var AuthServerClientsController = Backbone.Controller.extend({
  routes: {
    "": "index",
    "/c": "clients",
    "/c/new": "new",
    "/c/:id": "show"
  },

  callbacks : [],

  initialize: function() {
    this.clients = new Clients();
    this.clients.bind('refresh', _.bind(function() {
      this.initialized = true;
      this.callbacks.forEach(function(fun) {
        fun();
      });
    }, this));
    this.clients.fetch();
    // clean all new models
    this.bind('all', _.bind(function(e) {
      if (e == 'route:new') return;
      this.clients.remove(this.clients.filter(function(client) {
        return client.isNew();
      }));
    }, this));
  },

  index: function() {
    document.location.hash = "/c";
  },

  clients: function() {
    this.render(new AuthServerClientsIndexView({collection: this.clients}));
  },

  new: function() {
    var client = new Client();
    this.clients.add(client);
    client.bind('change:id', function(e) {
      document.location.hash = '#/c';
    });
    this.render(new AuthServerClientsNewView({model: client}));
  },

  show: function(id) {
    var onReady = _.bind(function() {
      var client = this.clients.get(id);
      if (!client) return document.location.hash = "#/c";
      this.render(new AuthServerClientShowView({model: client}));
      client.bind('destroy', function(e) {
        document.location.hash = "#/c";
      });
      client.bind('updated', function(e) {
        document.location.hash = "#/c";
      });
    }, this);
    if (this.initialized) {
      onReady();
    } else {
      this.callbacks.push(onReady);
    }
  },

  render: function(view) {
    $('#main').empty().append(view.render().el);
  }
});
