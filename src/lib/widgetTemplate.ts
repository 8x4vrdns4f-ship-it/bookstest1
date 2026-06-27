// Generates the standalone HTML widget that businesses embed on their site.
// Reads business_settings + busy slots from Supabase via anon key.
// The same parts are reused by the React /embed/:userId and /book/:userId pages.

export const WIDGET_STYLES = `
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:transparent}
  .bw{max-width:460px;margin:0 auto;background:#1a1f2e;border-radius:16px;padding:20px;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.3)}
  .bw h2{font-size:18px;margin:0 0 4px;color:#5bade8;font-weight:700}
  .bw .sub{font-size:12px;color:#9ca3af;margin:0 0 16px}
  .bw .deposit{font-size:11px;color:#9ca3af;background:#0f1420;padding:6px 10px;border-radius:6px;margin-bottom:14px;text-align:center}
  .bw .label{font-size:12px;color:#9ca3af;margin:14px 0 6px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .bw .dates{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}
  .bw .dates::-webkit-scrollbar{height:4px}
  .bw .dates::-webkit-scrollbar-thumb{background:#2d3548;border-radius:2px}
  .bw .date{flex:0 0 auto;min-width:54px;padding:8px 6px;border-radius:8px;background:#263040;text-align:center;cursor:pointer;border:1px solid transparent;transition:.15s}
  .bw .date:hover{background:#2d3548}
  .bw .date.sel{background:#5bade8;color:#0f1420;border-color:#5bade8}
  .bw .date .dn{font-size:10px;font-weight:600;text-transform:uppercase;opacity:.7}
  .bw .date .dd{font-size:18px;font-weight:700;line-height:1.2}
  .bw .date .dm{font-size:10px;opacity:.7}
  .bw .slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:220px;overflow-y:auto;padding:2px}
  .bw .slot{padding:8px 4px;border-radius:6px;background:#263040;text-align:center;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:.15s}
  .bw .slot:hover:not(:disabled):not(.busy){background:#2d3548}
  .bw .slot.sel{background:#5bade8;color:#0f1420;border-color:#5bade8}
  .bw .slot.busy{background:#3a1c1c;color:#7f3a3a;cursor:not-allowed;text-decoration:line-through}
  .bw .durs{display:flex;gap:6px;flex-wrap:wrap}
  .bw .dur{flex:1;min-width:64px;padding:8px;border-radius:6px;background:#263040;text-align:center;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:.15s}
  .bw .dur:hover:not(:disabled){background:#2d3548}
  .bw .dur.sel{background:#5bade8;color:#0f1420;border-color:#5bade8}
  .bw .dur:disabled{opacity:.3;cursor:not-allowed}
  .bw input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #2d3548;background:#263040;color:#fff;font-size:14px;outline:none}
  .bw input:focus{border-color:#5bade8}
  .bw .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .bw button.submit{width:100%;padding:12px;border:none;border-radius:8px;background:#5bade8;color:#0f1420;font-weight:700;font-size:14px;cursor:pointer;margin-top:14px;transition:.15s}
  .bw button.submit:hover{background:#4a9ad8}
  .bw button.submit:disabled{opacity:.5;cursor:not-allowed}
  .bw .ok{text-align:center;padding:24px 0}
  .bw .ok .ic{font-size:42px;color:#4ade80;margin-bottom:8px}
  .bw .ok h3{margin:0 0 6px;font-size:16px}
  .bw .ok p{margin:0;font-size:13px;color:#9ca3af}
  .bw .err{background:#3a1c1c;color:#fca5a5;padding:8px 10px;border-radius:6px;font-size:12px;margin-top:8px}
`;

export const WIDGET_MARKUP = `
<div class="bw" id="bw">
  <h2 id="bw-title">Book an Appointment</h2>
  <p class="sub">Pick a day, then tap a start time and duration.</p>
  <div class="deposit" id="bw-deposit">Loading...</div>

  <div class="label">Day</div>
  <div class="dates" id="bw-dates"></div>

  <div class="label">Start time</div>
  <div class="slots" id="bw-slots"></div>

  <div class="label">Duration</div>
  <div class="durs" id="bw-durs"></div>

  <div class="label">Your details</div>
  <div class="row">
    <input id="bw-name" placeholder="Full name" required>
    <input id="bw-email" type="email" placeholder="Email" required>
  </div>

  <div id="bw-err"></div>
  <button class="submit" id="bw-submit" disabled>Request Booking</button>
</div>

<div class="bw" id="bw-done" style="display:none">
  <div class="ok">
    <div class="ic">✓</div>
    <h3>Booking requested!</h3>
    <p>You'll receive an email when the business confirms or declines.</p>
  </div>
</div>
`;

export const buildWidgetScript = (opts: {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  paymentEnvironment?: "sandbox" | "live";
}) => `
(function(){
  var URL_ = ${JSON.stringify(opts.supabaseUrl)};
  var KEY = ${JSON.stringify(opts.supabaseKey)};
  var UID = ${JSON.stringify(opts.userId)};
  var PAYMENT_ENV = ${JSON.stringify(opts.paymentEnvironment || "live")};

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
    buffer_minutes: 0
  };
  var busy = [];
  var overrides = {};
  var selDate = null, selSlot = null, selDur = null;
  var DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];

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
  function busyMinutes(dateStr){
    var set = {};
    var buf = settings.buffer_minutes || 0;
    busy.filter(function(b){ return b.booking_date === dateStr; }).forEach(function(b){
      var s = toMin(b.booking_time) - buf;
      var e = toMin(b.booking_time) + (b.duration_minutes || 30) + buf;
      for (var m = Math.max(0, Math.floor(s/30)*30); m < e; m += 30) set[m] = true;
    });
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
      el.className = 'date' + (selDate === ds ? ' sel' : '') + (hrs.closed ? ' busy' : '');
      el.innerHTML = '<div class="dn">'+d.toLocaleDateString(undefined,{weekday:'short'})+'</div>'+
                     '<div class="dd">'+d.getDate()+'</div>'+
                     '<div class="dm">'+(hrs.closed ? 'Closed' : d.toLocaleDateString(undefined,{month:'short'}))+'</div>';
      if (!hrs.closed){
        (function(ds_){ el.onclick = function(){ selDate = ds_; selSlot = null; selDur = null; renderAll(); }; })(ds);
      }
      wrap.appendChild(el);
    }
  }
  function renderSlots(){
    var wrap = document.getElementById('bw-slots');
    wrap.innerHTML = '';
    if (!selDate){ wrap.innerHTML = '<div style="grid-column:1/-1;color:#9ca3af;font-size:12px;text-align:center;padding:8px">Pick a day first</div>'; return; }
    var hrs = dayHoursFor(selDate);
    if (hrs.closed){ wrap.innerHTML = '<div style="grid-column:1/-1;color:#9ca3af;font-size:12px;text-align:center;padding:8px">Closed this day</div>'; return; }
    var bset = busyMinutes(selDate);
    var startM = toMin(hrs.open), endM = toMin(hrs.close);
    for (var m = startM; m < endM; m += 30){
      var el = document.createElement('div');
      var isBusy = !!bset[m];
      el.className = 'slot' + (isBusy?' busy':'') + (selSlot === m?' sel':'');
      el.textContent = fmtMin(m);
      if (!isBusy){
        (function(mm){ el.onclick = function(){ selSlot = mm; selDur = null; renderAll(); }; })(m);
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
  function renderAll(){
    renderDates(); renderSlots(); renderDurs();
    var btn = document.getElementById('bw-submit');
    var name = document.getElementById('bw-name').value.trim();
    var email = document.getElementById('bw-email').value.trim();
    btn.disabled = !(selDate && selSlot !== null && selDur && name && email);
  }
  document.getElementById('bw-name').addEventListener('input', renderAll);
  document.getElementById('bw-email').addEventListener('input', renderAll);
  document.getElementById('bw-submit').addEventListener('click', async function(){
    var btn = this; btn.disabled = true; btn.textContent = 'Continuing to payment...';
    var errEl = document.getElementById('bw-err'); errEl.innerHTML = '';
    try {
      var res = await fetch(URL_ + '/functions/v1/create-booking-checkout', {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: UID,
          client_name: document.getElementById('bw-name').value.trim(),
          client_email: document.getElementById('bw-email').value.trim(),
          service: 'Booking',
          booking_date: selDate,
          booking_time: fmtMin(selSlot) + ':00',
          duration_minutes: selDur,
          environment: PAYMENT_ENV,
          origin: window.location.origin
        })
      });
      var data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout. Please try again.');
      // Redirect top window (escape iframe if embedded)
      try { window.top.location.href = data.url; } catch(_){ window.location.href = data.url; }
    } catch(e){
      var ed = document.createElement('div');
      ed.className = 'err';
      ed.textContent = (e && e.message) ? String(e.message) : 'Something went wrong';
      errEl.textContent = '';
      errEl.appendChild(ed);
      btn.disabled = false; btn.textContent = 'Request Booking';
    }
  });
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
      document.getElementById('bw-deposit').textContent = 'Deposit: £' + Number(settings.deposit_amount).toFixed(2) + ' (paid securely at checkout)';
    } else {
      document.getElementById('bw-deposit').textContent = 'Booking system';
    }
    busy = Array.isArray(arr[1]) ? arr[1] : [];
    (Array.isArray(arr[2]) ? arr[2] : []).forEach(function(o){ overrides[o.override_date] = o; });
    var today = new Date();
    var startI = settings.allow_same_day ? 0 : 1;
    var d0 = new Date(today); d0.setDate(d0.getDate()+startI);
    selDate = fmtDate(d0);
    renderAll();
  }).catch(function(e){
    document.getElementById('bw-deposit').textContent = 'Could not load. Refresh to try again.';
  });
})();
`;

export const buildWidgetHtml = (opts: {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  paymentEnvironment?: "sandbox" | "live";
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Book an Appointment</title>
<style>${WIDGET_STYLES}</style>
</head>
<body>
${WIDGET_MARKUP}
<script>${buildWidgetScript(opts)}</script>
</body>
</html>`;
