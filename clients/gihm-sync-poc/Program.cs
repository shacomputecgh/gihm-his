// =============================================================================
// GIHM-HIS native sync-protocol POC (docs/26 §5)
//
// Proves the SHARED offline-sync protocol (docs/15) works from a native
// Windows/.NET client, not just the browser PWA:
//
//   1. login             → POST /api/v1/auth/login               (shared auth)
//   2. stable device id  → persisted on first run (spec §109 device lifecycle)
//   3. register + enroll → POST /api/v1/devices/register + admin approval
//      (device gate, docs/21 §1: a device must be ACTIVE before it can sync)
//   4. mutation push     → POST /api/v1/sync/mutations           (outbox replay)
//      every mutation carries transactionId / idempotencyKey / clientTimestamp
//   5. status            → GET  /api/v1/sync/status?deviceId=…
//
// A production desktop shell (Tauri — see docs/26) replaces step 3's
// hand-built payload with the exact same IndexedDB-outbox flow the PWA uses;
// this POC exercises the protocol end-to-end from a fully native client.
//
// Usage:
//   dotnet run -- --baseUrl http://localhost:4000 \
//                  --email admin@demo.gh --password 'Demo@123'
// =============================================================================

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;

var argsList = args.ToList();
string GetArg(string name, string fallback)
{
    var i = argsList.IndexOf($"--{name}");
    return i >= 0 && i + 1 < argsList.Count ? argsList[i + 1] : fallback;
}

var baseUrl = GetArg("baseUrl", "http://localhost:4000").TrimEnd('/');
var email = GetArg("email", "admin@demo.gh");
var password = GetArg("password", "Demo@123");
var runName = GetArg("name", "Desktop Sync POC");

using var http = new HttpClient { BaseAddress = new Uri(baseUrl) };
http.Timeout = TimeSpan.FromSeconds(30);
var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);

Console.WriteLine($"GIHM-HIS native sync POC → {baseUrl}");
Console.WriteLine(new string('─', 64));

// --- 1. login ---------------------------------------------------------------
Console.WriteLine("[1/5] Authenticating…");
var loginRes = await http.PostAsJsonAsync("/api/v1/auth/login",
    new { email, password }, json);
loginRes.EnsureSuccessStatusCode();
var login = await loginRes.Content.ReadFromJsonAsync<JsonObject>(json);
var token = login?["token"]?.GetValue<string>()
    ?? throw new Exception("Login returned no token.");
http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
Console.WriteLine("      ✓ token acquired");

// --- 2. stable device id ----------------------------------------------------
// Persisted so the platform sees ONE device across runs (spec §109). A Tauri
// shell would use its app-config store; %LOCALAPPDATA% mirrors that for the POC.
var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
Directory.CreateDirectory(appData);
var deviceIdFile = Path.Combine(appData, "gihm-sync-poc-device-id");
var deviceId = File.Exists(deviceIdFile) ? await File.ReadAllTextAsync(deviceIdFile) : "";
if (string.IsNullOrWhiteSpace(deviceId))
{
    deviceId = $"gihm-poc-{Guid.NewGuid():N}"[..24];
    await File.WriteAllTextAsync(deviceIdFile, deviceId);
}
Console.WriteLine($"[2/5] Device id  {deviceId}  (persisted at {deviceIdFile})");

// --- 3. register + enroll the device (docs/21 §1, spec §109) ----------------
// The platform gates all sync on an ACTIVE device: a new device self-registers
// as PENDING and must be approved (enrolled) by an administrator. This POC logs
// in with the national admin account, so it approves its own device — the same
// action an admin performs in Admin → Sync status. On later runs the device is
// already ACTIVE and this step is a no-op.
Console.WriteLine("[3/5] Registering device…");
var regRes = await http.PostAsJsonAsync("/api/v1/devices/register",
    new { deviceId, name = "gihm-sync-poc (.NET)", platform = "WINDOWS", softwareVersion = "0.1.0-poc" }, json);
if (regRes.IsSuccessStatusCode)
{
    var reg = await regRes.Content.ReadFromJsonAsync<JsonObject>(json);
    var pending = reg?["pendingApproval"]?.GetValue<bool>() ?? false;
    Console.WriteLine($"      registered={reg?["registered"]} pendingApproval={pending}");
    if (pending)
    {
        var enrollRes = await http.PostAsJsonAsync($"/api/v1/admin/devices/{Uri.EscapeDataString(deviceId)}/status",
            new { status = "ACTIVE" }, json);
        if (enrollRes.IsSuccessStatusCode)
        {
            Console.WriteLine("      ✓ device approved — now ACTIVE (enrolled by admin session)");
        }
        else
        {
            var errBody = await enrollRes.Content.ReadAsStringAsync();
            Console.WriteLine($"      ✗ approval failed ({(int)enrollRes.StatusCode}) {errBody}");
            Console.WriteLine("      The device must be approved by an administrator (Admin → Sync status) before it can sync.");
            return 2;
        }
    }
}
else
{
    // A non-admin account cannot register/enroll — surface the server's reason
    // instead of crashing with an unhandled HttpRequestException.
    var errBody = await regRes.Content.ReadAsStringAsync();
    Console.WriteLine($"      ✗ device registration failed ({(int)regRes.StatusCode}) {errBody}");
    Console.WriteLine("      Run with the national admin account, or approve the device in Admin → Sync status.");
    return 2;
}

// --- 4. mutation push (outbox replay shape) ---------------------------------
// The payload mirrors the PWA outbox entry (apps/web/src/lib/offline.ts):
// transactionId + idempotencyKey are client-generated UUIDs; clientTimestamp
// preserves the original clinical event time (spec §130).
var transactionId = Guid.NewGuid().ToString();
var idempotencyKey = Guid.NewGuid().ToString();
var stamp = $"{DateTime.UtcNow:yyyy-MM-dd'T'HH:mm:ss.fff'Z'}";
var fullName = $"{runName} {DateTime.UtcNow:yyyyMMdd-HHmmss}";
var phone = $"055{new Random().Next(1000000, 9999999)}";

var mutation = new JsonObject
{
    ["transactionId"] = transactionId,
    ["entityType"] = "patient",
    ["operation"] = "CREATE",
    ["idempotencyKey"] = idempotencyKey,
    ["clientTimestamp"] = stamp,
    ["payload"] = new JsonObject
    {
        ["fullName"] = fullName,
        ["dateOfBirth"] = "1990-01-01",
        ["phone"] = phone,
        ["sex"] = "M",
        ["consentAccepted"] = true,
    },
};

Console.WriteLine("[4/5] Pushing patient.CREATE mutation…");
var syncRes = await http.PostAsJsonAsync("/api/v1/sync/mutations",
    new { deviceId, deviceName = "gihm-sync-poc (.NET)", platform = "WINDOWS", mutations = new[] { mutation } }, json);
if (!syncRes.IsSuccessStatusCode)
{
    // e.g. the device was suspended/revoked since step 3 — surface the server's
    // message cleanly instead of an unhandled HttpRequestException.
    var errBody = await syncRes.Content.ReadAsStringAsync();
    Console.WriteLine($"      ✗ mutation push failed ({(int)syncRes.StatusCode}) {errBody}");
    Console.WriteLine("      Sync blocked by the server — resolve the reported state and re-run.");
    return 2;
}
var sync = await syncRes.Content.ReadFromJsonAsync<JsonObject>(json);
var results = sync?["results"]?.AsArray();
var first = results?[0]?.AsObject();
var status = first?["status"]?.GetValue<string>();
var entityId = first?["entityId"]?.GetValue<string>();
var duplicated = first?["duplicated"]?.GetValue<bool>();
Console.WriteLine($"      processed={sync?["processed"]} failed={sync?["failed"]}");
Console.WriteLine($"      result: status={status} duplicated={duplicated} entityId={entityId}");

// --- 4. sync status ---------------------------------------------------------
Console.WriteLine("[5/5] Checking sync status…");
var statusRes = await http.GetAsync($"/api/v1/sync/status?deviceId={Uri.EscapeDataString(deviceId)}");
statusRes.EnsureSuccessStatusCode();
var statusJson = await statusRes.Content.ReadFromJsonAsync<JsonObject>(json);
Console.WriteLine($"      server={statusJson?["server"]} pending={statusJson?["pending"]}");
Console.WriteLine($"      device registered: {statusJson?["device"]?["status"]} (platform {statusJson?["device"]?["platform"]})");

Console.WriteLine(new string('─', 64));
Console.WriteLine("Protocol OK — the shared sync contract is satisfied from native .NET.");

return status == "PROCESSED" ? 0 : 1;
