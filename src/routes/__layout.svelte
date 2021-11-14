<script type="ts">
  import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut
  } from 'firebase/auth';

  import '@specialdoom/proi-ui/src/proi-ui.css';

  import { auth, isAuthenticated, user } from '../modules/firebase';
  import { Button, Modal, ToastProvider } from '@specialdoom/proi-ui/src';

  import { onMount } from 'svelte';
  import { dgraph } from '../modules/dgraph';

  let showModal = false;
  let name: string;

  function login() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  onMount(() => {
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
    const r = await new dgraph('user')
      .get({ id: 1, email: 1, displayName: 1 })
      .filter({ email: u.email })
      .build();
    // user does not exist, create user
    if (r.length === 0) {
      createUser(u);
    } else {
      user.set(r);
    }
  }

  async function createUser(u: any) {
    const r = await new dgraph('user')
      .add({ id: 1, email: 1, displayName: 1 })
      .set({ email: u.email, displayName: u.displayName })
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
<ToastProvider></ToastProvider>
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

<Modal bind:visible={showModal} title="Login to Vote">
  {#if !$isAuthenticated}
    <Button on:click={login} type="secondary">Signin with Google</Button>
  {:else}
    {name}
  {/if}
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
