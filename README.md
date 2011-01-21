# Auth Server

## Description

  auth_server is a node application acting as an authentication and authorization provider. It enables an organization to easily handle authorizations and users credentials in one place, for many web applications. It uses [mongodb](http://www.mongodb.org/) as DB.

Based on [oauth2_client_node](https://github.com/AF83/oauth2_client_node) and [oauth2_server_node](https://github.com/AF83/oauth2_server_node), it follows the [draft 10 of the OAuth2 specification](http://tools.ietf.org/html/draft-ietf-oauth-v2-10). As these projects evolve, auth_server will follow the OAuth2 specification evolutions.


The goal is to have an interface to be able to specify, for a given email, application and context, a list of roles: {application, context, email, [roles]}.
For example, I want to let the user Alice have the role "admin" on the application "trac" inside the context "af83-rd" ({'trac', 'af83-rd', 'alice@af83.com', ['admin']}). When logging to "trac", Alice is redirected to auth_server, in which she signs in using her email/password. Alice is then redirected to the application "trac" with a token. Using this token, trac can ask auth_server what roles Alice have. Alice can now administer the "af83-rd" part of the "trac" application. Specifying {'trac', '*', '*@af83.com', ['user']} will enable every person @ af83 to be user on trac.


The benefits are multiple:

 - there is only one application where Alice has to be registered (and so one set of credentials per user);
 - when developing a new application, there is no need to recreate all user registration process stuff, but only to plug the application to auth_server;
 - all the authorizations can be managed in a central place.


Of course (to do things well), auth_server is plugged to itself: setting {'auth_server', 'trac', 'bob@af83.com', ['admin']} should enable Bob to administer the authorizations for the application 'trac' on auth_server.

auth_server is functionnal (ie: users can sign in/out the the application and others applications using the service), but the administration interface lacks many features, including adding/editing authorizations. The asterik part described above is not implemented yet. Participations are welcome!


This project is alpha software, it might not be ready for production use yet.


## Similar projects

auth_server is developed together with:

 - [oauth2_client_node](https://github.com/AF83/oauth2_client_node), a connect middleware featuring an OAuth2 client.
 - [oauth2_server_node](https://github.com/AF83/oauth2_server_node), a connect middleware featuring an OAuth2 server bases.


## Usage

### Installation

Make sure libbsd-dev and gettext (xgettext and msgfmt) are installed on your system, then:

    make install
    make update_js_templates


### Run the tests

Make sure nodetk/bins is in your PATH environment variable and NODE_PATH environment variable includes node/lib directory. For more info on this, please have a look at the [nodetk README file](https://github.com/AF83/nodetk/blob/master/README.md). Then:

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

Tweak the config.js file to fit your needs, then:

    node src/server.js


## Dependencies

oauth2_server_node uses many other projects, including:

 - [connect](https://github.com/senchalabs/connect)
 - [cookie-sessions](https://github.com/caolan/cookie-sessions)
 - [connect-form](https://github.com/visionmedia/connect-form) using [node-formidable](https://github.com/felixge/node-formidable)
 - [nodetk](https://github.com/AF83/nodetk), also using [Yabble](https://github.com/jbrantly/yabble)
 - [rest-mongo](https://github.com/AF83/rest-mongo), also using [node-mongodb-native](https://github.com/christkv/node-mongodb-native)
 - [mustache.js](https://github.com/janl/mustache.js/)
 - [jQuery](http://jquery.com/)
 - [Backbone](http://documentcloud.github.com/backbone/)
 - [underscore](http://documentcloud.github.com/underscore/)
 - [node-mail](https://github.com/weaver/node-mail)
 - [bcrypt_hash](https://github.com/virtuo/bcrypt_hash)

All dependencies are included in repository or packaged via git submodules, except:
  
  - node (v0.3.1) 
    - Does not fully work with node v0.3.2 (node SSL client problem).
  - mongodb (>=v1.4)
  - libbsd-dev
  - make
  - gcc
  - xgettext and msgfmt (Debian package gettext)


## Projects and organizations using auth_server

A [wiki page](https://github.com/AF83/auth_server/wiki/Uses) lists the projects and organizations using auth_server. Don't hesitate to edit it.


## License

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


