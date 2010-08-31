<h2>Authorizations:</h2>
<ul class="auths">
  {{#authorizations}}
    <li>{{email}}: 
      <form method="post" action="/authorizations/{{id}}">
        <input class="field" type="text" name="roles" value="{{roles}}" />
        <input class="field" type="submit" value="Update" />
      </form>
    </li>
  {{/authorizations}}
</ul>
