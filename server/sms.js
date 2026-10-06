// SMS delivery through Africa's Talking (https://africastalking.com).
// Set AT_USERNAME and AT_API_KEY (and optionally AT_SENDER_ID, AT_SANDBOX=1).
// Without them every message stays in Admin → Messages for staff to send by WhatsApp.

export function createSms({ store, env = process.env, log = console }) {
  const username = env.AT_USERNAME || '';
  const apiKey = env.AT_API_KEY || '';
  const from = env.AT_SENDER_ID || '';
  const base = env.AT_BASE_URL || (env.AT_SANDBOX === '1' ? 'https://api.sandbox.africastalking.com' : 'https://api.africastalking.com');
  const enabled = !!(username && apiKey);
  let running = false;
  let again = false;

  async function sendOne(msg) {
    const body = new URLSearchParams({ username, to: msg.to, message: msg.body });
    if (from) body.set('from', from);
    const res = await fetch(`${base}/version1/messaging`, {
      method: 'POST',
      headers: { apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    const r = json && json.SMSMessageData && json.SMSMessageData.Recipients && json.SMSMessageData.Recipients[0];
    if (res.ok && r && (r.status === 'Success' || r.statusCode === 101 || r.statusCode === 102)) return { ok: true, id: r.messageId || '', cost: r.cost || '' };
    return { ok: false, error: (r && r.status) || (json && json.SMSMessageData && json.SMSMessageData.Message) || `HTTP ${res.status}` };
  }

  async function run() {
    if (!enabled) return;
    if (running) { again = true; return; }
    running = true;
    try {
      do {
        again = false;
        const queue = store.all('outbox').filter((m) => m.status === 'queued' || (m.status === 'failed' && (m.attempts || 0) < 3 && Date.now() - (m.lastAttemptAt || 0) > 60000));
        for (const m of queue.sort((a, b) => a.createdAt - b.createdAt)) {
          let r;
          try { r = await sendOne(m); } catch (e) { r = { ok: false, error: e.message }; }
          const cur = store.get('outbox', m.id) || m;
          await store.put('outbox', { ...cur, status: r.ok ? 'sent' : 'failed', attempts: (cur.attempts || 0) + 1, lastAttemptAt: Date.now(), sentAt: r.ok ? Date.now() : null, providerId: r.id || '', cost: r.cost || '', error: r.ok ? '' : r.error, channel: 'sms' });
          if (!r.ok) log.warn(`[sms] ${m.id} to ${m.to}: ${r.error}`);
        }
      } while (again);
    } finally {
      running = false;
    }
  }

  let timer = null;
  function start() {
    if (!enabled || timer) return;
    timer = setInterval(() => run().catch((e) => log.error('[sms]', e)), 60000);
    timer.unref?.();
    run().catch((e) => log.error('[sms]', e));
  }

  return { enabled, kick: () => run().catch((e) => log.error('[sms]', e)), start, sendOne };
}
