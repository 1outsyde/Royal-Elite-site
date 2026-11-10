// Home page content Benny edits in his dashboard: run with `npx tsx lib/siteContent.test.ts`
import { DEFAULT_CONTENT, LIMITS, mergeSiteConfig, moveTypesFrom, phoneHref, resolveContent } from './siteContent'

let p = 0, f = 0
const ok = (c: boolean, n: string) => { if (c) { p++; console.log(`  ✅ ${n}`) } else { f++; console.error(`  ❌ ${n}`) } }
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

console.log('resolveContent')
ok(same(resolveContent(null), DEFAULT_CONTENT), 'nothing saved gives today\'s site')
ok(same(resolveContent(undefined), DEFAULT_CONTENT), 'undefined gives today\'s site')
ok(same(resolveContent('junk'), DEFAULT_CONTENT), 'a non object gives today\'s site')
ok(same(resolveContent({}), DEFAULT_CONTENT), 'an empty object gives today\'s site')
ok(resolveContent({ region: '   ' }).region === DEFAULT_CONTENT.region, 'a blank field falls back')
ok(resolveContent({ region: '  Hampton Roads  ' }).region === 'Hampton Roads', 'text is trimmed')
ok(resolveContent({ light: { price: '' } }).light.price === '$250', 'an empty price falls back to $250')
ok(resolveContent({ light: { price: '$275' } }).light.price === '$275', 'an edited price shows')
ok(resolveContent({ light: { price: '$275' } }).light.title === 'Light Move', 'the rest of an edited card keeps its text')
ok(resolveContent({ region: 'x'.repeat(500) }).region.length === LIMITS.short, 'long text is cut to the limit')
ok(resolveContent({ policies: { deposit: 'y'.repeat(5000) } }).policies.deposit.length === LIMITS.long, 'long policy text is cut')
ok(resolveContent({ region: 42 }).region === DEFAULT_CONTENT.region, 'a non text value falls back')
ok(same(resolveContent({ trust: ['A', '', 'C'] }).trust, ['A', DEFAULT_CONTENT.trust[1], 'C', DEFAULT_CONTENT.trust[3]]), 'trust strip keeps 4 items, blanks fall back')
ok(same(resolveContent({ servicesOffered: ['  ', ''] }).servicesOffered, DEFAULT_CONTENT.servicesOffered), 'an all blank services list falls back')
ok(same(resolveContent({ servicesOffered: ['Moving', ' ', 'Packing'] }).servicesOffered, ['Moving', 'Packing']), 'blank services lines are dropped')
ok(resolveContent({ servicesOffered: Array(30).fill('x') }).servicesOffered.length === LIMITS.listItems, 'services list is capped')
ok(resolveContent({ simplePack: { rows: [{ price: '$210' }] } }).simplePack.rows[0].price === '$210', 'a packing row price is editable')
ok(resolveContent({ simplePack: { rows: [{ price: '$210' }] } }).simplePack.rows.length === 4, 'packing tables keep 4 rows')
ok(resolveContent({ simplePack: { rows: [{ price: '$210' }] } }).simplePack.rows[1].price === '$300', 'other packing rows keep their price')
ok(resolveContent({ longDistance: { rows: [{}, {}, { price: '' }] } }).longDistance.rows[2].price === '$3,200', 'long distance rows fall back')
ok(resolveContent({ phone: '' }).phone === '757-944-4925', 'phone falls back')

console.log('phoneHref')
ok(phoneHref('757-944-4925') === 'tel:+17579444925', '10 digit phone')
ok(phoneHref('(757) 944 4925') === 'tel:+17579444925', 'phone with spaces and brackets')
ok(phoneHref('1 757 944 4925') === 'tel:+17579444925', 'phone with a leading 1')

console.log('mergeSiteConfig')
const merged = mergeSiteConfig({ stylistPhoto: 'x', galleryPhotos: ['a'] }, { region: 'R' })
ok(merged.stylistPhoto === 'x' && same(merged.galleryPhotos, ['a']), 'keeps keys the editor does not own')
ok(same(merged.content, { region: 'R' }), 'sets content')
ok(same(mergeSiteConfig(null, { region: 'R' }), { content: { region: 'R' } }), 'works with nothing saved')
ok(same(mergeSiteConfig({ content: { region: 'Old', phone: '1' } }, { region: 'New' }).content, { region: 'New' }), 'content is replaced, not mixed')

console.log('moveTypesFrom')
ok(same(moveTypesFrom(DEFAULT_CONTENT), ['Standard Move', 'Light Move', 'Simple Pack', 'Full Pack', 'Long-Distance Move']), 'card titles in page order, no repeats')
ok(moveTypesFrom(resolveContent({ light: { title: 'Small Move' } }))[1] === 'Small Move', 'a renamed card renames the move type')

console.log(`\n${p} passed, ${f} failed`)
if (f) process.exit(1)
