import { join, basename } from 'node:path'
import { file } from 'bun'
import type { Entry } from './crawler'

/** Where a value came from: file plus line (text) or table/row/col (html). */
export type Cite = { file: string; line?: number; lines?: [number, number]; table?: string; row?: number; col?: number }

/** One row of values from the tool, untouched except for number parsing. */
export type Row = { values: Record<string, string | number>; cite: Cite }

/** A named block of rows: a wafer, a measurement site, a report table. */
export type Group = { name: string; meta: Record<string, string>; rows: Row[] }

export type Parsed = {
	tool: string
	file: string
	/** Run time from the tool's own header, else the filename, else null */
	date: string | null
	/** Where the date came from; 'created' is the file's creation time, not the tool's clock */
	dateSource: 'tool' | 'filename' | 'created'
	meta: Record<string, string>
	groups: Group[]
	warnings: string[]
}

type Parser = (text: string, entry: Entry) => Omit<Parsed, 'tool' | 'file' | 'dateSource'>

const num = (value: string) => {
	const trimmed = value.trim()
	return trimmed !== '' && Number.isFinite(+trimmed) ? +trimmed : trimmed
}
/** Tool exports are UTF-8 or Windows-1252 (F5x writes Å as 0xC5). */
const decode = (bytes: Uint8Array) => {
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
	} catch {
		return new TextDecoder('windows-1252').decode(bytes)
	}
}
const lines = (text: string) => text.replace(/\r/g, '').split('\n')
const iso = (date: Date) => (Number.isNaN(+date) ? null : date.toISOString())

/** YYYYMMDD or MMDDYYYY (AOI SPC3 files) in a filename. */
function dateFromName(name: string) {
	const [digits] = name.match(/(?<!\d)\d{8}(?!\d)/) ?? []
	if (!digits) return null
	const ymd = /^20\d{2}/.test(digits)
	const [y, m, d] = ymd ? [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6)] : [digits.slice(4), digits.slice(0, 2), digits.slice(2, 4)]
	return iso(new Date(`${y}-${m}-${d}T00:00:00`))
}

/** AOI52, Camtek: one CSV of defects, header row then one row per defect. */
const camtek: Parser = (text, { path }) => {
	const [header, ...body] = lines(text)
	const keys = header.split(',').map((key) => key.trim())
	const rows = body.flatMap((line, index) =>
		line.trim() ? [{ values: Object.fromEntries(line.split(',').map((cell, col) => [keys[col] ?? `col${col}`, num(cell)])), cite: { file: path, line: index + 2 } }] : []
	)
	const date = dateFromName(basename(path))
	return { date, meta: {}, groups: [{ name: 'defects', meta: {}, rows }], warnings: [] }
}

/** MTH52, F5x: file header, then one block per wafer. Each block has the tool's stats rows and a site table, keyed by RESULT TYPE. */
const STATS = new Set(['MEAN', 'MIN', 'MAX', '% STDDEV', 'STDDEV', '3 % STDDEV', '3 STDDEV', 'RANGE'])

const filmetrics: Parser = (text, { path }) => {
	const meta: Record<string, string> = {}
	const groups: Group[] = []
	let wafer: Group | undefined
	let results: string[] = []
	let sites: string[] | undefined

	lines(text).forEach((line, index) => {
		const cells = line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
		const [key, ...rest] = cells
		const cite = { file: path, line: index + 1 }
		if (!key) return (sites = undefined)
		if (key === 'WAFER ID') {
			wafer = { name: rest[0], meta: {}, rows: [] }
			groups.push(wafer)
			results = []
			sites = undefined
			return
		}
		if (!wafer) return (meta[key.replace(/:$/, '')] = rest.join(',').trim())
		if (key === 'RESULT TYPE') return (results = rest.filter(Boolean))
		if (STATS.has(key)) return wafer.rows.push({ values: { stat: key, ...Object.fromEntries(results.map((name, col) => [name, num(rest[col] ?? '')])) }, cite })
		if (key === 'Site #') return (sites = ['site', ...results, 'X', 'Y'])
		if (sites) return wafer.rows.push({ values: Object.fromEntries(sites.map((name, col) => [name, num(cells[col] ?? '')])), cite })
		wafer.meta[key] = rest.filter(Boolean).join(',')
	})

	const stamp = meta['PROCESS DATE/TIME'] ?? meta['COLLECTION DATE/TIME']
	const date = stamp ? iso(new Date(stamp.replace(/\s+/, ' '))) : dateFromName(basename(path))
	return { date, meta, groups, warnings: date ? [] : ['no date in header or filename'] }
}

/** OVL51/52, KLA Archer: tab-separated AUTORUN result, either Site Statistics or Raw Data. */
const archer: Parser = (text, { path }) => {
	const all = lines(text)
	const [first = ''] = all
	const [, stamp = '', lot = ''] = first.match(/^(\S+ \S+)\s+lot:(.*)$/) ?? []
	const meta: Record<string, string> = { lot: lot.trim(), program: all[2]?.match(/<(.*)>/)?.[1] ?? '', mode: all[3]?.trim() ?? '' }
	const groups: Group[] = []
	const warnings: string[] = []
	let group: Group | undefined
	let header: string[] | undefined

	const [, errors = '0'] = text.match(/# of reported errors\s*:\s*(\d+)/) ?? []
	if (+errors) warnings.push(`tool reported ${errors} error(s)`)

	all.forEach((line, index) => {
		const cells = line.split('\t').map((cell) => cell.trim())
		const cite = { file: path, line: index + 1 }
		if (/^Test ID:/.test(line)) {
			const pairs = [...line.matchAll(/([A-Za-z #]+):\s*([^\t]+)/g)].map(([, key, value]) => [key.trim(), value.trim()])
			group = { name: line.trim(), meta: Object.fromEntries(pairs), rows: [] }
			groups.push(group)
			header = undefined
			return
		}
		if (!group) return
		if (/^Location X:/.test(line)) return Object.assign(group.meta, Object.fromEntries([...line.matchAll(/(Location [XY]):\s*([^\t]+)/g)].map(([, k, v]) => [k, v.trim()])))
		if (/\(nm\)/.test(line)) return (header = cells)
		if (!header || !line.trim()) return
		const statistics = cells[0] !== '' && Number.isNaN(+cells[0])
		const keys = statistics ? ['axis', ...header.slice(1).filter(Boolean)] : header
		group.rows.push({ values: Object.fromEntries(keys.map((key, col) => [key, num(cells[col] ?? '')])), cite })
	})

	const [mm, dd, yy, hh, mi, ss] = stamp.split(/[/ :]/)
	const date = stamp ? iso(new Date(`20${yy}-${mm}-${dd}T${hh}:${mi}:${ss}`)) : null
	if (!groups.length) warnings.push('no measurement data')
	return { date, meta, groups, warnings }
}

/**
 * DEF51/52, KLA Surfscan: the tool's only export is its HTML job report.
 * Each lot (HT, ST, HS, UHS...) has a Lot Header table, then data tables with ids like "HT: DW Oblique Defects Totals".
 * Wafer rows are kept; the report's own MIN/MAX/AVG rows are dropped since they're recomputable.
 */
const surfscan: Parser = (text, { path }) => {
	const clean = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
	const meta: Record<string, string> = {}
	const groups: Group[] = []
	let lot: Record<string, string> = {}

	for (const [, attrs, body] of text.matchAll(/<table\b([^>]*)>([\s\S]*?)<\/table>/gi)) {
		if (/<table\b/i.test(body)) continue
		const id = attrs.match(/\bid="([^"]*)"/)?.[1] ?? ''
		const rows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(([, tr]) => [...tr.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(([, cell]) => clean(cell)))
		const filled = rows.filter((row) => row.some(Boolean))
		if (!filled.length) continue

		const [[title = ''] = []] = filled
		if (/^(Job|Lot) Header$/.test(title)) {
			const pairs = Object.fromEntries(filled.slice(1).filter((row) => row.length >= 2).map(([key, value]) => [key, value]))
			if (title === 'Lot Header') lot = pairs
			for (const [key, value] of Object.entries(pairs)) meta[key] ??= value
			continue
		}

		const width = Math.max(...filled.map(({ length }) => length))
		const headerAt = filled.findIndex(({ length }) => length === width)
		if (headerAt < 0 || width < 3) continue
		const header = filled[headerAt]
		const name = id || filled[0].join(' / ')
		groups.push({
			name,
			meta: { lot: lot['Lot Name'] ?? '', lotDate: lot['Lot Date'] ?? '', recipe: lot['Recipe Name'] ?? '', table: name.replace(/^[^:]*:\s*/, '') },
			rows: filled
				.slice(headerAt + 1)
				.filter(({ length }) => length === width)
				.map((row, r) => ({ values: Object.fromEntries(header.map((key, col) => [key || `col${col}`, num(row[col] ?? '')])), cite: { file: path, table: name, row: r + 1 } }))
		})
	}

	const stamp = meta['Lot Date'] ?? meta['Job Date']
	const date = stamp ? iso(new Date(stamp)) : null
	return { date, meta, groups, warnings: date ? [] : ['no lot or job date'] }
}

/** Parser per tool. Duplicate exports are skipped: OVL .xml mirrors the .txt. */
const PARSERS: Record<string, { parse: Parser; skip?: (entry: Entry) => boolean; source?: Parsed['dateSource'] }> = {
	AOI52: { parse: camtek, source: 'filename' },
	MTH52: { parse: filmetrics },
	OVL51: { parse: archer, skip: ({ ext }) => ext === '.xml' },
	OVL52: { parse: archer, skip: ({ ext }) => ext === '.xml' },
	DEF51: { parse: surfscan },
	DEF52: { parse: surfscan }
}

export async function parse(matched: Record<string, Entry[]>, root: string) {
	const parsed: Parsed[] = []
	const skipped: { tool: string; file: string; reason: string }[] = []

	for (const [tool, entries] of Object.entries(matched)) {
		const parser = PARSERS[tool]
		for (const entry of entries) {
			const { path } = entry
			if (!parser) {
				skipped.push({ tool, file: path, reason: 'no parser for tool' })
				continue
			}
			if (parser.skip?.(entry)) {
				skipped.push({ tool, file: path, reason: 'duplicate export' })
				continue
			}
			try {
				const bytes = await file(join(root, path)).bytes()
				const text = decode(bytes)
				const result = parser.parse(text, entry)
				const { date, warnings } = result
				parsed.push(
					date
						? { tool, file: path, dateSource: parser.source ?? 'tool', ...result }
						: { tool, file: path, ...result, date: entry.created, dateSource: 'created', warnings: [...warnings, 'date taken from file creation time'] }
				)
			} catch (error) {
				skipped.push({ tool, file: path, reason: `parse failed: ${(error as Error).message}` })
			}
		}
	}

	return { parsed, skipped }
}
