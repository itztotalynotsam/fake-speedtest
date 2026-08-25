// Fakes a plausible IP address for the header readout based on which
// network icon is currently selected (public IPv4 / CGNAT / dual-stack).

  function currentIpType(){
    return ipTypeByIcon[netIconSelect.value] || 'ipv4_public';
  }
  function randomPublicIP(){
    const octet = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
    let a;
    do{ a = octet(1,223); } while([10,100,127,169,172,192].includes(a));
    const b = octet(0,255), c = octet(0,255), d = octet(1,254);
    return `${a}.${b}.${c}.${d}`;
  }
  function randomCgnatIP(){
    // RFC 6598 shared address space: 100.64.0.0/10
    const octet = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
    return `100.${octet(64,127)}.${octet(0,255)}.${octet(1,254)}`;
  }
  function randomIPv6(){
    const seg = () => Math.floor(Math.random()*65536).toString(16);
    const prefixes = ['2001','2400','2600','2a00','2620'];
    const p = prefixes[Math.floor(Math.random()*prefixes.length)];
    return `${p}:${seg()}:${seg()}::${seg()}:${seg()}`;
  }
  function rerollIP(){
    const type = currentIpType();
    let ipStr, tag;
    if(type==='dualstack'){
      ipStr = randomIPv6();
      tag = 'IPv6 · Native (IPv4 via CGNAT)';
    } else if(type==='ipv4_cgnat'){
      ipStr = randomCgnatIP();
      tag = 'IPv4 · CGNAT';
    } else {
      ipStr = randomPublicIP();
      tag = 'IPv4 · Public';
    }
    el('ipLine').textContent = `Your IP: ${ipStr} (${tag})`;
  }
