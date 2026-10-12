<script lang="ts">
    import { FileText, Upload, X } from "@lucide/svelte";
    import * as Attachment from "$lib/components/attachment";
    import * as Field from "$lib/components/field";

    /** Files stay in the browser; they aren't saved to the snapshot yet */
    let { files = $bindable(), disabled = false }: { files: File[]; disabled?: boolean } = $props();

    let dragging = $state(false);

    const fileSize = (n: number) => (n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
    const fileKind = (f: File) => (f.name.split(".").pop() ?? "file").toUpperCase();

    function addFiles(list: FileList | null) {
        if (!list) return;
        const known = new Set(files.map((f) => `${f.name}:${f.size}`));
        files = [...files, ...Array.from(list).filter((f) => !known.has(`${f.name}:${f.size}`))];
    }
</script>

<Field.Set>
    <Field.Legend class="font-medium text-lg mb-1">Attachments</Field.Legend>
    <Field.Description>Add any additional files (e.g. quotes, datasheets, or emails)</Field.Description>
    <label
        class={["flex flex-col items-center gap-1.5 border border-dashed p-6 text-center text-sm transition-colors mt-4",
        disabled ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-accent/50 has-focus-visible:ring-2 has-focus-visible:ring-ring",
        dragging && "bg-accent"]}
        ondragover={(e) => { if (disabled) return; e.preventDefault(); dragging = true; }}
        ondragleave={() => { if (disabled) return; dragging = false; }}
        ondrop={(e) => { if (disabled) return; e.preventDefault(); dragging = false; addFiles(e.dataTransfer?.files ?? null); }}>
        <Upload class="size-5 stroke-[1.5]" />
        <span class="font-medium">Drop files here</span>
        <span class="text-muted-foreground">or click to browse</span>
        <input type="file" multiple class="sr-only" {disabled} onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ""; }} />
    </label>
    {#if files.length}
        <div class="flex flex-col gap-2 mt-4">
            {#each files as f, i (f.name + f.size + f.lastModified)}
                <Attachment.Root state="idle" size="sm" class="w-full">
                    <Attachment.Media><FileText /></Attachment.Media>
                    <Attachment.Content>
                        <Attachment.Title>{f.name}</Attachment.Title>
                        <Attachment.Description>{fileKind(f)} {fileSize(f.size)}</Attachment.Description>
                    </Attachment.Content>
                    <Attachment.Actions>
                        <Attachment.Action aria-label="Remove {f.name}" {disabled} onclick={() => (files = files.filter((_, j) => j !== i))}><X /></Attachment.Action>
                    </Attachment.Actions>
                </Attachment.Root>
            {/each}
        </div>
    {/if}
</Field.Set>
