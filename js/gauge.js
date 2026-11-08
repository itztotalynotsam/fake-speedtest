// The speed gauge: sizing, drawing the gradient arc + glowing tip + trail,
// and the idle ambient drift shown before a test is running.
// It also feeds the current speed to the aurora sky so the sky "reacts".

  const canvas = el('wave');
  const ctx = canvas.getContext('2d');
  let W=0,H=0,DPR=1;

  // Match the canvas pixel size to its CSS size (and the screen's pixel density) so lines stay sharp.
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
  let gaugeMax = 2;        // current scale ceiling (the arc's far end)
  let gaugePhase = 'idle'; // idle | ping | download | upload
  let trail = [];          // recent tip positions, drawn as fading dots for a sense of motion
  const TRAIL_MAX = 26;

  // Turn an [r,g,b] array into a CSS colour string.
  const rgba = (c,a=1) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

  // Shorten big tick numbers: 1500 -> "1.5G", 2000000 -> "2.00T".
  function fmtTick(v){
    if(gaugePhase==='ping') return Math.round(v);
    if(v>=1000000) return (v/1000000).toFixed(2)+'T';
    if(v>=1000) return (v/1000).toFixed(1)+'G';
    if(v>=100) return Math.round(v);
    if(v>=10) return v.toFixed(0);
    return v.toFixed(1);
  }

  function drawGauge(){
    ctx.clearRect(0,0,W,H);

    // geometry: a half circle sitting at the bottom of the canvas
    const cx = W/2;
    const cy = H-26;
    const r = Math.min(W*0.42, H-46);
    const pal = aurora.colors();   // eased aurora colours, so gauge and sky always match
    const live = gaugePhase!=='idle';

    // ease toward the target value, plus a tiny sine wobble so it feels alive while testing
    gaugeValue += (gaugeTarget-gaugeValue)*0.09;
    const wobble = live ? Math.sin(performance.now()/280)*gaugeMax*0.0018 : 0;
    const displayVal = Math.max(0, gaugeValue+wobble);
    const t = Math.max(0, Math.min(1, displayVal/gaugeMax));   // 0..1 along the arc
    const theta = Math.PI + t*Math.PI;                          // angle of the arc's tip
    aurora.setEnergy(live ? 0.35 + t*0.65 : 0.3);               // brighter sky at higher speed

    // background track
    ctx.beginPath();
    ctx.arc(cx,cy,r,Math.PI,2*Math.PI);
    ctx.strokeStyle = 'rgba(160,210,255,0.09)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // tick marks, with a number on every other tick
    ctx.font = '11px "Martian Mono", ui-monospace, monospace';
    ctx.fillStyle = 'rgba(190,220,235,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tickCount = 8;
    for(let i=0;i<=tickCount;i++){
      const a = Math.PI + (i/tickCount)*Math.PI;
      ctx.strokeStyle = 'rgba(190,220,235,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*(r+11), cy+Math.sin(a)*(r+11));
      ctx.lineTo(cx+Math.cos(a)*(r+17), cy+Math.sin(a)*(r+17));
      ctx.stroke();
      if(i%2===0) ctx.fillText(fmtTick((i/tickCount)*gaugeMax), cx+Math.cos(a)*(r+32), cy+Math.sin(a)*(r+32));
    }

    // gradient progress arc: a conic gradient sweeps the aurora colours along the half circle
    // (browsers without conic gradients fall back to a single colour)
    if(t>0.002){
      let stroke = rgba(pal[1]);
      if(ctx.createConicGradient){
        const g = ctx.createConicGradient(Math.PI, cx, cy);
        pal.forEach((col,i)=> g.addColorStop(i/(pal.length-1)*0.5, rgba(col)));
        stroke = g;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx,cy,r,Math.PI,theta);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(pal[1],0.9);
      ctx.shadowBlur = live ? 26 : 12;
      ctx.globalAlpha = live ? 1 : 0.55;   // dimmer when idle
      ctx.stroke();
      ctx.restore();
    }

    // fading trail of recent tip positions
    const tipCol = pal[Math.min(pal.length-1, Math.floor(t*pal.length))];
    trail.push({theta, r: r*0.72});
    if(trail.length>TRAIL_MAX) trail.shift();
    for(let i=0;i<trail.length;i++){
      const p = trail[i];
      ctx.beginPath();
      ctx.arc(cx+Math.cos(p.theta)*p.r, cy+Math.sin(p.theta)*p.r, 2, 0, Math.PI*2);
      ctx.fillStyle = rgba(tipCol, (i/trail.length)*0.4);
      ctx.fill();
    }

    // thin needle from the centre toward the tip
    const nx = cx+Math.cos(theta)*r*0.88, ny = cy+Math.sin(theta)*r*0.88;
    ctx.strokeStyle = 'rgba(235,250,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(nx,ny); ctx.stroke();

    // glowing orb at the arc's tip
    const ox = cx+Math.cos(theta)*r, oy = cy+Math.sin(theta)*r;
    const orb = ctx.createRadialGradient(ox,oy,0,ox,oy,20);
    orb.addColorStop(0, 'rgba(255,255,255,0.95)');
    orb.addColorStop(0.25, rgba(tipCol,0.7));
    orb.addColorStop(1, rgba(tipCol,0));
    ctx.fillStyle = orb;
    ctx.fillRect(ox-20, oy-20, 40, 40);

    // pivot ring in the centre
    ctx.beginPath();
    ctx.arc(cx,cy,6,0,Math.PI*2);
    ctx.fillStyle = '#05101a';
    ctx.fill();
    ctx.strokeStyle = rgba(pal[1]);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Set the arc's maximum (called at the start of each phase so the scale fits).
  function setGaugeMax(m){ gaugeMax = m; }

  // Called with every new speed/ping sample; also tells the sky which phase we're in.
  function pushSample(v, phase){
    gaugeTarget = v;
    gaugePhase = phase;
    aurora.setPhase(phase);
  }

  // Draw loop: redraw the gauge every animation frame.
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
    if(document.body.dataset.phase==='error') return;   // keep the red sky while showing an error
    idleT+=0.15;
    const v = 0.6+Math.sin(idleT)*0.3+Math.random()*0.15;
    pushSample(Math.max(0.1,v), 'idle');
  }, 90);
