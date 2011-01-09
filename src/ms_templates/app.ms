<?xml version="1.0" encoding="utf-8" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">


<head>
  <title>Auth server: authentication and authorization!</title>
  <link type="text/css" rel="stylesheet" href="/css/gui.css"/>
  <link type="text/css" rel="stylesheet" href="/css/authorizations.css"/>  
  <link href="css/global.css" rel="stylesheet" type="text/css" media="screen" charset="utf-8" />
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

  <a class="signout" href="/logout">Sign out</a>

  <div id="overview">
  </div>

  <div id="main">
   <div id="content"></div>
  </div>

 </div>

  <script type="text/javascript" src="/js/libs/jquery-1.4.2.min.js"></script>
  <script type="text/javascript" src="/js/libs/sammy-0.5.4.min.js"></script>
  <script type="text/javascript" src="/js/libs/mustache.js"></script>

  <script type="text/javascript" src="/js/templates_fr.js"></script>

  <script type="text/javascript" src="/js/utils.js"></script>
  <script type="text/javascript" src="/js/routes.js"></script>

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

