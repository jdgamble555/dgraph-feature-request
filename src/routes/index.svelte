<script context="module" type="ts">
  import {
    Input,
    Button,
    Progress,
    Tag,
    toaster,
    Modal
  } from '@specialdoom/proi-ui/src';
  import { Icon } from '@specialdoom/proi-ui-icons/src';
  import { dev, browser } from '$app/env';

  import { dgraph } from '../modules/dgraph';

  function _dgraph(type: string) {
    // create dgraph, print query in dev mode
    return new dgraph(type, dev);
  }

  export async function load() {
    const r = await _dgraph('queryFeatureSortedByVotes')
      .customQuery({
        id: 1,
        url: 1,
        name: 1,
        votes: { id: 1 },
        totalVotes: 1
      })
      .networkOnly()
      .build();
    return { props: { features: r } };
  }
</script>

<script type="ts">
  import { isAuthenticated, user } from '../modules/firebase';
  import { get } from 'svelte/store';
  import { onDestroy, onMount } from 'svelte';
  import type { Subscription } from 'rxjs';

  export let features: any[];

  let feature: string;
  let url: string;
  let showConfirm = false;
  let item: any;
  let dgraphSub: Subscription;

  onMount(() => {
    if (browser) {
      user.subscribe((u: any) => {
        if (u) {
          dgraphSub = _dgraph('queryFeatureSortedByVotes')
            .filter(u.id)
            .customQuery({
              name: 1,
              url: 1,
              id: 1,
              totalVotes: 1,
              votes: { id: 1 }
            })
            .buildSubscription()
            .subscribe((r: any) => {
              features = r;
            });
        }
      });
    }
  });

  onDestroy(() => {
    if (browser) dgraphSub.unsubscribe();
  });

  async function addFeature() {
    if (get(isAuthenticated)) {
      // optimistic update ui first
      features = [...features, { name: feature, url, id: 'x', totalVotes: 1 }];
      const u = get(user);
      await _dgraph('feature')
        .add({ name: 1, url: 1, id: 1, votes: { id: 1 } })
        .set({ name: feature, url, author: { id: u.id }, votes: { id: u.id } })
        .build();
      toaster.success('Feature Added!');
      // update form
      feature = '';
      url = '';
    } else {
      loginError();
    }
  }

  async function loginError() {
    toaster.error('You must be logged in for that!');
  }

  function confirmDelete(id: string, name: string) {
    if (get(isAuthenticated)) {
      showConfirm = true;
      item = { id, name };
    } else {
      loginError();
    }
  }

  async function deleteFeature(id: string) {
    showConfirm = false;
    if (get(isAuthenticated)) {
      // optimistic update ui first
      features = features.filter((r: any) => r.id !== id);
      await _dgraph('feature').delete().filter(id).build();
      toaster.success('Feature Deleted!');
    } else {
      loginError();
    }
  }

  async function toggleVote(id: string, voted: boolean) {
    if (get(isAuthenticated)) {
      // optimistic update ui first
      features = features.map((f: any) => {
        if (f.id === id) {
          if (voted) {
            f.totalVotes--;
          } else {
            f.totalVotes++;
          }
        }
        return f;
      });
      const u = get(user);
      const q = await _dgraph('feature')
        .get({ votes: { __filter: { id: u.id }, id: 1, email: 1 } })
        .filter(id)
        .build()
        .then((r) => (r.votes ? r.votes[0] : null));
      const r = _dgraph('feature')
        .update({ votes: { id: 1, email: 1 } })
        .filter({ id });
      if (q) {
        await r.remove({ votes: { id: u.id } }).build();
      } else {
        await r.set({ votes: { id: u.id } }).build();
      }
      toaster.success('Vote ' + (q ? 'Removed!' : 'Added!'));
    } else {
      loginError();
    }
  }
</script>

<Modal
  bind:visible={showConfirm}
  title="Are you sure you want to delete &quot{item?.name}&quot?"
>
  <Button
    on:click={() => {
      showConfirm = false;
    }}>No</Button
  >
  <Button on:click={() => deleteFeature(item?.id)}>Yes</Button>
</Modal>

<svelte:head>
  <title>DGraph Feature Voting System</title>
</svelte:head>
<!-- hide warning -->
{#if false}<slot />{/if}

<h1>DGraph Features</h1>

{#if features}
  <Progress percent="100" />
  <br />
  {#each features as feature (feature.id)}
    <div class="grid-container">
      <div class="column">
        <a href={feature.url}>
          <Button small outlined>{feature.name}</Button>
        </a>
      </div>
      <div class="column">
        <Tag>Votes: {feature.totalVotes}</Tag>
        <span
          class="thumbs-up"
          on:click={async () => {
            const voted = !!(feature.votes && feature.votes[0]);
            toggleVote(feature.id, voted);
          }}
        >
          <Icon type="wine" />
        </span>
        <span
          class="thumbs-up"
          on:click={() => confirmDelete(feature.id, feature.name)}
        >
          <Icon type="empty" />
        </span>
      </div>
    </div>
  {/each}
{/if}

<form on:submit|preventDefault={addFeature}>
  <div class="inputs">
    <br />
    <Input
      value={feature}
      placeholder="Add a feature..."
      on:change={(e) => {
        feature = e.target.value;
      }}
    />
    <Input
      value={url}
      placeholder="URL of feature request..."
      on:change={(e) => {
        url = e.target.value;
      }}
    />
    <br />
    <Button>Add</Button>
  </div>
</form>
<br />
<center><h5>Touch the wine glass to toggle your vote!</h5></center>
<Progress percent="100" />
This is unofficial and does not mean anything. The hope is so the Dgraph team takes
these seriously and puts focus on the features we want! The next official version
is
<strong>
  <a
    href="https://discuss.dgraph.io/t/feature-request-update-after-auth-validation/14799/27?u=jdgamble555"
  >
    21.09</a
  > (as far as we know)
</strong>

<style>
  .grid-container {
    display: grid;
    grid-template-columns: auto 160px;
    justify-items: left;
    align-items: center;
    width: fit-content;
  }
  .column {
    margin: 0px 10px;
  }
  .inputs {
    width: 50%;
  }
  .thumbs-up {
    cursor: pointer;
  }
</style>
<br />
<br />
<h3>Todo</h3>
<ul>
  <li>Edit Features</li>
  <li>Roles / @auth for Editors and Users</li>
  <li>Login with Magic Link</li>
  <li>Pagination (1-10)</li>
  <li>Add categories (GraphQL, DQL, Cloud DGraph UI)</li>
</ul>

