
var AuthServerAccountView = Backbone.View.extend({
  events: {
    "submit": "update"
  },
  /**
   * Display account page
   */
  render: function() {
    $('#overview').html('<h1>Your account</h1>');
    $(this.el).renders('account');
  },
  /**
   * Process password update
   */
  update: function(e) {
    e.preventDefault();
    this.$(".errors").html('');
    var params = {};
    _($(e.target).serializeArray()).each(function(p) {
      params[p.name] = p.value;
    });
    var self = this;
    if (params.new_password != params.new_password_confirm) {
      this.$(".errors").html('Passwords do not match.');
    } else {
      $.ajax({url: "/me/password",
              type: 'post',
              dataType: 'json',
              data: {current_password: params.current_password,
                     new_password    : params.new_password},
              success: function() {
                self.trigger("saved");
              },
              error: function(xhr) {
                $(".errors").html(JSON.parse(xhr.responseText).error);
              }});
    }
  }
});

var AuthServerAccountController = Backbone.Controller.extend({
  routes: {
    "/account": "account"
  },

  account: function() {
    new AuthServerAccountView({el: $("#content")}).render();
  }
});

