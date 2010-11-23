<html>
  <head>
    <title>Register to AuthServer</title>
  </head>
  <body>
    <h1>Welcome!</h1>
    <p>You are about to register to <strong>AuthServer</strong>:</p>
    {{#message}}
      <p class="error">{{message}}</p>
    {{/message}}
    <form action="/register" method="post">
      <label>Email:
        <input type="text" name="email" value="{{email}}" />
      </label>
      <br />

      <label>Password:
        <input type="password" name="password" value="{{password}}" />
      </label>
      <br />

      <label>Confirm password:
        <input type="password" name="password_confirm" value="{{password_confirm}}" />
      </label>
      <br />

      <input type="submit" value="Register" />
    </form>
  </body>
</html>

