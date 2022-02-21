<script lang="ts">
  // svelte imports
  import { dev } from '$app/env';
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';

  import {
    confirmSignIn,
    user,
    loginWithGoogle,
    sendEmailLink
  } from '../modules/firebase';

  import { User } from '../modules/user';

  // materialify
  import {
    Button,
    Dialog,
    Card,
    CardTitle,
    TextField,
    CardText,
    Divider
  } from 'svelte-materialify';

  // stores
  import {
    showDialog,
    showAuthSettings,
    showSnackbarMsg,
    userState
  } from '../stores/core';
  import type { Unsubscriber } from 'svelte/store';

  let userRec: {
    email: string;
    username: string;
    displayName: string;
    role: string;
  };

  let userSub: Unsubscriber;
  let showEmail = false;

  let userService = new User(dev);

  function passwordlessLogin(email?: string) {
    const url = $page.url.searchParams.toString();
    confirmSignIn(url, email).then((s) => {
      if (s) {
        showSnackbarMsg.set('You are now signed in!');
      } else {
        showSnackbarMsg.set('Your sign in link is expired!');
      }
    });
  }

  onMount(() => {
    // passwordless login signin
    if ($page.url.searchParams.get('apiKey')) {
      if (localStorage.getItem('emailForSignIn')) {
        passwordlessLogin();
      } else {
        showEmail = true;
        showDialog.set(true);
      }
    }

    // watch user state
    userSub = user.subscribe(async (u: any) => {
      // logged in
      if (u) {
        showDialog.set(false);
        // get user
        let r = await userService.getUser(u);
        // user does not exist, create user
        if (!r) {
          r = await userService.createUser(u);
        }
        userRec.displayName = r.displayName;
        userRec.role = r.role;
        userRec.username = r.username;
        userState.set(r);
        // not logged in
      } else {
        userState.set(null);
      }
    });
  });

  onDestroy(() => {
    userSub ? userSub() : null;
  });

  async function updateUser(user: any) {
    const r = await userService.updateUser($userState.id, user);
    userState.set(r);
    showSnackbarMsg.set('Your user profile has been updated!');
    showAuthSettings.set(false);
  }
</script>

<Dialog bind:active={$showDialog}>
  <Card>
    <CardTitle>Passwordless Login</CardTitle>
    <CardText>
      <center>
        <TextField bind:value={userRec.email} dense outlined>
          Enter your email address...
        </TextField>
        <br />
        {#if showEmail}
          <span
            on:click={() => {
              passwordlessLogin(userRec.email);
              userRec.email = '';
              showEmail = false;
            }}
          >
            <Button>Login</Button>
          </span>
        {:else}
          <Button
            on:click={async () => {
              sendEmailLink($page.url.host, userRec.email, dev).then(() => {
                userRec.email = '';
                showDialog.set(false);
                showSnackbarMsg.set(
                  'Your link has been sent to your email! Check your junk folder!'
                );
              });
            }}
          >
            Send Magic Link
          </Button>
          <br />
          <br />
          <Divider inset />
          <br />
          OR
          <br />
          <br />
          <Button class="red white-text" on:click={loginWithGoogle}>
            Signin with Google
          </Button>
        {/if}
      </center>
    </CardText>
  </Card>
</Dialog>

<Dialog bind:active={$showAuthSettings}>
  <Card>
    <CardTitle>Profile Settings</CardTitle>
    <CardText>
      <TextField bind:value={userRec.displayName} dense outlined>
        Display Name
      </TextField>
      <br />
      <TextField bind:value={userRec.username} dense outlined>
        Username (discuss.dgraph.io)
      </TextField>
      <br />
      <span class="text-h6 mb-2"><b>Role: </b> {userRec.role}</span>
      <p />
      <Button
        class="secondary-color"
        on:click={() =>
          updateUser({
            displayName: userRec.displayName,
            username: userRec.username
          })}
      >
        Save
      </Button>
      <Button style="margin: 1em" on:click={() => showAuthSettings.set(false)}>
        Cancel
      </Button>
    </CardText>
  </Card>
</Dialog>
