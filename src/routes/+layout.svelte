<script lang="ts">
    import '$lib/styles/layout.css'
	import { UserRoundIcon } from '@lucide/svelte';
	import * as Avatar from '$lib/components/avatar';
	import * as Tooltip from '$lib/components/tooltip';
    import { Toaster } from '$lib/components/sonner';
    import { ModeWatcher } from "mode-watcher";
    import MoonIcon from "@lucide/svelte/icons/moon";
    import SunIcon from "@lucide/svelte/icons/sun";
    import { toggleMode } from "mode-watcher";
    import { Button } from "$lib/components/button";
    
    
	let { children } = $props();
    let sessionUser = $state(undefined);
</script>



<Toaster richColors />
<Tooltip.Provider>
<nav class='fixed top-0 left-0 right-0 px-4 py-2 z-50 grid grid-cols-[1fr_auto_auto] items-center gap-3 font-sans pointer-events-none'>
    <a href='/' aria-label="Home" class='pointer-events-auto mr-auto'><img class='h-10' src='/brand/wordmark.svg' alt="Home"/></a>

    <Button onclick={toggleMode} variant="ghost" size="icon" class='pointer-events-auto'>
    <SunIcon class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"/>
    <MoonIcon class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"/>
    </Button>

    <a class='pointer-events-auto' href={ sessionUser ? "/profile" : "/login" }>
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


<main id='txie' class='relative font-normal min-h-screen max-w-screen'>
    {@render children()}
</main>
</Tooltip.Provider>
<ModeWatcher />

