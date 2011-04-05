new AuthServerClientsController();
new AuthServerUsersController();
new AuthServerAccountController();
Backbone.history.start();

// To (re)generate client secret:
$('.generate_secret').live('click', function() {
  $('input[name=secret]').val(256);
  return false;
});
