<script lang="ts">
  // material imports
  import {
    Button,
    MaterialApp,
    AppBar,
    Icon,
    Tooltip,
    Divider
  } from 'svelte-materialify';
  import {
    mdiAccountBox,
    mdiLogin,
    mdiLogout,
    mdiThemeLightDark
  } from '@mdi/js';

  import Auth from '../components/auth-form.svelte';
  import Message from '../components/message.svelte';
  import Confirm from './../components/confirm.svelte';
  import FeatureForm from '../components/feature-form.svelte';

  import { showDialog, showAuthSettings, userState } from '../stores/core';
  import { logout } from '../modules/firebase';

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
  <AppBar>
    <img style="height:35px" alt="DGraph" src="/dgraph-transparent.png" />
    <div style="flex-grow:1 " />
    <Tooltip bottom>
      <span slot="tip">Dark / Light Mode</span>
      <Button icon on:click={toggleTheme}>
        <Icon path={mdiThemeLightDark} />
      </Button>
    </Tooltip>
    <div style="margin: 1em" hidden={!$userState} />
    <!-- user hidden instead of if due to tooltip bug -->
    <div hidden={!$userState}>
      <Tooltip bottom>
        <span slot="tip">Profile Settings</span>
        <Button icon on:click={() => showAuthSettings.set(!$showAuthSettings)}>
          <Icon path={mdiAccountBox} />
        </Button>
      </Tooltip>
    </div>
    <div style="margin: 1em" />
    <Tooltip bottom>
      <span slot="tip">{$userState ? 'Logout' : 'Login'}</span>
      {#if !$userState}
        <Button icon on:click={() => showDialog.set(!$showDialog)}>
          <Icon path={mdiLogin} />
        </Button>
      {:else}
        <Button icon on:click={logout} small>
          <Icon path={mdiLogout} />
        </Button>
      {/if}
    </Tooltip>
    <div style="margin: 1em" />
  </AppBar>
  <div class="fullscreen">
    <div class="s-container">
      <slot />
      <br />
      <Divider inset />
      <br />
      <center>J</center>
      <br />
    </div>
    <p />
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
