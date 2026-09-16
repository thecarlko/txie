

<script lang='ts'>
    import { Button } from '$lib/components/button';
    import { Label } from '$lib/components/label';
    import * as Popover from '$lib/components/popover';
    import { Calendar } from '$lib/components/calendar';
    import { ChevronDownIcon } from '@lucide/svelte';
    import { type DateValue, getLocalTimeZone, type CalendarDate } from "@internationalized/date";
    import { Input } from '$lib/components/input';

    let open = $state(true);
    let rand = Math.floor(Math.random() * 1000000).toString();

    let {
        title = "Select Date",
        value = $bindable<CalendarDate>()
    } = $props();
</script>


<Input
    type="date"
    id="date"
    step="1"
    bind:value
    class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
/>