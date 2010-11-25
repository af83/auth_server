
exports.db = {
  host: 'localhost',
  port: 27017,
  db_name: 'auth_server_dev'
};

var server = exports.server = {
  base_url: "http://localhost:8080",
};

var oauth2_server = exports.oauth2_server = {
  authorize_url: '/oauth2/authorize',
  process_login_url: '/oauth2/login',
  token_url: '/oauth2/token',
  name: 'Auth server'
};

var oauth2_client = exports.oauth2_client = {
  base_url: server.base_url,
  process_login_url: '/login/process',
  redirect_uri: server.base_url + '/login/process',
  login_url: '/login',
  logout_url: '/logout',
  default_redirection_url: '/',

  server_authorize_endpoint: server.base_url + oauth2_server.authorize_url,
  server_token_endpoint: server.base_url + oauth2_server.token_url,

  client_id: undefined, // Define the client_id depending on DB
  client_secret: 'some secret string',
  name: 'Auth server',
};

