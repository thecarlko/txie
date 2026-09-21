


<script lang='ts'>
    import * as Tabs from "$lib/components/tabs";
</script>



<Tabs.Content value="committee" class='border border-green-400 grid grid-cols-2 pt-16 px-[5vw]'>
    <section class='border border-blue-400'>
        <h3>Proposals</h3>
    </section>


    <article class='border border-orange-400'>
        <h3>Wafer Based Plasma Dicing</h3>
        <p>Version #1</p>
        <br>
        <p>
            To support C4 bumping process when pitch is >=200 um.<br>
            Multiple potential customers asking for capability with 4 mil to 16 mil spheres, SnPb and SnAg.<br>
            <br>
            Two options:<br>
            ‒ (1) ball drop (w/flux print & rework), est. $2M,<br>
            ‒ (2) laser jet (lower throughput), est. $800k<br>
        </p>
        <br>
        <hr class='border-[0.5] border-dashed'>
        <br>
        <h3>Committee</h3>
        {@render Person({ name: "Pratik Joshi" })}
        {@render Person({ name: "Jane Smith" })}

    </article>
</Tabs.Content>



{#snippet Person(info: { name: string})}
    <div class='border border-gray-300 p-2'>
        <p><strong>{name}</strong></p>
    </div>
{/snippet}