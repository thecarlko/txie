import type { Point2D, Point3D } from './types';

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

const DEG_TO_RAD = Math.PI / 180;

/**
 * Projects a 3D point (x, y, z) in wafer-space to 2D SVG screen coordinates.
 * At φ = 30°, sin(30°) = 0.5 (standard 2:1 isometric foreshortening).
 * At φ = 90°, sin(90°) = 1.0 and cos(90°) = 0 (true 1:1 flat nadir view).
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
 * Generates a 2D circular polygon ring of radius `r`.
 * If `withNotch` is true, indents a V-shaped SEMI crystal orientation notch at +Y (90°).
 */
export function createWaferRing(
	radius: number,
	segments = 96,
	withNotch = true
): { points: Point2D[]; normals: Point2D[] } {
	const points: Point2D[] = [];
	const normals: Point2D[] = [];

	for (let i = 0; i < segments; i++) {
		const angle = (i / segments) * Math.PI * 2;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		// Carve a crisp orientation notch at the front (+Y axis, angle = π/2)
		let r = radius;
		if (withNotch) {
			const angularDist = Math.abs(angle - Math.PI / 2);
			if (angularDist < 0.045) {
				const notchDepth = radius * 0.045 * (1 - angularDist / 0.045);
				r -= notchDepth;
			}
		}

		points.push({ x: r * cos, y: r * sin });
		normals.push({ x: cos, y: sin });
	}

	return { points, normals };
}

function fmt(n: number): string {
	return n.toFixed(2);
}

/**
 * Extrudes a 2D floor polygon from zBottom to zTop and computes:
 * - Top cap path (.iso-top)
 * - 4 quantized side-wall shade paths (.iso-shade[data-shade="0..3"])
 * - Front-facing crease & silhouette edge paths
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

	for (let i = 0; i < n; i++) {
		const p = ring.points[i];
		topPts[i] = projectPoint({ x: p.x, y: p.y, z: zTop }, cam);
		botPts[i] = projectPoint({ x: p.x, y: p.y, z: zBottom }, cam);
	}

	// Build closed top cap polygon
	let topPath = '';
	for (let i = 0; i < n; i++) {
		topPath += `${i === 0 ? 'M' : 'L'}${fmt(topPts[i].x)} ${fmt(topPts[i].y)}`;
	}
	topPath += 'Z';

	const shades: [string, string, string, string] = ['', '', '', ''];
	const rimTicks: { d: string; opacity: number }[] = [];
	let creasePath = '';
	let botFrontEdge = '';

	const theta = cam.azimuthDeg * DEG_TO_RAD;
	const phi = cam.elevationDeg * DEG_TO_RAD;
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);

	// Hide side walls when within 0.2° of pure Nadir (90°)
	const showWalls = Math.cos(phi) > 0.003 && Math.abs(zTop - zBottom) > 0.01;

	// Light direction in screen-rotated XY plane (from top-left, matching anatomy-seasons)
	const lightX = -0.65;
	const lightY = -0.76;

	if (showWalls) {
		for (let i = 0; i < n; i++) {
			const next = (i + 1) % n;

			// Average outward normal of segment i -> next
			const nx = 0.5 * (ring.normals[i].x + ring.normals[next].x);
			const ny = 0.5 * (ring.normals[i].y + ring.normals[next].y);

			// Rotate normal by camera azimuth θ
			// In screen space, +Y points toward the viewer (front)
			const rnx = nx * cosT - ny * sinT;
			const rny = nx * sinT + ny * cosT;

			// Segment faces the camera if rny > 0 (when φ < 90°)
			if (rny > -0.02) {
				const t1 = topPts[i];
				const t2 = topPts[next];
				const b2 = botPts[next];
				const b1 = botPts[i];

				const quad = `M${fmt(t1.x)} ${fmt(t1.y)}L${fmt(t2.x)} ${fmt(t2.y)}L${fmt(b2.x)} ${fmt(b2.y)}L${fmt(b1.x)} ${fmt(b1.y)}Z`;

				// Compute diffuse illumination (-1 to +1) and quantize into 4 bands (0 = darkest right, 3 = lightest left)
				const lum = rnx * lightX + rny * lightY;
				let band = 0;
				if (lum > 0.25) band = 3;
				else if (lum > -0.1) band = 2;
				else if (lum > -0.45) band = 1;
				else band = 0;

				shades[band] += quad;
				creasePath += `M${fmt(t1.x)} ${fmt(t1.y)}L${fmt(t2.x)} ${fmt(t2.y)}`;
				botFrontEdge += `M${fmt(b1.x)} ${fmt(b1.y)}L${fmt(b2.x)} ${fmt(b2.y)}`;

				// Optional vertical knurling / graduation ticks on the cylinder wall
				if (includeRimTicks && i % 2 === 0 && rny > 0.08) {
					rimTicks.push({
						d: `M${fmt(b1.x)} ${fmt(b1.y)}L${fmt(t1.x)} ${fmt(t1.y)}`,
						opacity: Math.min(1, Math.pow(rny, 1.3))
					});
				}
			}
		}
	}

	const edgePath = showWalls ? `${topPath}${botFrontEdge}` : topPath;

	return {
		fill: topPath,
		top: topPath,
		crease: creasePath,
		edge: edgePath,
		shades,
		rimTicks
	};
}