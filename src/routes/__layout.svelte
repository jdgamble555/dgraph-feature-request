<script lang="ts">
  // material imports
  import { Button, MaterialApp, AppBar, Icon } from 'svelte-materialify';
  import { mdiThemeLightDark } from '@mdi/js';

  import Auth from '../components/auth.svelte';
  import Message from '../components/message.svelte';
  import Confirm from './../components/confirm.svelte';
  import { showDialog, userState } from '../stores/core';
  import { logout } from '../modules/firebase';
  import FeatureForm from '../components/feature-form.svelte';

  let theme: 'light' | 'dark' = 'light';
  function toggleTheme() {
    if (theme === 'light') theme = 'dark';
    else theme = 'light';
  }
</script>

<svelte:head>
  <title>DGraph Feature Request (Unofficial)</title>
  <meta
    name="description"
    content="A website to vote on Dgraph feature requests!"
  />
</svelte:head>

<MaterialApp {theme}>
  <!-- dialogs and snackbar -->
  <Auth />
  <Message />
  <Confirm />
  <FeatureForm />
  <AppBar class="pink darken-1">
    <span slot="title" class="white-text"
      >DGraph Feature Request (Unofficial)</span
    >
    <div style="flex-grow:1 " />
    <Button icon on:click={toggleTheme}>
      <Icon path={mdiThemeLightDark} />
    </Button>
    <div style="margin: 1em" />
    {#if !$userState}
      <Button on:click={() => showDialog.set(true)}>Login</Button>
    {:else}
      <Button on:click={logout} small>Logout</Button>
    {/if}
    <div style="margin: .5em" />
  </AppBar>
  <div class="fullscreen">
    <div class="s-container">
      <slot />
      <br />
      <h5><center>You can only edit and delete your own Feature.</center></h5>
      This is unofficial and does not mean anything. The hope is so the Dgraph team
      takes these seriously and puts focus on the features we want! The next official
      version is
      <strong>
        <a
          href="https://discuss.dgraph.io/t/next-release-date-2021-21-07/15167/5?u=jdgamble555"
        >
          21.09</a
        > (as far as we know)
      </strong>
      <br />
      <br />
      <h3>Todo</h3>
      <ul>
        <li><strike>Edit Feature</strike></li>
        <li><strike>Unauthorized Error Messages</strike></li>
        <li><strike>Roles / @auth for Editors and Users</strike></li>
        <li><strike>Login with Magic Link</strike></li>
        <li>Add a basic role management for admins</li>
        <li>Pagination (1-10)</li>
        <li>Add categories (GraphQL, DQL, Cloud DGraph UI)</li>
        <li>Add Status (Denied / Pending / New / Complete)</li>
        <li>Potential Difficulty</li>
        <li>Fix fetch problem under the hood</li>
        <li>Fix remote types</li>
      </ul>
      <p>
        I had to move this to a paid cloud instance (will share it with other
        apps), so you may have lost your date! Vote again if you need to!
      </p>
    </div>
  </div>
</MaterialApp>

<style>
  .s-container {
    margin-top: 15px;
    margin-bottom: 15px;
    padding: 5px;
    max-width: 995px;
    width: 100%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .fullscreen {
    position: relative;
    height: 94vh;
  }
</style>
