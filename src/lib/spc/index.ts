// Entry point: crawl → match → scrape → analyze. The data is never edited.
import { write } from 'bun'
import { crawl } from './crawler'
import { match } from './match'
import { scrape } from './scraper'
import { analyze } from './analysis'

const root = Bun.env.SPC_ROOT ?? '/Volumes/FabData'
const output = `${import.meta.dir}/../../../static/metro`
const tools = ['AOI52']

const entries = await crawl(root, tools)
const scans = await match(entries, root)
const { scraped, skipped } = await scrape(scans, root)

await write(`${output}/scans.json`, JSON.stringify({ root, crawled: new Date().toISOString(), scans }, null, '\t'))
await write(`${output}/scraped.json`, JSON.stringify({ scraped, skipped }, null, '\t'))

console.table(scraped.map(({ scan, file, date, dateSource, lot, wafer, recipe, defects, summary, warnings }) => ({ scan, file: file.split('/').at(-1), date: date?.value, from: dateSource, lot: lot?.value, wafer: wafer?.value, recipe: recipe?.value, defects: defects.length, summary: summary.map(({ values }) => values.NDEFECT).join(','), warn: warnings.join('; ') })))
if (skipped.length) console.table(skipped)

const analysis = analyze(scraped)
await write(`${output}/analysis.json`, JSON.stringify(analysis, null, '\t'))
console.table(Object.values(analysis).flat().map(({ id, points }) => ({ series: id, points: points.length })))
