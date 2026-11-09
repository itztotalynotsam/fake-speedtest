// Everything that reads/writes the slide-out configuration panel: the
// live cfg object, preset/ISP/server/technology selection, weather
// controls, and the panel's open/close behavior. Also runs the initial
// setup once all the fields exist.

// ---------- Config state ----------
  const cfg = {dl:940, ul:880, ping:5, jitter:1, ins:5, pl:0.0, dur:8};

  const presetSel = el('preset'), dlS=el('dl'), ulS=el('ul'), pgS=el('pg'), jtS=el('jt'), insS=el('ins'), plS=el('pl'), durS=el('dur');
  const locationSel = el('location'), deviceInput = el('deviceName');
  const ispPresetSel = el('ispPreset'), ispCustomWrap = el('ispCustomWrap'), ispCustomInput = el('ispCustomInput');
  const serverCustomWrap = el('serverCustomWrap'), serverCustomInput = el('serverCustomInput');
  const techPresetSel = el('techPreset'), techCustomWrap = el('techCustomWrap'), techCustomInput = el('techCustomInput');

  // Load a connection preset: copies its numbers into cfg and every control, then updates icon/tech text.
  function applyPreset(name){
    if(name==='custom') return;
    const p = presets[name];
    cfg.dl=p.dl; cfg.ul=p.ul; cfg.ping=p.ping; cfg.jitter=p.jitter; cfg.ins=p.ins; cfg.pl=p.pl;
    dlS.value=p.dl; ulS.value=p.ul; pgS.value=p.ping; jtS.value=p.jitter; insS.value=p.ins; plS.value=p.pl;
    syncLabels();
    if(presetIconDefault[name]) setNetIcon(presetIconDefault[name]);
    if(presetTech[name]){ techPresetSel.value = name; applyTechPreset(name); }
    if(typeof updateWeatherLine==='function') updateWeatherLine();
  }
  // (the old slider labels are gone: every setting is now a plain number field)
  function syncLabels(){}
  // Clamp a typed value into a range; empty or invalid text falls back to the old value.
  const num = (v, min, max, fallback) => { v = parseFloat(v); return isNaN(v) ? fallback : Math.max(min, Math.min(max, v)); };
  // Read the controls back into cfg (runs whenever the user edits a value).
  function readCfgFromControls(){
    const newDl = +dlS.value, newUl = +ulS.value;
    if(!isNaN(newDl) && newDl>0) cfg.dl=newDl;
    if(!isNaN(newUl) && newUl>0) cfg.ul=newUl;
    cfg.ping   = num(pgS.value, 0.1, 5000, cfg.ping);
    cfg.jitter = num(jtS.value, 0, 1000, cfg.jitter);
    cfg.ins    = num(insS.value, 0, 100, cfg.ins);
    cfg.pl     = num(plS.value, 0, 100, cfg.pl);       // packet loss is now typed in percent directly
    cfg.dur    = num(durS.value, 2, 60, cfg.dur);
  }

// ---------- Technology / ISP / server / device selection ----------
  function buildTechPresetOptions(){
    let html = '';
    Object.keys(presets).forEach(key=>{
      html += `<option value="${key}">${presetNames[key] || key}</option>`;
    });
    html += `<option value="custom">Custom</option>`;
    techPresetSel.innerHTML = html;
  }
  // apply a chosen technology preset (or reveal the custom text field)
  function applyTechPreset(key){
    if(key==='custom'){
      techCustomWrap.style.display = 'block';
      refreshTechLineFromCustom();
    } else {
      techCustomWrap.style.display = 'none';
      el('techLine').textContent = `Tech: ${presetTech[key] || 'Custom configuration'}`;
    }
  }
  function refreshTechLineFromCustom(){
    const text = (techCustomInput.value||'').trim() || 'Custom configuration';
    el('techLine').textContent = `Tech: ${text}`;
  }
  // populate the ISP dropdown from every fictional provider name already used across the server list
  function buildIspPresetOptions(){
    const names = new Set();
    Object.keys(locationMeta).forEach(key=>{
      if(key==='auto') return;
      const name = locationMeta[key].label.replace(/\s*\([^)]*\)\s*$/,'').trim();
      if(name) names.add(name);
    });
    const sorted = Array.from(names).sort((a,b)=>a.localeCompare(b));
    let html = sorted.map(n=>`<option value="${n.replace(/"/g,'&quot;')}">${n}</option>`).join('');
    html += `<option value="custom">Custom</option>`;
    ispPresetSel.innerHTML = html;
  }
  function applyIspPreset(){
    ispCustomWrap.style.display = ispPresetSel.value==='custom' ? 'block' : 'none';
    updateServerLine();
  }
  function currentIspName(){
    if(ispPresetSel.value==='custom'){
      return (ispCustomInput.value||'').trim() || 'Simulated Broadband';
    }
    return ispPresetSel.value || 'Simulated Broadband';
  }
  function applyServerSelection(){
    serverCustomWrap.style.display = locationSel.value==='custom' ? 'block' : 'none';
    updateServerLine();
  }
  function currentLocationLabel(){
    if(locationSel.value==='custom'){
      return (serverCustomInput.value||'').trim() || 'Custom Server';
    }
    return (locationMeta[locationSel.value] || locationMeta.auto).label;
  }
  function currentLocationExtra(){
    if(locationSel.value==='custom') return 0;
    return (locationMeta[locationSel.value] || locationMeta.auto).extra;
  }
  // Rewrites the 'Server / ISP' line under the button.
  function updateServerLine(){
    el('serverLine').textContent = `Server: ${currentLocationLabel()} · ISP: ${currentIspName()}`;
  }
  // Rewrites the 'Device' line under the button.
  function updateDeviceLine(){
    const name = (deviceInput.value||'').trim() || 'My-Device';
    el('deviceLine').textContent = `Device: ${name}`;
  }

// ---------- Gauge scale ----------
  // The dial's end is whatever the user picked (100 / 1000 / 10000 Mbps; 1000 by default), even if the
  // preset is faster. The needle just stops at the end; the number still shows the real speed.
  const gaugeMaxSel = el('gaugeMaxSel');
  function gaugeScaleFor(target){
    return +gaugeMaxSel.value;
  }

// ---------- Weather effects ----------
  const weatherToggle = el('weatherToggle'), weatherModeWrap = el('weatherModeWrap'), weatherSelect = el('weatherSelect');

  function getWeatherSensitivity(){
    return weatherSensitivity[presetSel.value] || 0;
  }
  function currentWeatherImpact(){
    if(!weatherToggle.checked) return 0;
    const cond = weatherConditions[weatherSelect.value] || weatherConditions.clear;
    return getWeatherSensitivity() * cond.severity;
  }
  // Shows how much the chosen weather affects this connection type.
  function updateWeatherLine(){
    const line = el('weatherLine');
    if(!weatherToggle.checked){
      line.style.display = 'none';
      return;
    }
    const cond = weatherConditions[weatherSelect.value] || weatherConditions.clear;
    const sens = getWeatherSensitivity();
    line.style.display = 'block';
    if(sens<=0){
      line.textContent = `Weather: ${cond.label} (no effect on this connection type)`;
    } else {
      const impact = sens*cond.severity;
      const level = impact>0.5 ? 'severe' : impact>0.2 ? 'moderate' : impact>0 ? 'minor' : 'no';
      line.textContent = `Weather: ${cond.label} (${level} impact expected)`;
    }
  }
  weatherToggle.addEventListener('change', ()=>{
    weatherModeWrap.style.display = weatherToggle.checked ? 'block' : 'none';
    updateWeatherLine();
  });
  weatherSelect.addEventListener('change', updateWeatherLine);

// ---------- Wire up all the config-panel inputs ----------
  [dlS,ulS,pgS,jtS,insS,plS,durS].forEach(s=>{
    s.addEventListener('input', ()=>{ presetSel.value='custom'; syncLabels(); readCfgFromControls(); updateWeatherLine(); });
  });
  presetSel.addEventListener('change', e=>{ applyPreset(e.target.value); updateWeatherLine(); });
  ispPresetSel.addEventListener('change', applyIspPreset);
  ispCustomInput.addEventListener('input', updateServerLine);
  deviceInput.addEventListener('input', updateDeviceLine);
  techPresetSel.addEventListener('change', e=>applyTechPreset(e.target.value));
  techCustomInput.addEventListener('input', refreshTechLineFromCustom);
  locationSel.addEventListener('change', applyServerSelection);
  serverCustomInput.addEventListener('input', updateServerLine);

// ---------- Initial setup once the page loads ----------
  buildTechPresetOptions();
  buildIspPresetOptions();
  ispPresetSel.value = 'custom';
  ispCustomInput.value = 'Simulated Broadband';
  ispCustomWrap.style.display = 'block';
  applyPreset('fiber1g'); readCfgFromControls(); updateServerLine(); updateDeviceLine();
  setNetIcon(presetIconDefault.fiber1g);
  rerollIP();

// ---------- Panel open/close ----------
  const panel=el('configPanel'), overlay=el('overlay');
  el('gearBtn').addEventListener('click', ()=>{panel.classList.add('show'); overlay.classList.add('show');});
  el('closeBtn').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  // Slide the settings drawer away.
  function closePanel(){panel.classList.remove('show'); overlay.classList.remove('show');}
