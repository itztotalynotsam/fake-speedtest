// SVG icon generators for each network type, the icon lookup map, and the
// logic that swaps the header badge's icon/label when the user picks one.
// All icons share one 24x24 grid, rounded 1.7px strokes and the theme accent colour (--icon).

  // wrap icon paths in a standard svg; DOT draws a small filled circle
  const S = body => `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--icon)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const DOT = (x,y,r=1.3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--icon)" stroke="none"/>`;

  // four rising bars, the first `n` lit (used for 2G/3G/4G/5G)
  function signalBarsSVG(n){
    return S([0,1,2,3].map(i => { const h = 6+i*4; return `<rect x="${3+i*5}" y="${20-h}" width="3" height="${h}" rx="1.2" ${i<n ? 'fill="var(--icon)"' : 'stroke-opacity=".3"'}/>`; }).join(''));
  }
  const globeSVG = () => S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>');
  const wifiSVG = () => S('<path d="M3 9a13 13 0 0118 0M6 12.5a8.5 8.5 0 0112 0M9 16a4 4 0 016 0"/>' + DOT(12,19.3));
  const fibreSVG = () => S('<path d="M3 7c6 0 6 5 9 5s3-5 9-5M3 12h18M3 17c6 0 6-5 9-5s3 5 9 5"/>' + DOT(12,12,1.8));          // strands converging on a light pulse
  const cableSVG = () => S('<rect x="3" y="8" width="14" height="8" rx="2"/><path d="M17 12h4M7 8V5M11 8V5M7 16v3M11 16v3"/>');
  const satelliteDishSVG = () => S('<path d="M4 9a9 9 0 009 9L4 9z"/><path d="M10 11l6-6"/>' + DOT(17,4,1.4) + '<path d="M16 9.5a4 4 0 012.5 2.5M16 6.5a8 8 0 013.5 3.5"/>');
  const towerSVG = () => S('<path d="M12 10v11M8 21l4-11 4 11M9.5 16.5h5"/><path d="M8 5.5a5 5 0 000 5M16 5.5a5 5 0 010 5"/>' + DOT(12,8,1.5));
  const laserSVG = () => S('<circle cx="4.5" cy="12" r="2"/><circle cx="19.5" cy="12" r="2"/><path d="M7.5 12h9" stroke-dasharray="1.8 2.4"/>');
  const chipSVG = () => S('<rect x="7" y="7" width="10" height="10" rx="1.8"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>');
  const enterpriseSVG = () => S('<path d="M3 21h18M5 21V10l6-3v14M11 21V5l8 3v13M14 11h2M14 14.5h2M14 18h2M8 12.5v.01M8 16v.01"/>');
  const switchSVG = () => S('<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 11.5v1M10.5 11.5v1M14 11.5v1M17.5 11.5v1"/>');
  const submarineCableSVG = () => S('<path d="M2 8c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.4 6-1M2 13c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.4 6-1"/><path d="M2 19c4 0 5-3 10-3s6 3 10 3"/>');
  const rocketSVG = () => S('<path d="M12 2c3 2 4.5 5.5 4.5 9l-2.2 3h-4.6L7.5 11C7.5 7.5 9 4 12 2z"/><circle cx="12" cy="9" r="1.6"/><path d="M7.8 13.5L5 16.5l3-.5M16.2 13.5L19 16.5l-3-.5M12 17.5V21"/>');
  const meshSVG = () => S('<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M11 7l-5 9.2M13 7l5 9.2M7.2 18h9.6"/>');
  const latencySVG = () => S('<circle cx="12" cy="13" r="7.5"/><path d="M12 13V9M9.5 2.5h5M12 2.5v3M18.5 6.5L20 5"/>');   // stopwatch
  const bluetoothSVG = () => S('<path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9"/>');
  const thunderboltSVG = () => S('<path d="M13 2L5 13.5h6L10 22l9-12h-6.5z"/>');

  const netIconMap = {
    internet:{icon:globeSVG(), label:'Internet'},
    fibre:{icon:fibreSVG(), label:'Fibre'},
    wifi:{icon:wifiSVG(), label:'Wi-Fi'},
    cable:{icon:cableSVG(), label:'Cable'},
    satellite:{icon:satelliteDishSVG(), label:'Satellite'},
    tower:{icon:towerSVG(), label:'Tower'},
    laser:{icon:laserSVG(), label:'Laser Link'},
    chip:{icon:chipSVG(), label:'IoT'},
    enterprise:{icon:enterpriseSVG(), label:'Enterprise'},
    switch:{icon:switchSVG(), label:'Network Switch'},
    submarinecable:{icon:submarineCableSVG(), label:'Submarine Cable'},
    rocket:{icon:rocketSVG(), label:'Experimental'},
    mesh:{icon:meshSVG(), label:'Mesh'},
    latency:{icon:latencySVG(), label:'Low Latency'},
    bluetooth:{icon:bluetoothSVG(), label:'Bluetooth'},
    thunderbolt:{icon:thunderboltSVG(), label:'Thunderbolt'},
    five_g:{icon:signalBarsSVG(4), label:'5G'},
    four_g:{icon:signalBarsSVG(3), label:'4G/LTE'},
    three_g:{icon:signalBarsSVG(2), label:'3G'},
    two_g:{icon:signalBarsSVG(1), label:'2G'},
  };
  const netIconSelect = el('netIconSelect');

  function setNetIcon(type){
    const m = netIconMap[type] || netIconMap.internet;
    el('netIcon').innerHTML = m.icon;
    el('netLabel').textContent = m.label;
    netIconSelect.value = netIconMap[type] ? type : 'internet';
    if(typeof rerollIP==='function') rerollIP();
  }
  netIconSelect.addEventListener('change', e=>setNetIcon(e.target.value));
