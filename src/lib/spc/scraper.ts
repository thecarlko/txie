import { file } from 'bun'
import { join } from 'node:path'
import type { Cite } from '../onedrive/scraper'
import type { Entry } from './crawler'
import type { Scan } from './match'

export type { Cite }

/** A value straight from the file, with the line it came from. */
export type Cited<T> = { value: T; cite: Cite }

/** One defect row. Columns follow the file's own DefectRecordSpec; `class` is the ClassLookup name. */
export type Defect = { values: Record<string, number>; images: number[]; class?: string; cite: Cite }

/** One SummaryList row (per inspection test), keyed by SummarySpec. */
export type Summary = { values: Record<string, number>; cite: Cite }

/** Everything scraped from one KLARF result file. Nothing is recalculated here. */
export type Klarf = {
	tool: string
	scan: string
	file: string
	/** Run time from ResultTimestamp, else FileTimestamp, else the file's creation time */
	date: Cited<string> | null
	dateSource: 'tool' | 'created'
	lot?: Cited<string>
	wafer?: Cited<string>
	slot?: Cited<number>
	recipe?: Cited<string>
	device?: Cited<string>
	station?: Cited<string[]>
	area?: Cited<number>
	classes: Record<number, string>
	defects: Defect[]
	summary: Summary[]
	/** Image files from the same scan folder */
	images: string[]
	warnings: string[]
}

const tokens = (line: string) => (line.match(/"[^"]*"|[^\s;]+/g) ?? []).map((t) => t.replace(/^"|"$/g, ''))

/** KLARF dates are MM-DD-YY HH:MM:SS on the tool's local clock. */
const klarfDate = (date = '', time = '') => {
	const [mm, dd, yy] = date.split('-')
	return mm && dd && yy && time ? `20${yy}-${mm}-${dd}T${time}` : undefined
}

/** Splits the file into records; a record ends at the line ending in ';'. */
const records = (text: string) => {
	const out: { key: string; head: string[]; rows: { tokens: string[]; line: number }[]; line: number }[] = []
	let current: (typeof out)[number] | undefined
	text.replace(/\r/g, '').split('\n').forEach((raw, i) => {
		const line = i + 1
		const trimmed = raw.trim()
		if (!trimmed) return
		if (!current) {
			const [key, ...head] = tokens(trimmed)
			current = { key, head, rows: [], line }
		} else if (trimmed !== ';') current.rows.push({ tokens: tokens(trimmed), line })
		if (trimmed.endsWith(';')) out.push(current), (current = undefined)
	})
	return out
}

export const scrapeKlarf = (text: string, { tool, scan, path, created }: Entry, images: string[] = []): Klarf => {
	const klarf: Klarf = { tool, scan, file: path, date: null, dateSource: 'created', classes: {}, defects: [], summary: [], images, warnings: [] }
	const cite = (line: number, lines?: [number, number]): Cite => (lines ? { file: path, lines } : { file: path, line })
	let defectSpec: string[] = []
	let summarySpec: string[] = []
	let fileTime: Cited<string> | undefined

	for (const { key, head, rows, line } of records(text)) {
		switch (key) {
			case 'ResultTimestamp':
			case 'FileTimestamp': {
				const value = klarfDate(...head)
				if (!value) klarf.warnings.push(`unreadable ${key} on line ${line}`)
				else if (key === 'ResultTimestamp') klarf.date = { value, cite: cite(line) }
				else fileTime = { value, cite: cite(line) }
				break
			}
			case 'LotID': klarf.lot = { value: head[0], cite: cite(line) }; break
			case 'WaferID': klarf.wafer = { value: head[0], cite: cite(line) }; break
			case 'Slot': klarf.slot = { value: +head[0], cite: cite(line) }; break
			case 'StepId': klarf.recipe = { value: head[0], cite: cite(line) }; break
			case 'DeviceID': klarf.device = { value: head[0], cite: cite(line) }; break
			case 'InspectionStationID': klarf.station = { value: head, cite: cite(line) }; break
			case 'AreaPerTest': klarf.area = { value: +head[0], cite: cite(line) }; break
			case 'ClassLookup':
				for (const { tokens: [n, name] } of rows) klarf.classes[+n] = name
				break
			case 'DefectRecordSpec': defectSpec = head.slice(1); break
			case 'SummarySpec': summarySpec = head.slice(1); break
			case 'DefectList': {
				const fixed = defectSpec.filter((c) => c !== 'IMAGELIST')
				for (const { tokens: t, line: l } of rows) {
					const values = Object.fromEntries(fixed.map((c, i) => [c, +t[i]]))
					const defect: Defect = { values, images: t.slice(fixed.length).map(Number), class: klarf.classes[values.CLASSNUMBER], cite: cite(l) }
					if (fixed.some((c) => !Number.isFinite(values[c]))) klarf.warnings.push(`non-numeric defect on line ${l}`)
					klarf.defects.push(defect)
				}
				break
			}
			case 'SummaryList':
				for (const { tokens: t, line: l } of rows) klarf.summary.push({ values: Object.fromEntries(summarySpec.map((c, i) => [c, +t[i]])), cite: cite(l) })
				break
		}
	}

	if (!klarf.date && fileTime) (klarf.date = fileTime), klarf.warnings.push('no ResultTimestamp; used FileTimestamp')
	if (klarf.date) klarf.dateSource = 'tool'
	else klarf.date = { value: created, cite: { file: path } }

	const listed = klarf.summary.reduce((n, { values }) => n + (values.NDEFECT ?? 0), 0)
	if (klarf.summary.length && listed !== klarf.defects.length) klarf.warnings.push(`SummaryList says ${listed} defects, DefectList has ${klarf.defects.length}`)
	return klarf
}

/** Scrapes every KLARF in every scan. Files are only read. */
export const scrape = async (scans: Scan[], root: string) => {
	const scraped: Klarf[] = []
	const skipped: { file: string; reason: string }[] = []
	for (const { klarf, images } of scans)
		for (const entry of klarf) {
			try {
				scraped.push(scrapeKlarf(await file(join(root, entry.path)).text(), entry, images.map(({ path }) => path)))
			} catch (error) {
				skipped.push({ file: entry.path, reason: String(error) })
			}
		}
	return { scraped, skipped }
}
