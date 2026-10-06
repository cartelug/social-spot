"""Runs the single-file preview (build/preview.html) in Chromium with a stand-in for the
artifact runtime (db, user, downloads), then walks the main flow end to end."""
import sys, re, os
from playwright.sync_api import sync_playwright, expect

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else 'shots'
os.makedirs(OUT, exist_ok=True)
page_html = open(os.path.join(ROOT, 'build', 'preview.html'), encoding='utf-8').read()
MOCK = r"""
<script>
(() => {
  const store = {}; const listeners = {};
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const snap = (col) => { const docs = Object.entries(store[col] || {}).map(([id, data]) => ({ id, exists: true, data: () => Object.freeze(clone(data)), metadata: { fromCache: false, hasPendingWrites: false } })); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }; };
  const notify = (col) => (listeners[col] || []).forEach((fn) => setTimeout(() => fn(snap(col)), 0));
  const db = { collection(col) { return {
    doc(id) { return {
      async set(data) { (store[col] ||= {})[id] = clone(data); notify(col); },
      async delete() { if (store[col]) delete store[col][id]; notify(col); },
      async get() { const d = (store[col] || {})[id]; return { id, exists: !!d, data: () => d && clone(d) }; },
    }; },
    onSnapshot(next) { (listeners[col] ||= []).push(next); setTimeout(() => next(snap(col)), 5); return () => {}; },
  }; } };
  window.__saved = [];
  window.claude = { use: async (name) => name === 'db' ? db : name === 'user' ? { isOwner: async () => true, can: async () => true } : name === 'downloads' ? { save: async (r) => { window.__saved.push(r.filename); return { status: 'saved' }; } } : null };
})();
</script>
"""
doc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + MOCK + page_html + '</body></html>'
errors = []
def ok(m): print('  ✓', m)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    # serve the CDN libraries from node_modules (the sandbox has no CDN access)
    def cdn(route):
        url = route.request.url
        if 'qrcode-generator' in url: return route.fulfill(path=os.path.join(ROOT, 'node_modules/qrcode-generator/qrcode.js'), content_type='text/javascript')
        if 'jsqr' in url: return route.fulfill(path=os.path.join(ROOT, 'node_modules/jsqr/dist/jsQR.js'), content_type='text/javascript')
        return route.abort()
    ctx.route(re.compile(r'https://(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)/.*'), cdn)
    p = ctx.new_page()
    p.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'net::ERR' not in m.text else None)
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.set_content(doc)
    p.wait_for_selector('.preloader', timeout=5000)
    p.screenshot(path=f'{OUT}/pv-preloader.png')
    p.wait_for_selector('.preloader', state='detached', timeout=15000)
    p.wait_for_selector('.hero h1')
    assert p.locator('.preview-bar').count() == 1
    ok('preview boots: preloader, then home with preview bar')
    p.screenshot(path=f'{OUT}/pv-home.png')

    # admin: set merchant code, open Founders
    p.click('.preview-bar a[href="/admin"]'); p.wait_for_selector('.page-head h1')
    p.click('[data-menu]'); p.click('.sheet a[href="/admin/settings"]'); p.wait_for_selector('[data-sec=payments]')
    p.fill('[data-sec=payments] input[name=mtnMerchantCode]', '654321'); p.click('[data-sec=payments] button[type=submit]'); p.wait_for_selector('.toast:has-text("Saved")')
    p.select_option('[data-sec=sales] select[name=forceRelease]', 'founders'); p.click('[data-sec=sales] button[type=submit]'); p.wait_for_selector('.toast:has-text("Saved")')
    ok('owner is admin: settings saved to the artifact database')

    # customer flow
    p.click('a[href="/"]'); p.wait_for_selector('.hero h1')
    p.click('.feature-ticket'); p.wait_for_selector('[data-ga]')
    p.click('[data-ga] button[type=submit]'); p.wait_for_selector('[data-checkout]')
    p.fill('[data-checkout] input[name=name]', 'Test Buyer'); p.fill('[data-checkout] input[name=phone]', '0772000111')
    p.check('[data-checkout] input[name=adult]'); p.check('[data-checkout] input[name=terms]')
    p.click('[data-checkout] button[type=submit]'); p.wait_for_selector('h1:has-text("Complete your payment")')
    ref = p.locator('aside h2.h4').inner_text().replace('Order ', '').strip()
    p.fill('[data-pay] input[name=txnId]', 'PREVIEW12345'); p.click('[data-pay] button[type=submit]')
    p.wait_for_selector('h1:has-text("Payment sent for confirmation")')
    ok(f'order {ref} placed and paid in the preview')

    p.click('[data-menu]'); p.click('.sheet a[href="/tickets"]'); p.wait_for_selector('[data-find]')
    p.goto('about:blank')  # simulate a reload: data must survive in the store?  (mock store lives in page memory, so re-open from scratch is not meaningful here)
    b.close()

    # second run in a fresh page to walk admin verify + scan in one session
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    ctx.route(re.compile(r'https://(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)/.*'), cdn)
    p = ctx.new_page()
    p.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'net::ERR' not in m.text else None)
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.set_content(doc)
    p.wait_for_selector('.preloader', state='detached', timeout=15000); p.wait_for_selector('.hero h1')
    p.click('.preview-bar a[href="/admin"]'); p.wait_for_selector('.side a[href="/admin/settings"]')
    p.click('.side a[href="/admin/settings"]'); p.wait_for_selector('[data-sec=sales]')
    p.select_option('[data-sec=sales] select[name=forceRelease]', 'founders'); p.click('[data-sec=sales] button[type=submit]'); p.wait_for_selector('.toast:has-text("Saved")')
    p.click('.admin-top a[href="/"]'); p.wait_for_selector('.hero h1')
    p.click('a.btn.lg[href="/replay"]'); p.wait_for_selector('[data-ga]')
    p.click('[data-ga] [data-step="1"]'); p.click('[data-ga] button[type=submit]'); p.wait_for_selector('[data-checkout]')
    p.fill('[data-checkout] input[name=name]', 'Amina Test'); p.fill('[data-checkout] input[name=phone]', '0701000222')
    p.check('[data-checkout] input[name=adult]'); p.check('[data-checkout] input[name=terms]')
    p.click('[data-checkout] button[type=submit]'); p.wait_for_selector('h1:has-text("Complete your payment")')
    p.wait_for_selector('.notice.warn:has-text("Merchant codes aren’t published yet")')
    p.fill('[data-pay] input[name=txnId]', 'PREVIEW99999'); p.click('[data-pay] button[type=submit]'); p.wait_for_selector('h1:has-text("Payment sent for confirmation")')
    p.click('.preview-bar a[href="/admin"]'); p.wait_for_selector('.side a[href="/admin/payments"]')
    p.click('.side a[href="/admin/payments"]'); p.wait_for_selector('.qcard [data-verify]'); p.click('.qcard [data-verify]'); p.wait_for_selector('.toast:has-text("confirmed")')
    ok('owner confirmed the payment in the preview admin')
    p.click('.side a[href="/admin/orders"]'); p.wait_for_selector('table.tbl a.mono'); p.click('table.tbl a.mono')
    p.wait_for_selector('h2:has-text("Passes")')
    code = p.locator('td.mono', has_text='SS-').first.inner_text().split('\n')[0].strip()
    p.click('.side a[href="/admin/door"]'); p.wait_for_selector('[data-manual]')
    assert p.locator('[data-photo]').count() == 1, 'photo scanning offered in the preview'
    p.fill('[data-manual] input', code); p.click('[data-manual] button'); p.wait_for_selector('.result.admitted')
    p.fill('[data-manual] input', code); p.click('[data-manual] button'); p.wait_for_selector('.result.deny:has-text("Already in")')
    ok(f'door scan in the preview: {code} admitted, then blocked')
    p.click('.side a[href="/admin/orders"]'); p.wait_for_selector('[data-export=orders]'); p.click('[data-export=orders]'); p.wait_for_timeout(400)
    saved = p.evaluate('window.__saved')
    assert saved and saved[0].startswith('replay-orders-'), saved
    ok(f'CSV export goes through the downloads capability: {saved[0]}')
    p.click('.side a[href="/admin"]'); p.wait_for_selector('.kpis'); p.screenshot(path=f'{OUT}/pv-admin.png', full_page=True)
    b.close()

print('ERRORS:' if errors else 'no console errors', *errors, sep='\n  ')
sys.exit(1 if errors else 0)
