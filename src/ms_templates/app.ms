<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">

<head>
  <title>Auth server: authentication and authorization!</title>
  <link type="text/css" rel="stylesheet" href="/css/gui.css"/>
  <link type="text/css" rel="stylesheet" href="/css/authorizations.css"/>  
  <link type="text/css" rel="stylesheet" href="/css/global.css" />
</head>

<body>
 
 <div id="wrapper">

  <div id="logo">
    <a href="/">
      <img src="img/logo_auth_server.png" alt="authServer" />
    </a>
  </div>

  <div id="nav">
    <ul>
      <li>
        <a href="#/c">Clients</a>
      </li>
      <li>
        <a href="#/u">Users</a>
      </li>
      <li>
        <a href="#/a">Authorizations</a>
      </li>
    </ul>
  </div>

  <p class="login-info">
    <span>{{email}}</span>
    <a href="#/account">Account</a>
    <a class="signout" href="/logout">Sign out</a>
  </p>

  <div id="overview">
  </div>

  <div id="main">
   <div id="content"></div>
  </div>

 </div>

  <script type="text/javascript" src="/js/libs/jquery-1.4.2.min.js"></script>
  <script type="text/javascript" src="/js/libs/underscore-min.js"></script>
  <script type="text/javascript" src="/js/libs/backbone-min.js"></script>
  <script type="text/javascript" src="/js/libs/mustache.js"></script>

  <script type="text/javascript" src="/js/templates_fr.js"></script>

  <script type="text/javascript" src="/js/utils.js"></script>
  <script type="text/javascript" src="/js/authorizations.js"></script>
  <script type="text/javascript" src="/js/users.js"></script>
  <script type="text/javascript" src="/js/accounts.js"></script>
  <script type="text/javascript" src="/js/clients.js"></script>


  <script type="text/javascript" src="/yabble.js"></script>
  <script type="text/javascript" src="/init_browser.js"></script>
  <script type="text/javascript">
    TOKEN = "{{token}}";
    require.useScriptTags();
    require.setModuleRoot('wrapped_js/');

    require.ensure([
      'util',
      'events',
      
      'rest-mongo/core',
      'rest-mongo/http_rest/jquery_backend',
    
      'nodetk/logging',
      'nodetk/orchestration/callbacks',
      'nodetk/random_str',
      'nodetk/utils',

      'browser/init',
      'schema',
    ], function() {
      require.run('browser/init');
    });
  </script>

</body>
</html>
