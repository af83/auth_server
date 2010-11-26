{{#client}}
<form action="/clients/{{id}}" method="post" >
<fieldset>
  <label>Client ID: {{id}}
    <input type="hidden" name="client_id" value="{{id}}" />
  </label><br />
  <label>Client name:
    <input type="text" name="name" class="field" value="{{name}}" />
  </label><br />
  <label>Client secret:
    <input type="text" name="secret" class="field" value="{{secret}}" />
  </label><br />
  <label>Redirect URI:
    <input type="text" name="redirect_uri" class="field" value="{{redirect_uri}}" />
  </label><br />
  <input class="field" value="Update" type="submit" />
</fieldset></form>
{{/client}}

