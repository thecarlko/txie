<script lang="ts">
	import { Spring } from 'svelte/motion';
	import { createWaferRing, extrudeCylinder, projectPoint, type CameraParams } from './geo';
	import type { WaferProps } from './types';

	let {
		diameter = 200,
		thickness = 20.0,
		diePitchX = 5.2,
		diePitchY = 5.2,
		bowWarp = 0.0,
		edgeExclusion = 5.0,
		view = 'isometric',
		azimuth = $bindable(-28),
		showPlinth = true,
		showNotch = true,
		theme = 'light'
	}: WaferProps = $props();

	// Smooth physical springs for camera & wafer metrology parameters
	const azimuthSpring = new Spring(azimuth, { stiffness: 0.14, damping: 0.72 });
	const elevationSpring = new Spring(view === 'nadir' ? 90 : 30, { stiffness: 0.09, damping: 0.78 });
	const diameterSpring = new Spring(diameter, { stiffness: 0.1, damping: 0.75 });
	const thicknessSpring = new Spring(thickness, { stiffness: 0.1, damping: 0.75 });
	const edgeExclusionSpring = new Spring(edgeExclusion, { stiffness: 0.12, damping: 0.78 });
	const diePitchXSpring = new Spring(diePitchX, { stiffness: 0.12, damping: 0.78 });
	const diePitchYSpring = new Spring(diePitchY, { stiffness: 0.12, damping: 0.78 });
	const bowWarpSpring = new Spring(bowWarp, { stiffness: 0.1, damping: 0.75 });

	// Sync external prop changes into the springs
	$effect(() => {
		azimuthSpring.target = azimuth;
	});

	$effect(() => {
		elevationSpring.target = view === 'nadir' ? 90 : 30;
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

	// Pointer drag state for horizontal turntable rotation
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartAzimuth = 0;

	function onPointerDown(e: PointerEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartAzimuth = azimuthSpring.target;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const dx = e.clientX - dragStartX;
		const nextAzimuth = dragStartAzimuth - dx * 0.45;
		azimuth = nextAzimuth;
		azimuthSpring.set(nextAzimuth, { instant: true });
	}

	function onPointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			azimuth -= e.shiftKey ? 30 : 10;
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			azimuth += e.shiftKey ? 30 : 10;
		}
	}

	// Coordinate space constants
	const CENTER_X = 320;
	const CENTER_Y = 235;
	const SCALE = 1.0;

	// Normalize wafer radius in scene units (e.g. 200mm -> 155px radius)
	let sceneRadius = $derived((diameterSpring.current / 200) * 155);
	// Scale thickness so 20.0mm is clearly visible in 3D
	let sceneHeight = $derived(thicknessSpring.current * 1.35);
	// Convert edge exclusion (mm) to scene units
	let sceneExclusion = $derived((edgeExclusionSpring.current / (diameterSpring.current / 2)) * sceneRadius);

	let cam = $derived<CameraParams>({
		azimuthDeg: azimuthSpring.current,
		elevationDeg: elevationSpring.current,
		centerX: CENTER_X,
		centerY: CENTER_Y,
		scale: SCALE
	});

	// Fixed camera for the stationary outer metrology plinth (azimuth locked at 0°)
	let plinthCam = $derived<CameraParams>({
		azimuthDeg: 0,
		elevationDeg: elevationSpring.current,
		centerX: CENTER_X,
		centerY: CENTER_Y,
		scale: SCALE
	});

	// 1. Stationary Metrology Plinth Geometry
	let plinthRing = $derived(createWaferRing(sceneRadius + 32, 96, false));
	let plinthGeo = $derived(extrudeCylinder(plinthRing, -14, 0, plinthCam, false));

	// Degree scale ticks on the stationary plinth bezel
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
	let waferRing = $derived(createWaferRing(sceneRadius, 96, showNotch));
	let waferGeo = $derived(extrudeCylinder(waferRing, 0, sceneHeight, cam, true));

	// Inner edge-exclusion ring on the top silicon surface
	let exclusionRingPath = $derived.by(() => {
		const innerRadius = Math.max(4, sceneRadius - sceneExclusion);
		const innerRing = createWaferRing(innerRadius, 96, showNotch);
		let d = '';
		for (let i = 0; i < innerRing.points.length; i++) {
			const pt = projectPoint(
				{ x: innerRing.points[i].x, y: innerRing.points[i].y, z: sceneHeight },
				cam
			);
			d += `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
		}
		return d + 'Z';
	});

	// Orientation notch indicator tick on top surface
	let notchMarkerPath = $derived.by(() => {
		if (!showNotch) return '';
		const p1 = projectPoint({ x: 0, y: sceneRadius * 0.955, z: sceneHeight }, cam);
		const p2 = projectPoint({ x: 0, y: sceneRadius * 0.89, z: sceneHeight }, cam);
		return `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)}L${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
	});

	let displayAzimuth = $derived(((Math.round(azimuthSpring.current) % 360) + 360) % 360);
</script>


<figure class="live" data-ready="">
	<div class="live-stage">
		<div class="iso" data-theme={theme}>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="iso-stage"
				tabindex="0"
				role="slider"
				aria-label="Silicon wafer model"
				aria-valuemin={0}
				aria-valuemax={360}
				aria-valuenow={displayAzimuth}
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointercancel={onPointerUp}
				onkeydown={onKeyDown}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="iso-svg iso-live"
					viewBox="0 0 640 470"
					preserveAspectRatio="xMidYMid meet"
					role="img"
					aria-label="Parametric silicon wafer cylinder"
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

								<!-- Inner edge-exclusion boundary -->
								<path class="iso-line" data-tone="lo" d={exclusionRingPath} fill="none" />

								<!-- Crystal orientation notch marker -->
								{#if showNotch}
									<path class="iso-line" data-tone="hi" d={notchMarkerPath} />
								{/if}

								<!-- Subtle vertical rim shading lines along cylinder wall -->
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
				</svg>
			</div>
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
	}

	/* Silicon Crystalline Dark-Slate Material Palette */
	.iso[data-theme='light'] [data-mat='silicon'] {
		--anatomy-paper: #2c3545;
		--anatomy-face: #384457;
		--anatomy-top: #2b3548;
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
		--anatomy-top: #222b3b;
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

	.iso-stage:active {
		cursor: grabbing;
	}

	.iso-svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	/* Core Anatomy Vector Fill & Stroke Rules */
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
</style>

