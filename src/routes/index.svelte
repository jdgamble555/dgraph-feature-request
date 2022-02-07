<script context="module" lang="ts">
  import { dev } from '$app/env';
  import { Feature } from '../modules/feature';

  let fService: Feature;

  export async function load({ fetch }) {
    // get features
    fService = new Feature(dev, fetch);
    const r = await fService.queryFeature();
    return { props: { features: r } };
  }
</script>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import type { Subscription } from 'rxjs';
  import type { Unsubscriber } from 'svelte/store';

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
    showFeatureForm,
    editFeatureRec
  } from '../stores/core';
  import {
    mdiDeleteVariant,
    mdiNoteEditOutline,
    mdiPlusBox,
    mdiThumbUpOutline
  } from '@mdi/js';

  export let features: any[];

  let dgraphSub: Subscription;

  let userSub: Unsubscriber;
  let featureSub: Unsubscriber;

  onMount(() => {
    // load feature module
    userSub = userState.subscribe((u) => {
      // random id or userid
      const id = u ? u.id : null;
      dgraphSub = fService.subscribeFeature(id).subscribe((r: any) => {
        if (r && r.length !== 0) {
          featureStore.set(r);
        }
      });
    });

    // update on add / update / delete optimistically
    featureSub = featureStore.subscribe((fs: any) => {
      if (fs && fs.length !== 0) {
        features = fs;
      }
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

<h3>Dgraph Unofficial Feature Voting System</h3>
<div class="add-box">
  <Button
    on:click={() => {
      if ($userState) {
        showFeatureForm.set(true);
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
<Card outlined>
  <CardText>
    <strong>
      Login at the top right, add your feature, and vote on others!
    </strong>
    <p />
    This is<b>unofficial</b> and does not mean anything. The hope is so the
    Dgraph team takes these seriously and puts focus on the features we want!
    The next official version is
    <strong>
      <a
        href="https://discuss.dgraph.io/t/dgraph-v21-12-0-zion-release/16215/8"
      >
        21.12
      </a>
    </strong>
    , which should be on DGraph Cloud soon!
  </CardText>
</Card>
<br />
{#if features}
  {#each features as feature (feature.id)}
    <Card outlined>
      <CardTitle>
        {feature.name}
      </CardTitle>
      <CardSubtitle>
        {#if feature.url}
          <a href={feature.url} target="_new">Discuss</a>
        {/if}
      </CardSubtitle>
      <CardText>
        {feature.description}
      </CardText>
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
          {#if $userState && (feature.author.id === $userState.id || $userState.role === 'ADMIN')}
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
                    name: feature.name,
                    description: feature.description
                  });
                  showFeatureForm.set(true);
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
