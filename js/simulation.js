// The actual speed-test simulation: noise/formatting helpers, the ping
// phase, the download/upload throughput phase, and the connection-failure
// simulation.

  // Random number with a bell-curve distribution (Box-Muller): most values near 0, few far away.
  function gaussianNoise(){
    // Box-Muller
    let u=0,v=0;
    while(u===0) u=Math.random();
    while(v===0) v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  // Smooth wobble made of two sine waves plus a little random noise; gives speeds a natural jitter.
  function noiseWave(t, seed, magnitude){
    return magnitude*(
      0.5*Math.sin(t*0.85+seed) +
      0.28*Math.sin(t*2.1+seed*1.7) +
      0.14*gaussianNoise()
    );
  }

  // Pause helper: `await sleep(200)` waits 200 ms.
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  // Picks the friendliest unit (Mbps / Gbps / Tbps) for a speed in Mbps.
  function formatSpeed(mbps){
    if(mbps>=1000000) return {value:(mbps/1000000).toFixed(2), unit:'Tbps'};
    if(mbps>=1000) return {value:(mbps/1000).toFixed(2), unit:'Gbps'};
    return {value:mbps.toFixed(2), unit:'Mbps'};
  }

// ---------- Phase label / big number / failure-panel DOM refs ----------
  const phaseLabel = el('phaseLabel'), bigValue = el('bigValue'), bigUnit = el('bigUnit'), bigNumber = el('bigNumber');
  const pingValEl = el('pingVal'), jitterValEl = el('jitterVal'), dlPingValEl = el('dlPingVal'), ulPingValEl = el('ulPingVal');
  const progressBar = el('progressBar');
  // Fills the thin progress bar under the readout (0..1); hidden when 0 or 1.
  function setProgress(f){
    progressBar.style.transform = `scaleX(${f})`;
    progressBar.parentElement.classList.toggle('on', f>0 && f<1);
  }
  const errorMessageEl = el('errorMessage');
  const failToggle = el('failToggle');
  const failModeWrap = el('failModeWrap'), failModeSelect = el('failModeSelect');
  const failCustomWrap = el('failCustomWrap'), failCustomCode = el('failCustomCode'), failCustomMsg = el('failCustomMsg');

  // Returns the {code, msg} of the failure the user chose (custom, random, or a preset).
  function currentFailure(){
    const mode = failModeSelect.value;
    if(mode==='custom'){
      const code = (failCustomCode.value||'').trim() || 'ERR_CUSTOM_001';
      const msg = (failCustomMsg.value||'').trim() || 'Failed to connect to network. Contact your provider for further information.';
      return {code, msg};
    }
    if(mode==='random'){
      const keys = Object.keys(failurePresets);
      const pick = keys[Math.floor(Math.random()*keys.length)];
      return failurePresets[pick];
    }
    return failurePresets[mode] || failurePresets.conn_refused;
  }
  failToggle.addEventListener('change', ()=>{
    failModeWrap.style.display = failToggle.checked ? 'block' : 'none';
    failCustomWrap.style.display = (failToggle.checked && failModeSelect.value==='custom') ? 'block' : 'none';
  });
  failModeSelect.addEventListener('change', ()=>{
    failCustomWrap.style.display = (failToggle.checked && failModeSelect.value==='custom') ? 'block' : 'none';
  });

  // Plain-language label for each phase key.
  const PHASE_LABELS = {ping:'Measuring ping', download:'Measuring download', finding:'Finding nearest server', upload:'Measuring upload', done:'Complete', connecting:'Connecting'};

  // Updates the label above the big number and tells the page which phase we're in
  // (body[data-phase] drives the colours in the CSS).
  function setPhase(key, active){
    key = key.toLowerCase();
    setProgress(0);
    phaseLabel.textContent = PHASE_LABELS[key] || key;
    document.body.dataset.phase = PHASE_LABELS[key] ? key : 'idle';
    phaseLabel.classList.toggle('active', !!active);
    phaseLabel.classList.remove('error');
    bigNumber.classList.remove('error');
    errorMessageEl.classList.remove('show');
  }

// ---------- Ping phase ----------
  async function runPing(){
    setPhase('PING', true);
    bigUnit.textContent = '';
    bigValue.textContent = '···';   // the big number waits; ping shows up in the small Ping stat instead
    const locExtra = currentLocationExtra();
    const weatherImpact = currentWeatherImpact();
    const peak = peakImpact();   // time-of-day congestion
    const effectivePing = cfg.ping + locExtra + weatherImpact*120 + peak.ping;
    const effectiveJitter = cfg.jitter * (1 + weatherImpact*2.5) * (1 + (1-peak.speed)*3);
    // the gauge stays calm during ping: park it at its idle position and keep the sky's ping colours
    setGaugeMax(2); pushSample(0.6, 'idle'); aurora.setPhase('ping');
    const samples = [];
    const count = 10;
    for(let i=0;i<count;i++){
      // occasional spike for realism
      const spike = Math.random() < (0.05 + weatherImpact*0.15) ? effectiveJitter*2.2*Math.random() : 0;
      const val = Math.max(1, effectivePing + gaussianNoise()*effectiveJitter*0.5 + spike);
      samples.push(val);
      // update the small Ping stat with the running average as each sample arrives
      pingValEl.textContent = (samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(0);
      setProgress((i+1)/count);
      await sleep(140);
    }
    const avg = samples.reduce((a,b)=>a+b,0)/samples.length;
    let jitterSum=0;
    for(let i=1;i<samples.length;i++) jitterSum += Math.abs(samples[i]-samples[i-1]);
    const jitterAvg = jitterSum/(samples.length-1);
    pingValEl.textContent = avg.toFixed(0);
    jitterValEl.textContent = jitterAvg.toFixed(1);
    return {ping:avg, jitter:jitterAvg};
  }

// ---------- Throughput phase (download/upload) ----------
  // Runs one phase for cfg.dur seconds and returns {speed, loss, loaded}.
  // Improvements over a plain noisy line:
  //  - time-based events (dips, loss) so the result doesn't depend on screen refresh rate
  //  - a TCP-style ramp with a small overshoot before settling
  //  - a smoothed on-screen number (like real testers) that updates ~10x per second
  //  - run-to-run variation: each run lands a few percent above or below the preset
  //  - "loaded ping" (bufferbloat): latency rises as the link fills up
  //  - final speed = average of the best 80% of samples, so brief dips don't dominate
  async function runThroughput(phase, target){
    setPhase(phase, true);
    bigUnit.textContent = 'Mbps';
    setGaugeMax(gaugeScaleFor(target));   // honours the 'Gauge max speed' setting

    const durationMs = cfg.dur*1000;
    const rampMs = Math.min(1800, durationMs*0.22);
    const weatherImpact = currentWeatherImpact();
    const magnitude = target * (cfg.ins/100) * 0.32 * (1 + weatherImpact*2.5);   // size of the random wobble
    const seed = Math.random()*10;

    // this run's luck: usually within about 4% of the preset, never more than +4% / -10%
    const peak = peakImpact();   // time-of-day congestion lowers the speed and raises latency
    const aim = target * peak.speed * Math.min(1.04, Math.max(0.90, 1 + gaussianNoise()*0.03));

    // how much extra delay a full link adds (slow links bloat more; upload bloats more than download)
    const baseLatency = cfg.ping + currentLocationExtra() + weatherImpact*120 + peak.ping;
    const bloatMs = Math.min(600, 800/Math.sqrt(Math.max(target,1)))
                  * (phase==='upload' ? 1.4 : 1) * (0.3 + cfg.ins/30) * (1 + weatherImpact*2);

    // events per second (not per frame), so 60 Hz and 144 Hz screens behave the same
    const dipPerSec  = 0.1 * (cfg.ins/10 + 1) * (1 + weatherImpact*3);
    const lossPerSec = ((cfg.pl/100)*0.2*(1 + weatherImpact*4) + weatherImpact*0.01) * 60;

    const loadedEl = phase==='upload' ? ulPingValEl : dlPingValEl;   // which small stat this phase fills in
    const start = performance.now();
    const samples = [];          // raw post-ramp speeds, used for the final result
    const loadedSamples = [];    // loaded-ping readings
    let dipUntil = 0, dipDepth = 0;
    let lossEvents = 0, totalTicks = 0;
    let shown = 0;               // smoothed speed shown to the user
    let lastTick = start, lastText = 0;

    return new Promise(resolve=>{
      function tick(now){
        const dt = Math.min(100, now - lastTick);   // ms since last frame (capped if the tab was asleep)
        lastTick = now;
        const elapsed = now - start;
        totalTicks++;
        setProgress(Math.min(1, elapsed/durationMs));

        // ramp: fast climb with a slight overshoot, then settle (like TCP slow-start finishing)
        const p = Math.min(1, elapsed/rampMs);
        const rampFactor = (1 - Math.pow(1-p, 3)) + 0.05*Math.sin(Math.PI*p)*(1-p);

        // random congestion dip: a short, partial slowdown
        if(now > dipUntil && Math.random() < dipPerSec*dt/1000){
          dipUntil = now + 300 + Math.random()*800;
          dipDepth = Math.min(0.85, (0.12 + Math.random()*0.18) * (1 + weatherImpact*2));
        }
        const dipFactor = now < dipUntil ? 1-dipDepth : 1;

        // packet-loss glitch: a sharp one-frame drop
        let lossFactor = 1;
        if(Math.random() < lossPerSec*dt/1000){
          lossFactor = 0.2 + Math.random()*0.25;
          lossEvents++;
        }

        let v = aim*rampFactor*dipFactor*lossFactor*scenarioFactor(elapsed/durationMs, seed) + noiseWave(elapsed/1000, seed, magnitude*rampFactor);
        v = Math.max(0.05, v);

        // smooth what we show (about a quarter-second memory)
        shown += (v - shown) * (1 - Math.exp(-dt/250));
        pushSample(shown, phase);

        // loaded ping grows with how full the link is
        const util = Math.min(1, shown/aim);
        const loaded = baseLatency + bloatMs*util*(0.8 + Math.random()*0.4);

        // only post-ramp samples count toward the result
        if(elapsed > rampMs*1.1){
          samples.push(v);
          loadedSamples.push(loaded);
        }

        // text readouts update ~10 times per second so digits are readable
        if(now - lastText > 100){
          lastText = now;
          const disp = formatSpeed(shown);
          bigValue.textContent = disp.value;
          bigUnit.textContent = disp.unit;
          loadedEl.textContent = loaded.toFixed(0);
          graphPoint(phase, Math.min(1, elapsed/durationMs), shown);   // add a point to the live graph
        }

        if(elapsed >= durationMs){
          // result: drop the slowest 20% of samples, average the rest
          let speed = aim;
          if(samples.length){
            const sorted = samples.slice().sort((a,b)=>a-b);
            const kept = sorted.slice(Math.floor(sorted.length*0.2));
            speed = kept.reduce((a,b)=>a+b,0)/kept.length;
          }
          const loadedAvg = loadedSamples.length ? loadedSamples.reduce((a,b)=>a+b,0)/loadedSamples.length : baseLatency;
          const lossPct = Math.min(50, (lossEvents/Math.max(1,totalTicks))*100 + cfg.pl*0.6 + weatherImpact*8);
          resolve({speed, loss:lossPct, loaded:loadedAvg});
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
