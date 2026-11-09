// Sky renderer for every theme, drawn on two fixed canvases behind the UI:
//   #aurora (half resolution, soft things: sky, stars, aurora curtains, galaxy, clouds)
//   #fx     (full resolution, sharp things: rain, snow, lightning)
// window.aurora lets the gauge/test steer it:
//   aurora.setPhase('download')  -> use that phase's theme colours
//   aurora.setEnergy(0..1)       -> how lively the scene is (driven by current speed)
//   aurora.colors()              -> current eased colours (the gauge reuses them)
//   aurora.palette('upload')     -> a phase's palette for the active theme
(function(){
  const cv = document.getElementById('aurora'), c = cv.getContext('2d');
  const fxCv = document.getElementById('fx'), f = fxCv.getContext('2d');
  const SCALE = 0.5, STEP = 3;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = window.theme;                                            // palettes and the active scene key, from themes.js
  const rand = (a,b) => a + Math.random()*(b-a);
  const lerp = (a,b,k) => a + (b-a)*k;

  let phase = 'idle', target = T.palette('idle'), cur = target.map(a => a.slice());   // cur = eased colours
  let energy = 0.3, energyTarget = 0.3;
  let W = 0, H = 0, IW = 0, IH = 0;
  let stars = [], trees = [], clouds = [], drops = [], flakes = [], gal = null;
  let galSpin = 0, galX = 0, galY = 0, flash = 0, bolt = null, nextBolt = 0;
  const shots = []; let nextShot = -1;

// ---------- Scene setup ----------
  const CLOUDS = {lightrain:[6,'70,90,110',.5], heavyrain:[8,'60,78,98',.6], storm:[9,'34,40,58',.7], snow:[5,'150,170,195',.4], fog:[12,'150,160,172',.35]};
  const RAIN = {lightrain:140, heavyrain:420, storm:520};
  function buildScene(newScene){
    const k = T.key();
    stars = Array.from({length: Math.round(W*H/(k==='galaxy' ? 1100 : 2600))}, () => ({x:rand(0,W), y:rand(0, H*(k==='galaxy' ? 1 : .8)), a:rand(.2,.8), tw:rand(0,6.28)}));
    trees = [];                                                      // jagged conifer treeline
    for(let x = -6; x < W+6; x += 5 + Math.random()*7) trees.push({x, h:H*(.035 + Math.random()*.05), w:5 + Math.random()*6});
    if(!newScene) return;
    const cl = CLOUDS[k];
    clouds = cl ? Array.from({length:cl[0]}, () => ({x:rand(0,W), y:rand(-.05, k==='fog' ? .8 : .4)*H, r:rand(.18,.4)*W, v:rand(2,9)*(k==='storm' ? 2 : 1), col:cl[1], a:cl[2]*rand(.6,1)})) : [];
    drops = Array.from({length:RAIN[k]||0}, () => ({x:rand(0,IW), y:rand(0,IH), v:rand(700,1200), l:rand(10,24)}));
    flakes = k==='snow' ? Array.from({length:170}, () => ({x:rand(0,IW), y:rand(0,IH), r:rand(1,2.6), v:rand(30,80), s:rand(0,6.28)})) : [];
    gal = k==='galaxy' ? makeGalaxy() : null;
    galX = W*(Math.random()<.5 ? .27 : .73); galY = H*.36;
    nextBolt = performance.now() + 2000; flash = 0; bolt = null;
  }
  function resize(){
    W = cv.width = Math.ceil(innerWidth*SCALE); H = cv.height = Math.ceil(innerHeight*SCALE);
    IW = innerWidth; IH = innerHeight;
    const d = devicePixelRatio || 1; fxCv.width = IW*d; fxCv.height = IH*d; f.setTransform(d,0,0,d,0,0);
    buildScene(!clouds.length && !gal && !drops.length && !flakes.length);
    if(reduceMotion) draw(0);
  }

  // Pre-render a spiral galaxy once: a glow, two spiral arms of thousands of stars, and a bright core.
  function makeGalaxy(){
    const S = Math.round(Math.min(W, H*1.3)*.6), g = document.createElement('canvas'); g.width = g.height = S;
    const x = g.getContext('2d'), R = S/2; x.globalCompositeOperation = 'lighter';
    const halo = x.createRadialGradient(R,R,0,R,R,R);
    halo.addColorStop(0,'rgba(255,235,200,.55)'); halo.addColorStop(.12,'rgba(210,170,255,.22)'); halo.addColorStop(.5,'rgba(110,120,255,.07)'); halo.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle = halo; x.fillRect(0,0,S,S);
    for(let i = 0; i < 9000; i++){
      const t = Math.pow(Math.random(), .65), r = t*R*.95;           // distance from the centre (denser near the middle)
      const ang = (i%2)*Math.PI + t*5.2 + (Math.random()+Math.random()-1)*(.5*(1-t)+.2);   // arm angle, with scatter
      const warm = 1 - t;                                            // inner stars warm, outer stars lavender-blue
      x.fillStyle = `rgba(${190+warm*65|0},${170+warm*50|0},${255-warm*90|0},${rand(.2,.8)})`;
      x.fillRect(R + Math.cos(ang)*r, R + Math.sin(ang)*r, rand(.8,1.8), rand(.8,1.8));
    }
    const core = x.createRadialGradient(R,R,0,R,R,R*.16);
    core.addColorStop(0,'rgba(255,250,230,.95)'); core.addColorStop(1,'rgba(255,200,150,0)');
    x.fillStyle = core; x.fillRect(0,0,S,S);
    return g;
  }

// ---------- Shared drawing helpers ----------
  const WSKY = {clear:['#02060d','#061426','#0a2230'], lightrain:['#0a1522','#16283a','#243a4d'], heavyrain:['#060c14','#0d1a28','#16283a'],
                storm:['#05070d','#0b0f1c','#171c2e'], snow:['#1a2433','#2b3a4f','#46586f'], fog:['#2a3340','#3d4856','#566170']};
  function sky(stops){                                               // vertical gradient background
    const g = c.createLinearGradient(0,0,0,H); stops.forEach((s,i) => g.addColorStop(i/(stops.length-1), s));
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0,0,W,H);
  }
  function drawStars(now){
    c.globalCompositeOperation = 'source-over'; c.fillStyle = '#dff6ff';
    for(const s of stars){ c.globalAlpha = s.a*(.6 + .4*Math.sin(now*.0008 + s.tw)); c.fillRect(s.x, s.y, 1, 1); }
  }
  function drawTrees(){
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#02050a';
    for(const t of trees){ c.beginPath(); c.moveTo(t.x-t.w, H); c.lineTo(t.x, H-t.h); c.lineTo(t.x+t.w, H); c.closePath(); c.fill(); }
    c.fillRect(0, H-H*.02, W, H*.02);
  }
  // Shooting stars: a streak with a fading tail, spawned every few seconds (only on starry scenes).
  function drawShots(now, dt, on){
    if(on && !reduceMotion){
      if(nextShot < 0) nextShot = now + 1500;
      if(now > nextShot){
        const dir = Math.random() < .5 ? 1 : -1, ang = rand(18,43)*Math.PI/180, sp = rand(550,1000)*SCALE;
        shots.push({x: dir > 0 ? rand(0,W*.6) : rand(W*.4,W), y:rand(0,H*.35), vx:Math.cos(ang)*sp*dir, vy:Math.sin(ang)*sp, age:0, life:rand(650,1200), len:rand(50,100)});
        nextShot = now + 3000 + Math.random()*8000;
      }
    }
    c.globalCompositeOperation = 'lighter';
    for(let i = shots.length-1; i >= 0; i--){
      const s = shots[i]; s.age += dt; s.x += s.vx*dt/1000; s.y += s.vy*dt/1000;
      if(s.age > s.life){ shots.splice(i,1); continue; }
      const mag = Math.hypot(s.vx,s.vy), tx = s.x - s.vx/mag*s.len, ty = s.y - s.vy/mag*s.len;
      const g = c.createLinearGradient(s.x,s.y,tx,ty); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(160,220,255,0)');
      c.globalAlpha = Math.sin(Math.PI*s.age/s.life); c.strokeStyle = g; c.lineWidth = 1.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(s.x,s.y); c.lineTo(tx,ty); c.stroke(); c.fillStyle = '#fff'; c.fillRect(s.x-1, s.y-1, 2, 2);
    }
  }

// ---------- Aurora curtains ----------
  const CURTAINS = [
    {base:.42, amp:.06, freq:1.3, speed:.000020, height:.36, alpha:.80, phase:0.0},
    {base:.34, amp:.08, freq:2.1, speed:.000031, height:.28, alpha:.55, phase:2.1},
    {base:.50, amp:.05, freq:3.0, speed:.000016, height:.22, alpha:.40, phase:4.3},
  ];
  const sprite = document.createElement('canvas'); sprite.width = 1; sprite.height = 128;
  const sc = sprite.getContext('2d');
  function paintSprite(){                                            // 1px-wide gradient reused for every ray
    const rgba = (col,a) => `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${a})`;
    const g = sc.createLinearGradient(0,0,0,128);
    g.addColorStop(0, rgba(cur[2],0)); g.addColorStop(.45, rgba(cur[1],.30)); g.addColorStop(.88, rgba(cur[0],.95)); g.addColorStop(1, rgba(cur[0],.10));
    sc.clearRect(0,0,1,128); sc.fillStyle = g; sc.fillRect(0,0,1,128);
  }
  function drawAurora(now, dt){
    sky(['#02060d','#061426','#0a2230']); drawStars(now); drawShots(now, dt, true);
    paintSprite(); c.globalCompositeOperation = 'lighter';           // 'lighter' makes overlapping ribbons glow brighter
    for(const k of CURTAINS){
      const t = now*k.speed;
      for(let x = 0; x < W; x += STEP){
        const nx = x/W;
        const wave = Math.sin(nx*k.freq*6.283 + t*6.283 + k.phase)*k.amp + Math.sin(nx*k.freq*14.2 - t*25 + k.phase*2)*k.amp*.5;
        const ray = .5 + .5*Math.sin(nx*70 + t*180 + k.phase*3)*Math.sin(nx*19 - t*60);       // vertical streaks
        const h = H*k.height*(.5 + .5*ray)*(.55 + .7*energy);
        c.globalAlpha = k.alpha*(.30 + .70*energy)*(.45 + .55*ray);
        c.drawImage(sprite, 0,0,1,128, x, H*(k.base + wave) - h, STEP+1, h);
      }
    }
    drawTrees();
  }

// ---------- Galaxy ----------
  const NEBULAE = [[.2,.25,.5,'120,80,255',.10],[.8,.7,.55,'255,90,200',.07],[.5,.9,.6,'60,120,255',.08]];
  function drawGalaxy(now, dt){
    sky(['#05030d','#0b0620','#150b30']);
    for(const [nx,ny,nr,col,a] of NEBULAE){                          // soft coloured gas clouds
      const g = c.createRadialGradient(nx*W,ny*H,0,nx*W,ny*H,nr*W); g.addColorStop(0,`rgba(${col},${a})`); g.addColorStop(1,`rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(0,0,W,H);
    }
    drawStars(now);
    if(gal){                                                         // tilted, slowly spinning; spins faster at high speed
      galSpin += dt*.00002*(1 + energy*4);
      c.save(); c.translate(galX, galY); c.rotate(-.35); c.scale(1,.46); c.rotate(galSpin);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .65 + .35*energy;
      c.drawImage(gal, -gal.width/2, -gal.height/2); c.restore();
    }
    drawShots(now, dt, true);
  }

// ---------- Basic dark: flat colour with a faint accent glow ----------
  function drawDark(){
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#0b0d11'; c.fillRect(0,0,W,H);
    const g = c.createRadialGradient(W/2, H*.25, 0, W/2, H*.25, W*.6);
    g.addColorStop(0, `rgba(${cur[1].map(v=>v|0)},${.06 + .08*energy})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0,0,W,H);
  }

// ---------- Weather scenes ----------
  function drawWeather(k, now, dt){
    sky(WSKY[k]);
    if(k === 'clear'){ drawStars(now); drawShots(now, dt, true); }
    for(const cl of clouds){                                         // drifting soft cloud blobs
      cl.x += cl.v*dt/1000; if(cl.x - cl.r > W) cl.x = -cl.r;
      c.save(); c.translate(cl.x, cl.y); c.scale(1,.38);
      const g = c.createRadialGradient(0,0,0,0,0,cl.r); g.addColorStop(0,`rgba(${cl.col},${cl.a})`); g.addColorStop(1,`rgba(${cl.col},0)`);
      c.fillStyle = g; c.fillRect(-cl.r,-cl.r,cl.r*2,cl.r*2); c.restore();
    }
    drawTrees();
  }
  // Rain, snow and lightning on the sharp full-resolution canvas.
  function drawFx(k, now, dt){
    f.clearRect(0,0,IW,IH);
    if(reduceMotion) return;
    const slant = ({lightrain:.1, heavyrain:.2, storm:.38})[k] || 0, sp = 1 + energy*.4;
    if(drops.length){
      f.strokeStyle = `rgba(190,215,240,${k==='lightrain' ? .28 : .38})`; f.lineWidth = 1; f.beginPath();
      for(const d of drops){
        d.y += d.v*sp*dt/1000; d.x -= d.v*slant*sp*dt/1000;
        if(d.y > IH){ d.y = -d.l; d.x = rand(0, IW+200); } if(d.x < -20) d.x += IW + 40;
        f.moveTo(d.x, d.y); f.lineTo(d.x + d.l*slant, d.y - d.l);
      }
      f.stroke();
    }
    if(flakes.length){
      f.fillStyle = 'rgba(255,255,255,.75)';
      for(const s of flakes){
        s.y += s.v*dt/1000; s.x += Math.sin(now/1500 + s.s)*12*dt/1000;   // flakes drift side to side as they fall
        if(s.y > IH){ s.y = -4; s.x = rand(0,IW); }
        f.beginPath(); f.arc(s.x, s.y, s.r, 0, 6.283); f.fill();
      }
    }
    if(k === 'storm'){
      if(now > nextBolt){                                            // trigger a lightning strike every few seconds
        flash = 1; nextBolt = now + rand(2500,8000);
        let x = rand(.2,.8)*IW, y = 0; bolt = [[x,y]]; const end = IH*rand(.45,.7);
        while(y < end){ x += rand(-30,30); y += rand(18,40); bolt.push([x,y]); }
      }
      if(flash > 0){
        f.fillStyle = `rgba(200,210,255,${flash*.3})`; f.fillRect(0,0,IW,IH);       // whole sky flashes
        if(bolt && flash > .55){
          f.strokeStyle = `rgba(235,240,255,${flash})`; f.lineWidth = 2; f.shadowColor = '#9fb4ff'; f.shadowBlur = 14;
          f.beginPath(); bolt.forEach((p,i) => i ? f.lineTo(p[0],p[1]) : f.moveTo(p[0],p[1])); f.stroke(); f.shadowBlur = 0;
        }
        flash -= dt/260; if(flash <= 0){ flash = 0; bolt = null; }
      }
    }
  }

// ---------- Main loop ----------
  let lastNow = 0;
  function draw(now){
    const dt = Math.min(50, now - lastNow || 16); lastNow = now;
    for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++) cur[i][j] = lerp(cur[i][j], target[i][j], .04);   // ease colours
    energy = lerp(energy, energyTarget, .05);
    const k = T.key();
    if(k === 'aurora') drawAurora(now, dt); else if(k === 'galaxy') drawGalaxy(now, dt); else if(k === 'dark') drawDark(); else drawWeather(k, now, dt);
    drawFx(k, now, dt);
  }
  function loop(now){ draw(now); requestAnimationFrame(loop); }

  addEventListener('resize', resize);
  addEventListener('themechange', () => { target = T.palette(phase); buildScene(true); if(reduceMotion) draw(0); });
  resize();
  if(reduceMotion) draw(0); else requestAnimationFrame(loop);        // reduced motion: one still frame only

  window.aurora = {
    setPhase(p){ phase = p; target = T.palette(p); },
    setEnergy(v){ energyTarget = Math.max(.15, Math.min(1, v)); if(reduceMotion) draw(0); },
    colors(){ return cur; },
    palette(p){ return T.palette(p); },
  };
})();
