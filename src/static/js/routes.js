
$.sammy(function() {

  this.get('', function() {
    this.redirect('#/c');
  });
 
  this.get('#/c', function() {
    // Display a list of clients for the user to choose.
    $('#overview').html('<h1>Clients</h1>');
    R.Client.index({}, function(clients) {
      $('#content').renders('clients_index', {clients: clients});
    });
  });

  this.get('#/c/:client_id', function(env) {
    var client_id = env.params.client_id;
    $('#overview').html('');
    $('#content').html('');
    var client, contexts;
    R.Client.get({ids: client_id}, function(client) {
      $('#overview').html('<h1>' + client.name + '</h1>');
      var data = {
        client: client,
      };
      $('#content').renders('client_show', data);
    });
  });

  this.post('/clients/:client_id', function(env) {
    var self = this
      , params = env.params
      ;
    R.Client.get({ids: params.client_id}, function(client) {
      $.extend(client, {
        name: params.name,
        redirect_uri: params.redirect_uri,
        secret: params.secret
      });
      client.save(function() {
        console.log("Client updated with success.");
      }, function() {
        console.log("Error while updating client.");
      });
    });
  });

  this.get('#/c/:client_id/:context', function(env) {
    /* Displays a list of authorizations (email -> roles) given a client and context.
     *
     */
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
    // TODO: handle permissions, no everyone should be able to see list of all users.
    // TODO: don't send passwords hashs
    $('#overview').html('<h1>Users</h1>');
    R.User.index({}, function(users) {
      $('#content').renders('users_index', {users: users});
    });
  });


  this.get('#/a', function() {
    /* Displays list of all authorizations. */
    $('#overview').html('<h1>Authorizations</h1>');
    $('#content').renders('waiting');
    var authorizations;
    var waiter = callbacks.get_waiter(2, function() {
      $('#content').renders('authorizations_index', {
        authorizations: authorizations 
      });
    });
    R.Client.index({}, waiter);
    R.Authorization.index({}, function(auths) {
      authorizations = auths;
      waiter();
    });
  });

});

