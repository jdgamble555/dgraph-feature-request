<script lang="ts">
  import { dev } from '$app/env';
  import { Feature } from '../modules/feature';
  import { delFeatureRec, showConfirm } from '../stores/core';
  import {
    CardTitle,
    CardText,
    Dialog,
    Card,
    Button
  } from 'svelte-materialify';

  const feature = new Feature(dev);
</script>

<Dialog bind:active={$showConfirm}>
  <Card>
    <CardTitle>Are you sure you want to delete {$delFeatureRec.name}?</CardTitle
    >
    <CardText>
      <Button on:click={() => showConfirm.set(false)}>No</Button>
      <Button
        on:click={() => {
          feature.deleteFeature($delFeatureRec.id);
          showConfirm.set(false);
        }}>Yes</Button
      >
    </CardText>
  </Card>
</Dialog>
