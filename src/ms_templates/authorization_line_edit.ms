{{>authorization_selector}}
{{#authorization}}
  <td><input type="text" name="user" value="{{email}}"/></td>
  <td><input type="text" name="client" 
             value="{{#client}}{{name}}{{/client}}"
             /></td>
  <td><input type="text" name="context" value="{{context}}"/></td>
  <td class="roles"> > <input type="text" name="roles" value="{{roles}}"/></td>
{{/authorization}}

