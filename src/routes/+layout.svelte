<script lang="ts">
    import '$lib/styles/layout.css'
	import { Banknote, Cpu, DraftingCompass, Pickaxe, UserRoundIcon } from '@lucide/svelte';
	import * as Avatar from '$lib/components/avatar';
	import * as Tooltip from '$lib/components/tooltip';
    import { Toaster } from '$lib/components/sonner';
    import { ModeWatcher } from "mode-watcher";
    import MoonIcon from "@lucide/svelte/icons/moon";
    import SunIcon from "@lucide/svelte/icons/sun";
    import { toggleMode } from "mode-watcher";
    import { Button } from "$lib/components/button";
    import 'katex/dist/katex.min.css';
    import { fly } from 'svelte/transition';
    import { page } from '$app/state';
    import type { Component } from 'svelte';
    

    type Department = { url: string; title: string; icon: Component }
    const departments: Department[] = [
        { url: '/finance', title: 'Finance', icon: Banknote },
        { url: '/metrology', title: 'Metrology', icon: DraftingCompass },
        { url: '/engineering', title: 'Engineering', icon: Cpu },
        { url: '/equipment', title: 'Equipment', icon: Pickaxe },
    ]
    
    
	let { children } = $props();
    let sessionUser = $state(undefined);

    const isActive = (url: string) => page.url.pathname === url || page.url.pathname.startsWith(`${url}/`);
</script>


<Toaster richColors />
<Tooltip.Provider>
<nav class='fixed inset-x-0 top-0 z-50 grid h-14 grid-cols-3 items-center gap-3 px-6 bg-txie-canvas font-sans text-txie-ink scheme-light'>
    <a href='/' aria-label="Home" class='mr-auto h-10 py-3 grid items-center focus-visible:outline-2 focus-visible:outline-txie-ink'><img class='h-full' src='/brand/word.svg' alt="Home"/></a>

    <div class='flex justify-center'>
        {@render TabBar()}
    </div>


    <div class='flex items-center gap-3 justify-end'>
        <Button onclick={toggleMode} variant="ghost" size="icon" class='rounded-none text-txie-secondary hover:bg-txie-subtle hover:text-txie-ink'>
        <SunIcon class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"/>
        <MoonIcon class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"/>
        </Button>
    
        <a class='focus-visible:outline-2 focus-visible:outline-txie-ink' href={ sessionUser ? "/profile" : "/login" }>
            {#if sessionUser }
            <Avatar.Root>
                <Avatar.Image src="https://api.dicebear.com/9.x/glass/svg?seed=pratik_joshi@txie.org" alt="Pratik Joshi" />
                <Avatar.Fallback>PJ</Avatar.Fallback>
            </Avatar.Root>
            {:else}
            <UserRoundIcon class='size-10 p-2 rounded-full border border-txie-rule text-txie-secondary' strokeWidth={1} />
            {/if}
        </a>
    </div>
</nav>


<main id='txie' class='relative font-normal min-h-screen max-w-screen'>
    {@render children()}
</main>
</Tooltip.Provider>
<ModeWatcher />





{#snippet TabBar()}
    {#if page.url.pathname !== '/'}
        <div class='grid grid-cols-4 items-center gap-1' transition:fly={{ y: -24, duration: 250 }}>
            {#each departments as { url, title, icon: Icon } (url)}
                <Tooltip.Root>
                    <Tooltip.Trigger>
                        {#snippet child({ props })}
                            <a {...props} href={url} aria-label={title} aria-current={isActive(url) ? 'page' : undefined}
                                class='text-sm font-medium flex items-center justify-center gap-2 px-3 min-[1000px]:pl-4 min-[1000px]:pr-5 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-txie-ink
                                    {isActive(url) ? 'text-brand-500' : 'text-txie-secondary hover:text-txie-ink'}'>
                                <Icon class='h-4 w-4 shrink-0' strokeWidth={1.5}/>
                                <span class='hidden min-[1000px]:inline'>{title}</span>
                            </a>
                        {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content side='bottom' sideOffset={8} class='min-[1000px]:hidden'>
                        {title}
                    </Tooltip.Content>
                </Tooltip.Root>
            {/each}
        </div>
    {/if}
{/snippet}

