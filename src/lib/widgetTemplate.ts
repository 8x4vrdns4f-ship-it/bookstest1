// Generates the standalone HTML widget that businesses embed on their site.
// Card details are captured inline via Stripe Elements (SetupIntent, no charge).
// The deposit is only charged if/when the business accepts the request.

export const WIDGET_STYLES = `
  :root{--bw-accent:#5BADE8;--bw-on-accent:#0A0F1A;--bw-bg:#0F1420;--bw-text:#F3F4F6;--bw-font:'Plus Jakarta Sans';--bw-r:10px;--bw-r-card:20px;--bw-muted:color-mix(in srgb,var(--bw-text) 60%,var(--bw-bg));--bw-border:color-mix(in srgb,var(--bw-text) 13%,var(--bw-bg));--bw-border-strong:color-mix(in srgb,var(--bw-text) 22%,var(--bw-bg));--bw-hover:color-mix(in srgb,var(--bw-text) 6%,var(--bw-bg));--bw-input:color-mix(in srgb,var(--bw-text) 4%,var(--bw-bg))}
  .bw .logo{display:block;max-height:48px;max-width:160px;object-fit:contain;margin:0 0 12px}
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:var(--bw-font),-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:transparent;-webkit-font-smoothing:antialiased}
  .bw{max-width:460px;margin:0 auto;background:var(--bw-bg);border:1px solid var(--bw-border);border-radius:var(--bw-r-card);padding:22px;color:var(--bw-text);box-shadow:0 8px 32px -12px rgba(0,0,0,.55)}
  .bw .head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
  .bw .head .ht{flex:1;min-width:0}
  .bw h2{font-size:20px;margin:0 0 4px;color:var(--bw-text);font-weight:700;letter-spacing:-.01em;line-height:1.2}
  .bw .sub{font-size:13px;color:var(--bw-muted);margin:0;line-height:1.4}
  .bw .deposit-pill{flex:0 0 auto;font-size:11px;color:var(--bw-accent);background:color-mix(in srgb,var(--bw-accent) 8%,transparent);border:1px solid color-mix(in srgb,var(--bw-accent) 25%,transparent);padding:5px 10px;border-radius:999px;font-weight:600;white-space:nowrap;line-height:1.2}
  .bw .label{font-size:11px;color:var(--bw-muted);margin:18px 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .bw .dates-wrap{position:relative}
  .bw .dates-wrap::before,.bw .dates-wrap::after{content:'';position:absolute;top:0;bottom:6px;width:18px;pointer-events:none;z-index:1}
  .bw .dates-wrap::before{left:0;background:linear-gradient(90deg,var(--bw-bg),transparent)}
  .bw .dates-wrap::after{right:0;background:linear-gradient(-90deg,var(--bw-bg),transparent)}
  .bw .dates{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:thin;scroll-behavior:smooth}
  .bw .dates::-webkit-scrollbar{height:4px}
  .bw .dates::-webkit-scrollbar-thumb{background:var(--bw-border);border-radius:2px}
  .bw .date{flex:0 0 auto;min-width:64px;padding:10px 8px;border-radius:var(--bw-r);background:transparent;border:1px solid var(--bw-border);text-align:center;cursor:pointer;transition:background .15s,border-color .15s,transform .1s}
  .bw .date:hover{background:var(--bw-hover);border-color:var(--bw-border-strong)}
  .bw .date.sel{background:var(--bw-accent);color:var(--bw-on-accent);border-color:var(--bw-accent)}
  .bw .date.closed{opacity:.35;cursor:not-allowed}
  .bw .date.inrange{background:color-mix(in srgb,var(--bw-accent) 15%,transparent);border-color:color-mix(in srgb,var(--bw-accent) 45%,transparent)}
  .bw .summary{margin-top:14px;border:1px solid var(--bw-border);border-radius:var(--bw-r);padding:12px 14px;font-size:13px;color:var(--bw-text);line-height:1.5}
  .bw .summary strong{color:var(--bw-text)}
  .bw .date.closed .dd{text-decoration:line-through}
  .bw .date .dn{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.75}
  .bw .date .dd{font-size:19px;font-weight:700;line-height:1.2;margin:2px 0}
  .bw .date .dm{font-size:10px;opacity:.65;font-weight:500}
  .bw .slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:220px;overflow-y:auto;padding:2px}
  @media (min-width:400px){.bw .slots{grid-template-columns:repeat(4,1fr)}}
  .bw .slots::-webkit-scrollbar{width:4px}
  .bw .slots::-webkit-scrollbar-thumb{background:var(--bw-border);border-radius:2px}
  .bw .slot{height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--bw-r);background:transparent;border:1px solid var(--bw-border);text-align:center;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;font-variant-numeric:tabular-nums;letter-spacing:.01em}
  .bw .slot:hover:not(:disabled):not(.busy){background:var(--bw-hover);border-color:var(--bw-border-strong)}
  .bw .slot.sel{background:var(--bw-accent);color:var(--bw-on-accent);border-color:var(--bw-accent)}
  .bw .slot.busy{color:var(--bw-muted);cursor:not-allowed;text-decoration:line-through;opacity:.6}
  .bw .empty{grid-column:1/-1;color:var(--bw-muted);font-size:12px;text-align:center;padding:20px 8px;display:flex;flex-direction:column;align-items:center;gap:6px}
  .bw .empty svg{opacity:.5}
  .bw .durs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .bw .dur{height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--bw-r);background:transparent;border:1px solid var(--bw-border);font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;color:inherit;font-family:inherit}
  .bw .dur:hover:not(:disabled){background:var(--bw-hover);border-color:var(--bw-border-strong)}
  .bw .dur.sel{background:var(--bw-accent);color:var(--bw-on-accent);border-color:var(--bw-accent)}
  .bw .dur:disabled{opacity:.35;cursor:not-allowed}
  .bw input{width:100%;padding:12px 14px;border-radius:var(--bw-r);border:1px solid var(--bw-border);background:var(--bw-input);color:var(--bw-text);font-size:14px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}
  .bw input::placeholder{color:var(--bw-muted)}
  .bw input:focus{border-color:var(--bw-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--bw-accent) 15%,transparent)}
  .bw .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  @media (max-width:380px){.bw .row{grid-template-columns:1fr}}
  .bw #bw-payel{background:var(--bw-input);border:1px solid var(--bw-border);border-radius:var(--bw-r);padding:12px;min-height:44px}
  .bw .paynote{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--bw-muted);margin-top:8px;line-height:1.4}
  .bw .paynote svg{flex:0 0 auto;opacity:.7}
  .bw button.submit{width:100%;height:48px;border:none;border-radius:var(--bw-r);background:var(--bw-accent);color:var(--bw-on-accent);font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;margin-top:16px;transition:transform .1s,box-shadow .15s,background .15s;letter-spacing:.01em}
  .bw button.submit:hover:not(:disabled){background:var(--bw-accent);transform:translateY(-1px);box-shadow:0 6px 18px -6px color-mix(in srgb,var(--bw-accent) 40%,transparent)}
  .bw button.submit:active:not(:disabled){transform:translateY(0)}
  .bw button.submit:disabled{opacity:.4;cursor:not-allowed}
  .bw .ok{text-align:center;padding:28px 8px}
  .bw .ok .ic{width:56px;height:56px;border-radius:50%;background:color-mix(in srgb,var(--bw-accent) 12%,transparent);color:var(--bw-accent);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;margin:0 auto 14px}
  .bw .ok h3{margin:0 0 8px;font-size:17px;font-weight:700}
  .bw .ok p{margin:0 0 16px;font-size:13px;color:var(--bw-muted);line-height:1.5}
  .bw .ok .again{background:transparent;border:1px solid var(--bw-border);color:var(--bw-text);padding:10px 18px;border-radius:var(--bw-r);font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .15s,border-color .15s}
  .bw .ok .again:hover{background:var(--bw-hover);border-color:var(--bw-border-strong)}
  .bw .err{background:#2A1518;color:#FCA5A5;padding:10px 12px 10px 14px;border-radius:8px;border-left:3px solid #EF4444;font-size:12px;margin-top:10px;line-height:1.4}
`;

export const WIDGET_MARKUP = `
<div class="bw" id="bw">
  <img id="bw-logo" class="logo" alt="" style="display:none">
  <div class="head">
    <div class="ht">
      <h2 id="bw-title">Book an Appointment</h2>
      <p class="sub">Pick a day, then tap a start time and duration.</p>
    </div>
    <div class="deposit-pill" id="bw-deposit">Loading…</div>
  </div>

  <div class="label" id="bw-day-label">Day</div>
  <div class="dates-wrap"><div class="dates" id="bw-dates"></div></div>
  <div id="bw-range-hint" style="display:none;font-size:12px;color:var(--bw-muted);margin-top:2px"></div>

  <div id="bw-svc-wrap" style="display:none">
    <div class="label" id="bw-svc-label">Service</div>
    <div class="slots" id="bw-services" style="grid-template-columns:repeat(2,1fr)"></div>
  </div>

  <div class="label" id="bw-time-label">Start time</div>
  <div class="slots" id="bw-slots"></div>


  <div id="bw-dur-wrap">
    <div class="label">Duration</div>
    <div class="durs" id="bw-durs"></div>
  </div>

  <div id="bw-party-wrap" style="display:none">
    <div class="label" id="bw-party-label">Party size</div>
    <input id="bw-party" type="number" min="1" max="99" value="2">
  </div>

  <div id="bw-res-wrap" style="display:none">
    <div class="label" id="bw-res-label">Resource</div>
    <div class="slots" id="bw-resources" style="grid-template-columns:repeat(2,1fr)"></div>
  </div>

  <div id="bw-pay-wrap" style="display:none">
    <div class="label">Payment</div>
    <div class="slots" id="bw-payopts" style="grid-template-columns:repeat(2,1fr)"></div>
  </div>

  <div class="summary" id="bw-summary" style="display:none"></div>

  <div class="label">Your details</div>
  <div class="row">
    <input id="bw-name" placeholder="Full name" required>
    <input id="bw-email" type="email" placeholder="Email" required>
  </div>

  <div class="label" style="margin-top:2px">Promo code <span style="opacity:.55;font-weight:400;text-transform:none">(optional)</span></div>
  <div class="row" style="grid-template-columns:1fr">
    <input id="bw-promo" placeholder="e.g. SUMMER20" maxlength="40" autocomplete="off" style="text-transform:uppercase">
  </div>
  <div id="bw-promo-note" style="font-size:12.5px;margin:-2px 0 10px"></div>

  <div class="label">Card details</div>
  <div id="bw-payel"></div>
  <div class="paynote" id="bw-paynote">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    <span>Your card is only charged if the business accepts your request.</span>
  </div>

  <div id="bw-err"></div>
  <button class="submit" id="bw-submit" disabled>Request Booking</button>
</div>

<div class="bw" id="bw-blocked" style="display:none">
  <div class="head">
    <div class="ht">
      <h2 id="bw-blocked-title">Online booking unavailable</h2>
      <p class="sub" id="bw-blocked-sub">This business hasn't finished setting up online bookings yet. Please contact them directly to arrange a booking.</p>
    </div>
  </div>
</div>

<div class="bw" id="bw-done" style="display:none">
  <div class="ok">
    <div class="ic">✓</div>
    <h3>Booking requested!</h3>
    <p>Your card is saved but has not been charged. You'll receive an email when the business accepts or declines.</p>
    <button class="again" id="bw-again" type="button">Book another</button>
  </div>
</div>
`;

export type WidgetTheme = {
  accent: string;
  bg: string;
  text: string;
  font: string;
  radius: "sharp" | "rounded" | "pill";
  logo: string | null;
};

export const buildWidgetScript = (opts: {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  paymentEnvironment?: "sandbox" | "live";
  stripePublishableKey: string;
  previewTheme?: WidgetTheme;
}) => `
(function(){
  var URL_ = ${JSON.stringify(opts.supabaseUrl)};
  var KEY = ${JSON.stringify(opts.supabaseKey)};
  var UID = ${JSON.stringify(opts.userId)};
  var PAYMENT_ENV = ${JSON.stringify(opts.paymentEnvironment || "live")};
  var STRIPE_PK = ${JSON.stringify(opts.stripePublishableKey)};
  var PREVIEW_THEME = ${JSON.stringify(opts.previewTheme || null).replace(/</g, "\\u003c")};
  var FONTS = ['Plus Jakarta Sans','Inter','Poppins','Playfair Display','Lora','Montserrat','DM Sans','Space Grotesk'];
  var THEME = { accent:'#5BADE8', bg:'#0F1420', text:'#F3F4F6', input:'#131a28', muted:'#94A3B8', border:'#1F2937', font:'Plus Jakarta Sans', radius:'10px', dark:true };

  function hexOk(h){ return typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h); }
  function rgb(h){ return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
  function lum(h){ var c = rgb(h).map(function(v){ v/=255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }); return .2126*c[0] + .7152*c[1] + .0722*c[2]; }
  function mix(a, b, t){ var x = rgb(a), y = rgb(b); return '#' + x.map(function(v,i){ return ('0' + Math.round(v*t + y[i]*(1-t)).toString(16)).slice(-2); }).join(''); }
  function fontCssUrl(f){ return 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(f).replace(/%20/g,'+') + ':wght@400;500;600;700&display=swap'; }
  function applyTheme(t){
    if (!t) return;
    var root = document.documentElement.style;
    if (hexOk(t.accent)) THEME.accent = t.accent;
    if (hexOk(t.bg)) THEME.bg = t.bg;
    if (hexOk(t.text)) THEME.text = t.text;
    THEME.dark = lum(THEME.bg) < .4;
    THEME.muted = mix(THEME.text, THEME.bg, .6);
    THEME.border = mix(THEME.text, THEME.bg, .13);
    THEME.input = mix(THEME.text, THEME.bg, .04);
    THEME.radius = t.radius === 'sharp' ? '2px' : t.radius === 'pill' ? '999px' : '10px';
    root.setProperty('--bw-accent', THEME.accent);
    root.setProperty('--bw-on-accent', lum(THEME.accent) > .45 ? '#0A0F1A' : '#FFFFFF');
    root.setProperty('--bw-bg', THEME.bg);
    root.setProperty('--bw-text', THEME.text);
    root.setProperty('--bw-r', THEME.radius);
    root.setProperty('--bw-r-card', t.radius === 'sharp' ? '4px' : t.radius === 'pill' ? '28px' : '20px');
    if (FONTS.indexOf(t.font) !== -1) {
      THEME.font = t.font;
      if (t.font !== 'Plus Jakarta Sans') {
        var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = fontCssUrl(t.font); document.head.appendChild(l);
      }
      root.setProperty('--bw-font', "'" + t.font + "'");
    }
    var logo = document.getElementById('bw-logo');
    if (logo) {
      if (typeof t.logo === 'string' && /^data:image\\/(png|jpeg|webp);base64,/.test(t.logo)) { logo.src = t.logo; logo.style.display = 'block'; }
      else { logo.removeAttribute('src'); logo.style.display = 'none'; }
    }
  }


  var settings = {
    working_hours: {
      mon:{open:'09:00',close:'18:00',closed:false},
      tue:{open:'09:00',close:'18:00',closed:false},
      wed:{open:'09:00',close:'18:00',closed:false},
      thu:{open:'09:00',close:'18:00',closed:false},
      fri:{open:'09:00',close:'18:00',closed:false},
      sat:{open:'10:00',close:'16:00',closed:false},
      sun:{open:'10:00',close:'16:00',closed:true}
    },
    deposit_amount: 10,
    business_name: '',
    welcome_message: '',
    allow_same_day: true,
    max_advance_days: 14,
    buffer_minutes: 0,
    currency: 'GBP',
    resources_enabled: false,
    resource_label: 'Resource',
    party_size_enabled: false,
    assignment_mode: 'client_pick',
    services_enabled: false,
    payment_mode: 'deposit',
    booking_mode: 'hourly',
    min_rental_days: 1,
    max_rental_days: 30,
    payments_enabled: true
  };
  var busy = [];
  var overrides = {};
  var resources = [];
  var services = [];
  var selDate = null, selEndDate = null, selSlot = null, selDur = null, selResource = null, selService = null, selPayOption = 'deposit';
  var DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
  var stripe = null, elements = null, paymentEl = null, elementsReady = false;

  function api(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({
      'apikey': KEY,
      'Authorization': 'Bearer ' + KEY,
      'Content-Type': 'application/json'
    }, opts.headers || {});
    return fetch(URL_ + path, opts);
  }
  function pad(n){ return String(n).padStart(2,'0'); }
  function fmtDate(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function toMin(t){ var p = t.split(':'); return parseInt(p[0])*60 + parseInt(p[1]); }
  function fmtMin(m){ return pad(Math.floor(m/60))+':'+pad(m%60); }
  // ---- day-based (rental) helpers ----
  function dailyOn(){ return settings.booking_mode === 'daily'; }
  function minDays(){ return Math.max(1, Number(settings.min_rental_days) || 1); }
  function maxDays(){ return Math.max(minDays(), Number(settings.max_rental_days) || 30); }
  function parseDate(ds){ return new Date(ds + 'T00:00:00'); }
  function dayDiff(a, b){ return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
  function rentalDays(){
    if (!dailyOn()) return null;
    if (!selDate || !selEndDate) return null;
    return dayDiff(selDate, selEndDate) + 1;
  }
  function prettyDate(ds){ return parseDate(ds).toLocaleDateString(undefined,{ day:'numeric', month:'short' }); }
  // Is this calendar day already taken by an existing booking (whole range blocked)?
  function dayTakenBy(dateStr, resourceId){
    return busy.some(function(b){
      var start = b.booking_date;
      var end = b.end_date || b.booking_date;
      if (dateStr < start || dateStr > end) return false;
      if (resourceId) return b.resource_id === resourceId;
      return true;
    });
  }
  function dayUnavailable(dateStr){
    if (!dailyOn()) return false;
    if (settings.resources_enabled) {
      var fits = fittingResources();
      if (fits.length === 0) return false;
      if (selResource) return dayTakenBy(dateStr, selResource);
      // unavailable only when every fitting resource is taken that day
      return fits.every(function(r){ return dayTakenBy(dateStr, r.id); });
    }
    return dayTakenBy(dateStr, null);
  }
  function rangeIsFree(startDs, endDs, resourceId){
    var d = parseDate(startDs);
    var endD = parseDate(endDs);
    while (d <= endD){
      var ds = fmtDate(d);
      if (resourceId ? dayTakenBy(ds, resourceId) : dayUnavailable(ds)) return false;
      d.setDate(d.getDate() + 1);
    }
    return true;
  }
  function showErr(msg){
    var errEl = document.getElementById('bw-err');
    errEl.innerHTML = '';
    var ed = document.createElement('div');
    ed.className = 'err';
    ed.textContent = msg || 'Something went wrong';
    errEl.appendChild(ed);
  }

  function dayHoursFor(dateStr){
    var ov = overrides[dateStr];
    if (ov) {
      if (ov.closed) return { closed: true, open: '09:00', close: '18:00' };
      return { closed: false, open: (ov.open_time||'09:00').slice(0,5), close: (ov.close_time||'18:00').slice(0,5) };
    }
    var d = new Date(dateStr + 'T00:00:00');
    var key = DAY_KEYS[d.getDay()];
    return settings.working_hours[key] || { closed: true, open:'09:00', close:'18:00' };
  }
  // Party size (returns 1 if disabled or empty)
  function partySize(){
    if (!settings.party_size_enabled) return 1;
    var v = parseInt(document.getElementById('bw-party').value, 10);
    return (isNaN(v) || v < 1) ? 1 : v;
  }
  // Which resources can host the current party size?
  function fittingResources(){
    if (!settings.resources_enabled) return [];
    var ps = partySize();
    return resources.filter(function(r){ return (r.capacity || 1) >= ps; });
  }
  // A slot is "busy" only if ALL fitting resources are occupied (or, when a specific resource is picked, only that resource).
  // When resources are disabled, fall back to the flat busy set.
  // Minutes-of-day before which a slot is in the past (only relevant for today).
  function pastCutoff(dateStr){
    var now = new Date();
    if (dateStr !== fmtDate(now)) return -1;
    return now.getHours() * 60 + now.getMinutes();
  }
  function busyMinutes(dateStr){
    var set = {};
    var buf = settings.buffer_minutes || 0;
    var cut = pastCutoff(dateStr);
    if (cut >= 0){ for (var pm = 0; pm < cut; pm += 30) set[pm] = true; }
    var todays = busy.filter(function(b){ return b.booking_date === dateStr; });


    if (!settings.resources_enabled) {
      todays.forEach(function(b){
        var s = toMin(b.booking_time) - buf;
        var e = toMin(b.booking_time) + (b.duration_minutes || 30) + buf;
        for (var m = Math.max(0, Math.floor(s/30)*30); m < e; m += 30) set[m] = true;
      });
      return set;
    }

    var fits = fittingResources();
    if (fits.length === 0) return set; // no resources = nothing bookable, but keep slots pickable so we can show a message

    // Which resource are we counting against?
    var scoped = selResource ? [selResource] : fits.map(function(r){ return r.id; });
    var scopedSet = {}; scoped.forEach(function(id){ scopedSet[id] = true; });

    // Count overlapping bookings per resource per slot
    var perSlot = {};
    todays.forEach(function(b){
      if (b.resource_id && !scopedSet[b.resource_id]) return;
      var s = toMin(b.booking_time) - buf;
      var e = toMin(b.booking_time) + (b.duration_minutes || 30) + buf;
      for (var m = Math.max(0, Math.floor(s/30)*30); m < e; m += 30) {
        var key = m + '|' + (b.resource_id || '_');
        perSlot[key] = true;
      }
    });

    if (selResource) {
      // Busy if this resource has any overlap at that slot
      Object.keys(perSlot).forEach(function(k){
        var parts = k.split('|'); if (parts[1] === selResource) set[Number(parts[0])] = true;
      });
    } else {
      // Busy only if EVERY fitting resource is booked at that slot
      var slotCounts = {};
      Object.keys(perSlot).forEach(function(k){
        var parts = k.split('|'); var m = Number(parts[0]);
        slotCounts[m] = (slotCounts[m] || 0) + 1;
      });
      Object.keys(slotCounts).forEach(function(m){
        if (slotCounts[m] >= scoped.length) set[Number(m)] = true;
      });
    }
    return set;
  }
  function pickDay(ds){
    if (!dailyOn()){
      selDate = ds; selSlot = null; selDur = null; selResource = null; renderAll(); return;
    }
    // daily: first tap sets pick-up, second tap sets return
    if (!selDate || selEndDate || ds < selDate){
      selDate = ds; selEndDate = null;
    } else {
      var days = dayDiff(selDate, ds) + 1;
      if (days > maxDays()) { selDate = ds; selEndDate = null; }
      else selEndDate = ds;
    }
    selSlot = null; selResource = null;
    renderAll();
  }
  function renderDates(){
    var wrap = document.getElementById('bw-dates');
    wrap.innerHTML = '';
    var today = new Date(); today.setHours(0,0,0,0);
    var startI = settings.allow_same_day ? 0 : 1;
    var totalDays = Math.min(settings.max_advance_days || 14, 60);
    for (var i=startI;i<=totalDays;i++){
      var d = new Date(today); d.setDate(d.getDate()+i);
      var ds = fmtDate(d);
      var hrs = dayHoursFor(ds);
      var taken = dayUnavailable(ds);
      var blocked = hrs.closed || taken;
      var inRange = dailyOn() && selDate && selEndDate && ds > selDate && ds <= selEndDate;
      var el = document.createElement('div');
      el.className = 'date' + (selDate === ds || selEndDate === ds ? ' sel' : (inRange ? ' inrange' : '')) + (blocked ? ' closed' : '');
      el.innerHTML = '<div class="dn">'+d.toLocaleDateString(undefined,{weekday:'short'})+'</div>'+
                     '<div class="dd">'+d.getDate()+'</div>'+
                     '<div class="dm">'+(hrs.closed ? 'Closed' : (taken ? 'Booked' : d.toLocaleDateString(undefined,{month:'short'})))+'</div>';
      if (!blocked){
        (function(ds_){ el.onclick = function(){ pickDay(ds_); }; })(ds);
      }
      wrap.appendChild(el);
    }
    var dayLabel = document.getElementById('bw-day-label');
    var hint = document.getElementById('bw-range-hint');
    if (dailyOn()){
      dayLabel.textContent = selDate && !selEndDate ? 'Return day' : 'Pick-up day';
      hint.style.display = '';
      var rd = rentalDays();
      hint.textContent = rd
        ? prettyDate(selDate) + ' \u2192 ' + prettyDate(selEndDate) + ' \u00B7 ' + rd + (rd === 1 ? ' day' : ' days')
        : (selDate ? 'Now choose the return day (max ' + maxDays() + ' days).' : 'Choose the pick-up day.');
    } else {
      dayLabel.textContent = 'Day';
      hint.style.display = 'none';
    }
  }
  function emptyMsg(text){
    return '<div class="empty">'+
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'+
      '<span>'+text+'</span></div>';
  }
  function renderSlots(){
    var wrap = document.getElementById('bw-slots');
    wrap.innerHTML = '';
    document.getElementById('bw-time-label').textContent = dailyOn() ? 'Pick-up time' : 'Start time';
    if (!selDate){ wrap.innerHTML = emptyMsg('Pick a day first'); return; }
    if (dailyOn() && !selEndDate){ wrap.innerHTML = emptyMsg('Pick a return day first'); return; }
    var hrs = dayHoursFor(selDate);
    if (hrs.closed){ wrap.innerHTML = emptyMsg('Closed this day'); return; }
    var bset = dailyOn() ? {} : busyMinutes(selDate);
    var cut = pastCutoff(selDate);
    var startM = toMin(hrs.open), endM = toMin(hrs.close);
    var shown = 0;
    for (var m = startM; m < endM; m += 30){
      if (cut >= 0 && m < cut) continue; // past times today
      shown++;
      var el = document.createElement('div');
      var isBusy = !!bset[m];
      el.className = 'slot' + (isBusy?' busy':'') + (selSlot === m?' sel':'');
      el.textContent = fmtMin(m);
      if (!isBusy){
        (function(mm){ el.onclick = function(){ selSlot = mm; selDur = servicesOn() && selService ? (Number(selService.duration_minutes) || 30) : (dailyOn() ? 60 : null); selResource = dailyOn() ? selResource : null; renderAll(); }; })(m);
      }
      wrap.appendChild(el);
    }
    if (shown === 0) wrap.innerHTML = emptyMsg('No times left today — pick another day');
  }


  function servicesOn(){ return !!settings.services_enabled && services.length > 0; }
  function renderServices(){
    var wrap = document.getElementById('bw-svc-wrap');
    if (!servicesOn()){ wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    document.getElementById('bw-svc-label').textContent = dailyOn() ? 'What are you hiring?' : 'Service';
    var list = document.getElementById('bw-services');
    list.innerHTML = '';
    var bset = (selDate && !dailyOn()) ? busyMinutes(selDate) : {};
    var hrs = selDate ? dayHoursFor(selDate) : null;
    var endLimit = hrs ? toMin(hrs.close) : 0;
    var ccy = (settings.currency || 'GBP').toUpperCase();
    var sym = ccy === 'USD' ? '$' : ccy === 'EUR' ? '\u20AC' : ccy === 'JPY' ? '\u00A5' : ccy === 'AUD' ? 'A$' : ccy === 'CAD' ? 'C$' : '\u00A3';
    services.forEach(function(sv){
      var d = Number(sv.duration_minutes) || 30;
      var disabled = false;
      if (!dailyOn() && selSlot !== null && selSlot !== undefined){
        if (selSlot + d > endLimit) disabled = true;
        for (var mm = selSlot; mm < selSlot + d; mm += 30){ if (bset[mm]) { disabled = true; break; } }
      }
      var el = document.createElement('div');
      el.className = 'slot' + (disabled ? ' busy' : '') + (selService && selService.id === sv.id ? ' sel' : '');
      var priceNum = (sv.price === null || sv.price === undefined) ? null : Number(sv.price);
      var priceTxt = (priceNum === null || priceNum === 0) ? '' : ' \u00B7 ' + sym + priceNum.toFixed(ccy === 'JPY' ? 0 : 2) + (dailyOn() ? '/day' : '');
      el.textContent = sv.name + (dailyOn() ? '' : ' \u00B7 ' + d + ' min') + priceTxt;
      if (!disabled){
        (function(svc){ el.onclick = function(){ selService = svc; selDur = Number(svc.duration_minutes) || (dailyOn() ? 60 : 30); if (!dailyOn()) selResource = null; renderAll(); }; })(sv);
      }
      list.appendChild(el);
    });
  }
  function renderDurs(){
    var durWrap = document.getElementById('bw-dur-wrap');
    if (servicesOn() || dailyOn()){ durWrap.style.display = 'none'; if (dailyOn() && !selDur) selDur = 60; return; }
    durWrap.style.display = '';
    var wrap = document.getElementById('bw-durs');
    wrap.innerHTML = '';
    var durs = [30,60,90,120];
    var bset = selDate ? busyMinutes(selDate) : {};
    var hrs = selDate ? dayHoursFor(selDate) : null;
    var endLimit = hrs ? toMin(hrs.close) : 0;
    durs.forEach(function(d){
      var el = document.createElement('button');
      el.type = 'button';
      var disabled = !selSlot;
      if (selSlot){
        var endM = selSlot + d;
        if (endM > endLimit) disabled = true;
        for (var mm = selSlot; mm < endM; mm += 30){ if (bset[mm]) { disabled = true; break; } }
      }
      el.disabled = disabled;
      el.className = 'dur' + (selDur === d ? ' sel' : '');
      el.textContent = d + ' min';
      (function(dd){ el.onclick = function(){ if (!el.disabled){ selDur = dd; selResource = null; renderAll(); } }; })(d);
      wrap.appendChild(el);
    });
  }
  // Which resources are free for the currently-selected date/time/duration/party?
  function resourceIsFree(resourceId){
    if (dailyOn()){
      if (!selDate) return true;
      return rangeIsFree(selDate, selEndDate || selDate, resourceId);
    }
    if (!selDate || selSlot === null || !selDur) return true;
    var buf = settings.buffer_minutes || 0;
    var startWant = selSlot;
    var endWant = selSlot + selDur;
    var conflict = busy.some(function(b){
      if (b.booking_date !== selDate) return false;
      if (b.resource_id !== resourceId) return false;
      var s = toMin(b.booking_time) - buf;
      var e = toMin(b.booking_time) + (b.duration_minutes || 30) + buf;
      return s < endWant && e > startWant;
    });
    return !conflict;
  }
  function renderResources(){
    var wrap = document.getElementById('bw-res-wrap');
    if (!settings.resources_enabled || settings.assignment_mode === 'auto') {
      wrap.style.display = 'none';
      return;
    }
    wrap.style.display = '';
    document.getElementById('bw-res-label').textContent = settings.resource_label || 'Resource';
    var list = document.getElementById('bw-resources');
    list.innerHTML = '';
    var fits = fittingResources();
    if (fits.length === 0){
      list.innerHTML = emptyMsg('No ' + (settings.resource_label || 'resource').toLowerCase() + 's available for that party size');
      return;
    }
    fits.forEach(function(r){
      var free = resourceIsFree(r.id);
      var el = document.createElement('div');
      el.className = 'slot' + (!free ? ' busy' : '') + (selResource === r.id ? ' sel' : '');
      el.textContent = r.name + ' · ' + r.capacity;
      if (free){
        (function(rid){ el.onclick = function(){ selResource = selResource === rid ? null : rid; renderAll(); }; })(r.id);
      }
      list.appendChild(el);
    });
  }
  function ccySym(){
    var ccy = (settings.currency || 'GBP').toUpperCase();
    return ccy === 'USD' ? '$' : ccy === 'EUR' ? '\u20AC' : ccy === 'JPY' ? '\u00A5' : ccy === 'AUD' ? 'A$' : ccy === 'CAD' ? 'C$' : '\u00A3';
  }
  function money(n){
    var ccy = (settings.currency || 'GBP').toUpperCase();
    return ccySym() + Number(n).toFixed(ccy === 'JPY' ? 0 : 2);
  }
  function servicePrice(){
    if (!selService) return null;
    var p = selService.price;
    if (p === null || p === undefined) return null;
    p = Number(p);
    return (isNaN(p) || p <= 0) ? null : p;
  }
  function fullAmount(){
    var p = servicePrice();
    if (p === null) return null;
    var total = dailyOn() ? p * (rentalDays() || 1) : p;
    return Math.max(Number(settings.deposit_amount || 0), total);
  }
  function applyPromo(base){
    if (!promoDiscount) return base;
    var d = promoDiscount.type === 'percent' ? base * (promoDiscount.value / 100) : promoDiscount.value;
    d = Math.min(d, Math.max(base - 1, 0));
    return Math.round((base - d) * 100) / 100;
  }
  function chargeNow(){
    var base = (selPayOption === 'full' && fullAmount() !== null) ? fullAmount() : Number(settings.deposit_amount || 0);
    return applyPromo(base);
  }
  function renderPayOptions(){
    var wrap = document.getElementById('bw-pay-wrap');
    var mode = settings.payment_mode || 'deposit';
    var full = fullAmount();
    if (full === null) { selPayOption = 'deposit'; }
    else if (mode === 'full') { selPayOption = 'full'; }
    else if (mode === 'deposit') { selPayOption = 'deposit'; }
    if (mode !== 'client_choice' || full === null){ wrap.style.display = 'none'; renderDepositPill(); return; }
    wrap.style.display = '';
    var list = document.getElementById('bw-payopts');
    list.innerHTML = '';
    var dep = Number(settings.deposit_amount || 0);
    var opts = [
      { key: 'deposit', label: 'Deposit now ' + money(dep) + ' \u00B7 ' + money(Math.max(0, full - dep)) + ' on the day' },
      { key: 'full', label: 'Pay in full ' + money(full) }
    ];
    opts.forEach(function(o){
      var el = document.createElement('div');
      el.className = 'slot' + (selPayOption === o.key ? ' sel' : '');
      el.textContent = o.label;
      (function(k){ el.onclick = function(){ selPayOption = k; renderAll(); }; })(o.key);
      list.appendChild(el);
    });
    renderDepositPill();
  }
  function renderDepositPill(){
    var pill = document.getElementById('bw-deposit');
    if (!pill) return;
    var amt = chargeNow();
    var label = money(amt) + (selPayOption === 'full' ? ' total' : ' deposit');
    if (promoDiscount){
      var base = (selPayOption === 'full' && fullAmount() !== null) ? fullAmount() : Number(settings.deposit_amount || 0);
      if (amt < base) label = money(amt) + ' \u2014 was ' + money(base);
    }
    pill.textContent = label;
  }
  function renderParty(){
    var wrap = document.getElementById('bw-party-wrap');
    if (!settings.party_size_enabled) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    document.getElementById('bw-party-label').textContent = 'Party size';
  }
  function renderSummary(){
    var box = document.getElementById('bw-summary');
    if (!box) return;
    var days = rentalDays();
    if (!dailyOn() || !days){ box.style.display = 'none'; return; }
    box.style.display = '';
    var p = servicePrice();
    var lines = '<div><strong>' + days + (days === 1 ? ' day' : ' days') + '</strong> \u00B7 ' +
      prettyDate(selDate) + ' \u2192 ' + prettyDate(selEndDate) + '</div>';
    if (p !== null){
      lines += '<div>' + days + ' \u00D7 ' + money(p) + ' = <strong>' + money(p * days) + '</strong></div>';
    }
    box.innerHTML = lines;
  }
  function renderAll(){
    renderDates(); renderSlots(); renderServices(); renderDurs(); renderParty(); renderResources(); renderPayOptions(); renderSummary();
    var btn = document.getElementById('bw-submit');
    var name = document.getElementById('bw-name').value.trim();
    var email = document.getElementById('bw-email').value.trim();
    var needResource = settings.resources_enabled && settings.assignment_mode === 'client_pick';
    var resourceOk = !needResource || !!selResource;
    var days = rentalDays();
    var rangeOk = !dailyOn() || (!!days && days >= minDays() && days <= maxDays());
    var payOk = elementsReady;
    btn.disabled = !(selDate && rangeOk && selSlot !== null && selDur && name && email && payOk && resourceOk);
  }
  document.getElementById('bw-name').addEventListener('input', renderAll);
  document.getElementById('bw-email').addEventListener('input', renderAll);
  document.getElementById('bw-party').addEventListener('input', function(){ selResource = null; renderAll(); });

  var promoDiscount = null;
  var promoCheckTimer = null;
  document.getElementById('bw-promo').addEventListener('input', function(){
    var note = document.getElementById('bw-promo-note');
    var code = this.value.trim();
    promoDiscount = null;
    note.textContent = '';
    if (promoCheckTimer) clearTimeout(promoCheckTimer);
    if (!code) { renderAll(); return; }
    promoCheckTimer = setTimeout(function(){
      api('/rest/v1/rpc/validate_promo_code', {
        method: 'POST',
        body: JSON.stringify({ p_user_id: UID, p_code: code })
      }).then(function(r){ return r.json(); }).then(function(res){
        var row = Array.isArray(res) ? res[0] : res;
        var input = document.getElementById('bw-promo');
        if (!row || !row.valid) {
          promoDiscount = null;
          note.style.color = '#f87171';
          note.textContent = (row && row.message) ? row.message : 'Invalid code';
        } else {
          promoDiscount = { type: row.discount_type, value: Number(row.discount_value) };
          note.style.color = '#4ade80';
          note.textContent = 'Code applied \u2014 discount included below';
          if (input.value.trim() !== code) return;
        }
        renderAll();
      }).catch(function(){ /* ignore */ });
    }, 400);
    renderAll();
  });

  function mountStripeElements(){
    if (!window.Stripe || !STRIPE_PK) {
      document.getElementById('bw-payel').textContent = 'Payments unavailable — please contact the business.';
      return;
    }
    stripe = Stripe(STRIPE_PK);
    var ccy = String(settings.currency || 'GBP').toLowerCase();
    elements = stripe.elements({
      mode: 'setup',
      currency: ccy,
      paymentMethodTypes: ['card'],
      fonts: [{ cssSrc: fontCssUrl(THEME.font) }],
      appearance: {
        theme: THEME.dark ? 'night' : 'stripe',
        variables: {
          colorPrimary: THEME.accent,
          colorBackground: THEME.input,
          colorText: THEME.text,
          colorTextPlaceholder: THEME.muted,
          borderRadius: THEME.radius,
          fontSizeBase: '14px',
          fontFamily: "'" + THEME.font + "', -apple-system, BlinkMacSystemFont, sans-serif"
        },
        rules: {
          '.Input': { border: '1px solid ' + THEME.border, boxShadow: 'none' },
          '.Input:focus': { border: '1px solid ' + THEME.accent, boxShadow: 'none' },
          '.Tab': { border: '1px solid ' + THEME.border }
        }
      }
    });
    paymentEl = elements.create('payment', { layout: 'tabs' });
    paymentEl.mount('#bw-payel');
    paymentEl.on('ready', function(){ elementsReady = true; renderAll(); });
    paymentEl.on('change', renderAll);
  }

  var againBtn = document.getElementById('bw-again');
  if (againBtn) {
    againBtn.addEventListener('click', function(){
      document.getElementById('bw-done').style.display = 'none';
      document.getElementById('bw').style.display = '';
      selSlot = null; selDur = null; selResource = null; selEndDate = null;
      document.getElementById('bw-name').value = '';
      document.getElementById('bw-email').value = '';
      document.getElementById('bw-err').innerHTML = '';
      var sb = document.getElementById('bw-submit');
      sb.textContent = 'Request Booking';
      if (paymentEl) { try { paymentEl.clear(); } catch(e){} }
      renderAll();
    });
  }

  function showBlocked(){
    var main = document.getElementById('bw');
    if (main) main.style.display = 'none';
    var blocked = document.getElementById('bw-blocked');
    if (blocked) {
      if (settings.business_name) {
        document.getElementById('bw-blocked-title').textContent = settings.business_name + ' is not taking bookings yet';
      }
      blocked.style.display = 'block';
    }
  }

  document.getElementById('bw-submit').addEventListener('click', async function(){
    var btn = this;
    btn.disabled = true; btn.textContent = 'Saving card...';
    document.getElementById('bw-err').innerHTML = '';
    try {
      var email = document.getElementById('bw-email').value.trim();
      var name = document.getElementById('bw-name').value.trim();
      var intentData = {}; var pmId = null;

      {
        // 1) validate card form
        var subm = await elements.submit();
        if (subm.error) throw new Error(subm.error.message || 'Card details invalid');

        // 2) create SetupIntent server-side
        var intentRes = await fetch(URL_ + '/functions/v1/create-booking-intent', {
          method: 'POST',
          headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: UID, client_email: email, environment: PAYMENT_ENV })
        });
        intentData = await intentRes.json();
        if (!intentRes.ok || !intentData.client_secret) {
          throw new Error(intentData.error || 'Could not initialise payment.');
        }

        // 3) confirm setup (saves the card, no charge)
        btn.textContent = 'Confirming...';
        var confirmRes = await stripe.confirmSetup({
          elements: elements,
          clientSecret: intentData.client_secret,
          confirmParams: { payment_method_data: { billing_details: { name: name, email: email } } },
          redirect: 'if_required'
        });
        if (confirmRes.error) throw new Error(confirmRes.error.message || 'Could not save card');
        pmId = confirmRes.setupIntent && confirmRes.setupIntent.payment_method;
        if (!pmId) throw new Error('Card not saved. Please try again.');
      }

      // 4) persist the pending booking
      btn.textContent = 'Sending request...';
      var saveRes = await fetch(URL_ + '/functions/v1/save-pending-booking', {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: UID,
          client_name: name,
          client_email: email,
          service: (selService && selService.name) ? selService.name : 'Booking',
          booking_date: selDate,
          booking_time: fmtMin(selSlot) + ':00',
          duration_minutes: selDur,
          environment: PAYMENT_ENV,
          stripe_customer_id: intentData.customer_id,
          stripe_payment_method_id: pmId,
          stripe_setup_intent_id: intentData.setup_intent_id,
          resource_id: settings.resources_enabled ? selResource : null,
          party_size: settings.party_size_enabled ? partySize() : null,
          service_id: selService ? selService.id : null,
          payment_option: selPayOption,
          end_date: dailyOn() ? selEndDate : null,
          rental_days: dailyOn() ? rentalDays() : null,
          promo_code: promoDiscount ? document.getElementById('bw-promo').value.trim() : null
        })
      });
      var saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.ok) throw new Error(saveData.error || 'Could not save booking');

      document.getElementById('bw').style.display = 'none';
      document.getElementById('bw-done').style.display = 'block';
    } catch(e){
      showErr((e && e.message) ? String(e.message) : 'Something went wrong');
      btn.disabled = false; btn.textContent = 'Request Booking';
    }
  });

  function loadStripeJs(cb){
    if (window.Stripe) return cb();
    var s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.onload = cb;
    s.onerror = function(){ document.getElementById('bw-payel').textContent = 'Could not load payment form.'; };
    document.head.appendChild(s);
  }

  var endRange = (function(){ var d = new Date(); d.setDate(d.getDate()+60); return fmtDate(d); })();
  Promise.all([
    api('/rest/v1/rpc/get_widget_settings', { method: 'POST', body: JSON.stringify({ p_user_id: UID }) }).then(function(r){ return r.json(); }),
    api('/rest/v1/rpc/get_busy_slots', { method: 'POST', body: JSON.stringify({ p_user_id: UID, p_from: fmtDate(new Date()), p_to: endRange }) }).then(function(r){ return r.json(); }),
    api('/rest/v1/rpc/get_widget_date_overrides', { method: 'POST', body: JSON.stringify({ p_user_id: UID, p_from: fmtDate(new Date()), p_to: endRange }) }).then(function(r){ return r.json(); }),
    api('/rest/v1/rpc/get_widget_resources', { method: 'POST', body: JSON.stringify({ p_user_id: UID }) }).then(function(r){ return r.json(); }),
    api('/rest/v1/rpc/get_widget_services', { method: 'POST', body: JSON.stringify({ p_user_id: UID }) }).then(function(r){ return r.json(); }).catch(function(){ return []; })
  ]).then(function(arr){
    if (arr[0] && arr[0][0]) {
      var s = arr[0][0];
      Object.keys(s).forEach(function(k){ if (s[k] !== null && s[k] !== undefined) settings[k] = s[k]; });
      applyTheme(PREVIEW_THEME || {
        accent: s.accent_color, bg: s.widget_bg_color, text: s.widget_text_color,
        font: s.widget_font, radius: s.widget_radius, logo: s.widget_logo_url
      });
      if (settings.business_name) document.getElementById('bw-title').textContent = 'Book at ' + settings.business_name;
      if (settings.welcome_message) {
        var sub = document.querySelector('.bw .sub');
        if (sub) sub.textContent = settings.welcome_message;
      }
      var depAmt = Number(settings.deposit_amount);
      var ccy = (settings.currency || 'GBP').toUpperCase();
      var sym = ccy === 'USD' ? '$' : ccy === 'EUR' ? '€' : ccy === 'JPY' ? '¥' : ccy === 'AUD' ? 'A$' : ccy === 'CAD' ? 'C$' : '£';
      document.getElementById('bw-deposit').textContent = sym + depAmt.toFixed(ccy === 'JPY' ? 0 : 2) + ' deposit';
    } else {
      document.getElementById('bw-deposit').textContent = 'Booking';
    }
    busy = Array.isArray(arr[1]) ? arr[1] : [];
    (Array.isArray(arr[2]) ? arr[2] : []).forEach(function(o){ overrides[o.override_date] = o; });
    resources = Array.isArray(arr[3]) ? arr[3] : [];
    services = Array.isArray(arr[4]) ? arr[4] : [];
    var today = new Date();
    var startI = settings.allow_same_day ? 0 : 1;
    var maxI = Math.min(settings.max_advance_days || 14, 60);
    selDate = null;
    for (var i = startI; i <= maxI; i++){
      var dc = new Date(today); dc.setDate(dc.getDate()+i);
      var dsc = fmtDate(dc);
      var hc = dayHoursFor(dsc);
      if (hc.closed) continue;
      var cutc = pastCutoff(dsc);
      var lastStart = toMin(hc.close) - 30;
      if (cutc >= 0 && lastStart < cutc) continue; // today's slots all gone
      selDate = dsc; break;
    }
    if (!selDate){ var d0 = new Date(today); d0.setDate(d0.getDate()+startI); selDate = fmtDate(d0); }

    if (settings.payments_enabled === false) {
      showBlocked();
      return;
    }
    renderAll();
    loadStripeJs(mountStripeElements);
  }).catch(function(e){
    document.getElementById('bw-deposit').textContent = 'Could not load';
  });
})();
`;


const RESIZE_SCRIPT = `
(function(){
  if (window.parent === window) return;
  var last = 0;
  function send(){
    var h = 0;
    var cards = document.querySelectorAll('.bw');
    for (var i = 0; i < cards.length; i++){
      var c = cards[i];
      if (c.offsetParent === null) continue; // hidden
      var r = c.getBoundingClientRect();
      h = Math.max(h, Math.ceil(r.bottom + window.scrollY) + 8);
    }
    if (!h) h = document.documentElement.scrollHeight;
    if (!h || Math.abs(h - last) < 4) return;
    last = h;
    try { window.parent.postMessage({ type: 'booksuite:height', height: h }, '*'); } catch (e) {}
  }
  window.addEventListener('load', send);
  setInterval(send, 400);
  if (window.ResizeObserver) { new ResizeObserver(send).observe(document.documentElement); }
  send();
})();
`;

export const buildWidgetHtml = (opts: {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  paymentEnvironment?: "sandbox" | "live";
  stripePublishableKey: string;
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Book an Appointment</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
<style>${WIDGET_STYLES}</style>
</head>
<body>
${WIDGET_MARKUP}
<script>${buildWidgetScript(opts)}</script>
<script>${RESIZE_SCRIPT}</script>
</body>
</html>`;
