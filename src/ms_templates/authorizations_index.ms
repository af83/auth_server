<p>index of authorizations</p>
<table class="auths">
 <col class="email" />
 <col class="client" />
 <col class="context" />
 <col class="roles" />
 <thead>
  <tr>
     <th>E-mail</th>
     <th>Client id</th>
     <th>Context</th>
     <th>Roles</th>
  </tr>
 </thead>
 <tbody>
 {{#authorizations}}
  <tr>
    <td>{{email}}</td>
    <td>{{#client}}{{id}}{{/client}}</td>
    <td>{{context}}</td>
    <td> > {{#roles}}<span class="role">{{.}}</span>{{/roles}}</td>
  </tr>
 {{/authorizations}}
 </tbody>
</table>
