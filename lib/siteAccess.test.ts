// Who sees the site dashboard: run with `npx tsx lib/siteAccess.test.ts`
import { canManageSite, isAdminEmail, siteRole } from './config'

let p = 0, f = 0
const ok = (c: boolean, n: string) => { if (c) { p++; console.log(`  ✅ ${n}`) } else { f++; console.error(`  ❌ ${n}`) } }
const BIZ = '9ebaa477-8d94-4522-b4fb-aaaa3c665c86'

ok(canManageSite({ email: 'bprovisionproperties@yahoo.com', businessId: BIZ }, BIZ), 'owner on the old email gets in')
ok(canManageSite({ email: 'info.royalelitemoving@gmail.com', businessId: BIZ }, BIZ), 'owner after changing email still gets in')
ok(!canManageSite({ email: 'bprovisionproperties@yahoo.com', businessId: null }, BIZ), 'the old owner email alone no longer opens it')
ok(!canManageSite({ email: 'vendor@other.co', businessId: 'another-business' }, BIZ), 'another business owner is kept out')
ok(!canManageSite({ email: 'customer@x.co', businessId: null }, BIZ), 'a customer is kept out')
ok(!canManageSite({ email: 'customer@x.co' }, BIZ), 'no businessId: kept out')
ok(canManageSite({ email: ' INFO@goutsyde.com ', businessId: null }, BIZ), 'Outsyde admin gets in (any case)')
ok(!canManageSite(null, BIZ) && !canManageSite(undefined, BIZ), 'signed out: kept out')
ok(!canManageSite({ email: 'x@y.co', businessId: '' }, ''), 'missing site business id never matches an empty one')
ok(!canManageSite({ email: 'x@y.co', businessId: undefined }, undefined), 'missing on both sides never matches')
ok(!isAdminEmail('bprovisionproperties@yahoo.com') && isAdminEmail('info@goutsyde.com'), 'admin list is Outsyde only')

// Team access (backend migration 112, Legend 2026-11-11): Jeremiah signs in as himself, role "requests".
const team = (businessId: string, role = 'requests') => ({ email: 'jdmymy86@gmail.com', businessId: null, team: [{ businessId, role }] })
ok(canManageSite(team(BIZ), BIZ), 'team member of this business gets in')
ok(siteRole(team(BIZ), BIZ) === 'team', 'team member is shown as team (read only outside requests)')
ok(!canManageSite(team('another-business'), BIZ), 'team member of another business is kept out')
ok(!canManageSite(team(BIZ, 'stranger'), BIZ), 'an unknown team role is kept out')
ok(!canManageSite({ email: 'x@y.co', businessId: null, team: 'oops' as unknown as [] }, BIZ), 'a broken team field is kept out')
ok(siteRole({ email: 'o@x.co', businessId: BIZ, team: [{ businessId: BIZ, role: 'requests' }] }, BIZ) === 'owner', 'owner stays owner even if also listed on the team')
ok(siteRole({ email: 'info@goutsyde.com', businessId: null }, BIZ) === 'admin', 'Outsyde admin is admin')
ok(siteRole({ email: 'c@x.co', businessId: null, team: [] }, BIZ) === null, 'customer with an empty team list has no role')
ok(siteRole(team(BIZ), '') === null, 'no site business id never matches a team entry')

console.log(`\n${p} passed, ${f} failed`)
process.exit(f ? 1 : 0)
