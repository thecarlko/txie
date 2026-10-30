import type { Cite, Parsed, Row } from './parser'

/** One value from one run, with where and when it was recorded. */
export type Point = { date: string; value: number; file: string; cite: Cite[]; dateSource: Parsed['dateSource'] }

export type Series = {
	tool: string
	id: string
	title: string
	unit?: string
	/** Matches a chart on the old dashboard */
	legacy?: boolean
	/** Raw value from the tool, or computed by us from raw values */
	kind: 'reported' | 'derived'
	points: Point[]
}

const numbers = (values: unknown[]) => values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const sigma = (values: number[]) => {
	const average = mean(values)
	return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(values.length - 1, 1))
}
/** One cite covering consecutive text lines; html rows stay individual. */
const span = (rows: Row[]): Cite[] => {
	const lines = rows.map(({ cite }) => cite.line).filter((line): line is number => line !== undefined)
	const [{ cite } = { cite: undefined }] = rows
	if (!cite) return []
	return lines.length ? [{ file: cite.file, lines: [Math.min(...lines), Math.max(...lines)] }] : rows.map(({ cite }) => cite)
}

abstract class ToolAnalysis {
	private store = new Map<string, Series>()

	constructor(
		readonly tool: string,
		readonly files: Parsed[]
	) {}

	/** Files in run order, oldest first. */
	protected get runs() {
		return [...this.files].filter(({ date }) => date).sort((a, b) => a.date!.localeCompare(b.date!))
	}

	/** Adds a point to a series, creating it on first use. */
	protected add(id: string, { title, unit, legacy, kind = 'derived' }: Omit<Series, 'tool' | 'id' | 'points' | 'kind'> & { kind?: Series['kind'] }, run: Parsed, value: number | undefined, cite: Cite[], date = run.date!) {
		if (value === undefined || !Number.isFinite(value)) return
		const series = this.store.get(id) ?? { tool: this.tool, id, title, unit, legacy, kind, points: [] }
		series.points.push({ date, value, file: run.file, cite, dateSource: run.dateSource })
		this.store.set(id, series)
	}

	abstract run(): void

	series() {
		this.store.clear()
		this.run()
		return [...this.store.values()]
	}
}

/**
 * AOI52, Camtek: each Surface CSV is a defect list.
 * Size bins follow the old pipeline (Width in µm) but use half-open bins so 0.7 and 1.0 aren't dropped.
 */
export class AOI52 extends ToolAnalysis {
	static BINS: [number, number][] = [[0, 0.7], [0.7, 1], [1, 2], [2, 5], [5, Infinity]]

	constructor(files: Parsed[]) {
		super('AOI52', files)
	}

	run() {
		for (const run of this.runs) {
			const [{ rows } = { rows: [] }] = run.groups
			const cite = span(rows)
			const column = (key: string) => numbers(rows.map(({ values }) => values[key]))

			this.add('total', { title: 'Total Defect Count', legacy: true }, run, rows.length, cite)

			for (const [low, high] of AOI52.BINS) {
				const hits = rows.filter(({ values: { Width } }) => typeof Width === 'number' && Width >= low && Width < high)
				const label = high === Infinity ? `≥ ${low}` : `${low} – ${high}`
				this.add(`bin:${low}`, { title: `Defect Size Bin ${label}`, unit: 'µm', legacy: true }, run, hits.length, span(hits))
			}

			const [areas, widths, lengths] = ['Area', 'Width', 'Length'].map(column)
			this.add('area:mean', { title: 'Mean Defect Area' }, run, areas.length ? mean(areas) : undefined, cite)
			this.add('area:total', { title: 'Total Defect Area' }, run, areas.reduce((sum, area) => sum + area, 0), cite)
			this.add('width:max', { title: 'Largest Defect Width', unit: 'µm' }, run, widths.length ? Math.max(...widths) : undefined, cite)
			this.add('length:mean', { title: 'Mean Defect Length', unit: 'µm' }, run, lengths.length ? mean(lengths) : undefined, cite)

			for (const key of ['Zone', 'Type', 'class']) {
				const counts = Map.groupBy(rows, ({ values }) => String(values[key] ?? ''))
				for (const [name, hits] of counts) this.add(`${key}:${name}`, { title: `${key === 'class' ? 'Class' : key} ${name} Count` }, run, hits.length, span(hits))
			}

			const dies = new Set(rows.map(({ values: { Col, Row } }) => `${Col},${Row}`))
			this.add('dies', { title: 'Dies With Defects' }, run, dies.size, cite)
		}
	}
}

/**
 * DEF51/52, KLA Surfscan: per lot (HT, ST, HS, UHS) and per channel table.
 * Every numeric column becomes a series; the old dashboard's Total Defects and Size Peak are marked legacy.
 */
class Surfscan extends ToolAnalysis {
	static LEGACY: Record<string, string> = { 'Sum Of All Count(Defects)': 'Total Defects', 'LPD Size Peak': 'Size Peak' }
	static PRIMARY = /^(DW Oblique Defects Totals|DW OBL Totals)$/

	run() {
		for (const run of this.runs) {
			for (const { meta, rows } of run.groups) {
				const { lot, table, lotDate } = meta
				const date = lotDate ? new Date(lotDate).toISOString() : run.date!
				rows.forEach(({ values, cite }) => {
					for (const [column, value] of Object.entries(values)) {
						if (typeof value !== 'number') continue
						const legacy = Surfscan.PRIMARY.test(table) && column in Surfscan.LEGACY
						const title = legacy ? `${lot} ${Surfscan.LEGACY[column]}` : `${lot} · ${table} · ${column}`
						this.add(`${lot}:${table}:${column}`, { title, legacy, kind: 'reported' }, run, value, [cite], date)
					}
					if (Surfscan.PRIMARY.test(table)) this.add(`${lot}:rejected`, { title: `${lot} Rejected Wafers` }, run, values.Grade === 'Rejected' ? 1 : 0, [cite], date)
				})
			}
		}
	}
}

export class DEF51 extends Surfscan {
	constructor(files: Parsed[]) {
		super('DEF51', files)
	}
}

export class DEF52 extends Surfscan {
	constructor(files: Parsed[]) {
		super('DEF52', files)
	}
}

/**
 * MTH52, F5x thin film: one point per wafer, per recipe and result type.
 * Mean, range and GOF are the tool's own stats. Uniformity, center-to-edge and per-site values are derived from the site table.
 */
export class MTH52 extends ToolAnalysis {
	/** 9-point map: site 1 is center, sites 2–5 are the 132.3 mm edge ring. */
	static CENTER = 1
	static EDGE = [2, 3, 4, 5]

	constructor(files: Parsed[]) {
		super('MTH52', files)
	}

	run() {
		for (const run of this.runs) {
			for (const { meta, rows } of run.groups) {
				const { RECIPE: recipe = '' } = meta
				const stats = rows.filter(({ values }) => 'stat' in values)
				const sites = rows.filter(({ values }) => 'site' in values)
				const results = Object.keys(sites[0]?.values ?? {}).filter((key) => !['site', 'X', 'Y'].includes(key))

				for (const result of results) {
					const label = result === 'GOF' ? `GOF - ${recipe}` : `${recipe} - ${result}`
					const stat = (name: string) => stats.find(({ values }) => values.stat === name)
					for (const [name, title, legacy] of [['MEAN', 'Mean', true], ['RANGE', 'Range', true], ['3 STDDEV', '3σ', false], ['% STDDEV', 'Uniformity %σ', false]] as const) {
						const row = stat(name)
						const value = row?.values[result]
						if (result === 'GOF' && name !== 'MEAN') continue
						this.add(`${recipe}:${result}:${name}`, { title: result === 'GOF' ? label : `${title} - ${label}`, legacy: legacy || result === 'GOF', kind: 'reported' }, run, typeof value === 'number' ? value : undefined, row ? [row.cite] : [])
					}

					if (result === 'GOF') continue
					const at = (site: number) => sites.find(({ values }) => values.site === site)
					const center = at(MTH52.CENTER)
					const edge = MTH52.EDGE.map(at).filter((row): row is Row => !!row)
					const edgeValues = numbers(edge.map(({ values }) => values[result]))
					const centerValue = center?.values[result]
					if (typeof centerValue === 'number' && edgeValues.length) {
						this.add(`${recipe}:${result}:c2e`, { title: `Center − Edge - ${label}` }, run, centerValue - mean(edgeValues), span([center!, ...edge]))
					}
					for (const row of sites) {
						const value = row.values[result]
						this.add(`${recipe}:${result}:site:${row.values.site}`, { title: `Site ${row.values.site} - ${label}`, kind: 'reported' }, run, typeof value === 'number' ? value : undefined, [row.cite])
					}
				}
			}
		}
	}
}

/** Mean, 3σ and worst case of a set of overlay values. */
function spread(add: (suffix: string, title: string, value: number | undefined) => void, label: string, values: number[]) {
	if (!values.length) return
	add('mean', `Mean ${label}`, mean(values))
	add('3s', `3σ ${label}`, 3 * sigma(values))
	add('max', `Max |${label}|`, Math.max(...values.map(Math.abs)))
	add('m3s', `|Mean| + 3σ ${label}`, Math.abs(mean(values)) + 3 * sigma(values))
}

/**
 * OVL51/52, KLA Archer: per Test ID (TN on the old dashboard).
 * OVL51 reports site statistics (Mis_X/Mis_Y with TIS); OVL52 reports raw Mreg X/Y per target with pass/fail.
 */
class Overlay extends ToolAnalysis {
	run() {
		for (const run of this.runs) {
			const byTest = Map.groupBy(run.groups, ({ meta }) => meta['Test ID'] ?? '?')
			for (const [test, groups] of byTest) {
				const rows = groups.flatMap(({ rows }) => rows)
				const cite = span(rows)
				const add = (key: string) => (suffix: string, title: string, value: number | undefined) =>
					this.add(`TN${test}:${key}:${suffix}`, { title: `TN ${test} - ${title}`, unit: 'nm', legacy: suffix === 'mean' && !key.startsWith('Mreg') }, run, value, cite)

				const pick = (axis: string, column: string) => numbers(rows.filter(({ values }) => values.axis === axis).map(({ values }) => values[column]))
				spread(add('MisX'), 'MisX', pick('Mis_X', 'Mean (nm)'))
				spread(add('MisY'), 'MisY', pick('Mis_Y', 'Mean (nm)'))
				spread(add('TISX'), 'TISX', pick('Mis_X', 'TIS Mean (nm)'))
				spread(add('TISY'), 'TISY', pick('Mis_Y', 'TIS Mean (nm)'))

				const raw = rows.filter(({ values }) => 'Mreg X(nm)' in values)
				spread(add('MregX'), 'Mreg X', numbers(raw.map(({ values }) => values['Mreg X(nm)'])))
				spread(add('MregY'), 'Mreg Y', numbers(raw.map(({ values }) => values['Mreg Y(nm)'])))
				if (raw.length) {
					const passed = raw.filter(({ values }) => values['P/F'] === 'PASS').length
					this.add(`TN${test}:pass`, { title: `TN ${test} - Pass Rate`, unit: '%' }, run, (100 * passed) / raw.length, cite)
				}

				const sites = groups.length
				this.add(`TN${test}:sites`, { title: `TN ${test} - Sites Measured` }, run, raw.length || sites, cite)
			}
		}
	}
}

export class OVL51 extends Overlay {
	constructor(files: Parsed[]) {
		super('OVL51', files)
	}
}

export class OVL52 extends Overlay {
	constructor(files: Parsed[]) {
		super('OVL52', files)
	}
}

const ANALYSES = { AOI52, DEF51, DEF52, MTH52, OVL51, OVL52 }

/** Runs every tool's analysis over its parsed files. */
export function analyze(parsed: Parsed[]) {
	const byTool = Map.groupBy(parsed, ({ tool }) => tool)
	return Object.fromEntries(
		Object.entries(ANALYSES).map(([tool, Analysis]) => [tool, new Analysis(byTool.get(tool) ?? []).series()])
	) as Record<keyof typeof ANALYSES, Series[]>
}


