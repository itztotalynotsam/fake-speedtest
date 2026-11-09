// Theme system: Aurora, Galaxy, Basic dark and Weather. Each theme (and each weather condition)
// has a colour palette per test phase. This file picks the palette, pushes it into the CSS colour
// variables (so buttons, chips and borders all re-tint) and tells the sky renderer to rebuild.
(function(){
  const el = id => document.getElementById(id);
  const themeSel = el('themeSel'), weatherSelect = el('weatherSelect');
  const mix = (a,b,k) => a.map((v,i) => Math.round(v + (b[i]-v)*k));
  // Build a phase palette from three colours: ping is a lighter start, upload runs the colours in reverse.
  const mk = (a,b,c) => ({idle:[a,b,c], ping:[mix(a,[255,255,255],.6),a,b], download:[a,b,c], upload:[c,b,a]});
  const ERROR = [[255,110,130],[255,140,90],[178,123,255]];   // every theme turns red on a failed connection

  // palettes are [r,g,b] triples: [main, middle, far end]
  const SETS = {
    aurora:{ idle:[[93,255,180],[63,216,255],[155,107,255]], ping:[[214,255,238],[93,255,180],[63,216,255]],
             download:[[93,255,180],[63,216,255],[107,139,255]], upload:[[255,110,199],[178,123,255],[107,139,255]] },
    galaxy:   mk([176,150,255],[110,170,255],[255,140,220]),
    dark:     mk([225,232,245],[140,190,255],[120,140,255]),
    clear:    mk([150,210,255],[110,170,255],[190,170,255]),   // weather conditions use the same ids as weatherSelect
    lightrain:mk([140,205,225],[100,165,215],[135,150,225]),
    heavyrain:mk([105,175,215],[80,135,205],[115,125,205]),
    storm:    mk([190,170,255],[130,140,255],[255,225,130]),
    snow:     mk([228,242,255],[170,210,255],[205,200,255]),
    fog:      mk([205,210,220],[165,175,195],[145,155,185]),
  };
  const SKY = {aurora:'#04080f', galaxy:'#05030d', dark:'#0b0d11', clear:'#04080f', lightrain:'#0a1522',
               heavyrain:'#060c14', storm:'#05070d', snow:'#1a2433', fog:'#2a3340'};

  // Which scene is active: the theme itself, or (for the Weather theme) the chosen weather condition.
  const key = () => themeSel.value === 'weather' ? (weatherSelect.value || 'clear') : themeSel.value;
  const palette = phase => phase === 'error' ? ERROR : (SETS[key()][phase] || SETS[key()].idle);

  // Push the palette into CSS variables and tell the renderer.
  function apply(){
    const k = key(), d = SETS[k].download, u = SETS[k].upload, s = document.body.style;
    const rgb = a => `rgb(${a.join(',')})`;
    document.body.dataset.theme = themeSel.value;
    document.body.dataset.weather = themeSel.value === 'weather' ? k : '';
    s.setProperty('--green', rgb(d[0])); s.setProperty('--ice', rgb(d[1])); s.setProperty('--peri', rgb(d[2]));
    s.setProperty('--pink', rgb(u[0]));  s.setProperty('--violet', rgb(u[1])); s.setProperty('--sky', SKY[k]);
    const bodies = el('bodies');                                    // moon and planets only suit aurora and clear nights
    if(bodies) bodies.style.opacity = (k === 'aurora' || k === 'clear') ? 1 : 0;
    try{ localStorage.setItem('testspeed.theme', themeSel.value); }catch(e){}
    dispatchEvent(new Event('themechange'));
  }

  themeSel.addEventListener('change', () => {
    if(themeSel.value === 'weather'){                               // the weather theme needs weather switched on
      const t = el('weatherToggle'); t.checked = true; t.dispatchEvent(new Event('change', {bubbles:true}));
    }
    apply();
  });
  weatherSelect.addEventListener('change', () => { if(themeSel.value === 'weather') apply(); });

  try{ const saved = localStorage.getItem('testspeed.theme'); if(saved && [...themeSel.options].some(o => o.value === saved)) themeSel.value = saved; }catch(e){}
  window.theme = {key, palette};
  apply();
})();
