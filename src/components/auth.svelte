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

  // dgraph imports
  import { dgraph, EnumType } from '../modules/dgraph';
  import type { Subscription } from 'rxjs';

  // stores
  import {
    showDialog,
    showSettings,
    showSnackbarMsg,
    userState
  } from '../stores/core';

  let email: string;
  let username: string;
  let displayName: string;
  let role: string;
  let userSub: Subscription;
  let showEmail = false;

  function passwordlessLogin(email?: string) {
    const url = $page.query.toString();
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
    if ($page.query.get('apiKey')) {
      if (localStorage.getItem('emailForSignIn')) {
        passwordlessLogin();
      } else {
        showEmail = true;
        showDialog.set(true);
      }
    }

    // watch user state
    userSub = user().subscribe((u) => {
      if (u) {
        showDialog.set(false);
        handleUser(u);
      } else {
        userState.set(null);
      }
    });
  });

  onDestroy(() => {
    userSub ? userSub.unsubscribe() : null;
  });

  async function handleUser(u: any) {
    const r = await new dgraph('user', dev)
      .get({ id: 1, email: 1, displayName: 1, role: 1, username: 1 })
      .filter({ email: u.email })
      .build();
    // user does not exist, create user
    if (r) {
      displayName = r.displayName;
      role = r.role;
      username = r.username;
      userState.set(r);
    } else {
      createUser(u);
    }
  }

  async function createUser(u: any) {
    const r = await new dgraph('user', dev)
      .add({ id: 1, email: 1, displayName: 1, role: 1, username: 1 })
      .set({
        email: u.email,
        displayName: u.displayName,
        username: u.username,
        link: { lid: 'link' },
        role: new EnumType('AUTHOR')
      })
      .build();
    userState.set(r);
  }

  async function updateUser(user: any) {
    const r = await new dgraph('user', dev)
      .update({ id: 1, email: 1, displayName: 1, role: 1, username: 1 })
      .filter($userState.id)
      .set(user)
      .build();
    console.log(r);
    userState.set(r);
    showSnackbarMsg.set('Your user profile has been updated!');
    showSettings.set(false);
  }
</script>

<Dialog bind:active={$showDialog}>
  <Card>
    <CardTitle>Passwordless Login</CardTitle>
    <CardText>
      <center>
        <TextField bind:value={email} dense outlined>
          Enter your email address...
        </TextField>
        <br />
        {#if showEmail}
          <span
            on:click={() => {
              passwordlessLogin(email);
              email = '';
              showEmail = false;
            }}
          >
            <Button>Login</Button>
          </span>
        {:else}
          <Button
            on:click={async () => {
              sendEmailLink($page.host, email, dev).then(() => {
                email = '';
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
          <Divider />
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

<Dialog bind:active={$showSettings}>
  <Card>
    <CardTitle>Profile Settings</CardTitle>
    <CardText>
      <TextField bind:value={displayName} dense outlined>
        Display Name
      </TextField>
      <br />
      <TextField bind:value={username} dense outlined>
        Username (discuss.dgraph.io)
      </TextField>
      <br />
      <span class="text-h6 mb-2"><b>Role: </b> {role}</span>
      <p />
      <Button
        class="secondary-color"
        on:click={() => updateUser({ displayName, username })}
      >
        Save
      </Button>
      <Button style="margin: 1em" on:click={() => showSettings.set(false)}>
        Cancel
      </Button>
    </CardText>
  </Card>
</Dialog>
