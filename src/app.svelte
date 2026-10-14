<script lang="ts">
  import { MeowTabs } from "$lib/bits/tabs";
  import { Tabs } from "bits-ui";
  import * as v from "valibot";
  import type { Theme } from "@penpot/plugin-types";
  import { MessageThemeSchema } from "./messages/theme-change.message";
  import { InsertResultSchema } from "./messages/insert-result.message";
  import Icons from "./tabs-content/icons.svelte";
  import Settings from "./tabs-content/settings.svelte";
  import Info from "./tabs-content/info.svelte";
  import { UNDER_TABS_PORTAL_ID } from "./portals";
  import { saveSettings, store } from "./stores/store.svelte";

  function themeFromUrl(): Theme {
    // Penpot opens the UI as `<host>/#/?theme=dark` (manifest v2)
    const url = new URL(window.location.href.replace("/#/", "/"));
    return url.searchParams.get("theme") === "dark" ? "dark" : "light";
  }

  function updateTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  updateTheme(themeFromUrl());

  function onMessage(event: MessageEvent) {
    const theme = v.safeParse(MessageThemeSchema, event.data);
    if (theme.success) {
      updateTheme(theme.output.theme);
      return;
    }

    const result = v.safeParse(InsertResultSchema, event.data);
    if (result.success) {
      const { name, error } = result.output;
      if (!error) store.lastInserted = name;
      store.notify(
        error
          ? { kind: "error", text: `Couldn't insert “${name}”: ${error}` }
          : { kind: "success", text: `Inserted “${name}”` },
      );
    }
  }

  $effect(() => saveSettings($state.snapshot(store.settings)));
</script>

<svelte:window onmessage={onMessage} />

<div class="flex h-screen flex-col">
  <Tabs.Root bind:value={store.currentTab} class="flex min-h-0 flex-1 flex-col">
    <div class="bg-b-primary sticky top-0 z-10 w-full pt-2">
      <MeowTabs.List class="body-s sticky h-max">
        <MeowTabs.Trigger value="icons">Icons</MeowTabs.Trigger>
        <MeowTabs.Trigger value="settings">Settings</MeowTabs.Trigger>
        <MeowTabs.Trigger value="info">Info</MeowTabs.Trigger>
      </MeowTabs.List>
      <div
        id={UNDER_TABS_PORTAL_ID}
        class={store.currentTab === "icons" ? "flex gap-1 pt-2" : ""}
      ></div>
    </div>
    <Tabs.Content value="icons" class="min-h-0 flex-1">
      <Icons />
    </Tabs.Content>
    <Tabs.Content value="settings" class="min-h-0 flex-1 overflow-y-auto">
      <Settings />
    </Tabs.Content>
    <Tabs.Content value="info" class="min-h-0 flex-1 overflow-y-auto">
      <Info />
    </Tabs.Content>
  </Tabs.Root>

  {#if store.notice}
    <div
      role="status"
      class={[
        "body-s fixed right-2 bottom-10 left-2 z-20 truncate rounded-md px-3 py-2",
        store.notice.kind === "error"
          ? "bg-error-500 text-app-white"
          : "bg-b-quaternary text-f-primary",
      ]}
      title={store.notice.text}
    >
      {store.notice.text}
    </div>
  {/if}
</div>
