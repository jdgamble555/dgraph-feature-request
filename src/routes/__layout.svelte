<script type="ts">
  import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut
  } from 'firebase/auth';
  import { dev } from '$app/env';

  import '@specialdoom/proi-ui/src/proi-ui.css';

  import {
    auth,
    confirmSignIn,
    isAuthenticated,
    sendEmailLink,
    user
  } from '../modules/firebase';
  import {
    Button,
    Modal,
    ToastProvider,
    ModalBody,
    Progress,
    Input,
    toaster
  } from '@specialdoom/proi-ui/src';

  import { onMount } from 'svelte';
  import { dgraph } from '../modules/dgraph';
  import { EnumType } from 'easy-dgraph';
  import { page } from '$app/stores';

  let showModal = false;
  let showEmail = false;
  let email: string;

  function login() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  function _dgraph(type: string) {
    // create dgraph, print query in dev mode
    return new dgraph(type, dev);
  }

  function passwordlessLogin(email?: string) {
    const url = $page.query.toString();
    confirmSignIn(url, email).then((s) => {
      if (s) {
        toaster.success('You are now signed in!');
      } else {
        toaster.error('Your sign in link is expired!');
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
        showModal = true;
      }
    }

    onAuthStateChanged(auth, (u) => {
      if (u) {
        isAuthenticated.set(true);
        showModal = false;
        handleUser(u);
      } else {
        isAuthenticated.set(false);
        user.set(null);
      }
    });
  });

  async function handleUser(u: any) {
    const r = await _dgraph('user')
      .get({ id: 1, email: 1, displayName: 1 })
      .filter({ email: u.email })
      .build();
    // user does not exist, create user
    if (r) {
      user.set(r);
    } else {
      createUser(u);
    }
  }

  async function createUser(u: any) {
    const r = await _dgraph('user')
      .add({ id: 1, email: 1, displayName: 1 })
      .set({
        email: u.email,
        displayName: u.displayName,
        link: { lid: 'link' },
        role: new EnumType('AUTHOR')
      })
      .build();
    user.set(r);
  }

  function logout() {
    signOut(auth);
  }
</script>

<svelte:head>
  <meta
    name="description"
    content="A website to vote on Dgraph feature requests!"
  />
</svelte:head>
<ToastProvider />
<nav class="navbar">
  <h3 class="nav-text">DGraph Feature Request</h3>
  {#if !$isAuthenticated}
    <Button type="secondary" on:click={() => (showModal = true)}>Login</Button>
  {:else}
    <Button type="link" on:click={logout} small>Logout</Button>
  {/if}
</nav>

<div class="s-container">
  <slot />
</div>

<Modal bind:visible={showModal} title="Passwordless Login">
  <center>
    <ModalBody>
      <Input
        value={email}
        on:change={(e) => {
          email = e.target.value;
        }}
        placeholder="Enter your email address..."
      />
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
          on:click={() => {
            sendEmailLink($page.host, email, dev);
            email = '';
            showModal = false;
            toaster.success(
              'Your link has been sent to your email! Check your junk folder!'
            );
          }}
        >
          <Button>Send Magic Link</Button>
        </span>
        <br />
        <br />
        OR
        <Progress percent="100" />
        <br />
        <Button on:click={login} type="secondary">Signin with Google</Button>
      {/if}
    </ModalBody>
  </center>
</Modal>

<style>
  .s-container {
    margin-top: 15px;
    margin-bottom: 15px;
    padding: 5px;
    max-width: 995px;
    width: 100%;
    background-color: transparent !important;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .navbar {
    background-color: #2398ab;
    color: white;
  }

  .nav-text {
    margin-top: 10px;
  }
</style>
