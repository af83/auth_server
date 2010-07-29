
exports.db = {
  host: 'localhost',
  port: 27017,
  db_name: 'auth_server_dev'
};

exports.oauth2 = {
  authorize_url: '/oauth/authorize',
  process_login_url: '/oauth/login',
  token_url: '/oauth/token'
};

var server = exports.server = {
  base_url: "http://localhost:8080",
  login_url: '/login',
  process_login_url: '/login/process'
};

exports.auth_server = {
  // Define the client_id depending on DB:
  client_id: undefined,
  name: 'Auth server',
  redirect_uri: server.base_url + server.process_login_url
};

