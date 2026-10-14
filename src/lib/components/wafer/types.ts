export type WaferViewMode = 'isometric' | 'nadir';

export interface WaferProps {
	/** Wafer identifier displayed when container is < 150x100px (e.g., "WFR-2026-01") */
	waferId?: string;
	/** Wafer diameter in mm (e.g., 100, 150, 200, 300) */
	diameter?: number;
	/** Uniform wafer thickness in mm (e.g., 20.0 -> 16.0 -> 11.0) */
	thickness?: number;
	/** Horizontal center-to-center distance between dies in mm (e.g., 5.2) */
	diePitchX?: number;
	/** Vertical center-to-center distance between dies in mm (e.g., 5.2) */
	diePitchY?: number;
	/** Edge bow/warp deviation in mm/μm (e.g., 3.1) */
	bowWarp?: number;
	/** Outer unusable rim margin in mm (e.g., 3.0 to 5.0) */
	edgeExclusion?: number;
	/** Controlled camera elevation mode ('isometric' = 30°, 'nadir' = 90°) */
	view?: WaferViewMode;
	/** Controlled or bindable turntable azimuth angle in degrees */
	azimuth?: number;
	/** Show or hide the outer metrology chuck / plinth */
	showPlinth?: boolean;
	/** Show or hide the SEMI crystal orientation notch */
	showNotch?: boolean;
	/** Visual theme matching the anatomy plate palette */
	theme?: 'light' | 'dark';
}

export interface Point2D {
	x: number;
	y: number;
}

export interface Point3D {
	x: number;
	y: number;
	z: number;
}