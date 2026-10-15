<script lang="ts">
  import { lucideVersion, indexTable } from "../lucide";
  import packageJson from "../../package.json" with { type: "json" };
</script>

<div class="text-f-primary body-m flex flex-col gap-4 py-3">
  <section class="flex flex-col gap-1">
    <h2 class="title-m">Lucide Icons for Penpot</h2>
    <p class="text-f-secondary">
      {indexTable.length} icons from Lucide {lucideVersion} · plugin v{packageJson.version}
    </p>
  </section>

  <section class="flex flex-col gap-1">
    <h3 class="title-s">How to use</h3>
    <ul class="text-f-secondary space-y-1">
      <li>Click an icon to insert it as a board named after the icon.</li>
      <li>
        With a <b>board</b> selected, the icon is placed inside it (respecting
        flex / grid layouts).
      </li>
      <li>
        With an inserted <b>icon</b> selected, the next one is placed next to it
        – handy for building icon sets.
      </li>
      <li>With any other shape selected, the icon is centered on top of it.</li>
      <li>Otherwise the icon lands in the center of the viewport.</li>
      <li>Color, size and stroke width are set in the Settings tab.</li>
    </ul>
  </section>

  <section class="flex flex-col gap-1">
    <h3 class="title-s">Links</h3>
    <ul class="flex flex-col gap-1">
      <li>
        <a class="text-a-primary underline" target="_blank" rel="noreferrer" href="https://lucide.dev"
          >lucide.dev</a
        >
      </li>
      <li>
        <a
          class="text-a-primary underline"
          target="_blank"
          rel="noreferrer"
          href="https://lucide.dev/license">Lucide license (ISC)</a
        >
      </li>
    </ul>
  </section>
</div>
