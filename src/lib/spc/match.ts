import { file } from 'bun'
import { join } from 'node:path'
import type { Entry } from './crawler'

/** One scan: its KLARF results plus the images that go with them. */
export type Scan = { tool: string; id: string; klarf: Entry[]; images: Entry[]; other: Entry[] }

const IMAGES = new Set(['.tif', '.tiff', '.jpeg', '.jpg', '.png'])

/** A KLARF result file always opens with its FileVersion record. */
const isKlarf = async ({ ext, path }: Entry, root: string) => ext === '.txt' && (await file(join(root, path)).slice(0, 64).text()).trimStart().startsWith('FileVersion')

/** Groups crawled files into scans and sorts each file by role. */
export const match = async (entries: Entry[], root: string) => {
	const scans = new Map<string, Scan>()
	for (const entry of entries) {
		const { tool, scan: id } = entry
		const key = `${tool}/${id}`
		const scan = scans.get(key) ?? { tool, id, klarf: [], images: [], other: [] }
		scans.set(key, scan)
		if (await isKlarf(entry, root)) scan.klarf.push(entry)
		else if (IMAGES.has(entry.ext)) scan.images.push(entry)
		else scan.other.push(entry)
	}
	return [...scans.values()]
}
