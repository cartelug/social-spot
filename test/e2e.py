"""End-to-end test of the deployed app (server mode) with Playwright.
Run the server first, then:  python3 test/e2e.py http://localhost:3100 out_dir
"""
import sys, re, json, os, time
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'shots'
os.makedirs(OUT, exist_ok=True)
ADMIN = ('admin@socialspot.test', 'TestPass123')
errors = []
results = []

def ok(msg):
    results.append(msg)
    print('  ✓', msg)

EXPECTED = ['status of 401']  # the deliberate wrong-password attempt

def watch(page, tag):
    page.on('console', lambda m: errors.append(f'[{tag}] console.{m.type}: {m.text}') if m.type == 'error' and not any(x in m.text for x in EXPECTED) else None)
    page.on('pageerror', lambda e: errors.append(f'[{tag}] pageerror: {e}'))

def settle(page):
    page.wait_for_selector('#app .view', timeout=15000)
    page.wait_for_selector('.preloader', state='detached', timeout=15000)

with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # ------------------------------------------------ admin: sign in, set payments, open Founders
    admin_ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    admin = admin_ctx.new_page(); watch(admin, 'admin')
    admin.goto(f'{BASE}/admin'); settle(admin)
    admin.wait_for_url(re.compile(r'/admin/login'))
    admin.fill('input[name=email]', ADMIN[0]); admin.fill('input[name=password]', 'wrong-password')
    admin.click('[data-login] button'); admin.wait_for_selector('[data-err]:has-text("Wrong email or password")')
    ok('wrong password rejected')
    admin.fill('input[name=password]', ADMIN[1]); admin.click('[data-login] button')
    admin.wait_for_selector('.page-head h1:has-text("The Replay")')
    ok('admin signed in, dashboard loaded')
    admin.screenshot(path=f'{OUT}/admin-dashboard-empty.png', full_page=True)
    admin.click('a[href="/admin/settings"]'); admin.wait_for_selector('[data-sec=payments]')
    admin.fill('[data-sec=payments] input[name=mtnMerchantCode]', '123456')
    admin.fill('[data-sec=payments] input[name=mtnMerchantName]', 'SOCIAL SPOT')
    admin.click('[data-sec=payments] button[type=submit]'); admin.wait_for_selector('.toast:has-text("Saved")')
    admin.select_option('[data-sec=sales] select[name=forceRelease]', 'founders')
    admin.click('[data-sec=sales] button[type=submit]'); admin.wait_for_selector('.toast:has-text("Saved")')
    ok('merchant code saved and Founders opened early')

    # ------------------------------------------------ customer (phone): home, The Replay, buy 2 GA
    phone_ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m = phone_ctx.new_page(); watch(m, 'phone')
    m.goto(BASE); settle(m)
    m.wait_for_selector('.hero h1:has-text("Everything worth leaving the house for.")')
    m.screenshot(path=f'{OUT}/m-home.png', full_page=True)
    sw = m.evaluate('document.documentElement.scrollWidth'); assert sw <= 390, f'horizontal overflow on home: {sw}'
    ok('phone home renders without sideways scroll')
    m.click('.feature-ticket'); m.wait_for_selector('.replay-hero .display')
    m.wait_for_selector('.rel.now:has-text("Founders")')
    m.screenshot(path=f'{OUT}/m-replay.png', full_page=True)
    sw = m.evaluate('document.documentElement.scrollWidth'); assert sw <= 390, f'horizontal overflow on replay: {sw}'
    m.click('[data-ga] [data-step="1"]')
    expect(m.locator('[data-ga] [data-total]')).to_have_text('UGX 70,000')
    m.click('[data-ga] button[type=submit]'); m.wait_for_selector('[data-checkout]')
    m.fill('[data-checkout] input[name=name]', 'Grace Namata'); m.fill('[data-checkout] input[name=phone]', '0772 123 456')
    m.select_option('[data-checkout] select[name=source]', 'Instagram'); m.fill('[data-checkout] input[name=song]', 'Bomboclat by Jose Chameleone')
    m.click('[data-checkout] button[type=submit]'); m.wait_for_selector('[data-checkout] [data-err]:has-text("18 or older")')
    ok('checkout blocks without age/terms confirmation')
    m.check('[data-checkout] input[name=adult]'); m.check('[data-checkout] input[name=terms]'); m.check('[data-checkout] input[name=marketing]')
    m.click('[data-checkout] button[type=submit]'); m.wait_for_selector('h1:has-text("Complete your payment")')
    order_url = m.url
    ref = m.locator('aside h2.h4').inner_text().replace('Order ', '').strip()
    m.wait_for_selector('.merchant:has-text("123456")')
    m.screenshot(path=f'{OUT}/m-order-pending.png', full_page=True)
    ok(f'order {ref} created; payment panel shows merchant code and hold timer')
    m.fill('[data-pay] input[name=txnId]', 'MP261005.1234.A56789')
    m.click('[data-pay] button[type=submit]'); m.wait_for_selector('h1:has-text("Payment sent for confirmation")')
    ok('transaction ID submitted; order awaiting confirmation')

    # ------------------------------------------------ admin confirms
    admin.goto(f'{BASE}/admin/payments'); admin.wait_for_selector(f'.qcard:has-text("{ref}")')
    admin.screenshot(path=f'{OUT}/admin-payments.png', full_page=True)
    admin.click(f'.qcard:has-text("{ref}") [data-verify]'); admin.wait_for_selector('.toast:has-text("confirmed")')
    ok('admin confirmed the payment')

    # ------------------------------------------------ customer sees QR tickets (auto refresh or reload)
    m.goto(order_url); m.wait_for_selector('h1:has-text("You’re in.")')
    m.wait_for_selector('.stub [data-qr] svg')
    codes = [c.inner_text() for c in m.locator('.stub .code').all()]
    assert len(codes) == 2 and all(re.match(r'^SS-[A-Z0-9]{4}-[A-Z0-9]{4}$', c) for c in codes), codes
    m.screenshot(path=f'{OUT}/m-order-paid.png', full_page=True)
    ok(f'2 QR tickets issued: {codes}')
    # rename guest 2 -> new code
    m.locator('[data-rename]').nth(1).click()
    m.fill('.dialog input[name=name]', 'Peter Okello'); m.click('.dialog button[type=submit]')
    m.wait_for_selector('.stub:has-text("Peter Okello")')
    new_code = m.locator('.stub:has-text("Peter Okello") .code').inner_text()
    assert new_code != codes[1]
    ok('guest renamed; ticket re-issued with a new code')

    # ------------------------------------------------ door scanning
    door = admin
    door.goto(f'{BASE}/admin/door'); door.wait_for_selector('[data-manual]')
    door.fill('[data-manual] input[name=code]', codes[0].lower().replace('-', ' '))
    door.click('[data-manual] button'); door.wait_for_selector('.result.admitted:has-text("Grace Namata")')
    ok('scan 1: admitted')
    door.fill('[data-manual] input[name=code]', codes[0]); door.click('[data-manual] button')
    door.wait_for_selector('.result.deny:has-text("Already in")')
    ok('scan 2 of same code: blocked as duplicate')
    door.fill('[data-manual] input[name=code]', codes[1]); door.click('[data-manual] button')
    door.wait_for_selector('.result.deny:has-text("Old code")')
    ok('old code after rename: blocked')
    door.screenshot(path=f'{OUT}/admin-door.png', full_page=True)

    # ------------------------------------------------ table: VIP V2 with deposit
    m.goto(f'{BASE}/replay#tickets'); m.wait_for_selector('[data-tier=vip]')
    m.click('[data-tier=vip] [data-table=V2]')
    m.click('[data-tier=vip] button[type=submit]'); m.wait_for_selector('[data-checkout]')
    m.fill('[data-checkout] input[name=name]', 'Brian Kato'); m.fill('[data-checkout] input[name=phone]', '0701 555 222')
    m.check('[data-checkout] input[name=adult]'); m.check('[data-checkout] input[name=terms]')
    m.click('[data-checkout] button[type=submit]'); m.wait_for_selector('h1:has-text("Complete your payment")')
    table_url = m.url
    tref = m.locator('aside h2.h4').inner_text().replace('Order ', '').strip()
    expect(m.locator('#pay-h')).to_have_text('UGX 325,000')
    m.fill('[data-pay] input[name=txnId]', 'MP261005.9999.B11111'); m.click('[data-pay] button[type=submit]')
    m.wait_for_selector('h1:has-text("Payment sent for confirmation")')
    admin.goto(f'{BASE}/admin/payments'); admin.click(f'.qcard:has-text("{tref}") [data-verify]'); admin.wait_for_selector('.toast:has-text("confirmed")')
    m.goto(table_url); m.wait_for_selector('h1:has-text("Your table is held")')
    m.wait_for_selector('[data-guests]')
    m.fill('[data-guests] input[name^="n_"] >> nth=1', 'Sarah Achieng')
    m.click('[data-guests] button[type=submit]'); m.wait_for_selector('.toast:has-text("Guest names saved")')
    m.screenshot(path=f'{OUT}/m-table-deposit.png', full_page=True)
    ok(f'table V2 ({tref}) deposit confirmed; guest named')
    admin.goto(f'{BASE}/admin/tables'); admin.wait_for_selector('.tcell.deposit_paid:has-text("V2")')
    admin.screenshot(path=f'{OUT}/admin-tables.png', full_page=True)
    ok('tables board shows V2 on deposit')

    # ------------------------------------------------ bookings: turf + quiz + penthouse
    m.goto(f'{BASE}/book/turf'); m.wait_for_selector('[data-slots] .slot')
    m.locator('[data-date]').nth(1).click(); m.wait_for_timeout(300)
    m.click('[data-slot="09:00"]'); m.click('[data-slot="10:00"]')
    expect(m.locator('[data-summary]')).to_contain_text('UGX 100,000')
    m.fill('[data-book] input[name=team]', 'Akright FC'); m.fill('[data-book] input[name=name]', 'Ivan Mugisha'); m.fill('[data-book] input[name=phone]', '0753 000 111')
    m.click('[data-book] button[type=submit]'); m.wait_for_selector('h1:has-text("You’re booked")')
    bcode = m.locator('.big-code').inner_text()
    m.screenshot(path=f'{OUT}/m-booking-turf.png', full_page=True)
    ok(f'turf booked ({bcode}) for 2 hours at UGX 100,000')
    m.goto(f'{BASE}/book/turf'); m.wait_for_selector('[data-slots] .slot'); m.locator('[data-date]').nth(1).click(); m.wait_for_timeout(300)
    assert m.locator('[data-slot="09:00"]').is_disabled(), 'booked slot should be disabled'
    ok('booked hours are no longer selectable')
    m.goto(f'{BASE}/quiz'); m.wait_for_selector('[data-book]')
    m.fill('[data-book] input[name=team]', 'The Quizzards'); m.fill('[data-book] input[name=name]', 'Ruth Nakato'); m.fill('[data-book] input[name=phone]', '0782 333 444')
    m.click('[data-book] button[type=submit]'); m.wait_for_selector('h1:has-text("You’re booked")')
    ok('Quiz Night team registered')
    m.goto(f'{BASE}/book/penthouse'); m.wait_for_selector('[data-book]')
    m.fill('[data-book] input[name=name]', 'Diana Auma'); m.fill('[data-book] input[name=phone]', '0772 999 000')
    m.click('[data-book] button[type=submit]'); m.wait_for_selector('h1:has-text("Request received")')
    ok('penthouse stay requested')

    # ------------------------------------------------ find my ticket
    m.goto(f'{BASE}/tickets'); m.fill('[data-find] input[name=phone]', '+256772123456'); m.fill('[data-find] input[name=code]', ref)
    m.click('[data-find] button'); m.wait_for_selector('h1:has-text("You’re in.")')
    ok('find my ticket by phone + reference')

    # ------------------------------------------------ admin views with data
    for path, sel, name in [('/admin', '.kpis', 'admin-dashboard'), ('/admin/bookings?range=all&status=', 'table.tbl', 'admin-bookings'), ('/admin/customers', 'table.tbl', 'admin-customers'), ('/admin/messages', 'table.tbl', 'admin-messages'), (f'/admin/orders', 'table.tbl', 'admin-orders')]:
        admin.goto(f'{BASE}{path}'); admin.wait_for_selector(sel); admin.screenshot(path=f'{OUT}/{name}.png', full_page=True)
    ok('dashboard, bookings, customers, messages and orders pages render with data')
    admin.goto(f'{BASE}/admin/bookings?range=all&status=requested'); admin.wait_for_selector('tr:has-text("Diana Auma")')
    admin.click('tr:has-text("Diana Auma") [data-status=confirmed]'); admin.wait_for_selector('.toast:has-text("Confirmed")')
    ok('penthouse request confirmed by admin')

    # desktop public pages for visual check
    d_ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    d = d_ctx.new_page(); watch(d, 'desktop')
    d.goto(BASE); settle(d); d.screenshot(path=f'{OUT}/d-home.png', full_page=True)
    d.goto(f'{BASE}/replay'); d.wait_for_selector('.replay-hero'); d.screenshot(path=f'{OUT}/d-replay.png', full_page=True)
    d.goto(order_url); d.wait_for_selector('.stub'); d.wait_for_selector('.stub [data-qr] svg'); d.screenshot(path=f'{OUT}/d-order.png', full_page=True)
    d.goto(f'{BASE}/book'); d.wait_for_selector('.amenity'); d.screenshot(path=f'{OUT}/d-book.png', full_page=True)
    ok('desktop pages captured')

    browser.close()

print('\nRESULTS:', len(results), 'checks passed')
if errors:
    print('ERRORS:')
    for e in errors: print('  ', e)
    sys.exit(1)
print('no console errors')
