<script lang="ts">
  import { Feature } from '../modules/feature';

  // material imports
  import {
    Button,
    Card,
    CardTitle,
    CardText,
    Dialog,
    TextField,
    Textarea
  } from 'svelte-materialify';
  import { dev } from '$app/env';
  import { showFeatureForm, editFeatureRec } from '../stores/core';

  // form items
  let feature: string;
  let url: string;
  // fix textarea bug
  let description: string = ' ';

  let fService = new Feature(dev);

  async function handleSubmit() {
    if ($editFeatureRec) {
      await fService.updateFeature($editFeatureRec.id, {
        url,
        name: feature,
        description
      });
    } else {
      await fService.addFeature(feature, url, description);
    }
    showFeatureForm.set(false);
    editFeatureRec.set(null);
  }
</script>

<Dialog
  on:introstart={() => {
    if ($editFeatureRec) {
      feature = $editFeatureRec.name;
      url = $editFeatureRec.url;
      description = $editFeatureRec.description;
    } else {
      feature = '';
      url = '';
      description = '';
    }
  }}
  bind:active={$showFeatureForm}
>
  <form on:submit|preventDefault={handleSubmit}>
    <Card>
      <CardTitle>{$editFeatureRec ? 'Edit' : 'Add'} a Feature</CardTitle>
      <CardText>
        <div class="inputs">
          <TextField bind:value={feature} outlined>Name</TextField>
          <br />
          <TextField bind:value={url} outlined>
            URL (discuss.dgraph.com)
          </TextField>
          <br />
          <Textarea bind:value={description} outlined>
            Brief Description
          </Textarea>
          <br />
        </div>
        <Button class="secondary-color" on:click={handleSubmit}>
          {$editFeatureRec ? 'Edit' : 'Add'}
        </Button>
        <Button style="margin: 1em" on:click={() => showFeatureForm.set(false)}>
          Cancel
        </Button>
      </CardText>
    </Card>
  </form>
</Dialog>
