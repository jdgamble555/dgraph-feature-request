<script lang="ts">
  import { showSnackbarMsg } from '../stores/core';
  import { Snackbar } from 'svelte-materialify';
  import { onDestroy } from 'svelte';

  let showSnackbar = false;

  const sbSub = showSnackbarMsg.subscribe((v) => (showSnackbar = !!v));

  onDestroy(sbSub);
</script>

<Snackbar
  class="flex-column"
  bind:active={showSnackbar}
  bottom
  center
  timeout={3000}
>
  {$showSnackbarMsg}
</Snackbar>
