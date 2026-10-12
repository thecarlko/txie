<script lang="ts" module>
    import { generateID } from "$lib/hooks/hash";
    import type { Footprint } from "$lib/models/procurement";

    /** One support item in the form: cost in dollars. `key` only keys the rows; it isn't saved. */
    export type ItemRow = { key: string; name: string; cost?: number; leadTime: number | null; size: Footprint };

    export const newItem = (): ItemRow => ({ key: generateID(), name: "", leadTime: null, size: {} });
</script>

<script lang="ts">
    import { slide } from "svelte/transition";
    import { Plus, X } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import { Currency } from "$lib/components/currency";
    import * as Field from "$lib/components/field";
    import { Input } from "$lib/components/input";

    /** Equipment bought or rented alongside the tool; its total is the vendor's `support_equipment` cost */
    let { items = $bindable() }: { items: ItemRow[] } = $props();

    const columns = "grid grid-cols-[1fr_9rem_6rem_auto] items-end gap-x-3";
</script>

<Field.Set>
    <Field.Legend variant='label'>Support Equipment</Field.Legend>
    <Field.Description>Chillers, pumps, analyzers, or anything else bought or rented alongside the tool. Their total is added to the cost above.</Field.Description>

    {#if items.length}
        <div class='grid gap-2'>
            <div class='{columns} text-sm text-muted-foreground'>
                <span>Item</span>
                <span>Cost</span>
                <span>Lead (weeks)</span>
                <span class='size-9'></span>
            </div>
            {#each items as item (item.key)}
                <div class={columns} transition:slide={{ duration: 200 }}>
                    <Input bind:value={item.name} aria-label='Item name' placeholder='Chiller' />
                    <Currency bind:value={item.cost} placeholder='25,000' variant='underline' />
                    <Input bind:value={item.leadTime} type='number' min='0' aria-label='Lead time in weeks' placeholder='9' />
                    <Button size='icon' variant='ghost' aria-label='Remove {item.name || "item"}' onclick={() => (items = items.filter((i) => i.key !== item.key))}>
                        <X class='size-4' />
                    </Button>
                </div>
            {/each}
        </div>
    {/if}

    <Button size='sm' variant='outline' class='w-max gap-2' onclick={() => items.push(newItem())}><Plus class='size-4' /> Add item</Button>
</Field.Set>
