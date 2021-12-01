<script lang="ts">
  import { Feature } from '../modules/feature';

  // material imports
  import {
    Button,
    Card,
    CardTitle,
    CardText,
    Dialog,
    TextField
  } from 'svelte-materialify';
  import { dev } from '$app/env';
  import { showForm, editFeatureRec } from '../stores/core';

  // form items
  let feature: string;
  let url: string;

  let fService = new Feature(dev);

  function handleKeyup(e: any) {
    if (e.code == 'Enter' || e.code == '13') {
      e.preventDefault();
      handleSubmit();
      return false;
    }
  }

  async function handleSubmit() {
    if ($editFeatureRec) {
      await fService.updateFeature($editFeatureRec.id, { url, name: feature });
    } else {
      await fService.addFeature(feature, url);
    }
    showForm.set(false);
    editFeatureRec.set(null);
  }
</script>

<Dialog
  on:introstart={() => {
    if ($editFeatureRec) {
      feature = $editFeatureRec.name;
      url = $editFeatureRec.url;
    } else {
      feature = '';
      url = '';
    }
  }}
  bind:active={$showForm}
>
  <form on:submit|preventDefault={handleSubmit}>
    <Card>
      <CardTitle>{$editFeatureRec ? 'Edit' : 'Add'} a Feature</CardTitle>
      <CardText>
        <div class="inputs">
          <TextField bind:value={feature} outlined>Name</TextField>
          <br />
          <TextField bind:value={url} on:keyup={handleKeyup} outlined>
            URL (discuss.dgraph.com)
          </TextField>
          <br />
        </div>
        <Button class="secondary-color" on:click={handleSubmit}
          >{$editFeatureRec ? 'Edit' : 'Add'}
        </Button>
        <Button style="margin: 1em" on:click={() => showForm.set(false)}>
          Cancel
        </Button>
      </CardText>
    </Card>
  </form>
</Dialog>
