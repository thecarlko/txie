<script lang='ts'>
    let { purpose }: { purpose: string } = $props();
</script>

<div class='max-w-56 truncate' title={purpose}>{ purpose }</div>
