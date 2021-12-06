<script context="module" lang="ts">
  import { dev, browser } from '$app/env';
  import { ssr, data } from '../modules/urql';

  export async function load() {
    // restore data from server to prevent double fetching
    if (browser) {
      ssr.restoreData(window['__URQL_DATA__']);
    }
    // get features
    const r = await Feature.queryFeature(dev);

    // get data as string to save to script tag
    const d = browser
      ? ''
      : data.replace('__SSR__', JSON.stringify(ssr.extractData()));
    return { props: { features: r, d } };
  }
</script>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import type { Subscription } from 'rxjs';
  import type { Unsubscriber } from 'svelte/store';

  import { Feature } from '../modules/feature';

  // material imports
  import {
    Button,
    Card,
    CardTitle,
    Icon,
    CardText,
    CardSubtitle,
    CardActions
  } from 'svelte-materialify';
  import {
    featureStore,
    showConfirm,
    delFeatureRec,
    userState,
    showForm,
    editFeatureRec
  } from '../stores/core';
  import {
    mdiDeleteVariant,
    mdiNoteEditOutline,
    mdiPlusBox,
    mdiThumbUpOutline
  } from '@mdi/js';

  export let features: any[];
  export let d: any;

  let dgraphSub: Subscription;

  let userSub: Unsubscriber;
  let featureSub: Unsubscriber;

  let fService = new Feature(dev);

  onMount(() => {
    // load feature module
    userSub = userState.subscribe((u: any) => {
      if (u) {
        dgraphSub = Feature.subscribeFeature(u.id).subscribe((r: any) => {
          if (r && r.length !== 0) {
            featureStore.set(r);
            features = r;
          }
        });
      }
    });

    // update on add / update / delete optimistically
    featureSub = featureStore.subscribe((fs: any) => {
      features = fs;
    });
  });

  onDestroy(() => {
    if (dgraphSub) dgraphSub.unsubscribe();
    if (userSub) userSub();
    if (featureSub) featureSub();
  });
</script>

<!-- hide warning -->
{#if false}<slot />{/if}

<!-- save data to script tag to restore on client -->
{@html d}

<h3>Dgraph Feature Voting System</h3>
<div class="add-box">
  <Button
    on:click={() => {
      if ($userState) {
        showForm.set(true);
        editFeatureRec.set(null);
      } else {
        fService.loginError();
      }
    }}
    fab
    size="small"
    class="pink accent-3 white-text"
  >
    <Icon path={mdiPlusBox} />
  </Button>
</div>
<br />
{#if features}
  {#each features as feature (feature.id)}
    <Card outlined>
      <CardTitle>
        {feature.name}
      </CardTitle>
      <CardSubtitle
        ><a href={feature.url} target="_new">Discuss</a></CardSubtitle
      >
      <CardText />
      <CardActions>
        <div class="flex-container">
          <Button
            depressed
            class="pink darken-2 white-text"
            on:click={async () => {
              const voted = !!(feature.votes && feature.votes[0]);
              fService.toggleVote(feature.id, voted);
            }}
          >
            <Icon size="18px" path={mdiThumbUpOutline} class="mr-3" />
            Votes: {feature.totalVotes}
          </Button>
          {#if $userState && feature.author.id === $userState.id}
            <div class="flex-row">
              <Button
                icon
                on:click={() => {
                  delFeatureRec.set({
                    name: feature.name,
                    id: feature.id
                  });
                  showConfirm.set(true);
                }}
              >
                <Icon path={mdiDeleteVariant} />
              </Button>
              <Button
                icon
                on:click={() => {
                  editFeatureRec.set({
                    id: feature.id,
                    url: feature.url,
                    name: feature.name
                  });
                  showForm.set(true);
                }}
              >
                <Icon path={mdiNoteEditOutline} />
              </Button>
            </div>
          {/if}
        </div>
      </CardActions>
    </Card>
    <br />
  {/each}
{/if}

<style>
  .flex-container {
    clear: both;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  .flex-row {
    gap: 1em;
    display: flex;
  }
  .add-box {
    text-align: right;
    margin-right: 1em;
  }
</style>
