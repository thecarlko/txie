export type WaferViewMode = 'isometric' | 'nadir';

export interface DieMeasurement {
	/** Normalized deviation (0.0 = low blue, 0.5 = nominal, 1.0 = high red anomaly) */
	deviation: number;
	/** Optional raw metrology value (e.g., local thickness in nm/mm) */
	value?: number;
	/** Flag for AI/threshold anomaly */
	isAnomaly?: boolean;
}

export interface DieInfo {
	id: string;
	row: number;
	col: number;
	xMm: number;
	yMm: number;
	deviation: number;
	value: number;
	isAnomaly: boolean;
}

export interface WaferProps {
	/** Wafer identifier displayed when container is < 120x90px (e.g., "WFR-2026-01") */
	waferId?: string;
	/** Wafer diameter in mm (e.g., 100, 150, 200, 300) */
	diameter?: number;
	/** Uniform wafer thickness in mm (e.g., 20.0 -> 16.0 -> 11.0) */
	thickness?: number;
	/** Horizontal center-to-center distance between dies in mm */
	diePitchX?: number;
	/** Vertical center-to-center distance between dies in mm */
	diePitchY?: number;
	/** Edge bow/warp deviation in mm/μm (e.g., 3.1) */
	bowWarp?: number;
	/** Outer unusable rim margin in mm (e.g., 5.0) */
	edgeExclusion?: number;
	/** Controlled camera elevation mode ('isometric' = 30°, 'nadir' = 90°) */
	view?: WaferViewMode;
	/** Controlled or bindable turntable azimuth angle in degrees */
	azimuth?: number;
	/** Show or hide the outer metrology chuck / plinth */
	showPlinth?: boolean;
	/** Show or hide the SEMI crystal orientation notch */
	showNotch?: boolean;
	/** Show or hide the parametric die grid */
	showDies?: boolean;
	/** Optional per-die metrology overrides keyed by "row,col" (e.g., "2,-1") */
	dieData?: Record<string, DieMeasurement>;
	/** Bindable currently selected die ID ("row,col") */
	selectedDieId?: string | null;
	/** Bindable currently hovered die ID ("row,col") */
	hoveredDieId?: string | null;
	/** Callback fired when a die is clicked */
	onSelectDie?: (die: DieInfo | null) => void;
	/** Callback fired when a die is hovered */
	onHoverDie?: (die: DieInfo | null) => void;
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