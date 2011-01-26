<td><input type="checkbox" class="selector" {{#selected}}checked="checked"{{/selected}} /></td>
{{#authorization}}
  <td>{{email}}</td>
  <td>{{#client}}<a href="#/c/{{id}}" title="{{redirect_uri}}">{{name}}</a>{{/client}}</td>
  <td>{{context}}</td>
  <td class="roles"> > {{#roles}}<span class="role">{{.}}</span>{{/roles}}</td>
{{/authorization}}
