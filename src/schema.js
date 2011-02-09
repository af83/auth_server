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
    resource: '/users',
    schema: {
      id: "User",
      description: "A human resource owner.",
      type: "object",

      properties: {
        id: {type: "string"},
        displayName: {type: "string"},
        email: {type: "string"},
        confirmed: {type: "integer"}, // 1 if registration confirmed
        contacts: {}
      }
    },
    methods: {
      toPortableContact: function() {
        return {
          id: this.id, // TODO: should an hash of clientid + mongodb id
          displayName: this.displayName,
          emails: [{value: this.email}]
        };
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
        code: {type: "string"}, // The code sent to client is: grant.id|grant.code
        time: {type: "integer"}, // timestamp
        redirect_uri: {type: "string"},
        additional_info: {type: "object"}
      }
    }
  }
}

