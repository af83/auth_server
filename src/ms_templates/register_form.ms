<!DOCTYPE html>
<html>
    <head>
        <title>Register to AuthServer</title>
        <link type="text/css" rel="stylesheet" href="/css/global.css" />
        <link type="text/css" rel="stylesheet" href="/css/gui.css"/>
    </head>
    <body>
        <div id="wrapper">

            <div id="logo">
                <a href="/">
                    <img src="/img/logo_auth_server.png" alt="authServer" />
                </a>
            </div>

            <div id="main">
                <div id="content">
                    <br />
                    <h1>Register</h1>
                    {{#message}}
                    <p class="error">{{message}}</p>
                    {{/message}}
                    <form action="/register" method="post">
                        <label>Email:
                            <input type="email" name="email" value="{{email}}" required />
                        </label>
                        <br />

                        <label>Password:
                            <input type="password" name="password" value="{{password}}" required />
                        </label>
                        <br />

                        <label>Confirm password:
                            <input type="password" name="password_confirm" value="{{password_confirm}}" required />
                        </label>
                        <br />

                        <input type="submit" value="Register" />
                    </form>
                </div>
            </div>
        </div>
    </body>
</html>

