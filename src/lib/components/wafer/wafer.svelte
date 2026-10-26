<script lang="ts">
	import { Spring } from 'svelte/motion';
	import {
		createWaferRing,
		extrudeCylinder,
		generateDieGrid,
		projectDieGridFast,
		projectPoint,
		projectSingleDie,
		screenToWaferPlane,
		type CameraParams,
		type DieCell
	} from './geo';
	import type { WaferProps } from './types';

	let {
		waferId = 'WFR-2026-01',
		diameter = 200,
		thickness = 20.0,
		diePitchX = 9.5,
		diePitchY = 9.5,
		bowWarp = 0.0,
		edgeExclusion = 5.0,
		view = 'isometric',
		azimuth = $bindable(-28),
		showPlinth = true,
		showNotch = true,
		showDies = true,
		dieData = undefined,
		selectedDieId = $bindable(null),
		hoveredDieId = $bindable(null),
		onSelectDie = undefined,
		onHoverDie = undefined,
		theme = 'light'
	}: WaferProps = $props();

	let containerWidth = $state(640);
	let containerHeight = $state(470);
	let isCompact = $derived(containerWidth < 120 || containerHeight < 90);
	let isNadirMode = $derived(view === 'nadir');

	let svgElement = $state<SVGSVGElement | null>(null);

	// Smooth physical springs for camera & wafer metrology parameters
	const azimuthSpring = new Spring(azimuth, { stiffness: 0.14, damping: 0.72 });
	const elevationSpring = new Spring(view === 'nadir' ? 90 : 30, { stiffness: 0.09, damping: 0.78 });
	const diameterSpring = new Spring(diameter, { stiffness: 0.1, damping: 0.75 });
	const thicknessSpring = new Spring(thickness, { stiffness: 0.1, damping: 0.75 });
	const edgeExclusionSpring = new Spring(edgeExclusion, { stiffness: 0.12, damping: 0.78 });
	const diePitchXSpring = new Spring(diePitchX, { stiffness: 0.12, damping: 0.78 });
	const diePitchYSpring = new Spring(diePitchY, { stiffness: 0.12, damping: 0.78 });
	const bowWarpSpring = new Spring(bowWarp, { stiffness: 0.1, damping: 0.75 });
	const hoverLiftSpring = new Spring(0, { stiffness: 0.25, damping: 0.7 });

	$effect(() => {
		azimuthSpring.target = azimuth;
	});

	$effect(() => {
		elevationSpring.target = view === 'nadir' ? 90 : 30;
		// Clear die hover/selection tracking whenever leaving Nadir mode
		if (view !== 'nadir') {
			hoveredDieId = null;
			hoverLiftSpring.set(0, { instant: true });
			onHoverDie?.(null);
		}
	});

	$effect(() => {
		diameterSpring.target = diameter;
	});

	$effect(() => {
		thicknessSpring.target = thickness;
	});

	$effect(() => {
		edgeExclusionSpring.target = edgeExclusion;
	});

	$effect(() => {
		diePitchXSpring.target = diePitchX;
	});

	$effect(() => {
		diePitchYSpring.target = diePitchY;
	});

	$effect(() => {
		bowWarpSpring.target = bowWarp;
	});

	// Coordinate space constants
	const CENTER_X = 320;
	const CENTER_Y = 235;
	const SCALE = 1.0;

	let sceneRadius = $derived((diameterSpring.current / 200) * 155);
	let sceneHeight = $derived(thicknessSpring.current * 1.35);
	let sceneExclusion = $derived(
		(edgeExclusionSpring.current / (diameterSpring.current / 2)) * sceneRadius
	);

	let cam = $derived<CameraParams>({
		azimuthDeg: azimuthSpring.current,
		elevationDeg: elevationSpring.current,
		centerX: CENTER_X,
		centerY: CENTER_Y,
		scale: SCALE
	});

	let plinthCam = $derived<CameraParams>({
		azimuthDeg: 0,
		elevationDeg: elevationSpring.current,
		centerX: CENTER_X,
		centerY: CENTER_Y,
		scale: SCALE
	});

	// 1. Stationary Metrology Plinth Geometry
	let plinthRing = $derived(createWaferRing(sceneRadius + 32, false));
	let plinthGeo = $derived(extrudeCylinder(plinthRing, -14, 0, plinthCam, false));

	let plinthTicks = $derived.by(() => {
		let minor = '';
		let major = '';
		const rInner = sceneRadius + 18;
		const rOuterMinor = sceneRadius + 25;
		const rOuterMajor = sceneRadius + 29;

		for (let deg = 0; deg < 360; deg += 5) {
			const rad = (deg * Math.PI) / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);
			const isMajor = deg % 30 === 0;

			const p1 = projectPoint({ x: rInner * cos, y: rInner * sin, z: 0 }, plinthCam);
			const r2 = isMajor ? rOuterMajor : rOuterMinor;
			const p2 = projectPoint({ x: r2 * cos, y: r2 * sin, z: 0 }, plinthCam);

			const seg = `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}L${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
			if (isMajor) major += seg;
			else minor += seg;
		}
		return { minor, major };
	});

	// 2. Rotatable Silicon Wafer Cylinder Geometry
	let waferRing = $derived(createWaferRing(sceneRadius, showNotch));
	let waferGeo = $derived(extrudeCylinder(waferRing, 0, sceneHeight, cam, true));

	let exclusionRingPath = $derived.by(() => {
		const innerRadius = Math.max(4, sceneRadius - sceneExclusion);
		const innerRing = createWaferRing(innerRadius, showNotch);
		let d = '';
		for (let i = 0; i < innerRing.points.length; i++) {
			const pt = projectPoint(
				{ x: innerRing.points[i].x, y: innerRing.points[i].y, z: sceneHeight },
				cam
			);
			d += `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
		}
		return d + 'Z';
	});

	let notchMarkerPath = $derived.by(() => {
		if (!showNotch) return '';
		const p1 = projectPoint({ x: 0, y: sceneRadius * 0.955, z: sceneHeight }, cam);
		const p2 = projectPoint({ x: 0, y: sceneRadius * 0.89, z: sceneHeight }, cam);
		return `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}L${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
	});

	// 3. Parametric Die Grid (Cached: only recomputes when physical wafer/die props change, NEVER on camera rotation)
	let dieGridData = $derived(
		showDies
			? generateDieGrid({
					diameterMm: diameterSpring.current,
					edgeExclusionMm: edgeExclusionSpring.current,
					pitchXMm: diePitchXSpring.current,
					pitchYMm: diePitchYSpring.current,
					thicknessMm: thicknessSpring.current,
					bowWarp: bowWarpSpring.current,
					sceneRadius,
					dieData
				})
			: { cells: [], cellMap: new Map<string, DieCell>(), pitchXScene: 10, pitchYScene: 10 }
	);

	// Fast batch projection of base dies (no hover state dependency -> dragging/hovering in Nadir doesn't re-project all 290 dies!)
	let projectedDies = $derived(
		projectDieGridFast({
			cells: dieGridData.cells,
			waferTopZ: sceneHeight,
			cam
		})
	);

	// Dedicated single-die projection for the hovered & selected dies in Nadir Mode
	let activeHoveredProjection = $derived.by(() => {
		if (!isNadirMode || !hoveredDieId || hoveredDieId === selectedDieId) return null;
		const cell = dieGridData.cellMap.get(hoveredDieId);
		if (!cell) return null;
		return projectSingleDie(cell, sceneHeight, hoverLiftSpring.current * 7.5, cam, true);
	});

	let activeSelectedProjection = $derived.by(() => {
		if (!isNadirMode || !selectedDieId) return null;
		const cell = dieGridData.cellMap.get(selectedDieId);
		if (!cell) return null;
		return projectSingleDie(cell, sceneHeight, 8.0, cam, true);
	});

	/**
	 * O(1) Mathematical Hit-Test for Nadir Mode:
	 * Converts pointer clientX/Y -> SVG viewBox (640x470) -> Wafer (sx, sy) -> Grid (row, col)
	 */
	function hitTestDieAtPointer(e: PointerEvent): DieCell | null {
		if (!isNadirMode || !showDies || !svgElement) return null;
		const rect = svgElement.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return null;

		// Account for preserveAspectRatio="xMidYMid meet"
		const scale = Math.min(rect.width / 640, rect.height / 470);
		const offsetX = (rect.width - 640 * scale) * 0.5;
		const offsetY = (rect.height - 470 * scale) * 0.5;

		const svgX = (e.clientX - rect.left - offsetX) / scale;
		const svgY = (e.clientY - rect.top - offsetY) / scale;

		const waferPt = screenToWaferPlane(svgX, svgY, sceneHeight, cam);
		const col = Math.round(waferPt.x / dieGridData.pitchXScene);
		const row = Math.round(waferPt.y / dieGridData.pitchYScene);

		const candidate = dieGridData.cellMap.get(`${row},${col}`);
		if (!candidate) return null;

		// Check if pointer is within the die's actual footprint (excluding street/kerf)
		if (
			Math.abs(waferPt.x - candidate.sx) <= candidate.hw * 1.12 &&
			Math.abs(waferPt.y - candidate.sy) <= candidate.hh * 1.12
		) {
			return candidate;
		}
		return null;
	}

	// Pointer interaction state
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartAzimuth = 0;

	function onPointerDown(e: PointerEvent) {
		// In Nadir mode, if clicking directly on a die, die selection takes priority over turntable drag
		if (isNadirMode) {
			const hit = hitTestDieAtPointer(e);
			if (hit) {
				const nextId = selectedDieId === hit.id ? null : hit.id;
				selectedDieId = nextId;
				onSelectDie?.(nextId ? hit : null);
				return;
			}
		}

		isDragging = true;
		dragStartX = e.clientX;
		dragStartAzimuth = azimuthSpring.target;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (isDragging) {
			const dx = e.clientX - dragStartX;
			const nextAzimuth = dragStartAzimuth - dx * 0.45;
			azimuth = nextAzimuth;
			azimuthSpring.set(nextAzimuth, { instant: true });
			return;
		}

		// Only track die hover when in Nadir Mode
		if (isNadirMode) {
			const hit = hitTestDieAtPointer(e);
			const nextId = hit?.id ?? null;
			if (nextId !== hoveredDieId) {
				hoveredDieId = nextId;
				if (hit) {
					hoverLiftSpring.set(0, { instant: true });
					hoverLiftSpring.target = 1;
				} else {
					hoverLiftSpring.target = 0;
				}
				onHoverDie?.(hit);
			}
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;
		if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		}
	}

	function onPointerLeave() {
		isDragging = false;
		if (hoveredDieId) {
			hoveredDieId = null;
			hoverLiftSpring.target = 0;
			onHoverDie?.(null);
		}
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			azimuth -= e.shiftKey ? 30 : 10;
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			azimuth += e.shiftKey ? 30 : 10;
		} else if (e.key === 'Escape' && selectedDieId) {
			selectedDieId = null;
			onSelectDie?.(null);
		}
	}

	let displayAzimuth = $derived(((Math.round(azimuthSpring.current) % 360) + 360) % 360);
</script>

<figure
	class="live"
	data-ready=""
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
>
	<div class="live-stage">
		<div class="iso" data-theme={theme}>
			{#if isCompact}
				<div class="iso-compact-fallback">
					<span>{waferId}</span>
				</div>
			{:else}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="iso-stage"
					class:is-die-hover={isNadirMode && hoveredDieId !== null}
					tabindex="0"
					role="slider"
					aria-label="Silicon wafer model"
					aria-valuemin={0}
					aria-valuemax={360}
					aria-valuenow={displayAzimuth}
					onpointerdown={onPointerDown}
					onpointermove={onPointerMove}
					onpointerup={onPointerUp}
					onpointerleave={onPointerLeave}
					onpointercancel={onPointerUp}
					onkeydown={onKeyDown}
				>
					<svg
						bind:this={svgElement}
						xmlns="http://www.w3.org/2000/svg"
						class="iso-svg iso-live"
						viewBox="0 0 640 470"
						preserveAspectRatio="xMidYMid meet"
						role="img"
						aria-label="Parametric silicon wafer cylinder and die grid"
					>
						<!-- 1. Stationary Metrology Plinth / Chuck Base -->
						{#if showPlinth}
							<g class="iso-parts" data-layer="plinth">
								<g class="iso-solid">
									<path class="iso-fill" d={plinthGeo.fill} />
									{#each plinthGeo.shades as shadePath, idx}
										{#if shadePath}
											<path class="iso-shade" data-shade={idx} d={shadePath} />
										{/if}
									{/each}
									<path class="iso-top" d={plinthGeo.top} />
									<path class="iso-line iso-crease" data-tone="faint" d={plinthGeo.crease} />
									<path class="iso-line" data-tone="faint" d={plinthTicks.minor} />
									<path class="iso-line" data-tone="mid" d={plinthTicks.major} />
									<path class="iso-line iso-edge" data-tone="lo" d={plinthGeo.edge} />
								</g>
							</g>
						{/if}

						<!-- 2. Rotatable Silicon Wafer Cylinder -->
						<g class="iso-parts" data-layer="wafer">
							<g class="iso-part" data-name="wafer.disc" data-mat="silicon">
								<g class="iso-solid">
									<path class="iso-fill" d={waferGeo.fill} />
									{#each waferGeo.shades as shadePath, idx}
										{#if shadePath}
											<path class="iso-shade" data-shade={idx} d={shadePath} />
										{/if}
									{/each}
									<path class="iso-top" d={waferGeo.top} />
									<path class="iso-line" data-tone="lo" d={exclusionRingPath} fill="none" />

									{#if showNotch}
										<path class="iso-line" data-tone="hi" d={notchMarkerPath} />
									{/if}

									{#each waferGeo.rimTicks as tick}
										<path
											class="iso-line"
											data-tone="faint"
											d={tick.d}
											opacity={tick.opacity * 0.45}
										/>
									{/each}

									<path class="iso-line iso-crease" data-tone="lo" d={waferGeo.crease} />
									<path class="iso-line iso-edge" data-tone="hi" d={waferGeo.edge} />
								</g>
							</g>
						</g>

						<!-- 3. Static/Batch Die Layer (Zero DOM event listeners, pointer-events: none) -->
						{#if showDies}
							<g class="iso-parts die-layer" data-layer="dies">
								{#each projectedDies as die (die.cell.id)}
									<g class="iso-die">
										{#if die.wallX}
											<path
												class="die-wall"
												fill={die.wallXColor}
												stroke={die.wallXColor}
												d={die.wallX}
											/>
										{/if}
										{#if die.wallY}
											<path
												class="die-wall"
												fill={die.wallYColor}
												stroke={die.wallYColor}
												d={die.wallY}
											/>
										{/if}
										<path
											class="die-top"
											fill={die.cell.topColor}
											stroke={die.cell.edgeColor}
											d={die.top}
										/>
									</g>
								{/each}
							</g>

							<!-- 4. Active Elevated Die Overlay (Only active in Nadir Mode for hovered / selected die) -->
							{#if isNadirMode}
								<g class="iso-parts die-overlay-layer" data-layer="active-dies">
									{#if activeSelectedProjection}
										<g class="iso-die-active is-selected">
											<path class="die-shadow" d={activeSelectedProjection.shadow} />
											<path
												class="die-wall"
												fill={activeSelectedProjection.wallXColor}
												stroke={activeSelectedProjection.wallXColor}
												d={activeSelectedProjection.wallX}
											/>
											<path
												class="die-wall"
												fill={activeSelectedProjection.wallYColor}
												stroke={activeSelectedProjection.wallYColor}
												d={activeSelectedProjection.wallY}
											/>
											<path
												class="die-top-active"
												fill={activeSelectedProjection.cell.hoverTopColor}
												d={activeSelectedProjection.top}
											/>
										</g>
									{/if}

									{#if activeHoveredProjection}
										<g class="iso-die-active is-hovered">
											<path class="die-shadow" d={activeHoveredProjection.shadow} />
											<path
												class="die-wall"
												fill={activeHoveredProjection.wallXColor}
												stroke={activeHoveredProjection.wallXColor}
												d={activeHoveredProjection.wallX}
											/>
											<path
												class="die-wall"
												fill={activeHoveredProjection.wallYColor}
												stroke={activeHoveredProjection.wallYColor}
												d={activeHoveredProjection.wallY}
											/>
											<path
												class="die-top-active"
												fill={activeHoveredProjection.cell.hoverTopColor}
												d={activeHoveredProjection.top}
											/>
										</g>
									{/if}
								</g>
							{/if}
						{/if}
					</svg>
				</div>
			{/if}
		</div>
	</div>
</figure>

<style>
	.live {
		margin: 0;
		width: 100%;
		height: 100%;
		display: block;
		user-select: none;
	}

	.live-stage {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.iso {
		--anatomy-card: #fafafa;
		--anatomy-paper: #fafafa;
		--anatomy-face: #ffffff;
		--anatomy-top: #ffffff;
		--anatomy-shade-0: #dcdcd9;
		--anatomy-shade-1: #e5e5e2;
		--anatomy-shade-2: #ededea;
		--anatomy-shade-3: #f4f4f1;
		--anatomy-hi: #26262a;
		--anatomy-mid: #8a8a8f;
		--anatomy-lo: #b4b4b8;
		--anatomy-faint: #d4d4d6;
		--anatomy-strong: #18181a;

		position: relative;
		width: 100%;
		height: 100%;
		background: var(--anatomy-card);
		overflow: hidden;
	}

	.iso[data-theme='dark'] {
		--anatomy-card: #11161d;
		--anatomy-paper: #151b24;
		--anatomy-face: #1c2430;
		--anatomy-top: #232d3b;
		--anatomy-shade-0: #0d1117;
		--anatomy-shade-1: #121820;
		--anatomy-shade-2: #171f29;
		--anatomy-shade-3: #1d2633;
		--anatomy-hi: #e2e8f0;
		--anatomy-mid: #64748b;
		--anatomy-lo: #334155;
		--anatomy-faint: #1e293b;
		--anatomy-strong: #f8fafc;
	}

	.iso-compact-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: 4px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 12px;
		font-weight: 600;
		color: var(--anatomy-strong);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.iso[data-theme='light'] [data-mat='silicon'] {
		--anatomy-paper: #2c3545;
		--anatomy-face: #384457;
		--anatomy-top: #232c3d;
		--anatomy-shade-0: #1b222e;
		--anatomy-shade-1: #232c3b;
		--anatomy-shade-2: #2d384a;
		--anatomy-shade-3: #39465b;
		--anatomy-hi: #0f172a;
		--anatomy-mid: #475569;
		--anatomy-lo: #64748b;
		--anatomy-faint: #334155;
	}

	.iso[data-theme='dark'] [data-mat='silicon'] {
		--anatomy-paper: #1e2636;
		--anatomy-face: #263042;
		--anatomy-top: #1a2230;
		--anatomy-shade-0: #111621;
		--anatomy-shade-1: #171e2b;
		--anatomy-shade-2: #1e2636;
		--anatomy-shade-3: #273246;
		--anatomy-hi: #94a3b8;
		--anatomy-mid: #64748b;
		--anatomy-lo: #475569;
		--anatomy-faint: #334155;
	}

	.iso-stage {
		position: relative;
		width: 100%;
		height: 100%;
		cursor: grab;
		outline: none;
		touch-action: none;
	}

	.iso-stage.is-die-hover {
		cursor: pointer;
	}

	.iso-stage:active {
		cursor: grabbing;
	}

	.iso-svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.iso-fill {
		fill: var(--anatomy-paper);
	}

	.iso-top {
		fill: var(--anatomy-top);
	}

	.iso-shade[data-shade='0'] {
		fill: var(--anatomy-shade-0);
		stroke: var(--anatomy-shade-0);
		stroke-width: 0.35;
		stroke-linejoin: round;
	}

	.iso-shade[data-shade='1'] {
		fill: var(--anatomy-shade-1);
		stroke: var(--anatomy-shade-1);
		stroke-width: 0.35;
		stroke-linejoin: round;
	}

	.iso-shade[data-shade='2'] {
		fill: var(--anatomy-shade-2);
		stroke: var(--anatomy-shade-2);
		stroke-width: 0.35;
		stroke-linejoin: round;
	}

	.iso-shade[data-shade='3'] {
		fill: var(--anatomy-shade-3);
		stroke: var(--anatomy-shade-3);
		stroke-width: 0.35;
		stroke-linejoin: round;
	}

	.iso-line {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.iso-line[data-tone='faint'] {
		stroke: var(--anatomy-faint);
		stroke-width: 0.65;
	}

	.iso-line[data-tone='lo'] {
		stroke: var(--anatomy-lo);
		stroke-width: 0.8;
	}

	.iso-line[data-tone='mid'] {
		stroke: var(--anatomy-mid);
		stroke-width: 0.9;
	}

	.iso-line[data-tone='hi'] {
		stroke: var(--anatomy-hi);
		stroke-width: 1.1;
	}

	.iso-crease {
		stroke-width: 0.75;
	}

	.iso-edge {
		stroke-width: 1.15;
	}

	/* All die layers ignore browser DOM hit-testing; stage handles Nadir hit-testing in O(1) math */
	.die-layer,
	.die-overlay-layer {
		pointer-events: none;
	}

	.die-wall {
		stroke-width: 0.3;
		stroke-linejoin: round;
	}

	.die-top {
		stroke-width: 0.6;
		stroke-linejoin: round;
	}

	.die-shadow {
		fill: rgba(9, 13, 22, 0.55);
		stroke: rgba(9, 13, 22, 0.35);
		stroke-width: 0.8;
		stroke-linejoin: round;
	}

	.die-top-active {
		stroke: #0f172a;
		stroke-width: 1.25;
		stroke-linejoin: round;
	}

	.iso-die-active.is-selected .die-top-active {
		stroke: #18181a;
		stroke-width: 1.5;
	}
</style>