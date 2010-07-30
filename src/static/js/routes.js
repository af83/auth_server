
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
    $.getJSON('/clients', function(clients) {
      $('#overview').html('<h1>Clients</h1>');
      $('#content').html('<ul></ul>');
      clients.forEach(function(client) {
        $('#content ul').append('<li><a href="#/c/' + client.id + 
                                '">' + client.name + '</a></li>');
      });
    });
  });

  this.get('#/c/:client_id', function(env) {
    before();
    var client_id = env.params.client_id;
    $('#overview').html('');
    $('#content').html(
      '<form action="/clients/'+client_id+'" method="post" >' +
      '<fieldset></fieldset></form>' +
      '<h2>Contexts:</h2><ul class="contexts"></ul>'
    );
    $.getJSON('/clients/' + client_id, function(client) {
      $('#overview').html('<h1>' + client.name + '</h1>');
      $('#content form fieldset').html(
        '<label>Client name:' +
         '<input name="name" class="field" value="'+client.name+'" />' +
        '</label><br />' +
        '<label>Client secret:' +
         '<input name="secret" class="field" value="'+client.secret+'" />' +
        '</label><br />' +
        '<label>Redirect URI:' +
         '<input name="redirect_uri" class="field" value="'+client.redirect_uri+'" />' +
        '</label><br />' +
        '<input class="field" value="Update" type="submit" />' 
      );
    });
    $.getJSON('/clients/' + env.params.client_id + '/contexts', function(contexts) {
      var list = $('#content .contexts');
      contexts.forEach(function(context) {
        list.append('<li><a href="#/c/'+client_id+'/'+context+'">'+context+'</a></li>');
      });
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
    before();
    var self = this
      , params = env.params
      , context = params.context
      , client_id = params.client_id
      ;
    $('#overview').html('');
    $('#content').html('<h2>Authorizations:</h2><ul class="auths"></ul>');
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
      $('#content .auths').append(authorizations.map(function(auth) {
        return '<li>'+auth.email+': '+auth.roles.join(', ')+'.</li>';
        //return '<li>'+JSON.stringify(auth)+'</li>';
      }).join(''));
    });
  });

  this.get('#/u', function() {
    /* Displays list of users.
     */
    before();
    // TODO: handle permissions, no everyone should be able to see list of all users.
    $('#overview').html('<h1>Users</h1>');
    $('#content').html('<ul></ul>');
    $.getJSON('/users', function(users) {
      users.forEach(function(user) {
        $('#content ul').append('<li>'+ user.email +'</li>')
      });
    });
  });

});

