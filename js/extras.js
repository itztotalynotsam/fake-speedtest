// Extra features, kept together: live graph, test scenarios, peak-hours congestion, server search,
// quality verdict, shareable result image, test history, keyboard shortcuts, shareable settings link.
// The simulation and app files call the functions exported at the bottom (window.xxx).
(function(){
  const fmt = v => { const f = formatSpeed(v); return f.value + ' ' + f.unit; };   // 940 -> "940.00 Mbps"

// ---------- 1. Live speed graph ----------
  // Every ~100 ms the download/upload phases report [time fraction, speed]; we draw both lines over the same time axis.
  const gCv = el('graph'), gc = gCv.getContext('2d'), gWrap = el('graphWrap');
  let series = {download:[], upload:[]};
  const COLORS = {download:['93,255,180','63,216,255'], upload:['255,110,199','178,123,255']};

  // Size a canvas to its CSS box at the screen's pixel density.
  function fit(cv, ctx){
    const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
    if(cv.width !== Math.round(r.width*d) || cv.height !== Math.round(r.height*d)){ cv.width = r.width*d; cv.height = r.height*d; }
    ctx.setTransform(d,0,0,d,0,0);
    return [r.width, r.height];
  }
  // Compact axis label: 670 Mbps, 1.2 Gbps.
  const short = v => v >= 1000 ? (v/1000).toFixed(1)+' Gbps' : Math.round(v)+' Mbps';
  function drawGraph(){
    const [w,h] = fit(gCv, gc);
    gc.clearRect(0,0,w,h);
    const all = series.download.concat(series.upload);
    if(!all.length) return;
    const max = Math.max(...all.map(p=>p[1])) * 1.1, padL = 54, padB = 6;
    gc.font = '11px "Martian Mono", monospace'; gc.textBaseline = 'middle';
    for(let i=0;i<=2;i++){                                           // faint grid lines with speed labels
      const y = 8 + (h-8-padB)*(1 - i/2);
      gc.strokeStyle = 'rgba(160,210,255,.1)'; gc.beginPath(); gc.moveTo(padL,y); gc.lineTo(w,y); gc.stroke();
      gc.fillStyle = 'rgba(190,220,232,.5)'; gc.fillText(i ? short(max*i/2) : '0', 0, y);
    }
    for(const phase of ['download','upload']){
      const pts = series[phase]; if(pts.length < 2) continue;
      const [a,b] = COLORS[phase];
      const X = p => padL + p[0]*(w-padL), Y = p => 8 + (h-8-padB)*(1 - p[1]/max);
      gc.beginPath(); pts.forEach((p,i)=> i ? gc.lineTo(X(p),Y(p)) : gc.moveTo(X(p),Y(p)));
      const lg = gc.createLinearGradient(padL,0,w,0); lg.addColorStop(0,`rgb(${a})`); lg.addColorStop(1,`rgb(${b})`);
      gc.strokeStyle = lg; gc.lineWidth = 2; gc.lineJoin = 'round'; gc.shadowColor = `rgba(${a},.8)`; gc.shadowBlur = 10; gc.stroke(); gc.shadowBlur = 0;
      gc.lineTo(X(pts[pts.length-1]), h-padB); gc.lineTo(X(pts[0]), h-padB); gc.closePath();   // soft fill under the line
      const fg = gc.createLinearGradient(0,0,0,h); fg.addColorStop(0,`rgba(${a},.22)`); fg.addColorStop(1,`rgba(${a},0)`);
      gc.fillStyle = fg; gc.fill();
    }
  }
  function graphReset(){ series = {download:[], upload:[]}; gWrap.classList.add('show'); drawGraph(); }
  function graphPoint(phase, x, v){ if(series[phase]){ series[phase].push([x,v]); drawGraph(); } }

// ---------- 2. Scenarios: ways the speed changes mid-test ----------
  const scenarioSel = el('scenarioSel');
  // Multiplier for the target speed at progress p (0..1 through the phase).
  function scenarioFactor(p, seed){
    switch(scenarioSel.value){
      case 'boost':  return p < 0.2 ? 1.25 : 1.25 - Math.min(1,(p-0.2)/0.1)*0.5;   // fast start, then settles at 75%
      case 'cap':    return p < 0.5 ? 1 : 0.03;                                     // data cap hit halfway: throttled
      case 'wobble': return 0.72 + 0.28*Math.sin(p*Math.PI*5 + seed);               // weak Wi-Fi signal drifting
      default:       return 1;
    }
  }

// ---------- 3. Peak-hours congestion ----------
  const peakSel = el('peakSel');
  const SHARED = /cable|wifi|wisp|lte|5g|mobile|hotspot|mesh|campus|dorm|star|satellite|hotel|public|fixedwireless|cbrs/i;  // shared-medium connections feel congestion most
  // Returns {speed: multiplier, ping: extra ms} for the chosen time of day.
  function peakImpact(){
    const mode = peakSel.value;
    if(mode === 'off') return {speed:1, ping:0};
    const hour = mode==='evening' ? 21 : mode==='night' ? 4 : new Date().getHours();
    const night = hour >= 1 && hour <= 5;
    const load = night ? 0 : (hour >= 19 && hour <= 22) ? 1 : ((hour >= 17 && hour < 19) || hour === 23) ? 0.55 : 0.3;   // how busy the network is
    const shared = SHARED.test(presetSel.value) || presetSel.value === 'custom' || presetSel.value === '';
    const k = shared ? 0.30 : 0.07;                                  // shared links lose up to 30%, dedicated lines ~7%
    return {speed: 1 - load*k + (night ? 0.04 : 0), ping: load*k*cfg.ping*2.5};
  }

// ---------- 4. Server search before the test ----------
  async function findServer(){
    setPhase('finding', true);
    bigUnit.textContent = ''; bigValue.textContent = '···';
    pingValEl.textContent = jitterValEl.textContent = '—';
    const names = Object.keys(locationMeta).filter(k => k !== 'auto').map(k => locationMeta[k].label);
    for(let i=0;i<6;i++){                                            // flick through random servers...
      el('serverLine').textContent = 'Server: Testing ' + names[Math.floor(Math.random()*names.length)];
      await sleep(170);
    }
    updateServerLine();                                              // ...then settle on the chosen one
  }

// ---------- 5. Quality verdict ----------
  const verdictEl = el('verdict'), actionsEl = el('actions');
  const rate = (good, ok) => good ? 'great' : ok ? 'ok' : 'poor';
  function fmtTime(s){ return s < 90 ? Math.round(s)+' sec' : s < 5400 ? Math.round(s/60)+' min' : s < 172800 ? (s/3600).toFixed(1)+' hours' : (s/86400).toFixed(1)+' days'; }
  function showVerdict(r){
    const sec = 50*8000/Math.max(r.down, 0.01);                      // time to download a 50 GB game
    const items = [
      ['4K streaming',   rate(r.down >= 25 && r.loss < 2, r.down >= 10 && r.loss < 5)],
      ['Video calls',    rate(r.down >= 5 && r.up >= 5 && r.ping < 100 && r.jitter < 30, r.up >= 2.5 && r.down >= 3 && r.ping < 200)],
      ['Online gaming',  rate(r.ping < 40 && r.jitter < 15 && r.loss < 1, r.ping < 100 && r.loss < 3)],
      ['50 GB game in ' + fmtTime(sec), rate(sec < 600, sec < 3600)],
    ];
    const greats = items.filter(i => i[1]==='great').length, poors = items.filter(i => i[1]==='poor').length;
    const line = greats === 4 ? 'Great for everything you throw at it.' : poors === 4 ? 'This connection will struggle with almost everything.'
               : poors ? 'Fine for the basics, but some things will struggle.' : 'Good for most things.';
    verdictEl.innerHTML = `<div class="verdict-line">${line}</div><div class="chips">` +
      items.map(i => `<span class="chip ${i[1]}">${i[0]} <b>${i[1]==='ok' ? 'okay' : i[1]}</b></span>`).join('') + '</div>';
    verdictEl.classList.add('show');
  }

// ---------- 6. Shareable result image ----------
  let lastResult = null;
  async function saveImage(){
    const r = lastResult; if(!r) return;
    try{ await document.fonts.load('500 80px "Martian Mono"'); await document.fonts.load('800 40px "Bricolage Grotesque"'); }catch(e){}
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 630;
    const x = cv.getContext('2d');
    // fill the card with the sky, keeping the upper part (moon, planets, aurora) in frame
    const cover = src => { const s = Math.max(1200/src.width, 630/src.height); x.drawImage(src, (1200-src.width*s)/2, (630-src.height*s)*0.12, src.width*s, src.height*s); };
    cover(el('aurora')); x.globalCompositeOperation = 'screen'; cover(el('bodies')); x.globalCompositeOperation = 'source-over';   // the current sky as background
    const shade = x.createLinearGradient(0,0,0,630); shade.addColorStop(0,'rgba(3,9,18,.25)'); shade.addColorStop(1,'rgba(3,9,18,.75)');
    x.fillStyle = shade; x.fillRect(0,0,1200,630);
    const grad = (c1,c2,x0,x1) => { const g = x.createLinearGradient(x0,0,x1,0); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; };
    x.textBaseline = 'alphabetic';
    x.font = '800 44px "Bricolage Grotesque", sans-serif'; x.fillStyle = grad('#5dffb4','#b27bff',60,260); x.fillText('Testspeed', 60, 86);
    const big = (label, mbps, x0, c1, c2) => {                       // one big speed block
      const f = formatSpeed(mbps);
      x.font = '500 26px "Bricolage Grotesque", sans-serif'; x.fillStyle = 'rgba(210,235,245,.7)'; x.fillText(label, x0, 215);
      x.font = '500 96px "Martian Mono", monospace'; x.fillStyle = grad(c1,c2,x0,x0+420); x.fillText(f.value, x0, 315);
      x.font = '500 28px "Bricolage Grotesque", sans-serif'; x.fillStyle = 'rgba(210,235,245,.7)'; x.fillText(f.unit, x0, 360);
    };
    big('Download', r.down, 60, '#5dffb4', '#3fd8ff'); big('Upload', r.up, 640, '#ff6ec7', '#b27bff');
    [['Ping', r.ping], ['Jitter', r.jitter], ['Download ping', r.dlPing], ['Upload ping', r.ulPing]].forEach((s,i) => {
      const x0 = 60 + i*285;
      x.font = '500 22px "Bricolage Grotesque", sans-serif'; x.fillStyle = 'rgba(210,235,245,.6)'; x.fillText(s[0], x0, 440);
      x.font = '500 34px "Martian Mono", monospace'; x.fillStyle = '#e9f6f4'; x.fillText(Math.round(s[1]) + ' ms', x0, 485);
    });
    x.font = '500 24px "Bricolage Grotesque", sans-serif'; x.fillStyle = 'rgba(210,235,245,.85)';
    x.fillText(`${r.isp} on ${r.net}, server: ${r.server}`, 60, 560);
    x.font = '400 20px "Bricolage Grotesque", sans-serif'; x.fillStyle = 'rgba(210,235,245,.5)';
    x.fillText('Simulated result, ' + r.when, 60, 595);
    cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'testspeed-result.png'; a.click(); URL.revokeObjectURL(a.href); });
  }
  el('shareBtn').addEventListener('click', saveImage);

// ---------- 7. Test history (kept in this browser) ----------
  const HKEY = 'testspeed.history', hWrap = el('history'), hCv = el('histCanvas'), hc = hCv.getContext('2d');
  const loadHist = () => { try{ return JSON.parse(localStorage.getItem(HKEY)) || []; }catch(e){ return []; } };
  const saveHist = h => { try{ localStorage.setItem(HKEY, JSON.stringify(h)); }catch(e){} };
  function drawHist(){
    const h = loadHist();
    hWrap.classList.toggle('show', h.length >= 2);
    if(h.length < 2) return;
    el('histTitle').textContent = `Last ${h.length} tests`;
    const [w,ht] = fit(hCv, hc); hc.clearRect(0,0,w,ht);
    const max = Math.max(...h.map(r => Math.max(r.down, r.up))) * 1.1;
    [['down','93,255,180'],['up','255,110,199']].forEach(([k,col]) => {
      const P = i => [8 + i*(w-16)/(h.length-1), 6 + (ht-12)*(1 - h[i][k]/max)];
      hc.beginPath(); h.forEach((_,i) => i ? hc.lineTo(...P(i)) : hc.moveTo(...P(i)));
      hc.strokeStyle = `rgb(${col})`; hc.lineWidth = 2; hc.lineJoin = 'round'; hc.stroke();
      hc.fillStyle = `rgb(${col})`; h.forEach((_,i) => { hc.beginPath(); hc.arc(...P(i), 3, 0, 7); hc.fill(); });
    });
  }
  el('clearHistory').addEventListener('click', () => { saveHist([]); drawHist(); });

// ---------- 8. Called by app.js around each test ----------
  function hideExtras(){ verdictEl.classList.remove('show'); actionsEl.classList.remove('show'); }
  function onTestComplete(r){
    lastResult = Object.assign({}, r, {
      isp: currentIspName(), server: currentLocationLabel(), net: el('netLabel').textContent,
      when: new Date().toLocaleString(undefined, {dateStyle:'medium', timeStyle:'short'}),
    });
    showVerdict(r); actionsEl.classList.add('show'); drawGraph();
    const h = loadHist(); h.push({down:r.down, up:r.up, ping:r.ping}); saveHist(h.slice(-8)); drawHist();   // keep the last 8
  }

// ---------- 9. Keyboard shortcuts ----------
  addEventListener('keydown', e => {
    const typing = /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(e.target.tagName);
    if(e.code === 'Space' && !typing && !el('configPanel').classList.contains('show') && !startBtn.disabled){ e.preventDefault(); startBtn.click(); }   // space = start test
    if(e.key === 'Escape') closePanel();
  });

// ---------- 10. Shareable settings link ----------
  const fields = () => [...document.querySelectorAll('#configPanel input[id], #configPanel select[id]')];
  const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
  // Every setting in the drawer, packed into a short code.
  function encodeSettings(){ const o = {}; fields().forEach(f => o[f.id] = f.type === 'checkbox' ? f.checked : f.value); return b64(JSON.stringify(o)); }
  // Apply a code: set each control and fire its event so the rest of the page updates.
  function restoreSettings(code){
    try{
      const o = JSON.parse(unb64(code));
      fields().forEach(f => {                                        // drawer order puts the preset first, so custom values win
        if(!(f.id in o)) return;
        if(f.type === 'checkbox') f.checked = !!o[f.id]; else f.value = o[f.id];
        f.dispatchEvent(new Event(f.tagName === 'SELECT' || f.type === 'checkbox' ? 'change' : 'input', {bubbles:true}));
      });
      if('preset' in o) presetSel.value = o.preset;                  // slider events flip the preset to Custom; put it back
      readCfgFromControls(); syncLabels(); updateServerLine(); updateDeviceLine(); updateWeatherLine();
    }catch(e){}
  }
  el('copyLinkBtn').addEventListener('click', async () => {
    const url = location.href.split('#')[0] + '#s=' + encodeSettings();
    history.replaceState(null, '', url);
    try{ await navigator.clipboard.writeText(url); }catch(e){ prompt('Copy this link:', url); }
    const b = el('copyLinkBtn'); b.textContent = 'Link copied'; setTimeout(() => b.textContent = 'Copy settings link', 1800);
  });
  if(location.hash.startsWith('#s=')) restoreSettings(location.hash.slice(3));

  addEventListener('resize', () => { drawGraph(); drawHist(); });
  drawHist();
  Object.assign(window, {graphReset, graphPoint, scenarioFactor, peakImpact, findServer, hideExtras, onTestComplete});
})();
