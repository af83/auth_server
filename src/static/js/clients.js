var Client = Backbone.Model.extend({
  url: '/client'
});
var Clients = Backbone.Collection.extend({
  url: '/clients',
  model: Client
});

var AuthServerClientsIndexView = Backbone.View.extend({
  initialize: function() {
    this.collection.bind('refresh', _.bind(this.render, this));
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
    $('#overview').html('<h1>' + this.model.get('name') + '</h1>');
    var data = {
      client: this.model.toJSON(),
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


var AuthServerClientsController = Backbone.Controller.extend({
  routes: {
    "": "index",
    "/c": "clients",
    "/c/new": "new",
    "/c/:id": "show"
  },

  initialize: function() {
    this.clients = new Clients();
  },

  index: function() {
    document.location.hash = "/c";
  },

  clients: function() {
    new AuthServerClientsIndexView({collection: this.clients,
                                    el: $("#content")}).render();
    this.clients.fetch();
  },

  new: function() {
    new AuthServerClientsNewView({el: $("#content"),
                                  model: new Client()}).render()
      .bind("success", function() {
        console.log("on success");
      }).bind("error", function() {
        console.log("on error");
      });
  },

  show: function(id) {
    var client = this.clients.get(id);
    new AuthServerClientShowView({el: $("#content"),
                                  model: client}).render();
  }
});

