// Request form helpers (Royal Elite step 6): run with `npx tsx lib/requestForm.test.ts`
import { blankQuestion, cleanForSave, firstMissing, toAnswers, LIMITS, type FormQuestion } from './requestForm'

let p = 0, f = 0
const ok = (c: boolean, n: string, d?: unknown) => { if (c) { p++; console.log(`  ✅ ${n}`) } else { f++; console.error(`  ❌ ${n}`, d ?? '') } }
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const qs: FormQuestion[] = [
  { id: 'b_a', type: 'short_text', label: 'How many boxes?', required: true },
  { id: 'b_b', type: 'choice', label: 'Heavy items?', required: false, options: ['Piano', 'Safe'], multiple: true },
  { id: 'b_c', type: 'choice', label: 'Elevator?', required: true, options: ['Yes', 'No'] },
  { id: 'b_d', type: 'photos', label: 'Photos', required: true, maxPhotos: 3 },
  { id: 'b_e', type: 'date', label: 'Walk through date', required: false },
]

console.log('blankQuestion')
ok(same(blankQuestion('short_text'), { type: 'short_text', label: '', required: false }), 'short text')
ok(same(blankQuestion('choice'), { type: 'choice', label: '', required: false, options: ['', ''], multiple: false }), 'choice starts with 2 empty options')
ok(same(blankQuestion('photos'), { type: 'photos', label: '', required: false, maxPhotos: LIMITS.photosPerQuestion }), 'photos start at the max')

console.log('cleanForSave')
ok(same(cleanForSave([{ type: 'short_text', label: '  Boxes  ', help: '  ', required: true }]), [{ type: 'short_text', label: 'Boxes', required: true }]), 'trims, drops empty help')
ok(same(cleanForSave([{ id: 'x1', type: 'choice', label: 'A', required: false, options: [' Yes ', '', 'No'], multiple: true }]), [{ id: 'x1', type: 'choice', label: 'A', required: false, options: ['Yes', 'No'], multiple: true }]), 'keeps id, drops empty options')
ok(same(cleanForSave([{ type: 'photos', label: 'P', required: false, maxPhotos: 9 }]), [{ type: 'photos', label: 'P', required: false, maxPhotos: 5 }]), 'photos capped at 5')
ok(same(cleanForSave([{ type: 'short_text', label: 'Keep', required: false, options: ['x'], multiple: true, maxPhotos: 2 }]), [{ type: 'short_text', label: 'Keep', required: false }]), 'drops fields that do not belong to the type')

console.log('firstMissing')
ok(firstMissing(qs, {}) === 'How many boxes?', 'names the first missing required question')
ok(firstMissing(qs, { b_a: '   ' }) === 'How many boxes?', 'blank text counts as missing')
ok(firstMissing(qs, { b_a: '4', b_c: 'Yes' }) === 'Photos', 'required photos missing')
ok(firstMissing(qs, { b_a: '4', b_c: 'Yes', b_d: ['u1'] }) === null, 'all required answered')

console.log('toAnswers')
ok(same(toAnswers(qs, { b_a: ' 40 ', b_b: [], b_c: 'No', b_d: ['u1', 'u2'], b_e: '' }), { b_a: '40', b_c: 'No', b_d: ['u1', 'u2'] }), 'trims, leaves out empty answers')
ok(same(toAnswers(qs, { b_b: ['Piano'], zzz: 'x' }), { b_b: ['Piano'] }), 'only known questions are sent')
ok(same(toAnswers([], { a: 'x' }), {}), 'no questions sends nothing')

console.log(`\n${p} passed, ${f} failed`)
if (f) process.exit(1)
