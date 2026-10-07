<script lang="ts">
    import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
    import {
        DateFormatter,
        type DateValue,
        getLocalTimeZone,
    } from "@internationalized/date";
    import * as Popover from "$lib/components/popover";
    import { Button } from "$lib/components/button";
    import { Calendar } from "$lib/components/calendar";

    const df = new DateFormatter("en-US", {
        dateStyle: "long",
    });

    let {
        value = $bindable(),
        disabled = false,
        placeholder = "Pick a date",
    }: { value?: DateValue; disabled?: boolean; placeholder?: string } = $props();
</script>

<Popover.Root>
    <Popover.Trigger {disabled} >
        {#snippet child({ props })}
            <Button {...props} variant='outline'>
                { value ? df.format(value.toDate(getLocalTimeZone())) : placeholder }
                <ChevronDownIcon data-icon="inline-end" />
            </Button>
        {/snippet}
    </Popover.Trigger>


    <Popover.Content class="w-auto p-0" align="start">
        <Calendar type="single" bind:value />
    </Popover.Content>
</Popover.Root>
