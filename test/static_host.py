"""GitHub Pages scenario: website files on a static host under /social-spot/,
the Social Spot server elsewhere (cross-origin), plus the no-server fallback.
Needs: the server on :3100 with the e2e test's data (Founders open, merchant code set),
and two emulators:
  node test/pages-emulator.mjs 3300 social-spot http://localhost:3100
  node test/pages-emulator.mjs 3301 social-spot
Run:  python3 test/static_host.py OUT_DIR
"""
import sys, re, os
from playwright.sync_api import sync_playwright, expect

OUT = sys.argv[1] if len(sys.argv) > 1 else 'shots'
os.makedirs(OUT, exist_ok=True)
PAGES = 'http://localhost:3300/social-spot'
BARE = 'http://localhost:3301/social-spot'
errors = []
EXPECTED = ['status of 404', 'status of 405', 'status of 401']  # 404.html deep links, no-API probes, wrong password

def watch(page, tag):
    page.on('console', lambda m: errors.append(f'[{tag}] {m.text}') if m.type == 'error' and not any(x in m.text for x in EXPECTED) else None)
    page.on('pageerror', lambda e: errors.append(f'[{tag}] pageerror {e}'))
def ok(m): print('  ✓', m)
def settle(p):
    p.wait_for_selector('#app .view', timeout=15000)
    p.wait_for_selector('.preloader', state='detached', timeout=15000)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    m = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2).new_page(); watch(m, 'phone')
    m.goto(f'{PAGES}/'); settle(m)
    assert m.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth > 0).length") >= 1, 'logo images load under /social-spot/'
    assert m.evaluate('getComputedStyle(document.body).fontFamily').startswith('Manrope'), 'stylesheet loaded'
    assert m.locator('a.feature-ticket').get_attribute('href') == '/social-spot/replay', 'links point inside the repo folder'
    ok('home on GitHub Pages path /social-spot/: styles, logo and links resolve')

    m.goto(f'{PAGES}/replay'); settle(m)   # deep link served through 404.html
    m.wait_for_selector('[data-ga]')
    ok('deep link /social-spot/replay works through 404.html')
    m.click('[data-ga] button[type=submit]'); m.wait_for_selector('[data-checkout]')
    m.fill('[data-checkout] input[name=name]', 'Pages Buyer'); m.fill('[data-checkout] input[name=phone]', '0772 555 010')
    m.check('[data-checkout] input[name=adult]'); m.check('[data-checkout] input[name=terms]')
    m.click('[data-checkout] button[type=submit]'); m.wait_for_selector('h1:has-text("Complete your payment")')
    assert re.search(r'/social-spot/t/[a-z0-9]+$', m.url), m.url
    order_url = m.url
    ref = m.locator('aside h2.h4').inner_text().replace('Order ', '').strip()
    m.reload(); settle(m); m.wait_for_selector('h1:has-text("Complete your payment")')
    m.fill('[data-pay] input[name=txnId]', 'PAGES.TXN.0001'); m.click('[data-pay] button[type=submit]')
    m.wait_for_selector('h1:has-text("Payment sent for confirmation")')
    ok(f'order {ref} placed cross-origin; order page survives a reload')

    a = b.new_context(viewport={'width': 1280, 'height': 900}).new_page(); watch(a, 'admin')
    a.goto(f'{PAGES}/admin'); a.wait_for_selector('[data-login]')
    a.fill('input[name=email]', 'admin@socialspot.test'); a.fill('input[name=password]', 'TestPass123'); a.click('[data-login] button')
    a.wait_for_selector('.page-head h1')
    assert a.url.endswith('/social-spot/admin'), a.url
    a.goto(f'{PAGES}/admin/payments'); a.wait_for_selector(f'.qcard:has-text("{ref}")')
    a.click(f'.qcard:has-text("{ref}") [data-verify]'); a.wait_for_selector('.toast:has-text("confirmed")')
    ok('staff login with a token across domains; payment confirmed; session survives page loads')

    m.goto(order_url); settle(m); m.wait_for_selector('h1:has-text("You’re in.")'); m.wait_for_selector('.stub [data-qr] svg')
    link = m.locator('[data-copy*="/p/"]').first.get_attribute('data-copy')
    assert link.startswith(f'{PAGES}/p/'), link
    code = m.locator('.stub .code').first.inner_text()
    m.goto(link); settle(m); m.wait_for_selector('.stub [data-qr] svg')
    ok(f'QR ticket live; shared link {link.replace(PAGES, "…")} opens the single ticket')

    a.goto(f'{PAGES}/admin/door'); a.wait_for_selector('[data-manual]')
    a.fill('[data-manual] input', code); a.click('[data-manual] button'); a.wait_for_selector('.result.admitted')
    ok(f'door scan from the Pages site: {code} admitted')
    m.screenshot(path=f'{OUT}/pages-ticket.png', full_page=True)

    # ---------------- no server configured: brochure mode
    v = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True).new_page(); watch(v, 'bare')
    v.goto(f'{BARE}/'); settle(v)
    v.wait_for_selector('.preview-bar:has-text("aren’t available right now")')
    v.wait_for_selector('.hero h1')
    v.goto(f'{BARE}/book/turf'); settle(v); v.wait_for_selector('[data-slots] .slot')
    v.click('[data-slot="21:00"]') if v.locator('[data-slot="21:00"]:not([disabled])').count() else v.locator('[data-slots] .slot:not([disabled])').first.click()
    v.fill('[data-book] input[name=name]', 'Walk In'); v.fill('[data-book] input[name=phone]', '0772 000 999')
    v.click('[data-book] button[type=submit]'); v.wait_for_selector('[data-book] [data-err]:has-text("Call 0393 103 799")')
    v.screenshot(path=f'{OUT}/pages-brochure.png', full_page=False)
    v.goto(f'{BARE}/admin'); settle(v); v.wait_for_selector('h1:has-text("Connect the ticket server")')
    ok('without a server: full site with a “call us” notice, bookings ask to call, staff see setup steps')
    b.close()

print('ERRORS:' if errors else 'no console errors', *errors, sep='\n  ')
sys.exit(1 if errors else 0)
