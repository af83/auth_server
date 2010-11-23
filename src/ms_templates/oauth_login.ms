<html>
  <head>
    <title>Login</title>
  </head>
  <body>
    <h1>Welcome!</h1>
    <p>You are about to signin to <strong>{{client_name}}</strong>
      using <strong>{{server_name}}</strong>:</p>
    <form action="{{action}}" method="post">
      These should be hidden (and could be assymetrically crypted in one field...): 
      <br />

      client_id & name:
      <input type="text" name="client_id" value="{{client_id}}" />
      <input type="text" name="client_name" value="{{client_name}}" />
      <br />

      redirect_uri:
      <input type="text" name="redirect_uri" value="{{redirect_uri}}" />
      <br />

      state:
      <input type="text" name="state" value="{{state}}" />
      <br />

      signature:
      <input type="text" name="signature" value="{{signature}}" />
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

