import { readdir, stat } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'

const IGNORE = new Set(['outputs', 'code_backups', 'work', 'PC'])
const JUNK = /^(~\$|\.)/

export type Entry = { path: string; ext: string; bytes: number; mtime: string; created: string }

export async function scan(root: string, dir = root): Promise<Entry[]> {
	const entries = await readdir(dir, { withFileTypes: true })
	const nested = await Promise.all(
		entries
			.filter(({ name }) => !JUNK.test(name) && !IGNORE.has(name))
			.map(async (entry) => {
				const full = join(dir, entry.name)
				if (entry.isDirectory()) return scan(root, full)
				const { size, mtime, birthtime } = await stat(full)
				return [{ path: relative(root, full), ext: extname(entry.name).toLowerCase(), bytes: size, mtime: mtime.toISOString(), created: birthtime.toISOString() }]
			})
	)
	return nested.flat()
}
