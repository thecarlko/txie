<script lang="ts">
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Textarea } from "$lib/components/textarea";

    /** `id` prefixes the element ids so several vendor forms can share a page */
    let {
        id,
        manufacturer = $bindable(),
        model = $bindable(),
        configuration = $bindable(),
        leadTime = $bindable(),
    }: {
        id: string;
        manufacturer: string;
        model: string;
        configuration: string;
        leadTime: number | null;
    } = $props();
</script>

<div class='grid grid-cols-2 gap-y-3 gap-x-4'>
    <Label for='{id}-manufacturer'>Manufacturer</Label>
    <Label for='{id}-model'>Model</Label>
    <Input bind:value={manufacturer} id='{id}-manufacturer' type='text' placeholder='Applied Materials, LAM, Camtek ...' />
    <Input bind:value={model} id='{id}-model' type='text' placeholder='PJ9000' />

    <Label for='{id}-configuration' class='col-span-full pt-3'>Configuration</Label>
    <Textarea bind:value={configuration} id='{id}-configuration' maxlength={300} class='col-span-full min-h-20 resize-none' placeholder="200mm/300mm capability with 4 baths spec'd for Cu RDL, Bump Cu, Bump Ni, Bump SnAg" />

    <Label for='{id}-lead-time' class='col-span-full pt-3'>Lead time (weeks)</Label>
    <Input bind:value={leadTime} id='{id}-lead-time' type='number' min='0' placeholder='26' />
</div>
