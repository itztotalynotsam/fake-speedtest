// Signal & distance simulation for wireless connections (5G/4G/3G/2G, Wi-Fi, mesh, fixed wireless, Bluetooth).
// Model: signal strength falls with distance (log-distance path loss), minus losses from walls/buildings,
// plus slow random fading. Signal quality then scales speed, ping, jitter and packet loss.
// Wired connections (fibre, cable...) ignore all of this.
(function(){
  const rand = (a,b) => a + Math.random()*(b-a), clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  // ref = dBm at d0 metres, n = how fast the signal fades with distance, best/worst = dBm for full/no quality,
  // maxPing = extra ms of latency at the worst signal, src = what you are measuring the distance to
  const KINDS = {
    five_g:   {ref:-70, d0:100, n:3.4, best:-70, worst:-118, maxPing:60,  src:'cell'},
    four_g:   {ref:-72, d0:100, n:2.7, best:-70, worst:-120, maxPing:110, src:'cell'},
    three_g:  {ref:-70, d0:100, n:2.5, best:-65, worst:-115, maxPing:220, src:'cell'},
    two_g:    {ref:-65, d0:100, n:2.4, best:-60, worst:-110, maxPing:450, src:'cell'},
    wifi:     {ref:-40, d0:1,   n:3.2, best:-45, worst:-90,  maxPing:70,  src:'router'},
    mesh:     {ref:-40, d0:1,   n:3.0, best:-45, worst:-90,  maxPing:60,  src:'mesh node'},
    tower:    {ref:-60, d0:100, n:2.6, best:-60, worst:-100, maxPing:90,  src:'tower'},
    bluetooth:{ref:-50, d0:1,   n:3.0, best:-55, worst:-95,  maxPing:120, src:'device'},
  };
  const FRACTION = {near:.08, good:.3, fair:.6, poor:.95};         // preset distance as a share of the usable range
  const MOVES = {still:0, walk_away:1.4, walk_toward:-1.4, drive_away:20, drive_toward:-20};   // metres per second
  const OFF = {on:false, factor:1, ping:0, jitter:1, loss:0, q:1};

  const sel = el('sigPreset'), customWrap = el('sigCustomWrap'), distIn = el('sigDist'), extraIn = el('sigExtra');
  const moveSel = el('sigMove'), lineEl = el('signalLine'), hintEl = el('sigHint');
  let base = 100, extraDb = 0, t0 = performance.now(), seed = 0;

  const kind = () => KINDS[netIconSelect.value] || null;
  // Distance where quality drops to 15% (the practical edge of coverage).
  const edge = k => k.d0 * Math.pow(10, (k.ref - (k.worst + 0.15*(k.best-k.worst))) / (10*k.n));
  const fmtDist = m => m >= 1000 ? (m/1000).toFixed(1) + ' km' : Math.round(m) + ' m';
  const qLabel = q => q > .75 ? 'Excellent' : q > .5 ? 'Good' : q > .3 ? 'Fair' : q > .1 ? 'Poor' : 'Very poor';

  // Decide the starting distance and obstruction loss for this test.
  function pickBase(){
    const k = kind(); if(!k) return;
    const p = sel.value;
    if(p === 'custom'){ base = Math.max(1, +distIn.value || 1); extraDb = clamp(+extraIn.value || 0, 0, 60); }
    else if(p === 'auto'){ base = edge(k) * Math.pow(10, rand(-1.3, 0)); extraDb = rand(0, 14); }   // random spot, maybe behind a wall
    else { base = edge(k) * FRACTION[p]; extraDb = 0; }
  }

  // Signal state right now: distance (changes if moving), fading, and the effects on the connection.
  function signalNow(){
    const k = kind(); if(!k) return OFF;
    const t = (performance.now() - t0) / 1000;
    const d = Math.max(1, base + MOVES[moveSel.value]*t);
    const fade = 2.2*Math.sin(t*1.7 + seed) + 1.3*Math.sin(t*3.9 + seed*2);          // slow multipath fading, in dB
    const sig = k.ref - 10*k.n*Math.log10(d/k.d0) - extraDb + fade;
    const q = clamp((sig - k.worst) / (k.best - k.worst), 0, 1);
    return {on:true, q, sig, d, k, factor: 0.03 + 0.97*Math.pow(q,1.5), ping: Math.pow(1-q,2)*k.maxPing,
            jitter: 1 + (1-q)*4, loss: Math.pow(1-q,3)*8};
  }

  // Show the signal line under the button (hidden for wired connections).
  function signalLineUpdate(s){
    s = s || signalNow();
    lineEl.style.display = s.on ? '' : 'none';
    if(s.on) lineEl.textContent = `Signal: ${Math.round(s.sig)} dBm (${qLabel(s.q)}), ${fmtDist(s.d)} from ${s.k.src}`;
  }
  function refreshHint(){
    const k = kind();
    hintEl.textContent = k ? `Usable range for ${el('netLabel').textContent} is roughly ${fmtDist(edge(k))}. Moving during the test changes the distance live.`
                           : 'Signal and distance only apply to wireless connections (mobile, Wi-Fi, fixed wireless). This connection type ignores them.';
  }
  // Called whenever a setting changes: pick a fresh starting point and refresh the display.
  function preview(){ customWrap.style.display = sel.value === 'custom' ? 'block' : 'none'; pickBase(); t0 = performance.now(); seed = Math.random()*10; refreshHint(); signalLineUpdate(); }
  // Called at the start of each test.
  function signalStart(){ pickBase(); t0 = performance.now(); seed = Math.random()*10; }

  [sel, moveSel].forEach(e => e.addEventListener('change', preview));
  [distIn, extraIn].forEach(e => e.addEventListener('input', preview));
  const origSetIcon = window.setNetIcon;                              // presets change the icon in code, so hook the function
  window.setNetIcon = function(t){ origSetIcon(t); preview(); };
  preview();
  Object.assign(window, {signalNow, signalStart, signalLineUpdate});
})();
