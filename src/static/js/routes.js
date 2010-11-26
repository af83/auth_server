
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
    R.Authorization.index({}, function(authorizations){
      $('#content').renders('authorizations_index', {
        authorizations: authorizations 
      });
    });
  });

});

