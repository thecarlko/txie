import { join, basename } from 'node:path'
import { file } from 'bun'
import type { Entry } from './crawler'

/** Reads the first bytes of a file for header checks. */
const head = async (path: string, bytes = 2048) => file(path).slice(0, bytes).text()

type Qualifier = (entry: Entry, root: string) => boolean | Promise<boolean>
type Tool = {
	/** Old names the folder may still use */
	deprecated?: string[]
	/** Pass 2: did this file come from the tool? */
	qualifies: Qualifier
}

const inRaw = ({ path }: Entry) => path.split('/').includes('RAW DATA')
const name = ({ path }: Entry) => basename(path)

/** Camtek surface export, not the die-align/location side files. */
const camtek: Qualifier = async (entry, root) =>
	inRaw(entry) && entry.ext === '.csv' && /_Surface\.csv$/i.test(name(entry)) &&
	(await head(join(root, entry.path))).startsWith('WaferX,WaferY')

/** Surfscan SPC health check report. */
const surfscan: Qualifier = (entry) =>
	inRaw(entry) && entry.ext === '.html' && /^SPC_Health_Check/i.test(name(entry))

/** F5x thin film measurement export. */
const filmetrics: Qualifier = async (entry, root) =>
	inRaw(entry) && entry.ext === '.csv' && /Thin Film Measurement/i.test(await head(join(root, entry.path)))

/** Overlay export; .txt and .xml are pairs of the same run. */
const overlay: Qualifier = (entry) => inRaw(entry) && ['.txt', '.xml'].includes(entry.ext)

/** No raw exports yet. */
const none: Qualifier = () => false

export const TOOLS: Record<string, Tool> = {
	AOI52: { qualifies: camtek },
	DEF51: { qualifies: surfscan },
	DEF52: { qualifies: surfscan },
	MTH52: { qualifies: filmetrics },
	MTH53: { deprecated: ['MTH02'], qualifies: none },
	OVL51: { qualifies: overlay },
	OVL52: { qualifies: overlay },
	SAM51: { qualifies: none }
}

/** Pass 1: tool id from the top-level folder (ASSETID_TOOL or TOOL). */
export function toolOf({ path }: Entry) {
	const [folder] = path.split('/')
	const id = folder.split('_').at(-1) ?? ''
	if (id in TOOLS) return id
	return Object.entries(TOOLS).find(([, { deprecated }]) => deprecated?.includes(id))?.[0]
}

export type Matches = { matched: Record<string, Entry[]>; unmatched: Entry[] }

export async function match(files: Entry[], root: string): Promise<Matches> {
	const matched: Record<string, Entry[]> = Object.fromEntries(Object.keys(TOOLS).map((id) => [id, []]))
	const unmatched: Entry[] = []

	for (const entry of files) {
		const id = toolOf(entry)
		const ok = id && (await TOOLS[id].qualifies(entry, root))
		ok ? matched[id].push(entry) : unmatched.push(entry)
	}

	return { matched, unmatched }
}
