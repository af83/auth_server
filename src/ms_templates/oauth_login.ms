<!DOCTYPE html>
<html>
    <head>
        <title>Login</title>
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
                    <h1>Welcome!</h1>
                    <p>You are about to signin to <strong>{{client_name}}</strong>
                        using <strong>{{server_name}}</strong>:</p>

                    <form action="{{action}}" method="post">
                        <input type="hidden" name="info" value="{{info}}" />

                        <label>Email:
                            <input type="email" name="email" required />
                        </label>
                        <br />

                        <label>Password:
                            <input type="password" name="password" required />
                        </label>
                        <br />

                        <input type="submit" value="Sign in" />
                    </form>
                    <p>You don't have an account? <a href="/register">Register</a></p>
                    <p><a href="/login/delegate?provider=facebook.com&info={{info}}">
                            Login with Facebook
                    </a></p>
                </div>
            </div>

        </div>
    </body>
</html>
