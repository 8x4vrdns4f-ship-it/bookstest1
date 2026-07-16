// Generates the standalone HTML widget that businesses embed on their site.
// Card details are captured inline via Stripe Elements (SetupIntent, no charge).
// The deposit is only charged if/when the business accepts the request.

export const WIDGET_STYLES = `
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:transparent;-webkit-font-smoothing:antialiased}
  .bw{max-width:460px;margin:0 auto;background:#0F1420;border:1px solid #1F2937;border-radius:20px;padding:22px;color:#F3F4F6;box-shadow:0 8px 32px -12px rgba(0,0,0,.55)}
  .bw .head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
  .bw .head .ht{flex:1;min-width:0}
  .bw h2{font-size:20px;margin:0 0 4px;color:#F3F4F6;font-weight:700;letter-spacing:-.01em;line-height:1.2}
  .bw .sub{font-size:13px;color:#94A3B8;margin:0;line-height:1.4}
  .bw .deposit-pill{flex:0 0 auto;font-size:11px;color:#5BADE8;background:rgba(91,173,232,.08);border:1px solid rgba(91,173,232,.25);padding:5px 10px;border-radius:999px;font-weight:600;white-space:nowrap;line-height:1.2}
  .bw .label{font-size:11px;color:#94A3B8;margin:18px 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .bw .dates-wrap{position:relative}
  .bw .dates-wrap::before,.bw .dates-wrap::after{content:'';position:absolute;top:0;bottom:6px;width:18px;pointer-events:none;z-index:1}
  .bw .dates-wrap::before{left:0;background:linear-gradient(90deg,#0F1420,rgba(15,20,32,0))}
  .bw .dates-wrap::after{right:0;background:linear-gradient(-90deg,#0F1420,rgba(15,20,32,0))}
  .bw .dates{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:thin;scroll-behavior:smooth}
  .bw .dates::-webkit-scrollbar{height:4px}
  .bw .dates::-webkit-scrollbar-thumb{background:#1F2937;border-radius:2px}
  .bw .date{flex:0 0 auto;min-width:64px;padding:10px 8px;border-radius:12px;background:transparent;border:1px solid #1F2937;text-align:center;cursor:pointer;transition:background .15s,border-color .15s,transform .1s}
  .bw .date:hover{background:#141B2A;border-color:#2A3547}
  .bw .date.sel{background:#5BADE8;color:#0A0F1A;border-color:#5BADE8}
  .bw .date.closed{opacity:.35;cursor:not-allowed}
  .bw .date.closed .dd{text-decoration:line-through}
  .bw .date .dn{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.75}
  .bw .date .dd{font-size:19px;font-weight:700;line-height:1.2;margin:2px 0}
  .bw .date .dm{font-size:10px;opacity:.65;font-weight:500}
  .bw .slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:220px;overflow-y:auto;padding:2px}
  @media (min-width:400px){.bw .slots{grid-template-columns:repeat(4,1fr)}}
  .bw .slots::-webkit-scrollbar{width:4px}
  .bw .slots::-webkit-scrollbar-thumb{background:#1F2937;border-radius:2px}
  .bw .slot{height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:transparent;border:1px solid #1F2937;text-align:center;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;font-variant-numeric:tabular-nums;letter-spacing:.01em}
  .bw .slot:hover:not(:disabled):not(.busy){background:#141B2A;border-color:#2A3547}
  .bw .slot.sel{background:#5BADE8;color:#0A0F1A;border-color:#5BADE8}
  .bw .slot.busy{color:#4B5563;cursor:not-allowed;text-decoration:line-through;opacity:.6}
  .bw .empty{grid-column:1/-1;color:#64748B;font-size:12px;text-align:center;padding:20px 8px;display:flex;flex-direction:column;align-items:center;gap:6px}
  .bw .empty svg{opacity:.5}
  .bw .durs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .bw .dur{height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:transparent;border:1px solid #1F2937;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;color:inherit;font-family:inherit}
  .bw .dur:hover:not(:disabled){background:#141B2A;border-color:#2A3547}
  .bw .dur.sel{background:#5BADE8;color:#0A0F1A;border-color:#5BADE8}
  .bw .dur:disabled{opacity:.35;cursor:not-allowed}
  .bw input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #1F2937;background:#0A0F1A;color:#F3F4F6;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}
  .bw input::placeholder{color:#64748B}
  .bw input:focus{border-color:#5BADE8;box-shadow:0 0 0 3px rgba(91,173,232,.15)}
  .bw .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  @media (max-width:380px){.bw .row{grid-template-columns:1fr}}
  .bw #bw-payel{background:#0A0F1A;border:1px solid #1F2937;border-radius:10px;padding:12px;min-height:44px}
  .bw .paynote{display:flex;align-items:center;gap:6px;font-size:11px;color:#94A3B8;margin-top:8px;line-height:1.4}
  .bw .paynote svg{flex:0 0 auto;opacity:.7}
  .bw button.submit{width:100%;height:48px;border:none;border-radius:12px;background:#5BADE8;color:#0A0F1A;font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;margin-top:16px;transition:transform .1s,box-shadow .15s,background .15s;letter-spacing:.01em}
  .bw button.submit:hover:not(:disabled){background:#6BB8EC;transform:translateY(-1px);box-shadow:0 6px 18px -6px rgba(91,173,232,.4)}
  .bw button.submit:active:not(:disabled){transform:translateY(0)}
  .bw button.submit:disabled{opacity:.4;cursor:not-allowed}
  .bw .ok{text-align:center;padding:28px 8px}
  .bw .ok .ic{width:56px;height:56px;border-radius:50%;background:rgba(91,173,232,.12);color:#5BADE8;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;margin:0 auto 14px}
  .bw .ok h3{margin:0 0 8px;font-size:17px;font-weight:700}
  .bw .ok p{margin:0 0 16px;font-size:13px;color:#94A3B8;line-height:1.5}
  .bw .ok .again{background:transparent;border:1px solid #1F2937;color:#F3F4F6;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .15s,border-color .15s}
  .bw .ok .again:hover{background:#141B2A;border-color:#2A3547}
  .bw .err{background:#2A1518;color:#FCA5A5;padding:10px 12px 10px 14px;border-radius:8px;border-left:3px solid #EF4444;font-size:12px;margin-top:10px;line-height:1.4}
`;

export const WIDGET_MARKUP = `
<div class="bw" id="bw">
  <div class="head">
    <div class="ht">
      <h2 id="bw-title">Book an Appointment</h2>
      <p class="sub">Pick a day, then tap a start time and duration.</p>
    </div>
    <div class="deposit-pill" id="bw-deposit">Loading…</div>
  </div>

  <div class="label">Day</div>
  <div class="dates-wrap"><div class="dates" id="bw-dates"></div></div>

  <div class="label">Start time</div>
  <div class="slots" id="bw-slots"></div>

  <div class="label">Duration</div>
  <div class="durs" id="bw-durs"></div>

  <div id="bw-party-wrap" style="display:none">
    <div class="label" id="bw-party-label">Party size</div>
    <input id="bw-party" type="number" min="1" max="99" value="2">
  </div>

  <div id="bw-res-wrap" style="display:none">
    <div class="label" id="bw-res-label">Resource</div>
    <div class="slots" id="bw-resources" style="grid-template-columns:repeat(2,1fr)"></div>
  </div>

  <div class="label">Your details</div>
  <div class="row">
    <input id="bw-name" placeholder="Full name" required>
    <input id="bw-email" type="email" placeholder="Email" required>
  </div>

  <div class="label">Card details</div>
  <div id="bw-payel"></div>
  <div class="paynote" id="bw-paynote">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    <span>Your card is only charged if the business accepts your request.</span>
  </div>

  <div id="bw-err"></div>
  <button class="submit" id="bw-submit" disabled>Request Booking</button>
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

export const buildWidgetScript = (opts: {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  paymentEnvironment?: "sandbox" | "live";
  stripePublishableKey: string;
}) => `
(function(){
  var URL_ = ${JSON.stringify(opts.supabaseUrl)};
  var KEY = ${JSON.stringify(opts.supabaseKey)};
  var UID = ${JSON.stringify(opts.userId)};
  var PAYMENT_ENV = ${JSON.stringify(opts.paymentEnvironment || "live")};
  var STRIPE_PK = ${JSON.stringify(opts.stripePublishableKey)};

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
    assignment_mode: 'client_pick'
  };
  var busy = [];
  var overrides = {};
  var resources = [];
  var selDate = null, selSlot = null, selDur = null, selResource = null;
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
  function busyMinutes(dateStr){
    var set = {};
    var buf = settings.buffer_minutes || 0;
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
      var el = document.createElement('div');
      el.className = 'date' + (selDate === ds ? ' sel' : '') + (hrs.closed ? ' closed' : '');
      el.innerHTML = '<div class="dn">'+d.toLocaleDateString(undefined,{weekday:'short'})+'</div>'+
                     '<div class="dd">'+d.getDate()+'</div>'+
                     '<div class="dm">'+(hrs.closed ? 'Closed' : d.toLocaleDateString(undefined,{month:'short'}))+'</div>';
      if (!hrs.closed){
        (function(ds_){ el.onclick = function(){ selDate = ds_; selSlot = null; selDur = null; selResource = null; renderAll(); }; })(ds);
      }
      wrap.appendChild(el);
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
    if (!selDate){ wrap.innerHTML = emptyMsg('Pick a day first'); return; }
    var hrs = dayHoursFor(selDate);
    if (hrs.closed){ wrap.innerHTML = emptyMsg('Closed this day'); return; }
    var bset = busyMinutes(selDate);
    var startM = toMin(hrs.open), endM = toMin(hrs.close);
    for (var m = startM; m < endM; m += 30){
      var el = document.createElement('div');
      var isBusy = !!bset[m];
      el.className = 'slot' + (isBusy?' busy':'') + (selSlot === m?' sel':'');
      el.textContent = fmtMin(m);
      if (!isBusy){
        (function(mm){ el.onclick = function(){ selSlot = mm; selDur = null; selResource = null; renderAll(); }; })(m);
      }
      wrap.appendChild(el);
    }
  }
  function renderDurs(){
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
      (function(dd){ el.onclick = function(){ if (!el.disabled){ selDur = dd; renderAll(); } }; })(d);
      wrap.appendChild(el);
    });
  }
  // Which resources are free for the currently-selected date/time/duration/party?
  function resourceIsFree(resourceId){
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
  function renderParty(){
    var wrap = document.getElementById('bw-party-wrap');
    if (!settings.party_size_enabled) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    document.getElementById('bw-party-label').textContent = 'Party size';
  }
  function renderAll(){
    renderDates(); renderSlots(); renderDurs(); renderParty(); renderResources();
    var btn = document.getElementById('bw-submit');
    var name = document.getElementById('bw-name').value.trim();
    var email = document.getElementById('bw-email').value.trim();
    var needResource = settings.resources_enabled && settings.assignment_mode === 'client_pick';
    var resourceOk = !needResource || !!selResource;
    btn.disabled = !(selDate && selSlot !== null && selDur && name && email && elementsReady && resourceOk);
  }
  document.getElementById('bw-name').addEventListener('input', renderAll);
  document.getElementById('bw-email').addEventListener('input', renderAll);
  document.getElementById('bw-party').addEventListener('input', function(){ selResource = null; renderAll(); });

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
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#5BADE8',
          colorBackground: '#0A0F1A',
          colorText: '#F3F4F6',
          colorTextPlaceholder: '#64748B',
          borderRadius: '10px',
          fontSizeBase: '14px',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        },
        rules: {
          '.Input': { border: '1px solid #1F2937', boxShadow: 'none' },
          '.Input:focus': { border: '1px solid #5BADE8', boxShadow: '0 0 0 3px rgba(91,173,232,.15)' },
          '.Tab': { border: '1px solid #1F2937' }
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
      selSlot = null; selDur = null; selResource = null;
      document.getElementById('bw-name').value = '';
      document.getElementById('bw-email').value = '';
      document.getElementById('bw-err').innerHTML = '';
      var sb = document.getElementById('bw-submit');
      sb.textContent = 'Request Booking';
      if (paymentEl) { try { paymentEl.clear(); } catch(e){} }
      renderAll();
    });
  }

  document.getElementById('bw-submit').addEventListener('click', async function(){
    var btn = this;
    btn.disabled = true; btn.textContent = 'Saving card...';
    document.getElementById('bw-err').innerHTML = '';
    try {
      // 1) validate card form
      var subm = await elements.submit();
      if (subm.error) throw new Error(subm.error.message || 'Card details invalid');

      // 2) create SetupIntent server-side
      var email = document.getElementById('bw-email').value.trim();
      var name = document.getElementById('bw-name').value.trim();
      var intentRes = await fetch(URL_ + '/functions/v1/create-booking-intent', {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: UID, client_email: email, environment: PAYMENT_ENV })
      });
      var intentData = await intentRes.json();
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
      var pmId = confirmRes.setupIntent && confirmRes.setupIntent.payment_method;
      if (!pmId) throw new Error('Card not saved. Please try again.');

      // 4) persist the pending booking
      btn.textContent = 'Sending request...';
      var saveRes = await fetch(URL_ + '/functions/v1/save-pending-booking', {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: UID,
          client_name: name,
          client_email: email,
          service: 'Booking',
          booking_date: selDate,
          booking_time: fmtMin(selSlot) + ':00',
          duration_minutes: selDur,
          environment: PAYMENT_ENV,
          stripe_customer_id: intentData.customer_id,
          stripe_payment_method_id: pmId,
          stripe_setup_intent_id: intentData.setup_intent_id
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
    api('/rest/v1/rpc/get_widget_date_overrides', { method: 'POST', body: JSON.stringify({ p_user_id: UID, p_from: fmtDate(new Date()), p_to: endRange }) }).then(function(r){ return r.json(); })
  ]).then(function(arr){
    if (arr[0] && arr[0][0]) {
      var s = arr[0][0];
      Object.keys(s).forEach(function(k){ if (s[k] !== null && s[k] !== undefined) settings[k] = s[k]; });
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
    var today = new Date();
    var startI = settings.allow_same_day ? 0 : 1;
    var d0 = new Date(today); d0.setDate(d0.getDate()+startI);
    selDate = fmtDate(d0);
    renderAll();
    loadStripeJs(mountStripeElements);
  }).catch(function(e){
    document.getElementById('bw-deposit').textContent = 'Could not load';
  });
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
</body>
</html>`;
