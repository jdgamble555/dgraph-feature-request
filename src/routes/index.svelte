<script context="module" type="ts">
  import {
    Input,
    Button,
    Progress,
    toaster,
    Modal
  } from '@specialdoom/proi-ui/src';
  import { Icon } from '@smui/icon-button';
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
      //.networkOnly()
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
  let _features: any[];
  let fid: string;
  let url: string;
  let showConfirm = false;
  let item: any;
  let dgraphSub: Subscription;
  let buttonType: 'edit' | 'add' = 'add';

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
              if (r) {
                features = _features = r;
              }
            });
        }
      });
    }
  });

  onDestroy(() => {
    if (browser && dgraphSub) dgraphSub.unsubscribe();
  });

  async function addFeature() {
    if (get(isAuthenticated)) {
      // optimistic update ui first
      if (!fid) {
        features = [
          ...features,
          { name: feature, url, id: 'x', totalVotes: 1 }
        ];
      } else {
        features = features.map((r: any) => {
          if (r.id === fid) {
            r.url = url;
            r.name = feature;
          }
          return r;
        });
      }
      const u = get(user);
      let r: any;
      if (fid) {
        r = await _dgraph('feature')
          .update({ name: 1, url: 1, id: 1, votes: { id: 1 } })
          .filter(fid)
          .set({
            name: feature,
            url
          })
          .build();
      } else {
        r = await _dgraph('feature')
          .add({ name: 1, url: 1, id: 1, votes: { id: 1 } })
          .set({
            name: feature,
            url,
            author: { id: u.id },
            votes: { id: u.id },
            link: { lid: 'link' }
          })
          .build();
      }
      if (r.numUids === 0) {
        toaster.error('You are not authorized to perform that action!');
        features = _features;
      } else {
        toaster.success('Feature Added!');
      }
      // update form
      feature = '';
      url = '';
      fid = '';
      buttonType = 'add';
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
      const r = await _dgraph('feature').delete().filter(id).build();
      if (r.numUids === 0) {
        toaster.error('You are not authorized to perform that action!');
        features = _features;
      } else {
        toaster.success('Feature Deleted!');
      }
    } else {
      loginError();
    }
  }

  function editFeature(id: string, u: string, name: string) {
    feature = name;
    fid = id;
    url = u;
    buttonType = 'edit';
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
      const r = await _dgraph('toggleVote').filter(id).customMutation().build();
      if (r.numUids === 0) {
        toaster.error('You are not authorized to perform that action!');
        features = _features;
      } else {
        toaster.success('Vote ' + (voted ? 'Removed!' : 'Added!'));
      }
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
  <title>DGraph Feature Request (Unofficial)</title>
</svelte:head>
<!-- hide warning -->
{#if false}<slot />{/if}

<h1>Dgraph Feature Voting System</h1>

{#if features}
  <Progress percent="100" />
  <br />
  <ol>
    {#each features as feature (feature.id)}
      <li>
        <div class="grid-container">
          <div class="column">
            <a href={feature.url}>
              <Button small outlined>{feature.name}</Button>
            </a>
          </div>
          <div class="column">
            <span
              class="thumbs-up"
              on:click={async () => {
                const voted = !!(feature.votes && feature.votes[0]);
                toggleVote(feature.id, voted);
              }}
            >
              <span class="icon">
                <Icon class="material-icons">arrow_circle_up</Icon>
              </span>
              <Button small>Votes: {feature.totalVotes}</Button>
            </span>
            <span
              class="thumbs-up"
              on:click={() => confirmDelete(feature.id, feature.name)}
            >
              <span class="icon">
                <Icon class="material-icons">delete</Icon>
              </span>
            </span>
            <span
              class="thumbs-up"
              on:click={() =>
                editFeature(feature.id, feature.url, feature.name)}
            >
              <span class="icon">
                <Icon class="material-icons">edit</Icon>
              </span>
            </span>
          </div>
        </div>
      </li>
    {/each}
  </ol>
{/if}

<form on:submit|preventDefault={addFeature}>
  <div class="inputs">
    <br />
    <Input
      value={feature}
      placeholder="Short name of feature..."
      on:change={(e) => {
        feature = e.target.value;
      }}
    />
    <Input
      value={url}
      placeholder="URL of feature request from discuss.dgraph.com..."
      on:change={(e) => {
        url = e.target.value;
      }}
    />
    <br />
    <Button>{buttonType === 'add' ? 'Add' : 'Edit'}</Button>
    {#if buttonType === 'edit'}
      <Button
        on:click={() => {
          buttonType = 'add';
          feature = '';
          url = '';
          fid = '';
        }}>Cancel</Button
      >
    {/if}
  </div>
</form>
<br />
<h5><center>You can only edit and delete your own Feature.</center></h5>
<Progress percent="100" />
This is unofficial and does not mean anything. The hope is so the Dgraph team takes
these seriously and puts focus on the features we want! The next official version
is
<strong>
  <a
    href="https://discuss.dgraph.io/t/next-release-date-2021-21-07/15167/5?u=jdgamble555"
  >
    21.08</a
  > (as far as we know)
</strong>
<Progress percent="100" />
<br />
<br />
<h3>Todo</h3>
<ul>
  <li><strike>Edit Feature</strike></li>
  <li><strike>Unauthorized Error Messages</strike></li>
  <li>Add a basic role management for admins</li>
  <li><strike>Roles / @auth for Editors and Users</strike></li>
  <li><strike>Login with Magic Link</strike></li>
  <li>Pagination (1-10)</li>
  <li>Add categories (GraphQL, DQL, Cloud DGraph UI)</li>
  <li>Add Status (Denied / Pending / New / Complete)</li>
</ul>

<p>
  I had to move this to a paid cloud instance (will share it with other apps),
  so you may have lost your date! Vote again if you need to!
</p>

<style>
  .grid-container {
    display: grid;
    grid-template-columns: 250px auto;
    grid-column: 2;
    justify-items: left;
    align-items: center;
    width: fit-content;
  }

  .icon {
    vertical-align: bottom;
  }
  .column {
    margin: 0px 10px;
  }
  .inputs {
    width: 50%;
  }
  .thumbs-up {
    cursor: pointer;
    margin: 0px 3px;
  }
</style>
