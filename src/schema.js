/* Schema of application data, used by rest-mongo to generate objects */

exports.schema = {
  Client: {
    resource: '/clients',
    schema: {
      id: "Client",
      description: "An application obtaining authorization and making " +
                   "protected resource requests.",
      type: "object",

      properties: {
        id: {type: "string"},
        name: {type: "string"},
        secret: {type: "string"},
        redirect_uri: {type: "string"}
      }
    }
  },

  User: {
    schema: {
      id: "User",
      description: "A human resource owner.",
      type: "object",

      properties: {
        id: {type: "string"},
        password: {type: "string"},
        email: {type: "string"},
      }
    }
  },

  Grant: {
    schema: {
      id: "Grant",
      description: "Authorization code: " +
                   "A short-lived token representing the access grant " +
                   "provided by the end-user.  The authorization code is " +
                   "used to obtain an access token and a refresh token",
      type: "object",

      properties: {
        client_id: {type: "string"},
        user_id: {type: "string"},
        time: {type: "integer"} // timestamp
      }
    }
  },

  Authorization: {
    schema: {
      id: "Authorization",
      description: "Represents an end-user list of roles, " +
                  " given an application (client) and a context.",
      type: "object",

      properties: {
        id: {type: 'string'},
        // We just store the email, as we want to be able to give authorization
        // to users not registered yet.
        email: {type: 'string'},
        client: {'$ref': 'Client'},
        context: {'type': 'string'},
        roles: {type: 'array', items: {type: "string"}}
      }
    }
  }

}

