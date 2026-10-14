<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Check from "@lucide/svelte/icons/check";
  import ChevronsUp from "@lucide/svelte/icons/chevrons-up";
  import ChevronsDown from "@lucide/svelte/icons/chevrons-down";

  import Fuse from "fuse.js";
  import { Debounced } from "runed";
  import { Portal, Select } from "bits-ui";
  import Search from "$lib/components/search.svelte";
  import { indexTable, type IndexTableItem } from "../lucide";
  import type { InsertIcon } from "../messages/insert-icon.message";
  import { UNDER_TABS_PORTAL_ID, via } from "../portals";
  import { DEFAULT_CATEGORY, store } from "../stores/store.svelte";
  import { finalStrokeWidth, LUCIDE_BASE_SIZE } from "../settings";

  const fuse = new Fuse(indexTable, {
    threshold: 0.15,
    ignoreLocation: true,
    keys: [
      { name: "name", weight: 3 },
      { name: "aliases", weight: 2 },
      { name: "tags", weight: 1 },
      { name: "categories", weight: 0.5 },
    ],
  });

  // Fuzzy search, but icons whose name matches the query (with spaces read as
  // dashes, e.g. "arrow right") always come first.
  function search(query: string) {
    const slug = query.toLowerCase().replace(/\s+/g, "-");
    const rank = (name: string) =>
      name === slug ? 0 : name.startsWith(slug) ? 1 : 2;

    return fuse
      .search(query)
      .map((it) => it.item)
      .sort((a, b) => rank(a.name) - rank(b.name));
  }

  const debouncedSearch = new Debounced(() => store.search.trim(), 150);

  const icons = $derived.by(() => {
    const query = debouncedSearch.current;
    const found = query === "" ? indexTable : search(query);

    return store.currentCategory === DEFAULT_CATEGORY.value
      ? found
      : found.filter((it) => it.categories.includes(store.currentCategory));
  });

  // Preview the stroke width the inserted icon will visually have.
  const previewStrokeWidth = $derived(
    (finalStrokeWidth(store.settings) * LUCIDE_BASE_SIZE) / store.settings.size,
  );

  function insert(item: IndexTableItem) {
    parent.postMessage(
      {
        __type: "insert-icon",
        name: item.name,
        svg: item.svg,
        settings: $state.snapshot(store.settings),
      } satisfies InsertIcon,
      "*",
    );
  }
</script>

{#if store.currentTab === "icons"}
  <Portal to={via(UNDER_TABS_PORTAL_ID)}>
    <Search
      class={{ input: "rounded-r-none" }}
      placeholder={`Search ${indexTable.length} icons`}
      bind:value={store.search}
    />
    <Select.Root
      type="single"
      items={store.categories}
      bind:value={store.currentCategory}
    >
      <Select.Trigger
        aria-label="Category"
        class={[
          "bg-b-tertiary body-m flex max-w-36 items-center pr-0 pl-2",
          "rounded-lg rounded-l-none text-nowrap",
          "outline-1 -outline-offset-1 outline-transparent",
          "focus:outline-a-tertiary focus:bg-b-quaternary",
        ]}
      >
        <span class="truncate"><Select.Value /></span>
        <ChevronDown class="shrink-0 scale-60" />
      </Select.Trigger>
      <Select.Portal>
        <Select.ContentStatic
          class={[
            "fixed top-23 right-0.5 z-30 h-[calc(100vh-var(--spacing)*24)]",
            "bg-b-tertiary outline-b-quaternary! p-2 outline-2!",
            "rounded-md",
          ]}
        >
          <Select.ScrollUpButton class="flex h-max w-full items-center justify-center">
            <ChevronsUp class="size-3" />
          </Select.ScrollUpButton>
          <Select.Viewport class="w-40">
            {#each store.categories as category (category.value)}
              <Select.Item
                class="body-m data-highlighted:bg-b-quaternary flex cursor-pointer rounded px-1"
                value={category.value}
                label={category.label}
              >
                {#snippet children({ selected })}
                  {category.label}
                  {#if selected}
                    <div class="ml-auto">
                      <Check aria-label="selected" class="size-4" />
                    </div>
                  {/if}
                {/snippet}
              </Select.Item>
            {/each}
          </Select.Viewport>
          <Select.ScrollDownButton
            class="flex w-full items-center justify-center rounded-b-md"
          >
            <ChevronsDown class="size-3" />
          </Select.ScrollDownButton>
        </Select.ContentStatic>
      </Select.Portal>
    </Select.Root>
  </Portal>
{/if}

<div class="flex h-full flex-col">
  <div class="min-h-0 flex-1 overflow-y-auto">
    {#if icons.length === 0}
      <p class="body-m text-f-secondary py-8 text-center">
        No icons found for “{debouncedSearch.current}”.
      </p>
    {:else}
      <div
        class="icon-grid text-f-primary grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] pt-2"
        style:--preview-stroke-width={previewStrokeWidth}
      >
        {#each icons as item (item.name)}
          <button
            type="button"
            title={item.name}
            aria-label={`Insert ${item.name}`}
            class="hover:bg-b-secondary focus-visible:outline-a-primary flex aspect-square items-center justify-center rounded-md outline-1 outline-transparent"
            onclick={() => insert(item)}
          >
            {@html item.svg}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <button
    type="button"
    class="body-s text-f-secondary hover:text-f-primary bg-b-primary flex items-center gap-2 py-2"
    title="Change insert settings"
    onclick={() => (store.currentTab = "settings")}
  >
    <span
      class="border-b-quaternary inline-block size-3 rounded-sm border"
      style:background-color={store.settings.color}
    ></span>
    {store.settings.color.toUpperCase()} · {store.settings.size}px ·
    stroke {store.settings.strokeWidth}{store.settings.absoluteStrokeWidth
      ? "px (absolute)"
      : ""}
    <span class="ml-auto">{icons.length} icons</span>
  </button>
</div>

<style>
  .icon-grid :global(svg) {
    stroke-width: var(--preview-stroke-width);
  }
</style>
