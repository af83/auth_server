
$.sammy(function() {
  
  var before_change; // if set, to be ran before every change of url hash
  var before = function() {
    if(before_change) {
      before_change();
      before_change = null;
    }
  };

  this.get('', function() {
    before();
    this.redirect('#/c');
  });
 
  this.get('#/c', function() {
    // Display a list of clients for the user to choose.
    before();
    $('#overview').html('<h1>Clients</h1>');
    $.getJSON('/clients', function(clients) {
      $('#content').renders('clients_index', {clients: clients});
    });
  });

  this.get('#/c/:client_id', function(env) {
    before();
    var client_id = env.params.client_id;
    $('#overview').html('');
    $('#content').html('');
    var client, contexts;
    var waiter = callbacks.get_waiter(2, function() {
      var data = {
        client: client,
        contexts: contexts.map(function(context) {return {
          name: context,
          href: '#/c/' + client.id + '/' + context
        }})
      };
      $('#content').renders('client_show', data);
    });
    $.getJSON('/clients/' + client_id, function(client_) {
      $('#overview').html('<h1>' + client_.name + '</h1>');
      client = client_;
      waiter();
    });
    $.getJSON('/clients/' + env.params.client_id + '/contexts', function(contexts_) {
      contexts = contexts_;
      waiter();
    });
  });

  this.post('/clients/:client_id', function(env) {
    var self = this
      , params = env.params
      ;
    $.post('/clients/' + params.client_id, {
      name: params.name,
      redirect_uri: params.redirect_uri,
      secret: params.secret
    }, function(result) {
      console.log(result);
    });
    console.log(env);
  });

  this.get('#/c/:client_id/:context', function(env) {
    /* Displays a list of authorizations (email -> roles) given a client and context.
     *
     */
    before();
    var self = this
      , params = env.params
      , context = params.context
      , client_id = params.client_id
      ;
    $('#overview').html('');
    $.getJSON('/clients/' + client_id, function(client) {
      $('#overview').html(
        '<h1>'+client.name+' > '+context+'</h1>'
      );
    });
    var url = '/authorizations?' + utils.param({
      clients: client_id,
      contexts: context
    });
    $.getJSON(url, function(authorizations) {
      $('#content').renders('authorizations', {authorizations: authorizations});
    });
  });

  this.get('#/u', function() {
    /* Displays list of users.
     */
    before();
    // TODO: handle permissions, no everyone should be able to see list of all users.
    $('#overview').html('<h1>Users</h1>');
    $('#content').renders('users_index', {users: users});
    $.getJSON('/users', function(users) {
      $('#content').renders('users_index', {users: users});
    });
  });

});

