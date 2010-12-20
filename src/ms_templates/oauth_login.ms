<html>
  <head>
    <title>Login</title>
  </head>
  <body>
    <h1>Welcome!</h1>
    <p>You are about to signin to <strong>{{client_name}}</strong>
      using <strong>{{server_name}}</strong>:</p>
    <form action="{{action}}" method="post">
      Info associated with request (should be crypted): 
      <input type="text" name="info" value="{{info}}" />
      <br />

      These should be what the user sees:
      <br />

      <label>Email:
        <input type="text" name="email" value="pruyssen@af83.com" />
      </label>
      <br />

      <label>Password (1234):
        <input type="password" name="password" value="1234" />
      </label>
      <br />

      <input type="submit" value="Sign in" />
    </form>
    <p>You don't have an account? <a href="/register">Register</a></p>
  </body>
</html>

