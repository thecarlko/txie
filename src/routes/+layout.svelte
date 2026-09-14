<script lang="ts">
    import '$lib/styles/layout.css'
	import { UserRoundIcon } from '@lucide/svelte';
    import { Button } from '$lib/components/button';
	import * as Avatar from '$lib/components/avatar';
	import * as Tooltip from '$lib/components/tooltip';
    
    
	let { children } = $props();
    let sessionUser = $state(undefined);
</script>



<Tooltip.Provider>
<nav class='fixed top-0 left-0 right-0 px-4 py-2 z-50 flex justify-between font-sans'>
    <a href='/' aria-label="Home"><img class='h-10' src='/brand/wordmark.svg' alt="Home"/></a>

    <a href={ sessionUser ? "/profile" : "/login" }>
        {#if sessionUser }
        <Avatar.Root>
            <Avatar.Image src="https://api.dicebear.com/9.x/glass/svg?seed=pratik_joshi@txie.org" alt="Pratik Joshi" />
            <Avatar.Fallback>PJ</Avatar.Fallback>
        </Avatar.Root>
        {:else}
        <UserRoundIcon class='size-10 p-2 rounded-full bg-muted border shadow/10' strokeWidth={1} />
        {/if}
    </a>
</nav>


<main id='txie' class='relative font-normal min-h-screen min-w-screen'>
    {@render children()}
</main>
</Tooltip.Provider>

