import { write } from 'bun'
import { scan } from './crawler'
import { match } from './match'
import { parse } from './parser'
import { analyze } from './analysis'

const folder = '/Users/crl/OneDrive/TIE Internal-Equipment - Shared Documents/Equipment/MR2/Tools/0_Metrology/All_Metro_SPC_MR2'
const output = '/Users/crl/Developer/txie/static/metro'

const files = await scan(folder)
const { matched, unmatched } = await match(files, folder)
const { parsed, skipped } = await parse(matched, folder)
const analysis = analyze(parsed)

await write(`${output}/inventory.json`, JSON.stringify({ root: folder, scanned: new Date().toISOString(), files }, null, '\t'))
await write(`${output}/matches.json`, JSON.stringify({ matched, unmatched }, null, '\t'))

await write(`${output}/parsed.json`, JSON.stringify({ parsed, skipped }, null, '\t'))

console.table(parsed.map(({ tool, file, date, groups, warnings }) => ({ tool, file: file.split('/').at(-1)?.slice(0, 40), date: date?.slice(0, 16), groups: groups.length, rows: groups.reduce((n, { rows }) => n + rows.length, 0), warn: warnings.join('; ') })))
console.table(skipped)
await write(`${output}/analysis.json`, JSON.stringify(analysis, null, '\t'))
console.table(Object.entries(analysis).map(([tool, series]) => ({ tool, series: series.length, legacy: series.filter(({ legacy }) => legacy).length, points: series.reduce((n, { points }) => n + points.length, 0) })))
console.table(Object.entries(matched).map(([tool, { length }]) => ({ tool, files: length })))
console.log(`${files.length} scanned, ${files.length - unmatched.length} matched, ${unmatched.length} unmatched`)
