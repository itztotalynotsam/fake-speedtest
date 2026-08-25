// SVG icon generators for each network type, the icon lookup map, and the
// logic that swaps the header badge's icon/label when the user picks one.

  function signalBarsSVG(activeCount){
    const heights = [5,8,11,14];
    let bars = '';
    for(let i=0;i<4;i++){
      const h = heights[i];
      const x = i*5;
      const y = 16-h;
      const fill = i<activeCount ? 'var(--cyan)' : '#2a3540';
      bars += `<rect x="${x}" y="${y}" width="3.5" height="${h}" rx="1" fill="${fill}"/>`;
    }
    return `<svg viewBox="0 0 20 16" width="17" height="15">${bars}</svg>`;
  }
  function globeSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.6">
      <circle cx="12" cy="12" r="9"/>
      <ellipse cx="12" cy="12" rx="4" ry="9"/>
      <path d="M3 12h18"/>
      <path d="M4.7 7h14.6"/>
      <path d="M4.7 17h14.6"/>
    </svg>`;
  }
  function wifiSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.8" stroke-linecap="round">
      <path d="M3.5 9.5a13 13 0 0117 0"/>
      <path d="M6.5 13a8.5 8.5 0 0111 0"/>
      <path d="M9.7 16.5a4 4 0 014.6 0"/>
      <circle cx="12" cy="19.3" r="1" fill="var(--cyan)" stroke="none"/>
    </svg>`;
  }
  function fibreSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.8" stroke-linecap="round">
      <path d="M3 18L21 6"/>
      <circle cx="7.5" cy="15.3" r="1.1" fill="var(--cyan)" stroke="none"/>
      <circle cx="12.5" cy="12" r="1.1" fill="var(--cyan)" stroke="none"/>
      <circle cx="17.5" cy="8.7" r="1.1" fill="var(--cyan)" stroke="none"/>
    </svg>`;
  }
  function cableSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.8" stroke-linecap="round">
      <path d="M2.5 12h5"/>
      <circle cx="12" cy="12" r="4.2"/>
      <circle cx="12" cy="12" r="1.2" fill="var(--cyan)" stroke="none"/>
      <path d="M16.5 12h5"/>
    </svg>`;
  }
  function satelliteDishSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.7" stroke-linecap="round">
      <path d="M3.5 14.5a10 10 0 0114-9"/>
      <path d="M5.7 12.8a7 7 0 019-6"/>
      <circle cx="16" cy="6.4" r="1.1" fill="var(--cyan)" stroke="none"/>
      <path d="M8.5 15l2.6 2.6"/>
      <path d="M11 18.5l2.7-1.8"/>
      <path d="M14 16.5l2.6 3.5"/>
    </svg>`;
  }
  function towerSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.6" stroke-linecap="round">
      <path d="M12 3l-5 18M12 3l5 18"/>
      <path d="M8.3 9.5h7.4M7.2 14.5h9.6"/>
      <path d="M9.5 3.2a4 4 0 015 0"/>
      <path d="M8.2 1.7a6.3 6.3 0 017.6 0"/>
    </svg>`;
  }
  function laserSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.7" stroke-linecap="round">
      <rect x="2.5" y="10.5" width="4" height="3" rx="0.6"/>
      <path d="M6.5 12h13.5"/>
      <path d="M14 8.3l2-1.6M14 15.7l2 1.6M17 12h1.6" stroke-width="1.3"/>
      <path d="M19 8.5l1.8-1.4M19 15.5l1.8 1.4" stroke-width="1.3"/>
    </svg>`;
  }
  function chipSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.6" stroke-linecap="round">
      <rect x="7" y="7" width="10" height="10" rx="1.4"/>
      <rect x="10" y="10" width="4" height="4" rx="0.6"/>
      <path d="M9 3.3v2.4M12 3.3v2.4M15 3.3v2.4M9 18.3v2.4M12 18.3v2.4M15 18.3v2.4"/>
      <path d="M3.3 9v2M3.3 12v2M3.3 15v2M18.3 9v2M18.3 12v2M18.3 15v2" transform="translate(0.4 0)"/>
    </svg>`;
  }
  function enterpriseSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="9" width="8" height="12" rx="0.6"/>
      <rect x="12" y="4" width="8" height="17" rx="0.6"/>
      <path d="M6.5 12h1.5M6.5 15h1.5M6.5 18h1.5"/>
      <path d="M14.5 7h1.5M14.5 10h1.5M14.5 13h1.5M14.5 16h1.5"/>
    </svg>`;
  }
  function switchSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.6" stroke-linecap="round">
      <rect x="2.3" y="8" width="19.4" height="8" rx="1.2"/>
      <path d="M5.3 12h1.6M8.5 12h1.6M11.7 12h1.6M14.9 12h1.6M18.1 12h1.6"/>
      <circle cx="19.7" cy="9.7" r="0.6" fill="var(--cyan)" stroke="none"/>
    </svg>`;
  }
  function submarineCableSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.5" stroke-linecap="round">
      <path d="M2 7c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 3.2-1.4 4.8 0 3.2 1.4 4.8 0"/>
      <path d="M4 10.5q8 8 16 0"/>
      <circle cx="12" cy="15.8" r="1.1" fill="var(--cyan)" stroke="none"/>
    </svg>`;
  }
  function rocketSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2.3c2.4 2 3.7 4.9 3.7 8.3 0 2-1 4-1 4h-5.4s-1-2-1-4c0-3.4 1.3-6.3 3.7-8.3z"/>
      <circle cx="12" cy="9.3" r="1.3"/>
      <path d="M8.3 14.6l-1.9 3.4 3.2-1.1M15.7 14.6l1.9 3.4-3.2-1.1"/>
      <path d="M10.6 18.5l1.4 2.4 1.4-2.4"/>
    </svg>`;
  }
  function meshSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1" stroke-linecap="round">
      <path d="M5 6l7 6.5M19 6l-7 6.5M5 18l7-6.5M19 18l-7-6.5M5 6v12M19 6v12"/>
      <circle cx="5" cy="6" r="1.7" fill="var(--cyan)" stroke="none"/>
      <circle cx="19" cy="6" r="1.7" fill="var(--cyan)" stroke="none"/>
      <circle cx="12" cy="12.5" r="1.9" fill="var(--cyan)" stroke="none"/>
      <circle cx="5" cy="18" r="1.7" fill="var(--cyan)" stroke="none"/>
      <circle cx="19" cy="18" r="1.7" fill="var(--cyan)" stroke="none"/>
    </svg>`;
  }
  function latencySVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="13.5" r="8"/>
      <path d="M12 13.5l3.2-3.6"/>
      <path d="M9.3 2.5h5.4"/>
      <path d="M12 2.5v2.3"/>
    </svg>`;
  }
  function bluetoothSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cyan)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v18"/>
      <path d="M8 7l8 5-8 5"/>
      <path d="M16 7l-8 5 8 5"/>
    </svg>`;
  }
  function thunderboltSVG(){
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="var(--cyan)" stroke="none">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
    </svg>`;
  }

// ---------- Icon lookup + header badge ----------
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
