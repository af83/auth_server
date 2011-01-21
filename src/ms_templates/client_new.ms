<form action="/clients" method="post">
<fieldset>
  <label>Client name:
    <input type="text" name="name" class="field" value="{{name}}" required />
  </label><br />
  <label>Client secret:
    <input type="text" name="secret" class="field" value="{{secret}}" required />
  </label>
  <a href="#" class="generate_secret">Generate random string</a>
  <br />
  <label>Redirect URI:
    <input type="text" name="redirect_uri" class="field" value="{{redirect_uri}}" />
  </label><br />
  <input class="button" value="Create" type="submit" />
</fieldset></form>
