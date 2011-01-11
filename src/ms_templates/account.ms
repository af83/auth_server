<form action="/account" method="post">
  <fieldset>
    <legend>Update your password</legend>
    <p class="errors"></p>
    <label>
      Current password:
      <input type="password" name="current_password" required />
    </label><br />
    <label>
      New password:
      <input type="password" name="new_password" required />
    </label><br />
    <label>
      Confirm new password:
      <input type="password" name="new_password_confirm" required />
    </label><br />
    <input type="submit" value="Update" />
  </fieldset>
</form>
