






<script lang='ts'>
    import * as Tabs from "$lib/components/tabs";
    import type { PurchaseRequest } from "$lib/data/procurement.svelte";
    let { request = $bindable() as PurchaseRequest, section = $bindable() } = $props()

</script>



<Tabs.Content value="vendors" class='border border-green-400'>
    <br>
    <br>
    <br>
    <h1>This is the vendors page</h1>
</Tabs.Content>