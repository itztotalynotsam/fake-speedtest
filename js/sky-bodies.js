// Random celestial bodies: on every page load it picks a moon (random phase, sometimes absent)
// and one or two naked-eye planets (Venus, Jupiter, Saturn, Mars), then draws them once
// on a full-resolution canvas so they stay crisp. Layout is stored as fractions of the screen
// so a window resize redraws everything in the same relative spots.
(function(){
  const cv = document.getElementById('bodies');
  const c = cv.getContext('2d');
  const pick = arr => arr.splice(Math.floor(Math.random()*arr.length), 1)[0];   // remove & return a random item
  const rand = (a,b) => a + Math.random()*(b-a);

  // ---- 1. Decide what's in the sky this visit ----
  const bodies = [];
  if(Math.random() < 0.6) bodies.push({kind:'moon', phase: rand(0.06, 0.94), r: rand(20,28)});   // 0 new .. 0.5 full .. 1 new
  const planets = ['venus','jupiter','saturn','mars'];
  const count = Math.random() < 0.5 ? 1 : 2;
  for(let i=0;i<count;i++) bodies.push({kind: pick(planets), r: 0});

  // ---- 2. Give each a spot in the upper sky, not too close to another ----
  bodies.forEach((b, i) => {
    for(let tries=0; tries<40; tries++){
      b.fx = rand(0.06, 0.94); b.fy = rand(0.07, 0.42);
      const ok = bodies.slice(0,i).every(o => Math.hypot((o.fx-b.fx)*innerWidth, (o.fy-b.fy)*innerHeight) > 150);
      if(ok) break;
    }
  });

  // glowing halo behind a body
  function halo(x, y, r, color, a){
    const g = c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g; c.fillRect(x-r, y-r, r*2, r*2);
  }

  // The moon: a dim "earthshine" disc, then the lit part built from a half-circle plus the terminator curve.
  function drawMoon(x, y, r, p){
    halo(x, y, r*4.5, '190,215,255', 0.16*Math.sin(p*Math.PI));          // brighter glow near full moon
    c.fillStyle = 'rgba(120,140,175,0.14)';
    c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
    const k = Math.cos(p*Math.PI*2);                                     // 1 = new ... -1 = full
    const waxing = p < 0.5;
    c.save();
    c.beginPath();
    c.arc(x, y, r, -Math.PI/2, Math.PI/2, !waxing);                      // lit edge: right side when waxing, left when waning
    c.ellipse(x, y, Math.max(0.01, r*Math.abs(k)), r, 0, Math.PI/2, -Math.PI/2, waxing ? k > 0 : k < 0);   // terminator
    c.clip();
    const g = c.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r*1.1);
    g.addColorStop(0, '#fffdf2'); g.addColorStop(1, '#cfd6e4');
    c.fillStyle = g; c.fillRect(x-r, y-r, r*2, r*2);
    c.fillStyle = 'rgba(90,100,125,0.22)';                               // a few craters
    [[-.3,-.2,.22],[.25,.15,.28],[-.1,.45,.15],[.45,-.35,.14]].forEach(([dx,dy,s]) => { c.beginPath(); c.arc(x+dx*r, y+dy*r, s*r, 0, Math.PI*2); c.fill(); });
    c.restore();
  }

  // Planets are drawn slightly bigger than real life so they read as "that bright one", with a coloured glow.
  function drawPlanet(kind, x, y){
    if(kind === 'venus'){                                // brightest, whitish-gold, big glow
      halo(x,y,28,'255,240,200',0.35); c.fillStyle = '#fff6dc'; c.beginPath(); c.arc(x,y,4,0,7); c.fill();
    } else if(kind === 'mars'){                          // small, orange-red
      halo(x,y,18,'255,130,90',0.30); c.fillStyle = '#ff9f7a'; c.beginPath(); c.arc(x,y,3.2,0,7); c.fill();
    } else if(kind === 'jupiter'){                       // cream disc with two faint cloud bands
      halo(x,y,25,'255,225,180',0.30); c.save(); c.beginPath(); c.arc(x,y,4.8,0,7); c.clip();
      c.fillStyle = '#f6e2c0'; c.fillRect(x-5,y-5,10,10);
      c.fillStyle = 'rgba(170,120,80,0.45)'; c.fillRect(x-5,y-2,10,1.3); c.fillRect(x-5,y+1.2,10,1.1); c.restore();
    } else {                                             // saturn: tilted ring passes behind, then in front of the planet
      halo(x,y,26,'240,225,170',0.28);
      c.strokeStyle = 'rgba(235,220,170,0.85)'; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(x,y,10.5,2.9,-0.35,Math.PI,Math.PI*2); c.stroke();   // back half
      c.fillStyle = '#f2e4b4'; c.beginPath(); c.arc(x,y,4.2,0,7); c.fill();
      c.beginPath(); c.ellipse(x,y,10.5,2.9,-0.35,0,Math.PI); c.stroke();           // front half
    }
  }

  // ---- 3. Draw everything (also runs on resize) ----
  function render(){
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth*dpr; cv.height = innerHeight*dpr;
    c.setTransform(dpr,0,0,dpr,0,0);
    bodies.forEach(b => {
      const x = b.fx*innerWidth, y = b.fy*innerHeight;
      if(b.kind === 'moon') drawMoon(x, y, b.r, b.phase); else drawPlanet(b.kind, x, y);
    });
  }
  addEventListener('resize', render);
  render();
})();
