<!--
  The whole tool: plan canvas plus room directory, with saving.

  `initial` seeds the furniture. Without `onchange`, edits are saved to
  localStorage and a saved layout replaces the seed on the next visit. With
  `onchange`, your backend owns persistence and `initial` is authoritative.
-->
<script>
  import { untrack } from 'svelte';
  import FloorPlan from './FloorPlan.svelte';
  import RoomDirectory from './RoomDirectory.svelte';
  import { Plan } from './plan.svelte.js';

  /**
   * @type {{
   *   building: object,
   *   initial?: object | null,
   *   onchange?: ((doc: object) => void) | null,
   *   backdrop?: object | null,
   *   title?: string,
   * }}
   */
  let { building, initial = null, onchange = null, backdrop = null, title = 'Furniture plan' } = $props();

  // The building is read once. To show a different building, key this component on its id.
  const plan = untrack(() => new Plan(building, { saved: initial }));
  const storageKey = untrack(() => `floorplan:${building.id}`);

  function readSaved() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeSaved(json) {
    try {
      localStorage.setItem(storageKey, json);
    } catch {
      // Storage full or blocked: the plan still works for this session.
    }
  }

  // Effects only run in the browser, so restoring here is safe under SSR.
  let restored = false;
  $effect(() => {
    const json = JSON.stringify(plan.toJSON());
    if (!restored) {
      restored = true;
      if (!onchange) {
        untrack(() => {
          const saved = readSaved();
          if (saved) plan.load(saved);
        });
      }
      return;
    }
    const t = setTimeout(() => (onchange ? onchange(JSON.parse(json)) : writeSaved(json)), 400);
    return () => clearTimeout(t);
  });
</script>

<div class="app">
  <header class="top">
    <h1>{title}. {plan.building.name}</h1>
    {#if plan.selectedRoom}
      <p>{plan.selectedRoom.name}</p>
    {/if}
  </header>

  <div class="body">
    <main class="canvas">
      <FloorPlan {plan} {backdrop} />
    </main>
    <RoomDirectory {plan} />
  </div>
</div>

<style>
  .app {
    --fp-ink: #000;
    --fp-ink-soft: #5f5f5f;
    --fp-paper: #fff;
    --fp-floor: #fff;
    --fp-floor-muted: #f2f2ef;
    --fp-floor-hover: #edf1fc;
    --fp-line: #dcdcdc;
    --fp-accent: #2347d1;
    --fp-planned: #e8edfc;
    --fp-fit: #1d8a58;
    --fp-bad: #c4262e;
    --fp-bad-tint: #fdeaea;

    display: flex;
    flex-direction: column;
    height: 100vh;
    box-sizing: border-box;
    padding: 24px;
    gap: 20px;
    background: #f6f6f4;
    color: var(--fp-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  }

  .top { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; }
  h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.015em; }
  .top p { margin: 0; color: var(--fp-ink-soft); font-size: 15px; }

  .body {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    grid-template-rows: minmax(0, 1fr);
    gap: 20px;
    min-height: 0;
  }

  .canvas,
  .body > :global(.dir) {
    background: var(--fp-paper);
    border: 1px solid var(--fp-line);
    border-radius: 8px;
    overflow: hidden;
  }
  .canvas { min-height: 420px; }

  @media (max-width: 860px) {
    .app { padding: 12px; gap: 12px; height: auto; min-height: 100vh; }
    .body { grid-template-columns: 1fr; grid-template-rows: auto; }
    .canvas { height: 62vh; min-height: 340px; }
    .body > :global(.dir) { overflow: visible; }
  }
</style>
