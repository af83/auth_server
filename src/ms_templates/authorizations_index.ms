<p>index of authorizations</p>
<table class="auths">
 <col class="email" />
 <col class="client" />
 <col class="context" />
 <col class="roles" />
 <thead>
  <tr>
     <th>User E-mail</th>
     <th>Client</th>
     <th>Context</th>
     <th>Roles</th>
  </tr>
 </thead>
 <tbody>
 {{#authorizations}}
  <tr>
    <td>{{email}}</td>
    <td>{{#client}}<a href="#/c/{{id}}" title="{{redirect_uri}}">{{name}}</a>{{/client}}</td>
    <td>{{context}}</td>
    <td> > {{#roles}}<span class="role">{{.}}</span>{{/roles}}</td>
  </tr>
 {{/authorizations}}
 </tbody>
</table>
