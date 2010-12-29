exports.email = {
  method: "dev", // smtp in prod
  conf: {
    host: "smtp-out.bearstech.lan"
  }
};

exports.db = {
  host: 'localhost',
  port: 27017,
  db_name: 'auth_server_dev'
};

var server = exports.server = {
  base_url: "http://example.com:7070",
  port: 7070,
};

var oauth2_server = exports.oauth2_server = {
  authorize_url: '/oauth2/authorize',
  process_login_url: '/oauth2/login',
  token_url: '/oauth2/token',
  name: 'Auth server',
};

var oauth2_client = exports.oauth2_client = {
  client: {
    base_url: server.base_url,
    process_login_url: '/login/process/',
    redirect_uri: server.base_url + '/login/process/',
    login_url: '/login',
    logout_url: '/logout',
    default_redirection_url: '/',
  },
  default_server: "auth_server",
  servers: {
    "auth_server": {
      server_authorize_endpoint: server.base_url + oauth2_server.authorize_url,
      server_token_endpoint: server.base_url + oauth2_server.token_url,
      client_id: undefined, // Define the client_id depending on DB
      client_secret: 'some secret string'
    },
    "facebook.com": {
      server_authorize_endpoint: "https://graph.facebook.com/oauth/authorize",
      server_token_endpoint: 'https://graph.facebook.com/oauth/access_token',
      // These are the client id and secret of a FB application only registered
      // for testing purpose... don't use it in prod!
      client_id: "c5c0789871d6a65e485bc78235639d36",
      client_secret: 'ccd74db270c0b5f1dad0a603d36d6f1b',
    }
  },
  name: 'auth_server'
};

