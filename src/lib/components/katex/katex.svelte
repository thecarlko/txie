<script>
  import katex from 'katex';

  /**
   * The LaTeX formula to render.
   * @type {{ formula: string, displayMode?: boolean }}
   */
  let { formula, displayMode = false } = $props();

  // katex.renderToString works on both server and client (SSR safe)
  let html = $derived(
    katex.renderToString(formula, {
      displayMode,
      throwOnError: false
    })
  );
</script>

{@html html}