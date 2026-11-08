// Animated aurora borealis sky, drawn on a fixed full-screen canvas behind the UI.
// It exposes window.aurora so the gauge/test can steer it:
//   aurora.setPhase('download')  -> change the colour set
//   aurora.setEnergy(0..1)       -> how bright/tall the curtains are (driven by current speed)
//   aurora.colors()              -> the current eased colours (the gauge reuses them)
(function(){
  const cv = document.getElementById('aurora');
  const c = cv.getContext('2d');
  const SCALE = 0.5;   // render at half resolution: soft glow doesn't need more and it's far cheaper
  const STEP  = 3;     // width in canvas px of each vertical "ray" in a curtain
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Colour sets as [r,g,b] for [bottom edge (brightest), middle, top fringe].
  // Real aurora is green low down (oxygen) with violet/magenta higher up, so
  // download = green curtain, upload = high magenta/violet curtain.
  const PALETTES = {
    idle:     [[93,255,180],  [63,216,255],  [155,107,255]],
    ping:     [[214,255,238], [93,255,180],  [63,216,255]],
    download: [[93,255,180],  [63,216,255],  [107,139,255]],
    upload:   [[255,110,199], [178,123,255], [107,139,255]],
    error:    [[255,110,130], [255,140,90],  [178,123,255]],
  };
  let target = PALETTES.idle;
  let cur = PALETTES.idle.map(a => a.slice());   // eased copy that actually gets drawn
  let energy = 0.3, energyTarget = 0.3;

  // Each curtain is a wavy ribbon: where it sits, how far it sways, how fast, how tall, how bright.
  const CURTAINS = [
    {base:.42, amp:.06, freq:1.3, speed:.000020, height:.36, alpha:.80, phase:0.0},
    {base:.34, amp:.08, freq:2.1, speed:.000031, height:.28, alpha:.55, phase:2.1},
    {base:.50, amp:.05, freq:3.0, speed:.000016, height:.22, alpha:.40, phase:4.3},
  ];

  // One-pixel-wide vertical gradient reused for every ray: sharp bright bottom edge, long soft fade upward.
  const sprite = document.createElement('canvas');
  sprite.width = 1; sprite.height = 128;
  const sc = sprite.getContext('2d');
  function paintSprite(){
    const rgba = (col, a) => `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${a})`;
    const g = sc.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0,    rgba(cur[2], 0));
    g.addColorStop(0.45, rgba(cur[1], 0.30));
    g.addColorStop(0.88, rgba(cur[0], 0.95));
    g.addColorStop(1,    rgba(cur[0], 0.10));
    sc.clearRect(0, 0, 1, 128);
    sc.fillStyle = g;
    sc.fillRect(0, 0, 1, 128);
  }

  let W = 0, H = 0, stars = [], trees = [];
  function resize(){
    W = cv.width  = Math.ceil(innerWidth  * SCALE);
    H = cv.height = Math.ceil(innerHeight * SCALE);
    // scatter stars once per resize (mostly in the upper sky)
    stars = Array.from({length: Math.round(W*H/2600)}, () => ({
      x: Math.random()*W, y: Math.random()*H*0.8,
      a: 0.2 + Math.random()*0.6, tw: Math.random()*6.28
    }));
    // jagged conifer treeline along the bottom, built from random triangles
    trees = [];
    for(let x = -6; x < W + 6; x += 5 + Math.random()*7){
      trees.push({x, h: H*(0.035 + Math.random()*0.05), w: 5 + Math.random()*6});
    }
    if(reduceMotion) draw(0);
  }
  addEventListener('resize', resize);

  // ----- Shooting stars: a streak with a fading tail, spawned every few seconds at random -----
  const shots = [];
  let nextShot = -1;   // time of the next spawn (set on first frame)
  function spawnShot(){
    const dir = Math.random() < 0.5 ? 1 : -1;                        // travels right or left
    const ang = (18 + Math.random()*25) * Math.PI/180;                // always angled downward
    const speed = (550 + Math.random()*450) * SCALE;                  // canvas px per second
    shots.push({
      x: dir > 0 ? Math.random()*W*0.6 : W*0.4 + Math.random()*W*0.6,
      y: Math.random()*H*0.35,
      vx: Math.cos(ang)*speed*dir, vy: Math.sin(ang)*speed,
      age: 0, life: 650 + Math.random()*550, len: 50 + Math.random()*50,
    });
  }
  function drawShots(now, dt){
    if(!reduceMotion && nextShot < 0) nextShot = now + 1500;           // first one shortly after load
    if(!reduceMotion && now > nextShot){ spawnShot(); nextShot = now + 3000 + Math.random()*8000; }
    c.globalCompositeOperation = 'lighter';
    for(let i = shots.length - 1; i >= 0; i--){
      const s = shots[i];
      s.age += dt; s.x += s.vx*dt/1000; s.y += s.vy*dt/1000;
      if(s.age > s.life){ shots.splice(i, 1); continue; }
      const fade = Math.sin(Math.PI * s.age / s.life);                 // fade in, then out
      const mag = Math.hypot(s.vx, s.vy);
      const tx = s.x - s.vx/mag*s.len, ty = s.y - s.vy/mag*s.len;     // tail end
      const g = c.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(160,220,255,0)');
      c.globalAlpha = fade;
      c.strokeStyle = g; c.lineWidth = 1.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(tx, ty); c.stroke();
      c.fillStyle = '#fff'; c.fillRect(s.x - 1, s.y - 1, 2, 2);        // bright head
    }
  }

  function lerp(a, b, k){ return a + (b - a)*k; }

  let lastNow = 0;
  function draw(now){
    const dt = Math.min(50, now - lastNow || 16); lastNow = now;   // ms since last frame
    // ease colours and energy toward their targets so phase changes fade smoothly
    for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++) cur[i][j] = lerp(cur[i][j], target[i][j], 0.04);
    energy = lerp(energy, energyTarget, 0.05);
    paintSprite();

    // night sky: deep blue-black with a faint green glow near the horizon
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#02060d'); sky.addColorStop(0.6, '#061426'); sky.addColorStop(1, '#0a2230');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);

    // twinkling stars
    c.fillStyle = '#dff6ff';
    for(const s of stars){
      c.globalAlpha = s.a * (0.6 + 0.4*Math.sin(now*0.0008 + s.tw));
      c.fillRect(s.x, s.y, 1, 1);
    }

    drawShots(now, dt);

    // curtains: 'lighter' blending makes overlapping ribbons glow brighter, like real light
    c.globalCompositeOperation = 'lighter';
    for(const k of CURTAINS){
      const t = now * k.speed;
      for(let x = 0; x < W; x += STEP){
        const nx = x / W;
        // two sine waves give the ribbon its slow, folding sway
        const wave = Math.sin(nx*k.freq*6.283 + t*6.283 + k.phase)*k.amp
                   + Math.sin(nx*k.freq*14.2 - t*25 + k.phase*2)*k.amp*0.5;
        const base = H*(k.base + wave);
        // vertical streak brightness varies along x so it reads as rays, not a flat band
        const ray = 0.5 + 0.5*Math.sin(nx*70 + t*180 + k.phase*3)*Math.sin(nx*19 - t*60);
        const h = H*k.height*(0.5 + 0.5*ray)*(0.55 + 0.7*energy);
        c.globalAlpha = k.alpha*(0.30 + 0.70*energy)*(0.45 + 0.55*ray);
        c.drawImage(sprite, 0, 0, 1, 128, x, base - h, STEP + 1, h);
      }
    }

    // treeline silhouette on top
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.fillStyle = '#02050a';
    for(const t of trees){
      c.beginPath();
      c.moveTo(t.x - t.w, H); c.lineTo(t.x, H - t.h); c.lineTo(t.x + t.w, H);
      c.closePath(); c.fill();
    }
    c.fillRect(0, H - H*0.02, W, H*0.02);
  }

  function loop(now){ draw(now); requestAnimationFrame(loop); }
  resize();
  if(reduceMotion) draw(0); else requestAnimationFrame(loop);   // reduced motion: one still frame only

  window.aurora = {
    setPhase(key){ target = PALETTES[key] || PALETTES.idle; },
    setEnergy(v){ energyTarget = Math.max(0.15, Math.min(1, v)); if(reduceMotion) draw(0); },
    colors(){ return cur; },
  };
})();
