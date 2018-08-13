# Auth Server

## Description

auth_server is a node application acting as an authentication and portable contact server. It uses [mongodb](http://www.mongodb.org/) as DB.

It's a part of a project named **turbulences** for creating a distributed social network.

Based on [oauth2_client_node](https://github.com/AF83/oauth2_client_node) and [oauth2_server_node](https://github.com/AF83/oauth2_server_node), it follows the [draft 10 of the OAuth2 specification](http://tools.ietf.org/html/draft-ietf-oauth-v2-10). As these projects evolve, auth_server will follow the OAuth2 specification evolutions.

The benefits are multiple:

 - there is only one application where Alice has to be registered (and so one set of credentials per user);
 - when developing a new application, there is no need to recreate all user registration process stuff, but only to plug the application to auth_server;

auth_server is functional (ie: users can sign in/out of the application and other applications using the service), but the administration interface lacks many features, including adding/editing user's contacts.

This project is alpha software, it might not be ready for production use yet.

## Similar projects

auth_server is developed together with:

 - [oauth2_client_node](https://github.com/AF83/oauth2_client_node), a connect middleware featuring an OAuth2 client.
 - [oauth2_server_node](https://github.com/AF83/oauth2_server_node), a connect middleware featuring an OAuth2 server bases.

## Usage

### Installation

Make sure gettext (xgettext and msgfmt) are installed on your system, then:

    make install
    make update_js_templates

### Run the tests

Make sure nodetk/bins is in your PATH environment variable and NODE_PATH environment variable includes node/lib directory. For more info on this, please have a look at the [nodetk README file](https://github.com/AF83/nodetk/blob/master/README.md). (looks like 'npm install .' in vendor/nodetk should do the trick)
     	Then:

    nodetests src/tests

### Updating templates

When updating the templates, they need to be "repackaged" for the web application. This can be done doing:

    make update_js_templates

or, to skip the i18n process:

    make skip

### Load some testing data in DB

This command will load some testing data in the DB:

    node src/scripts/load_data.js

### Running the server

Tweak the `config.js` file to fit your needs, then:

    node src/server.js

## Dependencies

auth_server uses many other projects, including:

 - [connect](https://github.com/senchalabs/connect)
 - [cookie-sessions](https://github.com/caolan/cookie-sessions)
 - [connect-form](https://github.com/visionmedia/connect-form) using [node-formidable](https://github.com/felixge/node-formidable)
 - [nodetk](https://github.com/AF83/nodetk) (only for testing)
 - [mustache.js](https://github.com/janl/mustache.js/)
 - [futures](https://github.com/coolaj86/futures)
 - [jQuery](http://jquery.com/)
 - [Backbone](http://documentcloud.github.com/backbone/)
 - [underscore](http://documentcloud.github.com/underscore/)
 - [node-mail](https://github.com/weaver/node-mail)
 - [node-glob](https://github.com/isaacs/node-glob)
 - node (v0.4)
 - mongodb (>=v1.4)
 - xgettext and msgfmt (Debian package gettext)

    $> git submodule update --init

    $> npm install

## Projects and organizations using auth_server

A [wiki page](https://github.com/AF83/auth_server/wiki/Uses) lists the projects and organizations using auth_server. Don't hesitate to edit it.

## API

### OAuth2

#### Obtaining End-User Authorization

    /oauth2/authorize

#### Obtaining an Access Token

    /oauth2/login

## Internal

### List clients

    GET /clients

### Create client

    POST /clients

### Update client

    PUT /clients/:id

### Delete client

    DELETE /clients/:id

### List users

    GET /users

### Update user password

    POST /me/password

### Portables contacts

We follow the current specification of [portables contacts](http://portablecontacts.net/draft-spec.html).

All filtering/sorting are not available.

Example of a portable contact record:

    {
      "displayName": "Foo Bar",
      "name": {
       "familyName": "Foo",
       "givenName": Bar"
      },
      "id": "XXXX"
    }

#### Get current user

    GET /portable_contacts/@me/@self

    $ curl --header "Authorization: OAuth TOKEN" /portable_contacts/@me/@self

#### Get all contacts from current user

    GET /portable_contacts/@me/@all

    $ curl --header "Authorization: OAuth TOKEN" /portable_contacts/@me/@all

#### Get one contact from current user

    GET /portable_contacts/@me/@all/:id

    $ curl --header "Authorization: OAuth TOKEN" /portable_contacts/@me/@all/:id

#### Create a contact

    POST /portable_contacts/@me/@all

    $ curl -X POST --header "Content-Type: application/json" --header "Authorization: OAuth TOKEN" /portable_contacts/@me/@all --data-binary @portable_contact.json

#### Update a contact

    PUT /portable_contacts/@me/@all/:id

    $ curl -X PUT --header "Content-Type: application/json" --header "Authorization: OAuth TOKEN" /portable_contacts/@me/@all/:id --data-binary @portable_contact.json

#### Delete a contact

    DELETE /portable_contacts/@me/@all/:id

    $ curl -X DELETE --header "Authorization: OAuth TOKEN" /portable_contacts/@me/@all/:id

## Changelog

* **0.1.3**

  Upgrade to mongoskin for the model layer.

* **0.1.2**

  Update doc and Makefile with latest change of npm.

  Fix index creation on mongodb.

* **0.1.1**

  Fix typo.

* **0.1.0**

  Remove authorizations.

  Add portable contacts api.

  Updated many dependencies.

## License

(c) 2011 af83

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see [http://www.fsf.org/licensing/licenses/agpl-3.0.html](http://www.fsf.org/licensing/licenses/agpl-3.0.html).
