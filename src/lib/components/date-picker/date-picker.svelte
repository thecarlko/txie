<script lang="ts">
    import { CalendarDate, getLocalTimeZone, today, type DateValue } from "@internationalized/date";
    import { parseDate } from "chrono-node";
    import { untrack } from "svelte";
    import * as Popover from "$lib/components/popover";
    import { Button } from "$lib/components/button";
    import { Calendar } from "$lib/components/calendar";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { CalendarIcon } from "@lucide/svelte";

    function formatDate(date: DateValue | undefined) {
        if (!date) return "";

        return date.toDate(getLocalTimeZone()).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }

    let { inputValue = $bindable<string>() } = $props();
    const id = $props.id();

    let open = $state(false);
    let value = $state<DateValue | undefined>(
        untrack(() => {
            const date = parseDate(inputValue);
            if (date)
                return new CalendarDate(
                    date.getFullYear(),
                    date.getMonth() + 1,
                    date.getDate(),
                );
            return undefined;
        }),
    );
</script>


<Popover.Root bind:open>
    <Popover.Trigger id="{id}-date-picker" class="border w-full py-1.5 px-3 text-start disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 grid grid-cols-[1fr_auto]">
        { formatDate(value) }
        <CalendarIcon class='size-5 stroke-1' />
    </Popover.Trigger>

    <Popover.Content class="w-auto overflow-hidden p-0" align="end">
        <Calendar
            type="single"
            bind:value
            captionLayout="dropdown"
            minValue={today(getLocalTimeZone())}
            onValueChange={(v) => {
                inputValue = formatDate(v);
                open = false;
            }}
        />
    </Popover.Content>
</Popover.Root>