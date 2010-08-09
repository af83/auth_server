{{#client}}
<form action="/clients/{{id}}" method="post" >
<fieldset>
  <label>Client ID: {{id}}</label><br />
  <label>Client name:
    <input name="name" class="field" value="{{name}}" />
  </label><br />
  <label>Client secret:
    <input name="secret" class="field" value="{{secret}}" />
  </label><br />
  <label>Redirect URI:
    <input name="redirect_uri" class="field" value="{{redirect_uri}}" />
  </label><br />
  <input class="field" value="Update" type="submit" />
</fieldset></form>
{{/client}}

<h2>Contexts:</h2>
<ul class="contexts">
  {{#contexts}}
    <li><a href="{{href}}">{{name}}</a></li>
  {{/contexts}}
</ul>
