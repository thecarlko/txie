<script lang="ts">
	import { Wafer, type DieInfo, type WaferViewMode } from '$lib/components/wafer';

	let waferId = $state('WFR-2026-01');
	let figureNumber = $state('No. 01');
	let view = $state<WaferViewMode>('isometric');
	let thickness = $state(20.0);
	let diameter = $state(200);
	let diePitchX = $state(9.5);
	let diePitchY = $state(9.5);
	let bowWarp = $state(0.0);
	let edgeExclusion = $state(5.0);
	let azimuth = $state(-28);
	let showPlinth = $state(true);

	let selectedDieId = $state<string | null>(null);
	let hoveredDieId = $state<string | null>(null);
	let activeDie = $state<DieInfo | null>(null);

	let processStep = $derived(
		thickness >= 20 ? 'incoming_raw' : thickness >= 15 ? 'post_grind' : 'final_polish'
	);
	let toolId = $derived(thickness >= 20 ? 'AFM51' : 'WTB02');
	let displayAzimuth = $derived(((Math.round(azimuth) % 360) + 360) % 360);
	let displayElevation = $derived(view === 'nadir' ? 90 : 30);
</script>

<div class="space-y-6 p-8">
	<div class="w-[50vw]">
		<section class="relative h-[44vh] w-full overflow-hidden rounded-lg bg-[#fafafa]">
			<!-- 4-Corner HUD Overlay on the parent section -->
			<div
				class="pointer-events-none absolute inset-0 z-10 grid grid-cols-2 grid-rows-[auto_1fr_auto] px-[18px] py-[14px] text-xs leading-snug text-[#8c8c90]"
				aria-hidden="true"
			>
				<span class="col-start-1 row-start-1 font-semibold text-[#57575a]">
					{figureNumber}
				</span>
				<span class="col-start-2 row-start-1 text-right font-medium text-[#18181a]">
					{waferId} · {processStep.replace(/_/g, ' ')}
				</span>
				<span class="col-start-1 row-start-3">
					{#if activeDie}
						<strong class="text-[#18181a]">Die ({activeDie.row}, {activeDie.col})</strong>
						· {activeDie.value.toFixed(2)}&nbsp;mm
						· dev {(activeDie.deviation * 100).toFixed(0)}%
						{#if activeDie.isAnomaly}
							· <span class="font-semibold text-red-600">ANOMALY</span>
						{/if}
					{:else}
						Drag to turn · Hover/click die · {view === 'nadir' ? 'Nadir (90°)' : 'Isometric (30°)'}
					{/if}
				</span>
				<span class="col-start-2 row-start-3 text-right font-medium tabular-nums text-[#18181a]">
					Ø {diameter.toFixed(0)}&nbsp;mm · {thickness.toFixed(1)}&nbsp;mm · pitch {diePitchX.toFixed(1)}&nbsp;mm · θ {displayAzimuth}° · φ {displayElevation}°
				</span>
			</div>

			<Wafer
				{waferId}
				{thickness}
				{diameter}
				{diePitchX}
				{diePitchY}
				{bowWarp}
				{edgeExclusion}
				{view}
				bind:azimuth
				bind:selectedDieId
				bind:hoveredDieId
				onHoverDie={(d) => {
					if (d) activeDie = d;
				}}
				onSelectDie={(d) => {
					activeDie = d;
				}}
				{showPlinth}
			/>
		</section>

		<!-- Bottom Caption Readout -->
		<div class="flex items-center justify-between px-1 pt-2 text-xs text-zinc-500">
			<span class="flex items-center gap-3">
				<span>Drag to turn</span>
				<span>Click die to inspect</span>
			</span>
			<span class="font-medium tabular-nums">
				{waferId}&nbsp;· {thickness.toFixed(1)}&nbsp;mm&nbsp;· { toolId }&nbsp;· {view}
			</span>
		</div>
	</div>

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
			onclick={() => {
				diePitchX = diePitchX === 9.5 ? 12.5 : 9.5;
				diePitchY = diePitchX;
			}}
		>
			Die Pitch: {diePitchX} mm
		</button>

		<button
			class="rounded border px-3 py-1.5 text-sm"
			onclick={() => (bowWarp = bowWarp === 0.0 ? 3.1 : 0.0)}
		>
			Bow/Warp: {bowWarp} mm
		</button>
	</div>
</div>