var Client = Backbone.Model.extend({
});
var Clients = Backbone.Collection.extend({
  url: '/clients',
  model: Client
});

var AuthServerClientsIndexView = Backbone.View.extend({
  initialize: function() {
    this.collection.bind('refresh', _.bind(this.render, this));
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

  render: function() {
    $('#overview').html('<h1>' + this.model.get('name') + '</h1>');
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
    this.model.save(function() {
      self.trigger("saved");
    }, function(err) {
      self.trigger("error");
    });
  },

  del: function(e) {
    e.preventDefault();
    var name = this.model.get('name');
    var redirect_uri = this.model.get('redirect_uri') || '';
    var client_label = '"'+name+'" ['+redirect_uri+']';
    var msg = "Are you sure you want to delete the client " + client_label + "?";
    if(confirm(msg)) {
      this.model.destroy({success: function() {

      }})
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
  },

  index: function() {
    document.location.hash = "/c";
  },

  clients: function() {
    new AuthServerClientsIndexView({collection: this.clients,
                                    el: $("#content")}).render();
  },

  new: function() {
    var client = new Client();
    this.clients.add(client);
    new AuthServerClientsNewView({el: $("#content"),
                                  model: client}).render()
      .bind("success", function() {
        console.log("on success");
      }).bind("error", function() {
        console.log("on error");
      });
  },

  show: function(id) {
    var onReady = _.bind(function() {
      var client = this.clients.get(id);
      new AuthServerClientShowView({el: $("#content"),
                                    model: client}).render();
    }, this);
    if (this.initialized) {
      onReady();
    } else {
      this.callbacks.push(onReady);
    }
  }
});

