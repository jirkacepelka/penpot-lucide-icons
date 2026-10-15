<script lang="ts">
  import {
    DEFAULT_SETTINGS,
    finalStrokeWidth,
    LUCIDE_BASE_SIZE,
  } from "../settings";
  import { indexTable } from "../lucide";
  import { store } from "../stores/store.svelte";

  const SIZE_PRESETS = [16, 20, 24, 32, 48, 64];
  const HEX = /^#[0-9a-f]{6}$/i;

  const settings = $derived(store.settings);

  const sampleIcon = $derived(
    indexTable.find((it) => it.name === (store.lastInserted ?? "rocket")) ??
      indexTable[0],
  );

  // Local text state so that half-typed values don't end up in the settings.
  let colorText = $state(store.settings.color);
  $effect(() => {
    colorText = settings.color;
  });

  function setColor(value: string) {
    let hex = value.trim();
    if (!hex.startsWith("#")) hex = `#${hex}`;
    if (/^#[0-9a-f]{3}$/i.test(hex)) {
      hex = `#${[...hex.slice(1)].map((c) => c + c).join("")}`;
    }
    if (HEX.test(hex)) store.settings.color = hex.toUpperCase();
  }

  function setSize(value: number) {
    if (Number.isFinite(value) && value >= 1 && value <= 2048) {
      store.settings.size = Math.round(value * 100) / 100;
    }
  }

  function setStrokeWidth(value: number) {
    if (Number.isFinite(value) && value >= 0.25 && value <= 10) {
      store.settings.strokeWidth = value;
    }
  }

  const previewSize = $derived(Math.min(settings.size, 96));
  const previewStroke = $derived(
    (finalStrokeWidth(settings) * LUCIDE_BASE_SIZE) / settings.size,
  );
  const isDefault = $derived(
    JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS),
  );
</script>

<div class="text-f-primary flex flex-col gap-4 py-3">
  <div
    class="bg-b-secondary flex h-32 items-center justify-center rounded-lg"
    style:color={settings.color}
  >
    <div
      class="preview"
      style:width="{previewSize}px"
      style:height="{previewSize}px"
      style:--preview-stroke-width={previewStroke}
    >
      {@html sampleIcon.svg}
    </div>
  </div>

  <label class="flex flex-col gap-1">
    <span class="body-s text-f-secondary">Color</span>
    <div class="flex gap-1">
      <input
        type="color"
        class="bg-b-tertiary h-8 w-10 cursor-pointer rounded-lg p-1"
        value={settings.color}
        oninput={(e) => setColor(e.currentTarget.value)}
        aria-label="Pick color"
      />
      <input
        class="input flex-1"
        bind:value={colorText}
        onchange={() => {
          setColor(colorText);
          colorText = store.settings.color;
        }}
        maxlength={7}
        spellcheck="false"
        aria-label="Hex color"
      />
    </div>
  </label>

  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between">
      <label class="body-s text-f-secondary" for="size">Size (px)</label>
      <input
        id="size"
        type="number"
        class="input w-20"
        min="1"
        max="2048"
        step="1"
        value={settings.size}
        onchange={(e) => {
          setSize(e.currentTarget.valueAsNumber);
          e.currentTarget.value = String(store.settings.size);
        }}
      />
    </div>
    <div class="grid grid-cols-6 gap-1">
      {#each SIZE_PRESETS as size (size)}
        <button
          type="button"
          class={[
            "body-s rounded-md py-1",
            settings.size === size
              ? "bg-b-quaternary text-a-primary"
              : "bg-b-tertiary text-f-secondary hover:text-f-primary",
          ]}
          onclick={() => setSize(size)}
        >
          {size}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between">
      <label class="body-s text-f-secondary" for="stroke">Stroke width</label>
      <input
        type="number"
        class="input w-20"
        min="0.25"
        max="10"
        step="0.25"
        value={settings.strokeWidth}
        aria-label="Stroke width value"
        onchange={(e) => {
          setStrokeWidth(e.currentTarget.valueAsNumber);
          e.currentTarget.value = String(store.settings.strokeWidth);
        }}
      />
    </div>
    <input
      id="stroke"
      type="range"
      class="accent-a-primary w-full"
      min="0.5"
      max="3"
      step="0.25"
      value={settings.strokeWidth}
      oninput={(e) => setStrokeWidth(e.currentTarget.valueAsNumber)}
    />
  </div>

  <label class="flex cursor-pointer items-start gap-2">
    <input
      type="checkbox"
      class="accent-a-primary mt-0.5"
      bind:checked={store.settings.absoluteStrokeWidth}
    />
    <span class="flex flex-col">
      <span class="body-m">Absolute stroke width</span>
      <span class="body-s text-f-secondary">
        Keep the stroke at {settings.strokeWidth}px no matter the icon size.
        Otherwise it scales with the size (currently
        {Math.round(finalStrokeWidth(settings) * 100) / 100}px).
      </span>
    </span>
  </label>

  <button
    type="button"
    data-appearance="secondary"
    disabled={isDefault}
    onclick={() => store.resetSettings()}
  >
    Reset to defaults
  </button>
</div>

<style>
  .preview :global(svg) {
    width: 100%;
    height: 100%;
    stroke-width: var(--preview-stroke-width);
  }
</style>
