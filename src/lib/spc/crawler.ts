import { Glob } from 'bun'
import { basename, extname, join } from 'node:path'
import { stat } from 'node:fs/promises'

/** One file found under a tool's scan folder. Paths are relative to the data root. */
export type Entry = { tool: string; scan: string; path: string; name: string; ext: string; bytes: number; mtime: string; created: string }

/** Only scan folders count: SPC, SPC_1, SPC3_10132026, spc_20260921… */
const SCAN = /^spc/i

/** Lists every file in Raw_Data/<tool>/KLARF/<spc*>/ for the given tools. Read-only. */
export const crawl = async (root: string, tools: string[]) => {
	const entries: Entry[] = []
	for (const tool of tools) {
		const cwd = join(root, 'Raw_Data', tool, 'KLARF')
		if (!(await stat(cwd).catch(() => null))?.isDirectory()) continue
		for await (const path of new Glob('*/*').scan({ cwd, onlyFiles: true })) {
			const [scan, name] = path.split('/')
			if (!SCAN.test(scan) || name.startsWith('.')) continue
			const { size, mtime, birthtime } = await stat(join(cwd, path))
			entries.push({ tool, scan, path: join('Raw_Data', tool, 'KLARF', path), name: basename(name), ext: extname(name).toLowerCase(), bytes: size, mtime: mtime.toISOString(), created: birthtime.toISOString() })
		}
	}
	return entries
}
