import type { DieInfo, DieMeasurement, Point2D, Point3D } from './types';

export interface CameraParams {
	azimuthDeg: number; // θ: horizontal turntable rotation
	elevationDeg: number; // φ: 30° (isometric) to 90° (nadir)
	centerX: number;
	centerY: number;
	scale: number;
}

export interface ExtrudedSolidPaths {
	fill: string;
	top: string;
	crease: string;
	edge: string;
	shades: [string, string, string, string];
	rimTicks: { d: string; opacity: number }[];
}

export interface DieCell extends DieInfo {
	/** Center X in scene units */
	sx: number;
	/** Center Y in scene units */
	sy: number;
	/** Half-width in scene units */
	hw: number;
	/** Half-height in scene units */
	hh: number;
	/** Pre-computed stepped prism height in scene units */
	baseHeight: number;
	/** Pre-computed CSS colors (avoids expensive runtime CSS color-mix() per frame) */
	topColor: string;
	hoverTopColor: string;
	edgeColor: string;
	shadeColors: [string, string, string, string];
}

export interface ProjectedDie {
	cell: DieCell;
	depth: number;
	top: string;
	wallX: string;
	wallY: string;
	wallXColor: string;
	wallYColor: string;
	crease: string;
	shadow: string;
}

const DEG_TO_RAD = Math.PI / 180;

// Cached 96-segment unit circle lookup table so we never re-run trig for rings
const RING_SEGMENTS = 96;
const UNIT_CIRCLE = Array.from({ length: RING_SEGMENTS }, (_, i) => {
	const angle = (i / RING_SEGMENTS) * Math.PI * 2;
	const angularDist = Math.abs(angle - Math.PI / 2);
	const notchFactor = angularDist < 0.045 ? 1 - 0.045 * (1 - angularDist / 0.045) : 1;
	return {
		cos: Math.cos(angle),
		sin: Math.sin(angle),
		notchFactor
	};
});

function fmt(n: number): string {
	return ((n * 10 + 0.5) | 0) / 10 + '';
}

/**
 * Projects a single 3D point (x, y, z) in wafer-space to 2D SVG screen coordinates.
 */
export function projectPoint(pt: Point3D, cam: CameraParams): Point2D {
	const theta = cam.azimuthDeg * DEG_TO_RAD;
	const phi = cam.elevationDeg * DEG_TO_RAD;

	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const cosP = Math.cos(phi);
	const sinP = Math.sin(phi);

	const rx = pt.x * cosT - pt.y * sinT;
	const ry = pt.x * sinT + pt.y * cosT;

	return {
		x: cam.centerX + cam.scale * rx,
		y: cam.centerY + cam.scale * (ry * sinP - pt.z * cosP)
	};
}

/**
 * Inverse-projects a 2D SVG coordinate (svgX, svgY) at a given Z plane back into wafer (sx, sy) space.
 * Used in Nadir mode for O(1) mathematical die hit-testing without DOM event listeners on every die.
 */
export function screenToWaferPlane(
	svgX: number,
	svgY: number,
	zPlane: number,
	cam: CameraParams
): Point2D {
	const theta = cam.azimuthDeg * DEG_TO_RAD;
	const phi = cam.elevationDeg * DEG_TO_RAD;

	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const sinP = Math.max(0.1, Math.sin(phi));
	const cosP = Math.cos(phi);

	const rx = (svgX - cam.centerX) / cam.scale;
	const ry = ((svgY - cam.centerY) / cam.scale + zPlane * cosP) / sinP;

	return {
		x: rx * cosT + ry * sinT,
		y: -rx * sinT + ry * cosT
	};
}

/**
 * Generates a 2D circular polygon ring of radius `r` using the cached trig table.
 */
export function createWaferRing(
	radius: number,
	withNotch = true
): { points: Point2D[]; normals: Point2D[] } {
	const points: Point2D[] = new Array(RING_SEGMENTS);
	const normals: Point2D[] = new Array(RING_SEGMENTS);

	for (let i = 0; i < RING_SEGMENTS; i++) {
		const u = UNIT_CIRCLE[i];
		const r = withNotch ? radius * u.notchFactor : radius;
		points[i] = { x: r * u.cos, y: r * u.sin };
		normals[i] = { x: u.cos, y: u.sin };
	}

	return { points, normals };
}

/**
 * Extrudes a 2D floor polygon from zBottom to zTop.
 */
export function extrudeCylinder(
	ring: { points: Point2D[]; normals: Point2D[] },
	zBottom: number,
	zTop: number,
	cam: CameraParams,
	includeRimTicks = false
): ExtrudedSolidPaths {
	const n = ring.points.length;
	const topPts: Point2D[] = new Array(n);
	const botPts: Point2D[] = new Array(n);

	const theta = cam.azimuthDeg * DEG_TO_RAD;
	const phi = cam.elevationDeg * DEG_TO_RAD;
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const cosP = Math.cos(phi);
	const sinP = Math.sin(phi);

	const ux = cam.scale * cosT;
	const uy = cam.scale * sinT * sinP;
	const vx = -cam.scale * sinT;
	const vy = cam.scale * cosT * sinP;
	const wzTop = cam.centerY - cam.scale * zTop * cosP;
	const wzBot = cam.centerY - cam.scale * zBottom * cosP;

	for (let i = 0; i < n; i++) {
		const p = ring.points[i];
		const sx = cam.centerX + p.x * ux + p.y * vx;
		const syBase = p.x * uy + p.y * vy;
		topPts[i] = { x: sx, y: wzTop + syBase };
		botPts[i] = { x: sx, y: wzBot + syBase };
	}

	let topPath = '';
	for (let i = 0; i < n; i++) {
		topPath += `${i === 0 ? 'M' : 'L'}${fmt(topPts[i].x)} ${fmt(topPts[i].y)}`;
	}
	topPath += 'Z';

	const shades: [string, string, string, string] = ['', '', '', ''];
	const rimTicks: { d: string; opacity: number }[] = [];
	let creasePath = '';
	let botFrontEdge = '';

	const showWalls = cosP > 0.004 && Math.abs(zTop - zBottom) > 0.01;
	const lightX = -0.65;
	const lightY = -0.76;

	if (showWalls) {
		for (let i = 0; i < n; i++) {
			const next = (i + 1) % n;
			const nx = 0.5 * (ring.normals[i].x + ring.normals[next].x);
			const ny = 0.5 * (ring.normals[i].y + ring.normals[next].y);

			const rnx = nx * cosT - ny * sinT;
			const rny = nx * sinT + ny * cosT;

			if (rny > -0.02) {
				const t1 = topPts[i];
				const t2 = topPts[next];
				const b2 = botPts[next];
				const b1 = botPts[i];

				const quad = `M${fmt(t1.x)} ${fmt(t1.y)}L${fmt(t2.x)} ${fmt(t2.y)}L${fmt(b2.x)} ${fmt(b2.y)}L${fmt(b1.x)} ${fmt(b1.y)}Z`;

				const lum = rnx * lightX + rny * lightY;
				const band = lum > 0.25 ? 3 : lum > -0.1 ? 2 : lum > -0.45 ? 1 : 0;

				shades[band] += quad;
				creasePath += `M${fmt(t1.x)} ${fmt(t1.y)}L${fmt(t2.x)} ${fmt(t2.y)}`;
				botFrontEdge += `M${fmt(b1.x)} ${fmt(b1.y)}L${fmt(b2.x)} ${fmt(b2.y)}`;

				if (includeRimTicks && i % 2 === 0 && rny > 0.08) {
					rimTicks.push({
						d: `M${fmt(b1.x)} ${fmt(b1.y)}L${fmt(t1.x)} ${fmt(t1.y)}`,
						opacity: Math.min(1, Math.pow(rny, 1.3))
					});
				}
			}
		}
	}

	return {
		fill: topPath,
		top: topPath,
		crease: creasePath,
		edge: showWalls ? `${topPath}${botFrontEdge}` : topPath,
		shades,
		rimTicks
	};
}

function mixRgb(
	c1: [number, number, number],
	c2: [number, number, number],
	weight1: number
): string {
	const w2 = 1 - weight1;
	const r = Math.round(c1[0] * weight1 + c2[0] * w2);
	const g = Math.round(c1[1] * weight1 + c2[1] * w2);
	const b = Math.round(c1[2] * weight1 + c2[2] * w2);
	return `rgb(${r},${g},${b})`;
}

/**
 * Multi-stop wafer map RGB tuple generator
 */
function deviationToRgb(t: number): [number, number, number] {
	const clamped = Math.max(0, Math.min(1, t));
	const stops: [number, [number, number, number]][] = [
		[0.0, [43, 92, 168]],
		[0.28, [78, 118, 182]],
		[0.5, [120, 148, 198]],
		[0.66, [238, 224, 162]],
		[0.82, [242, 165, 85]],
		[1.0, [230, 85, 64]]
	];

	for (let i = 0; i < stops.length - 1; i++) {
		const [t0, c0] = stops[i];
		const [t1, c1] = stops[i + 1];
		if (clamped >= t0 && clamped <= t1) {
			const f = (clamped - t0) / (t1 - t0);
			return [
				Math.round(c0[0] + (c1[0] - c0[0]) * f),
				Math.round(c0[1] + (c1[1] - c0[1]) * f),
				Math.round(c0[2] + (c1[2] - c0[2]) * f)
			];
		}
	}
	return [78, 118, 182];
}

function defaultDieDeviation(
	nx: number,
	ny: number,
	bowWarp: number,
	row: number,
	col: number
): number {
	const d1 = Math.hypot(nx - 0.12, ny - 0.08);
	const lobe1 = Math.exp(-(d1 * d1) / 0.11) * 0.78;

	const d2 = Math.hypot(nx + 0.04, ny - 0.36);
	const lobe2 = Math.exp(-(d2 * d2) / 0.065) * 0.58;

	const d3 = Math.hypot(nx + 0.68, ny + 0.05);
	const lobe3 = Math.exp(-(d3 * d3) / 0.025) * 0.45;

	const r2 = nx * nx + ny * ny;
	const bowEffect = Math.min(0.45, Math.abs(bowWarp) * 0.08) * r2;

	const hash = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
	const jitter = (hash - Math.floor(hash) - 0.5) * 0.08;

	return Math.max(0.04, Math.min(0.99, 0.18 + lobe1 + lobe2 + lobe3 + bowEffect + jitter));
}

/**
 * Generates the 2D array of dies and a Map for O(1) coordinate lookup.
 * Only re-runs when wafer metrology parameters (pitch, diameter, thickness, bowWarp) change—NOT on camera drag!
 */
export function generateDieGrid(params: {
	diameterMm: number;
	edgeExclusionMm: number;
	pitchXMm: number;
	pitchYMm: number;
	thicknessMm: number;
	bowWarp: number;
	sceneRadius: number;
	dieData?: Record<string, DieMeasurement>;
}): { cells: DieCell[]; cellMap: Map<string, DieCell>; pitchXScene: number; pitchYScene: number } {
	const {
		diameterMm,
		edgeExclusionMm,
		pitchXMm,
		pitchYMm,
		thicknessMm,
		bowWarp,
		sceneRadius,
		dieData
	} = params;

	const waferRadiusMm = Math.max(10, diameterMm / 2);
	const usableRadiusMm = Math.max(4, waferRadiusMm - edgeExclusionMm);

	const safePitchX = Math.max(3.2, pitchXMm);
	const safePitchY = Math.max(3.2, pitchYMm);

	const mmToScene = sceneRadius / waferRadiusMm;
	const pitchXScene = safePitchX * mmToScene;
	const pitchYScene = safePitchY * mmToScene;

	const streetRatio = 0.84;
	const dieWidthMm = safePitchX * streetRatio;
	const dieHeightMm = safePitchY * streetRatio;

	const halfW = (dieWidthMm * mmToScene) / 2;
	const halfH = (dieHeightMm * mmToScene) / 2;

	const maxCols = Math.ceil(usableRadiusMm / safePitchX);
	const maxRows = Math.ceil(usableRadiusMm / safePitchY);

	const cells: DieCell[] = [];
	const cellMap = new Map<string, DieCell>();

	for (let row = -maxRows; row <= maxRows; row++) {
		for (let col = -maxCols; col <= maxCols; col++) {
			const xMm = col * safePitchX;
			const yMm = row * safePitchY;

			const cornerX = Math.abs(xMm) + dieWidthMm * 0.42;
			const cornerY = Math.abs(yMm) + dieHeightMm * 0.42;
			if (Math.hypot(cornerX, cornerY) > usableRadiusMm) continue;

			if (yMm > usableRadiusMm * 0.91 && Math.abs(xMm) < safePitchX * 0.9) continue;

			const id = `${row},${col}`;
			const nx = xMm / usableRadiusMm;
			const ny = yMm / usableRadiusMm;

			const custom = dieData?.[id];
			const deviation = custom?.deviation ?? defaultDieDeviation(nx, ny, bowWarp, row, col);
			const value = custom?.value ?? Number((thicknessMm + (deviation - 0.35) * 1.8).toFixed(2));
			const isAnomaly = custom?.isAnomaly ?? deviation > 0.82;

			const sx = xMm * mmToScene;
			const sy = yMm * mmToScene;
			const rNorm2 = (sx * sx + sy * sy) / (155 * 155);
			const baseHeight = 1.6 + deviation * 2.8 + bowWarp * 0.85 * rNorm2;

			// Pre-compute all RGB colors once so CSS doesn't compute color-mix() on 1,200 nodes every frame
			const rgb = deviationToRgb(deviation);
			const topColor = mixRgb(rgb, [255, 255, 255], 0.88);
			const hoverTopColor = mixRgb(rgb, [255, 255, 255], 0.68);
			const edgeColor = mixRgb(rgb, [15, 23, 42], 0.38);
			const shadeColors: [string, string, string, string] = [
				mixRgb(rgb, [15, 23, 42], 0.52),
				mixRgb(rgb, [30, 41, 59], 0.64),
				mixRgb(rgb, [51, 65, 85], 0.74),
				mixRgb(rgb, [71, 85, 105], 0.82)
			];

			const cell: DieCell = {
				id,
				row,
				col,
				xMm,
				yMm,
				sx,
				sy,
				hw: halfW,
				hh: halfH,
				baseHeight,
				deviation,
				value,
				isAnomaly,
				topColor,
				hoverTopColor,
				edgeColor,
				shadeColors
			};

			cells.push(cell);
			cellMap.set(id, cell);
		}
	}

	return { cells, cellMap, pitchXScene, pitchYScene };
}

/**
 * Projects a single die prism (used both in the main loop and for the isolated elevated die in Nadir mode).
 */
export function projectSingleDie(
	cell: DieCell,
	waferTopZ: number,
	liftZ: number,
	cam: CameraParams,
	forceBevelInNadir = false
): ProjectedDie {
	const effPhiDeg = forceBevelInNadir && cam.elevationDeg > 82 ? 82 : cam.elevationDeg;
	const theta = cam.azimuthDeg * DEG_TO_RAD;
	const phi = effPhiDeg * DEG_TO_RAD;

	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const cosP = Math.cos(phi);
	const sinP = Math.sin(phi);

	const ux = cam.scale * cosT;
	const uy = cam.scale * sinT * sinP;
	const vx = -cam.scale * sinT;
	const vy = cam.scale * cosT * sinP;
	const wz = -cam.scale * cosP;

	const zBot = waferTopZ + liftZ;
	const zTop = zBot + cell.baseHeight;

	const x0 = cell.sx - cell.hw;
	const x1 = cell.sx + cell.hw;
	const y0 = cell.sy - cell.hh;
	const y1 = cell.sy + cell.hh;

	const topZOffset = cam.centerY + zTop * wz;
	const tNWx = cam.centerX + x0 * ux + y0 * vx;
	const tNWy = topZOffset + x0 * uy + y0 * vy;
	const tNEx = cam.centerX + x1 * ux + y0 * vx;
	const tNEy = topZOffset + x1 * uy + y0 * vy;
	const tSEx = cam.centerX + x1 * ux + y1 * vx;
	const tSEy = topZOffset + x1 * uy + y1 * vy;
	const tSWx = cam.centerX + x0 * ux + y1 * vx;
	const tSWy = topZOffset + x0 * uy + y1 * vy;

	const top = `M${fmt(tNWx)} ${fmt(tNWy)}L${fmt(tNEx)} ${fmt(tNEy)}L${fmt(tSEx)} ${fmt(tSEy)}L${fmt(tSWx)} ${fmt(tSWy)}Z`;

	let wallX = '';
	let wallY = '';
	let crease = '';
	let shadow = '';

	const showEastWall = sinT >= 0;
	const showSouthWall = cosT >= 0;
	const lightX = -0.65;
	const lightY = -0.76;

	const nxSign = showEastWall ? 1 : -1;
	const lumX = nxSign * cosT * lightX + nxSign * sinT * lightY;
	const shadeX = lumX > 0.2 ? 3 : lumX > -0.15 ? 2 : lumX > -0.45 ? 1 : 0;

	const nySign = showSouthWall ? 1 : -1;
	const lumY = -nySign * sinT * lightX + nySign * cosT * lightY;
	const shadeY = lumY > 0.2 ? 3 : lumY > -0.15 ? 2 : lumY > -0.45 ? 1 : 0;

	if (cosP > 0.015) {
		const dyTopToBot = (zBot - zTop) * wz;
		const bNWy = tNWy + dyTopToBot;
		const bNEy = tNEy + dyTopToBot;
		const bSEy = tSEy + dyTopToBot;
		const bSWy = tSWy + dyTopToBot;

		if (showEastWall) {
			wallX = `M${fmt(tNEx)} ${fmt(tNEy)}L${fmt(tSEx)} ${fmt(tSEy)}L${fmt(tSEx)} ${fmt(bSEy)}L${fmt(tNEx)} ${fmt(bNEy)}Z`;
		} else {
			wallX = `M${fmt(tSWx)} ${fmt(tSWy)}L${fmt(tNWx)} ${fmt(tNWy)}L${fmt(tNWx)} ${fmt(bNWy)}L${fmt(tSWx)} ${fmt(bSWy)}Z`;
		}

		if (showSouthWall) {
			wallY = `M${fmt(tSEx)} ${fmt(tSEy)}L${fmt(tSWx)} ${fmt(tSWy)}L${fmt(tSWx)} ${fmt(bSWy)}L${fmt(tSEx)} ${fmt(bSEy)}Z`;
		} else {
			wallY = `M${fmt(tNWx)} ${fmt(tNWy)}L${fmt(tNEx)} ${fmt(tNEy)}L${fmt(tNEx)} ${fmt(bNEy)}L${fmt(tNWx)} ${fmt(bNWy)}Z`;
		}
	}

	if (liftZ > 0.1) {
		const dyTopToWafer = (waferTopZ - zTop) * wz;
		const sNWy = tNWy + dyTopToWafer;
		const sNEy = tNEy + dyTopToWafer;
		const sSEy = tSEy + dyTopToWafer;
		const sSWy = tSWy + dyTopToWafer;
		shadow = `M${fmt(tNWx)} ${fmt(sNWy)}L${fmt(tNEx)} ${fmt(sNEy)}L${fmt(tSEx)} ${fmt(sSEy)}L${fmt(tSWx)} ${fmt(sSWy)}Z`;
	}

	return {
		cell,
		depth: cell.sx * sinT + cell.sy * cosT,
		top,
		wallX,
		wallY,
		wallXColor: cell.shadeColors[shadeX],
		wallYColor: cell.shadeColors[shadeY],
		crease,
		shadow
	};
}

/**
 * Fast batch projection for the entire die grid.
 * - In Nadir mode (cosP <= 0.015), skips wall geometry and skips O(N log N) sorting!
 * - Uses pre-computed basis vectors so each die corner is just 2 multiplies and 2 adds.
 */
export function projectDieGridFast(params: {
	cells: DieCell[];
	waferTopZ: number;
	cam: CameraParams;
}): ProjectedDie[] {
	const { cells, waferTopZ, cam } = params;
	const n = cells.length;
	if (n === 0) return [];

	const theta = cam.azimuthDeg * DEG_TO_RAD;
	const phi = cam.elevationDeg * DEG_TO_RAD;
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const cosP = Math.cos(phi);
	const sinP = Math.sin(phi);

	// 2D basis vectors for (x, y, z) -> (screenX, screenY)
	const ux = cam.scale * cosT;
	const uy = cam.scale * sinT * sinP;
	const vx = -cam.scale * sinT;
	const vy = cam.scale * cosT * sinP;
	const wz = -cam.scale * cosP;

	const showWalls = cosP > 0.015;
	const showEastWall = sinT >= 0;
	const showSouthWall = cosT >= 0;

	const lightX = -0.65;
	const lightY = -0.76;

	const nxSign = showEastWall ? 1 : -1;
	const lumX = nxSign * cosT * lightX + nxSign * sinT * lightY;
	const shadeX = lumX > 0.2 ? 3 : lumX > -0.15 ? 2 : lumX > -0.45 ? 1 : 0;

	const nySign = showSouthWall ? 1 : -1;
	const lumY = -nySign * sinT * lightX + nySign * cosT * lightY;
	const shadeY = lumY > 0.2 ? 3 : lumY > -0.15 ? 2 : lumY > -0.45 ? 1 : 0;

	const baseZScreenY = cam.centerY + waferTopZ * wz;
	const projected: ProjectedDie[] = new Array(n);

	for (let i = 0; i < n; i++) {
		const cell = cells[i];
		const x0 = cell.sx - cell.hw;
		const x1 = cell.sx + cell.hw;
		const y0 = cell.sy - cell.hh;
		const y1 = cell.sy + cell.hh;

		const dieZOffset = baseZScreenY + cell.baseHeight * wz;

		const tNWx = cam.centerX + x0 * ux + y0 * vx;
		const tNWy = dieZOffset + x0 * uy + y0 * vy;
		const tNEx = cam.centerX + x1 * ux + y0 * vx;
		const tNEy = dieZOffset + x1 * uy + y0 * vy;
		const tSEx = cam.centerX + x1 * ux + y1 * vx;
		const tSEy = dieZOffset + x1 * uy + y1 * vy;
		const tSWx = cam.centerX + x0 * ux + y1 * vx;
		const tSWy = dieZOffset + x0 * uy + y1 * vy;

		const top = `M${fmt(tNWx)} ${fmt(tNWy)}L${fmt(tNEx)} ${fmt(tNEy)}L${fmt(tSEx)} ${fmt(tSEy)}L${fmt(tSWx)} ${fmt(tSWy)}Z`;

		let wallX = '';
		let wallY = '';

		if (showWalls) {
			// Bottom corners have the exact same X as top corners, shifted vertically by -baseHeight * wz
			const dy = -cell.baseHeight * wz;
			const bNWy = tNWy + dy;
			const bNEy = tNEy + dy;
			const bSEy = tSEy + dy;
			const bSWy = tSWy + dy;

			if (showEastWall) {
				wallX = `M${fmt(tNEx)} ${fmt(tNEy)}L${fmt(tSEx)} ${fmt(tSEy)}L${fmt(tSEx)} ${fmt(bSEy)}L${fmt(tNEx)} ${fmt(bNEy)}Z`;
			} else {
				wallX = `M${fmt(tSWx)} ${fmt(tSWy)}L${fmt(tNWx)} ${fmt(tNWy)}L${fmt(tNWx)} ${fmt(bNWy)}L${fmt(tSWx)} ${fmt(bSWy)}Z`;
			}

			if (showSouthWall) {
				wallY = `M${fmt(tSEx)} ${fmt(tSEy)}L${fmt(tSWx)} ${fmt(tSWy)}L${fmt(tSWx)} ${fmt(bSWy)}L${fmt(tSEx)} ${fmt(bSEy)}Z`;
			} else {
				wallY = `M${fmt(tNWx)} ${fmt(tNWy)}L${fmt(tNEx)} ${fmt(tNEy)}L${fmt(tNEx)} ${fmt(bNEy)}L${fmt(tNWx)} ${fmt(bNWy)}Z`;
			}
		}

		projected[i] = {
			cell,
			depth: cell.sx * sinT + cell.sy * cosT,
			top,
			wallX,
			wallY,
			wallXColor: cell.shadeColors[shadeX],
			wallYColor: cell.shadeColors[shadeY],
			crease: '',
			shadow: ''
		};
	}

	// Only depth-sort when side walls are visible (Isometric / transition).
	// In flat Nadir mode, dies never overlap so we skip O(N log N) sorting and DOM re-ordering!
	if (showWalls) {
		projected.sort((a, b) => a.depth - b.depth);
	}

	return projected;
}