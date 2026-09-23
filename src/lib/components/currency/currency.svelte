<script lang='ts'>
    import * as InputGroup from '$lib/components/input-group';

    let { value = $bindable<number | undefined>(undefined) } = $props();
    let displayValue = $state(value ? formatWithCommas(value.toString()) : '');


    function formatWithCommas(digits: string): string {
        if (!digits) return '';
        const [intPart, decPart] = digits.split('.');
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    }

    function handleInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const raw = input.value.replace(/,/g, '');

        // reject anything that isn't digits + at most one decimal point
        if (!/^\d*\.?\d*$/.test(raw)) {
            input.value = displayValue; // revert to last valid state
            return;
        }

        const cursorFromEnd = input.value.length - (input.selectionStart ?? input.value.length);

        displayValue = formatWithCommas(raw);
        value = raw ? parseFloat(raw) : undefined;

        // keep cursor at the same distance from the end after reformatting
        requestAnimationFrame(() => {
            const pos = displayValue.length - cursorFromEnd;
            input.setSelectionRange(pos, pos);
        });
    }
</script>

<InputGroup.Root class='col-span-2'>
<InputGroup.Addon><InputGroup.Text>$</InputGroup.Text></InputGroup.Addon>
<InputGroup.Input
    bind:value={displayValue}
    oninput={handleInput}
    placeholder="10,000.00"
    type="text"
    inputmode="decimal"
/>
<InputGroup.Addon align="inline-end"><InputGroup.Text>USD</InputGroup.Text></InputGroup.Addon>
</InputGroup.Root>