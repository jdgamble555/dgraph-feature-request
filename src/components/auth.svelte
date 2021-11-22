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
    showSnackbarMsg,
    userState
  } from '../stores/core';

  let email: string;
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
      .get({ id: 1, email: 1, displayName: 1 })
      .filter({ email: u.email })
      .build();
    // user does not exist, create user
    if (r) {
      userState.set(r);
    } else {
      createUser(u);
    }
  }

  async function createUser(u: any) {
    const r = await new dgraph('user', dev)
      .add({ id: 1, email: 1, displayName: 1 })
      .set({
        email: u.email,
        displayName: u.displayName,
        link: { lid: 'link' },
        role: new EnumType('AUTHOR')
      })
      .build();
    userState.set(r);
  }
</script>

<Dialog bind:active={$showDialog}>
  <Card>
    <CardTitle>Passwordless Login</CardTitle>
    <CardText>
      <center>
        <TextField
          bind:value={email}
          dense
          outlined
        >Enter your email address...</TextField>
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
          <span
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
            <Button>Send Magic Link</Button>
          </span>
          <br />
          <br />
          <Divider />
          <br />
          OR
          <br />
          <br />
          <Button class="red white-text" on:click={loginWithGoogle}
            >Signin with Google</Button
          >
        {/if}
      </center>
    </CardText>
  </Card>
</Dialog>
