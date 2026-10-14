<script lang="ts">
	import { Wafer, type WaferViewMode } from '$lib/components/wafer';

	let view = $state<WaferViewMode>('isometric');
	let thickness = $state(20.0);
	let diameter = $state(200);
	let diePitchX = $state(5.2);
	let diePitchY = $state(5.2);
	let bowWarp = $state(0.0);
	let edgeExclusion = $state(5.0);
	let azimuth = $state(-28);
	let showPlinth = $state(true);
</script>

<div class="space-y-6 p-8">
	<section class="h-[40vh] w-[50vw] border border-red-500">
		<Wafer
			{thickness}
			{diameter}
			{diePitchX}
			{diePitchY}
			{bowWarp}
			{edgeExclusion}
			{view}
			bind:azimuth
			{showPlinth}
		/>
	</section>

	<!-- Unconnected external controls -->
	<div class="flex flex-wrap items-center gap-3">
		<button
			class="rounded border px-3 py-1.5 text-sm font-medium"
			onclick={() => (view = view === 'isometric' ? 'nadir' : 'isometric')}
		>
			View: {view === 'isometric' ? '3D Isometric (30°)' : 'Top-Down Nadir (90°)'}
		</button>

		<button class="rounded border px-3 py-1.5 text-sm" onclick={() => (thickness = 20.0)}>
			Incoming (20.0 mm)
		</button>
		<button class="rounded border px-3 py-1.5 text-sm" onclick={() => (thickness = 16.0)}>
			Post-Grind (16.0 mm)
		</button>
		<button class="rounded border px-3 py-1.5 text-sm" onclick={() => (thickness = 11.0)}>
			Final Polish (11.0 mm)
		</button>

		<button
			class="rounded border px-3 py-1.5 text-sm"
			onclick={() => (diameter = diameter === 200 ? 150 : 200)}
		>
			Diameter: {diameter} mm
		</button>

		<button
			class="rounded border px-3 py-1.5 text-sm"
			onclick={() => (edgeExclusion = edgeExclusion === 5.0 ? 15.0 : 5.0)}
		>
			Edge Exclusion: {edgeExclusion} mm
		</button>

		<button
			class="rounded border px-3 py-1.5 text-sm"
			onclick={() => (showPlinth = !showPlinth)}
		>
			Plinth: {showPlinth ? 'On' : 'Off'}
		</button>
	</div>
</div>