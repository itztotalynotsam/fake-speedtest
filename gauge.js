// The canvas oscilloscope/gauge: sizing, drawing the arc + needle + trail,
// and the idle ambient drift shown before a test is running.

  const canvas = el('wave');
  const ctx = canvas.getContext('2d');
  let W=0,H=0,DPR=1;
  function resize(){
    DPR = window.devicePixelRatio||1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W*DPR; canvas.height = H*DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  let gaugeValue = 0;      // eased/displayed value
  let gaugeTarget = 0;     // raw incoming sample
  let gaugeMax = 2;        // current scale ceiling
  let gaugePhase = 'idle';
  let trail = [];          // fading needle-position trail for a sense of motion
  const TRAIL_MAX = 26;

  function colorFor(phase){
    if(phase==='ping') return getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
    if(phase==='download') return getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim();
    if(phase==='upload') return getComputedStyle(document.documentElement).getPropertyValue('--amber').trim();
    return '#3d4753';
  }

  function fmtTick(v){
    if(gaugePhase==='ping'){
      return Math.round(v);
    }
    if(v>=1000000) return (v/1000000).toFixed(2)+'T';
    if(v>=1000) return (v/1000).toFixed(1)+'G';
    if(v>=100) return Math.round(v);
    if(v>=10) return v.toFixed(0);
    return v.toFixed(1);
  }

  function drawGauge(){
    ctx.clearRect(0,0,W,H);

    const cx = W/2;
    const cy = H-26;
    const r = Math.min(W*0.42, H-46);
    const trackColor = '#1b232e';
    const color = colorFor(gaugePhase);

    // easing toward target + tiny life-like wobble
    gaugeValue += (gaugeTarget-gaugeValue)*0.09;
    const wobble = (gaugePhase==='idle') ? 0 : Math.sin(performance.now()/280)*gaugeMax*0.0018;
    const displayVal = Math.max(0, gaugeValue+wobble);
    const t = Math.max(0, Math.min(1, displayVal/gaugeMax));
    const theta = Math.PI + t*Math.PI;

    // track arc
    ctx.beginPath();
    ctx.arc(cx,cy,r,Math.PI,2*Math.PI);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // tick marks + labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4a5666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tickCount = 8;
    for(let i=0;i<=tickCount;i++){
      const a = Math.PI + (i/tickCount)*Math.PI;
      const tx1 = cx+Math.cos(a)*(r+11), ty1 = cy+Math.sin(a)*(r+11);
      const tx2 = cx+Math.cos(a)*(r+17), ty2 = cy+Math.sin(a)*(r+17);
      ctx.strokeStyle = '#2a3540';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx1,ty1); ctx.lineTo(tx2,ty2); ctx.stroke();
      if(i%2===0){
        const lx = cx+Math.cos(a)*(r+30), ly = cy+Math.sin(a)*(r+30);
        ctx.fillText(fmtTick((i/tickCount)*gaugeMax), lx, ly);
      }
    }

    // active progress arc
    ctx.beginPath();
    ctx.arc(cx,cy,r,Math.PI,theta);
    ctx.strokeStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

    // fading trail of recent needle tips
    trail.push({theta, r: r*0.72});
    if(trail.length>TRAIL_MAX) trail.shift();
    for(let i=0;i<trail.length;i++){
      const p = trail[i];
      const alpha = (i/trail.length)*0.35;
      const px = cx+Math.cos(p.theta)*p.r, py = cy+Math.sin(p.theta)*p.r;
      ctx.beginPath();
      ctx.arc(px,py,2,0,Math.PI*2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // needle
    const needleLen = r*0.88;
    const nx = cx+Math.cos(theta)*needleLen, ny = cy+Math.sin(theta)*needleLen;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(nx,ny);
    ctx.stroke();
    ctx.restore();

    // pivot
    ctx.beginPath();
    ctx.arc(cx,cy,6,0,Math.PI*2);
    ctx.fillStyle = '#0f141c';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function setGaugeMax(m){ gaugeMax = m; }

  function pushSample(v, phase){
    gaugeTarget = v;
    gaugePhase = phase;
  }

  let rafId=null;
  function renderLoop(){
    drawGauge();
    rafId = requestAnimationFrame(renderLoop);
  }
  renderLoop();

// ---------- Idle ambient drift when not testing ----------
  let idleT=0;
  let testing=false;
  setGaugeMax(2);
  setInterval(()=>{
    if(testing) return;
    idleT+=0.15;
    const v = 0.6+Math.sin(idleT)*0.3+Math.random()*0.15;
    pushSample(Math.max(0.1,v), 'idle');
  }, 90);
