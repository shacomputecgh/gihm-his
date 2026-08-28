import { buildApp } from './app.js';
import { config } from './config.js';
import { getReminderJobConfig, getSetting } from './lib/settings.js';

async function main() {
  const app = await buildApp();
  try {
    // Port is read from settings at boot (editable in the admin UI; restart applies).
    const port = Number(getSetting('app.port') ?? config.port) || config.port;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`GIHM-HIS API listening on http://localhost:${config.port} (docs: /docs)`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Scheduled auto-reminder sweep (spec §22): recalls children due/overdue within
  // the window, deduped by the audit look-back. Without gateway credentials the
  // sweep is a graceful no-op that still audit-logs the attempt. Overlapping runs
  // are skipped so a slow sweep can never double-send. The config is re-read on
  // every run so admin Settings edits apply without a restart.
  if (getReminderJobConfig().enabled) {
    let running = false;
    const run = async (source: string) => {
      if (running) return;
      running = true;
      try {
        const job = getReminderJobConfig();
        const { prisma } = await import('./db.js');
        const { runScheduledReminders } = await import('./modules/immunization/reminders.js');
        const summary = await runScheduledReminders(prisma, {
          windowDays: job.windowDays,
          lookbackDays: job.lookbackDays,
        });
        app.log.info({ summary, source }, 'immunization reminder sweep complete');
      } catch (err) {
        app.log.error(err, 'immunization reminder sweep failed');
      } finally {
        running = false;
      }
    };
    setTimeout(() => void run('boot'), 5_000);
    setInterval(() => void run('interval'), getReminderJobConfig().intervalMs);
  }

  // Security sweep (docs/25): alerts the developer when an activated license is
  // within license.alertDaysBefore days of expiring. Deduped inside the check
  // (at most once per 24h) so a daily run never spams. Runs at boot and daily.
  {
    let running = false;
    const run = async (source: string) => {
      if (running) return;
      running = true;
      try {
        const { prisma } = await import('./db.js');
        const { runLicenseExpiryCheck, runDailyDigest, runAlertRetentionSweep } = await import('./lib/alert.js');
        const expiry = await runLicenseExpiryCheck(prisma);
        if (expiry.alerted) app.log.info({ result: expiry, source }, 'license expiry alert sent');
        const digest = await runDailyDigest(prisma);
        if (digest.published) app.log.info({ result: digest, source }, 'daily security digest published');
        // Retention policy: inbox rows older than alerts.retentionDays age out
        // with the daily sweep (and via the manual prune endpoint).
        const pruned = await runAlertRetentionSweep(prisma);
        if (pruned.deleted > 0) app.log.info({ result: pruned, source }, 'alert retention sweep pruned rows');
      } catch (err) {
        app.log.error(err, 'security sweep failed');
      } finally {
        running = false;
      }
    };
    setTimeout(() => void run('boot'), 15_000);
    setInterval(() => void run('interval'), 24 * 3600 * 1000);
  }

  // Alert delivery retry sweep (docs/25): failed email/SMS dispatches are
  // queued in AlertDelivery and retried with exponential backoff until success
  // or max attempts. Runs far more often than the daily sweep (30 min) so a
  // transient gateway outage never silently loses an alert for a full day.
  {
    let running = false;
    const run = async (source: string) => {
      if (running) return;
      running = true;
      try {
        const { prisma } = await import('./db.js');
        const { runAlertRetrySweep } = await import('./lib/alert.js');
        const result = await runAlertRetrySweep(prisma);
        if (result.retried > 0) app.log.info({ result, source }, 'alert delivery retry sweep complete');
      } catch (err) {
        app.log.error(err, 'alert retry sweep failed');
      } finally {
        running = false;
      }
    };
    setTimeout(() => void run('boot'), 20_000);
    setInterval(() => void run('interval'), 30 * 60 * 1000);
  }

  // Facility edge relay (docs/16 §2, docs/26): when this deployment is a
  // facility edge configured with a national/regional upstream (EDGE_RELAY_URL),
  // bubble the local PROCESSED mutation log up through the same shared
  // /sync/mutations protocol the PWA uses. The cursor persists to disk and the
  // upstream is idempotent, so restarts and crashes never duplicate. Overlapping
  // runs are skipped; a slow upstream never queues a second pass on top.
  if (config.edgeRelay.url) {
    let running = false;
    const run = async (source: string) => {
      if (running) return;
      running = true;
      try {
        const { prisma } = await import('./db.js');
        const { relayOnce } = await import('./modules/edge/relay.js');
        const result = await relayOnce(prisma, config.edgeRelay, app.log);
        if (result.pushed > 0 || result.failed > 0) {
          app.log.info({ result, source }, 'edge relay pass complete');
        }
      } catch (err) {
        app.log.error(err, 'edge relay pass failed');
      } finally {
        running = false;
      }
    };
    setTimeout(() => void run('boot'), 10_000);
    setInterval(() => void run('interval'), config.edgeRelay.intervalMs);
  }

  // National integration delivery sweep (docs/08 §3): pushes queued DHIMS2 /
  // SORMAS / GhiLMIS / HRIMS submissions to the configured upstreams with
  // exponential backoff. Each adapter has an independent queue, so one national
  // system being down never blocks the others (spec §128); unconfigured
  // adapters stay pending.
  {
    let running = false;
    const run = async (source: string) => {
      if (running) return;
      running = true;
      try {
        const { prisma } = await import('./db.js');
        const { deliverPending } = await import('./modules/integrations/engine.js');
        const { dhims2Transport } = await import('./modules/integrations/dhims2.js');
        const { sormasTransport } = await import('./modules/integrations/sormas.js');
        const { ghilmisTransport } = await import('./modules/integrations/ghilmis.js');
        const { hrimsTransport } = await import('./modules/integrations/hrims.js');
        const { nhisTransport } = await import('./modules/integrations/nhis.js');
        const { etrackerTransport } = await import('./modules/integrations/etracker.js');
        const { lhimsTransport } = await import('./modules/integrations/lhim.js');
        const result = await deliverPending(prisma, config.integrations, { dhims2: dhims2Transport, sormas: sormasTransport, ghilmis: ghilmisTransport, hrims: hrimsTransport, nhis: nhisTransport, etracker: etrackerTransport, lhims: lhimsTransport }, app.log);
        if (result.attempted > 0) app.log.info({ result, source }, 'integration delivery sweep complete');
        // Platform event webhooks (docs/22 Phase 7) — the same sweep also
        // delivers due signed webhook POSTs to external subscribers.
        const { deliverDueWebhooks } = await import('./modules/webhooks/engine.js');
        const wh = await deliverDueWebhooks(prisma, {}, app.log);
        if (wh.attempted > 0) app.log.info({ result: wh, source }, 'webhook delivery sweep complete');
      } catch (err) {
        app.log.error(err, 'integration delivery sweep failed');
      } finally {
        running = false;
      }
    };
    setTimeout(() => void run('boot'), 12_000);
    setInterval(() => void run('interval'), config.integrations.sweepIntervalMs);
  }

  // Scheduled-report sweep (spec §149): runs every active subscription whose
  // nextRunAt is due, computing the period's report live and emailing the
  // authorised recipients. Overlapping runs are skipped; without SMTP a run is
  // recorded as skipped (delivery log) rather than failing the process.
  {
    let running = false;
    const run = async (source: string) => {
      if (running) return;
      running = true;
      try {
        const { prisma } = await import('./db.js');
        const { runDueSchedules } = await import('./modules/reports/schedule.js');
        const summary = await runDueSchedules(prisma);
        if (summary.ran > 0) app.log.info({ summary, source }, 'scheduled report sweep complete');
      } catch (err) {
        app.log.error(err, 'scheduled report sweep failed');
      } finally {
        running = false;
      }
    };
    setTimeout(() => void run('boot'), 25_000);
    setInterval(() => void run('interval'), 60 * 1000);
  }

  // Scheduled-report delivery retry sweep (docs/14 §5): failed/skipped report
  // deliveries are retried with exponential backoff until success or
  // reports.retryMaxAttempts (default 4). Mirrors the alert retry sweep — a
  // transient SMTP outage never silently loses a scheduled report. Runs at boot
  // and every 30 minutes (far less often than the due-run sweep).
  {
    let running = false;
    const run = async (source: string) => {
      if (running) return;
      running = true;
      try {
        const { prisma } = await import('./db.js');
        const { runReportRetrySweep } = await import('./modules/reports/schedule.js');
        const result = await runReportRetrySweep(prisma);
        if (result.retried > 0) app.log.info({ result, source }, 'report delivery retry sweep complete');
      } catch (err) {
        app.log.error(err, 'report retry sweep failed');
      } finally {
        running = false;
      }
    };
    setTimeout(() => void run('boot'), 22_000);
    setInterval(() => void run('interval'), 30 * 60 * 1000);
  }
}

void main();
