// The actual speed-test simulation: noise/formatting helpers, the ping
// phase, the download/upload throughput phase, and the connection-failure
// simulation.

  function gaussianNoise(){
    // Box-Muller
    let u=0,v=0;
    while(u===0) u=Math.random();
    while(v===0) v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  function noiseWave(t, seed, magnitude){
    return magnitude*(
      0.5*Math.sin(t*0.85+seed) +
      0.28*Math.sin(t*2.1+seed*1.7) +
      0.14*gaussianNoise()
    );
  }

  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  function formatSpeed(mbps){
    if(mbps>=1000000) return {value:(mbps/1000000).toFixed(2), unit:'Tbps'};
    if(mbps>=1000) return {value:(mbps/1000).toFixed(2), unit:'Gbps'};
    return {value:mbps.toFixed(2), unit:'Mbps'};
  }

// ---------- Phase label / big number / failure-panel DOM refs ----------
  const phaseLabel = el('phaseLabel'), bigValue = el('bigValue'), bigUnit = el('bigUnit'), bigNumber = el('bigNumber');
  const pingValEl = el('pingVal'), jitterValEl = el('jitterVal');
  const errorMessageEl = el('errorMessage');
  const failToggle = el('failToggle');
  const failModeWrap = el('failModeWrap'), failModeSelect = el('failModeSelect');
  const failCustomWrap = el('failCustomWrap'), failCustomCode = el('failCustomCode'), failCustomMsg = el('failCustomMsg');

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

  function setPhase(text, active){
    phaseLabel.textContent = text;
    phaseLabel.classList.toggle('active', !!active);
    phaseLabel.classList.remove('error');
    bigNumber.classList.remove('error');
    errorMessageEl.classList.remove('show');
  }

// ---------- Ping phase ----------
  async function runPing(){
    setPhase('PING', true);
    bigUnit.textContent = 'ms';
    const locExtra = currentLocationExtra();
    const weatherImpact = currentWeatherImpact();
    const effectivePing = cfg.ping + locExtra + weatherImpact*120;
    const effectiveJitter = cfg.jitter * (1 + weatherImpact*2.5);
    setGaugeMax(Math.max(200, effectivePing*3));
    const samples = [];
    const count = 10;
    for(let i=0;i<count;i++){
      // occasional spike for realism
      const spike = Math.random() < (0.05 + weatherImpact*0.15) ? effectiveJitter*2.2*Math.random() : 0;
      const val = Math.max(1, effectivePing + gaussianNoise()*effectiveJitter*0.5 + spike);
      samples.push(val);
      bigValue.textContent = val.toFixed(0);
      pushSample(val, 'ping');
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
  async function runThroughput(phase, target){
    setPhase(phase.toUpperCase(), true);
    bigUnit.textContent = 'Mbps';
    setGaugeMax(Math.max(20, target*1.3));
    const durationMs = cfg.dur*1000;
    const rampMs = Math.min(1800, durationMs*0.22);
    const start = performance.now();
    const samples = [];
    const weatherImpact = currentWeatherImpact();
    const magnitude = target * (cfg.ins/100) * 0.32 * (1 + weatherImpact*2.5);
    const seed = Math.random()*10;
    let dipUntil = 0;
    let dipDepth = 0;
    let lossEvents = 0;
    let totalTicks = 0;

    return new Promise(resolve=>{
      function tick(now){
        const elapsed = now-start;
        const tSec = elapsed/1000;
        totalTicks++;

        // ramp shape (TCP slow-start-ish)
        const rampProgress = Math.min(1, elapsed/rampMs);
        const rampFactor = 1 - Math.pow(1-rampProgress, 3); // ease-out cubic

        // random congestion dip (rarer, shallower = more stable; worse in bad weather)
        if(now > dipUntil && Math.random() < 0.0016*(cfg.ins/10+1)*(1+weatherImpact*3)){
          dipUntil = now + 300 + Math.random()*800;
          dipDepth = Math.min(0.85, (0.12 + Math.random()*0.18) * (1 + weatherImpact*2));
        }
        let dipFactor = 1;
        if(now < dipUntil){
          dipFactor = 1-dipDepth;
        }

        // packet loss glitch (worse in bad weather for line-of-sight/satellite links)
        let lossFactor = 1;
        if((cfg.pl>0 || weatherImpact>0) && Math.random() < (cfg.pl/100)*0.2*(1+weatherImpact*4) + weatherImpact*0.01){
          lossFactor = 0.2+Math.random()*0.25;
          lossEvents++;
        }

        let v = target*rampFactor*dipFactor*lossFactor + noiseWave(tSec, seed, magnitude*rampFactor);
        v = Math.max(0.05, v);

        const disp = formatSpeed(v);
        bigValue.textContent = disp.value;
        bigUnit.textContent = disp.unit;
        pushSample(v, phase);

        // only count steady-state (post-ramp) samples toward final average,
        // weighted slightly toward the later/steadier portion like real tests
        if(elapsed > rampMs*1.1){
          samples.push(v);
        }

        if(elapsed >= durationMs){
          const finalAvg = samples.length ? samples.reduce((a,b)=>a+b,0)/samples.length : target;
          const lossPct = Math.min(50, (lossEvents/Math.max(1,totalTicks))*100 + cfg.pl*0.6 + weatherImpact*8);
          resolve({speed:finalAvg, loss:lossPct});
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
