<!--
  The side panel. On the overview it lists rooms; inside a room it lists what's
  there, lets you add a piece, and edits the selected one to the millimetre.
-->
<script>
  import { dims, m2, mm } from './format.js';
  import { PRESETS } from './presets.js';

  /** @type {{ plan: import('./plan.svelte.js').Plan, presets?: typeof PRESETS }} */
  let { plan, presets = PRESETS } = $props();

  const room = $derived(plan.selectedRoom);
  const contents = $derived(room ? (plan.byRoom.get(room.id) ?? []) : []);
  const movable = $derived(contents.filter((i) => !i.fixed));
  const builtIn = $derived(contents.filter((i) => i.fixed));
  const unplaced = $derived((plan.byRoom.get(null) ?? []).filter((i) => !i.fixed));
  const selected = $derived(plan.selectedItem);
  const issues = $derived(selected ? (plan.conflicts.get(selected.id) ?? []) : []);
  const pos = $derived(selected ? plan.position(selected.id) : null);
  const fitCount = $derived(plan.placement?.count ?? null);

  // Add form
  const first = presets[0];
  let presetKey = $state(first?.key ?? 'custom');
  let name = $state(first?.label ?? '');
  let width = $state(first?.w ?? 1000);
  let depth = $state(first?.h ?? 600);
  let front = $state(first?.clearance?.front ?? 0);
  let addNote = $state('');
  let copied = $state(false);

  function choosePreset(key) {
    presetKey = key;
    const p = presets.find((x) => x.key === key);
    if (!p) return;
    name = p.key === 'custom' ? '' : p.label;
    width = p.w;
    depth = p.h;
    front = p.clearance?.front ?? 0;
  }

  function add(e) {
    e.preventDefault();
    if (!room) return;
    const p = presets.find((x) => x.key === presetKey);
    const w = Math.max(50, Math.round(width || 0));
    const h = Math.max(50, Math.round(depth || 0));
    const { placed } = plan.add(
      {
        label: name.trim() || 'New piece',
        w,
        h,
        clearance: { ...(p?.clearance ?? {}), front: Math.max(0, Math.round(front || 0)) },
        status: 'planned',
        meta: p && p.key !== 'custom' ? { preset: p.key } : {},
      },
      room.id,
    );
    addNote = placed
      ? ''
      : `Nothing ${dims(w, h)} mm fits here with its clear space. It's in the middle of the room, marked red.`;
  }

  function roomIssues(id) {
    let n = 0;
    for (const it of plan.byRoom.get(id) ?? []) if (plan.conflicts.has(it.id)) n++;
    return n;
  }

  /** Wrap a handler so it only fires for a real number (an emptied field gives NaN). */
  const num = (fn) => (e) => {
    const n = e.currentTarget.valueAsNumber;
    if (Number.isFinite(n)) fn(n);
  };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  async function copyLayout() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(plan.toJSON(), null, 2));
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      copied = false;
    }
  }
</script>

<aside class="dir">
  {#if !room}
    <header>
      <h2>Rooms</h2>
      <p class="sub">Select a room to see what's in it and plan new pieces.</p>
    </header>

    <ul class="rooms">
      {#each plan.rooms as r (r.id)}
        {@const pieces = (plan.byRoom.get(r.id) ?? []).filter((i) => !i.fixed).length}
        {@const bad = roomIssues(r.id)}
        <li>
          <button type="button" class="row" onclick={() => plan.selectRoom(r.id)}>
            <span class="name">{r.name}</span>
            <span class="meta">{dims(r.bbox.w, r.bbox.h)}</span>
            <span class="count">
              {#if bad}<span class="flag">{plural(bad, 'clash', 'clashes')}</span>{/if}
              {plural(pieces, 'piece', 'pieces')}
            </span>
          </button>
        </li>
      {/each}
    </ul>

    {#if unplaced.length}
      <section>
        <h3>Not in any room</h3>
        <ul class="items">
          {#each unplaced as it (it.id)}
            <li class="row static"><span class="name">{it.label}</span><span class="meta">{dims(it.w, it.h)}</span></li>
          {/each}
        </ul>
      </section>
    {/if}
  {:else}
    <header>
      <button type="button" class="back" onclick={() => plan.selectRoom(null)}>Whole building</button>
      <h2>{room.name}</h2>
      <p class="sub"><span class="num">{dims(room.bbox.w, room.bbox.h)}</span> mm, {m2(room.area)} m²</p>
    </header>

    {#if selected && !selected.fixed}
      <section class="editor" aria-label="Selected piece">
        <div class="editor-head">
          <h3>{selected.label}</h3>
          <div class="seg" role="group" aria-label="Status">
            <button
              type="button"
              aria-pressed={selected.status === 'planned'}
              onclick={() => plan.update(selected.id, { status: 'planned' })}>Planned</button
            >
            <button
              type="button"
              aria-pressed={selected.status === 'existing'}
              onclick={() => plan.update(selected.id, { status: 'existing' })}>Already here</button
            >
          </div>
        </div>

        {#if issues.length}
          <ul class="issues" role="status">
            {#each issues as msg (msg)}<li>{msg}</li>{/each}
          </ul>
        {:else}
          <p class="ok" role="status">Fits, with its clear space free.</p>
        {/if}

        <div class="grid">
          <label class="wide">
            <span>Name</span>
            <input type="text" value={selected.label} onchange={(e) => plan.update(selected.id, { label: e.currentTarget.value })} />
          </label>
          <label>
            <span>Width</span>
            <input type="number" min="10" step="10" value={selected.w} onchange={num((n) => plan.resize(selected.id, n, selected.h))} />
          </label>
          <label>
            <span>Depth</span>
            <input type="number" min="10" step="10" value={selected.h} onchange={num((n) => plan.resize(selected.id, selected.w, n))} />
          </label>
          {#if pos}
            <label>
              <span>From left</span>
              <input type="number" step="10" value={Math.round(pos.left)} onchange={num((n) => plan.setPosition(selected.id, n, pos.top))} />
            </label>
            <label>
              <span>From top</span>
              <input type="number" step="10" value={Math.round(pos.top)} onchange={num((n) => plan.setPosition(selected.id, pos.left, n))} />
            </label>
          {/if}
          <label class="wide">
            <span>Clear space in front</span>
            <input
              type="number"
              min="0"
              step="50"
              value={selected.clearance?.front ?? 0}
              onchange={num((n) => plan.update(selected.id, { clearance: { ...(selected.clearance ?? {}), front: n } }))}
            />
          </label>
        </div>
        <p class="note">Millimetres. Position is the piece's top-left corner from the room's top-left corner.</p>

        <div class="actions">
          <button type="button" onclick={() => plan.rotate(selected.id, 90)}>Rotate 90°</button>
          {#if issues.length && fitCount}
            <button type="button" onclick={() => plan.relocate(selected.id)}>Move to nearest clear spot</button>
          {/if}
          <button type="button" class="danger" onclick={() => plan.remove(selected.id)}>Remove</button>
        </div>
        {#if fitCount === 0}
          <p class="note">There's no clear spot for this size in {room.name.toLowerCase()}. Try a smaller size or less clear space.</p>
        {/if}
      </section>
    {:else if selected?.fixed}
      <section class="editor">
        <h3>{selected.label}</h3>
        <p class="sub"><span class="num">{dims(selected.w, selected.h)}</span> mm. Built in, so it stays where it is.</p>
      </section>
    {/if}

    <section>
      <h3>Add furniture</h3>
      <form class="grid" onsubmit={add}>
        <label class="wide">
          <span>Type</span>
          <select value={presetKey} onchange={(e) => choosePreset(e.currentTarget.value)}>
            {#each presets as p (p.key)}<option value={p.key}>{p.label}</option>{/each}
          </select>
        </label>
        <label class="wide">
          <span>Name</span>
          <input type="text" bind:value={name} placeholder="New piece" />
        </label>
        <label>
          <span>Width</span>
          <input type="number" min="50" step="10" bind:value={width} />
        </label>
        <label>
          <span>Depth</span>
          <input type="number" min="50" step="10" bind:value={depth} />
        </label>
        <label class="wide">
          <span>Clear space in front</span>
          <input type="number" min="0" step="50" bind:value={front} />
        </label>
        <button type="submit" class="primary wide">Add to {room.name.toLowerCase()}</button>
      </form>
      {#if addNote}<p class="note warn" role="status">{addNote}</p>{/if}
    </section>

    <section>
      <h3>In this room</h3>
      {#if movable.length}
        <ul class="items">
          {#each movable as it (it.id)}
            {@const bad = plan.conflicts.has(it.id)}
            <li>
              <button
                type="button"
                class="row"
                class:active={it.id === plan.selectedItemId}
                aria-current={it.id === plan.selectedItemId}
                onclick={() => plan.selectItem(it.id)}
              >
                <span class="name">{it.label}</span>
                <span class="meta">{dims(it.w, it.h)}</span>
                <span class="count">
                  {#if bad}<span class="flag">Clashes</span>{:else if it.status === 'planned'}<span class="tag">Planned</span>{/if}
                </span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="note">Nothing here yet. Add the first piece above.</p>
      {/if}
    </section>

    {#if builtIn.length}
      <section>
        <h3>Built in</h3>
        <ul class="items">
          {#each builtIn as it (it.id)}
            <li>
              <button type="button" class="row muted" onclick={() => plan.selectItem(it.id)}>
                <span class="name">{it.label}</span>
                <span class="meta">{dims(it.w, it.h)}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}

  <footer>
    <button type="button" onclick={() => plan.undo()} disabled={!plan.canUndo}>Undo</button>
    <button type="button" onclick={() => plan.redo()} disabled={!plan.canRedo}>Redo</button>
    <button type="button" class="push" onclick={copyLayout}>{copied ? 'Copied' : 'Copy layout as JSON'}</button>
  </footer>
</aside>

<style>
  .dir {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    color: var(--fp-ink, #000);
    font-family: var(--fp-font, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif);
    font-size: 14px;
    line-height: 1.4;
    min-height: 0;
    overflow-y: auto;
  }

  h2 { margin: 0; font-size: 19px; font-weight: 600; letter-spacing: -0.01em; }
  h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
  .sub { margin: 4px 0 0; color: var(--fp-ink-soft, #5c5c5c); }
  .num, .meta { font-family: var(--fp-mono, ui-monospace, 'SF Mono', Menlo, Consolas, monospace); font-size: 12px; }
  .note { margin: 8px 0 0; color: var(--fp-ink-soft, #5c5c5c); font-size: 13px; }
  .warn { color: var(--fp-bad, #c4262e); }

  ul { list-style: none; margin: 0; padding: 0; }
  .rooms li + li, .items li + li { border-top: 1px solid var(--fp-line, #e6e6e6); }

  .row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: baseline;
    width: 100%;
    padding: 9px 6px;
    margin: 0;
    background: none;
    border: 0;
    border-radius: 4px;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row:hover { background: var(--fp-floor-muted, #f4f4f2); }
  .row.active { background: var(--fp-planned, #e8edfc); }
  .row.static { cursor: default; }
  .row.muted .name { color: var(--fp-ink-soft, #5c5c5c); }
  .row .meta { color: var(--fp-ink-soft, #5c5c5c); }
  .count { display: inline-flex; gap: 8px; align-items: baseline; color: var(--fp-ink-soft, #5c5c5c); font-size: 13px; min-width: 4.5em; justify-content: end; }
  .flag { color: var(--fp-bad, #c4262e); font-weight: 500; }
  .tag { color: var(--fp-accent, #2347d1); }

  .back {
    align-self: flex-start;
    margin: 0 0 10px;
    padding: 0;
    background: none;
    border: 0;
    font: inherit;
    font-size: 13px;
    color: var(--fp-accent, #2347d1);
    cursor: pointer;
  }
  .back:hover { text-decoration: underline; }

  .editor {
    padding: 14px;
    border: 1px solid var(--fp-accent, #2347d1);
    border-radius: 8px;
  }
  .editor-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .editor-head h3 { margin: 0; }
  .issues { margin: 0 0 12px; color: var(--fp-bad, #c4262e); font-size: 13px; }
  .issues li { padding-left: 12px; position: relative; }
  .issues li::before { content: ''; position: absolute; left: 0; top: 0.55em; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .ok { margin: 0 0 12px; color: var(--fp-fit, #1d7a4f); font-size: 13px; }

  .seg { display: inline-flex; border: 1px solid var(--fp-line, #d4d4d4); border-radius: 6px; overflow: hidden; }
  .seg button { padding: 4px 9px; border: 0; border-radius: 0; background: var(--fp-paper, #fff); font-size: 12px; }
  .seg button + button { border-left: 1px solid var(--fp-line, #d4d4d4); }
  .seg button[aria-pressed='true'] { background: var(--fp-ink, #000); color: var(--fp-paper, #fff); }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .wide { grid-column: 1 / -1; }
  label { display: flex; flex-direction: column; gap: 4px; }
  label span { font-size: 12px; color: var(--fp-ink-soft, #5c5c5c); }

  input, select {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 9px;
    border: 1px solid var(--fp-line, #d4d4d4);
    border-radius: 6px;
    background: var(--fp-paper, #fff);
    color: inherit;
    font: inherit;
  }
  input[type='number'] { font-family: var(--fp-mono, ui-monospace, 'SF Mono', Menlo, Consolas, monospace); font-size: 13px; }

  button {
    padding: 7px 12px;
    border: 1px solid var(--fp-line, #d4d4d4);
    border-radius: 6px;
    background: var(--fp-paper, #fff);
    color: var(--fp-ink, #000);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  button:hover:not(:disabled) { background: var(--fp-floor-muted, #f4f4f2); }
  button:disabled { opacity: 0.4; cursor: default; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--fp-accent, #2347d1); outline-offset: 1px; }
  .primary { background: var(--fp-ink, #000); border-color: var(--fp-ink, #000); color: var(--fp-paper, #fff); }
  .primary:hover:not(:disabled) { background: var(--fp-ink, #000); opacity: 0.85; }
  .danger { color: var(--fp-bad, #c4262e); }
  .row.active:hover { background: var(--fp-planned, #e8edfc); }

  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

  footer {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--fp-line, #e6e6e6);
  }
  .push { margin-left: auto; }
</style>
