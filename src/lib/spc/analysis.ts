import type { Cite, Defect, Klarf } from './scraper'

/** One value from one run, with where and when it was recorded. */
export type Point = { date: string; value: number; file: string; cite: Cite[]; dateSource: Klarf['dateSource'] | 'filename' }

export type Series = {
	tool: string
	id: string
	title: string
	unit?: string
	/** Shown first, like the old dashboard's charts */
	legacy?: boolean
	/** Raw value from the tool, or computed by us from raw values */
	kind: 'reported' | 'derived'
	points: Point[]
}

type Meta = Omit<Series, 'tool' | 'id' | 'points' | 'kind'> & { kind?: Series['kind'] }

/** One cite spanning the defect rows' lines (they are consecutive in the DefectList). */
const span = (defects: Defect[], fallback: Cite): Cite[] => {
	const lines = defects.map(({ cite: { line } }) => line).filter((line): line is number => line !== undefined)
	return lines.length ? [{ file: fallback.file, lines: [Math.min(...lines), Math.max(...lines)] }] : [fallback]
}

abstract class ToolAnalysis {
	private store = new Map<string, Series>()

	constructor(
		readonly tool: string,
		readonly files: Klarf[]
	) {}

	/** Runs oldest first, by the KLARF's own timestamp. */
	protected get runs() {
		return this.files.filter(({ tool, date }) => tool === this.tool && date).toSorted((a, b) => a.date!.value.localeCompare(b.date!.value))
	}

	protected add(id: string, { title, unit, legacy, kind = 'derived' }: Meta, run: Klarf, value: number | undefined, cite: Cite[]) {
		if (value === undefined || !Number.isFinite(value)) return
		const series = this.store.get(id) ?? { tool: this.tool, id, title, unit, legacy, kind, points: [] }
		series.points.push({ date: run.date!.value, value, file: run.file, cite, dateSource: run.dateSource })
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
 * AOI52, Camtek Hawk KLARF. Each recipe is its own set of series until engineers say they can be combined.
 * Size bins use DSIZE (µm) with half-open bins.
 */
export class AOI52 extends ToolAnalysis {
	static BINS: [number, number][] = [[0, 0.7], [0.7, 1], [1, 2], [2, 5], [5, Infinity]]

	constructor(files: Klarf[]) {
		super('AOI52', files)
	}

	run() {
		for (const run of this.runs) {
			const { recipe, defects, summary, file } = run
			const r = recipe?.value ?? 'unknown recipe'
			const all = span(defects, { file })

			for (const { values: { NDEFECT, NDIE, NDEFDIE }, cite } of summary) {
				this.add(`${r}:total`, { title: `${r} · Total Defects`, legacy: true, kind: 'reported' }, run, NDEFECT, [cite])
				this.add(`${r}:dies`, { title: `${r} · Defective Die`, legacy: true, kind: 'reported' }, run, NDEFDIE, [cite])
				if (NDIE) this.add(`${r}:yield`, { title: `${r} · Defective Die Share`, unit: '%' }, run, (NDEFDIE / NDIE) * 100, [cite])
			}

			for (const [low, high] of AOI52.BINS) {
				const hits = defects.filter(({ values: { DSIZE } }) => DSIZE >= low && DSIZE < high)
				const label = high === Infinity ? `≥ ${low}` : `${low} – ${high}`
				this.add(`${r}:bin:${low}`, { title: `${r} · Size ${label} µm`, unit: 'count', legacy: true }, run, hits.length, span(hits, { file }))
			}

			const classes = Map.groupBy(defects, ({ class: name, values: { CLASSNUMBER } }) => name ?? `Class ${CLASSNUMBER}`)
			for (const [name, hits] of classes) this.add(`${r}:class:${name}`, { title: `${r} · ${name}` }, run, hits.length, span(hits, { file }))

			const sizes = defects.map(({ values: { DSIZE } }) => DSIZE).filter(Number.isFinite)
			if (sizes.length) {
				this.add(`${r}:size:mean`, { title: `${r} · Mean Defect Size`, unit: 'µm' }, run, sizes.reduce((a, b) => a + b, 0) / sizes.length, all)
				this.add(`${r}:size:max`, { title: `${r} · Largest Defect Size`, unit: 'µm' }, run, Math.max(...sizes), all)
			}
		}
	}
}

const ANALYSES = { AOI52 }

/** Series per tool, ready for analysis.json. The scraped data is only read. */
export const analyze = (scraped: Klarf[]) =>
	Object.fromEntries(Object.entries(ANALYSES).map(([tool, Analysis]) => [tool, new Analysis(scraped).series()]))
