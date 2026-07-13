// Standalone uptime monitor — deliberately outside the Next.js app so it
// keeps running (and can still alert) even when the app container is down.
// Runs in its own container (see docker-compose.yml's "healthcheck" service).
//
// Every CHECK_INTERVAL_MS it GETs HEALTH_CHECK_URL. On failure it texts
// everyone in TWILIO_TO_NUMBER (comma-separated) via the Twilio REST API. It
// only sends one "down" SMS per outage (not one every 30 min) and one
// "recovered" SMS when it comes back, to avoid spamming/costing money while
// an outage drags on.

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const REQUEST_TIMEOUT_MS = 10 * 1000;

const {
  HEALTH_CHECK_URL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  TWILIO_TO_NUMBER,
} = process.env;

for (const [name, value] of Object.entries({
  HEALTH_CHECK_URL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  TWILIO_TO_NUMBER,
})) {
  if (!value) {
    console.error(`[health-check-cron] missing required env var ${name}`);
    process.exit(1);
  }
}

const TO_NUMBERS = TWILIO_TO_NUMBER.split(",").map((n) => n.trim()).filter(Boolean);

let isDown = false;

async function sendSms(body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  await Promise.all(
    TO_NUMBERS.map(async (to) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_FROM_NUMBER,
          Body: body,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[health-check-cron] Twilio SMS to ${to} failed (${res.status}): ${text}`);
      } else {
        console.log(`[health-check-cron] SMS alert sent to ${to}`);
      }
    }),
  );
}

async function checkOnce() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(HEALTH_CHECK_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    console.log(`[health-check-cron] ${new Date().toISOString()} app is up`);
    if (isDown) {
      isDown = false;
      await sendSms("Focus Importer is back up.");
    }
  } catch (err) {
    console.error(`[health-check-cron] ${new Date().toISOString()} app is down:`, err.message);
    if (!isDown) {
      isDown = true;
      await sendSms(`Focus Importer appears to be DOWN (${err.message}).`);
    }
  } finally {
    clearTimeout(timer);
  }
}

checkOnce();
setInterval(checkOnce, CHECK_INTERVAL_MS);
