// Ties it all together: the Start/Try Again button, the connection-failure
// path, and the full ping -> download -> upload test sequence.

  const startBtn = el('startBtn');
  const resultsPanel = el('results');
  startBtn.addEventListener('click', runTest);

  async function runConnectionFailure(){
    setPhase('CONNECTING', true);
    bigUnit.textContent = '';
    bigValue.textContent = '···';
    pingValEl.textContent = '—';
    jitterValEl.textContent = '—';
    await sleep(900 + Math.random()*900);
    const failure = currentFailure();
    phaseLabel.textContent = 'CONNECTION FAILED';
    phaseLabel.classList.remove('active');
    phaseLabel.classList.add('error');
    bigNumber.classList.add('error');
    bigUnit.textContent = '';
    bigValue.textContent = failure.code;
    errorMessageEl.textContent = failure.msg;
    errorMessageEl.classList.add('show');
  }

  async function runTest(){
    startBtn.disabled = true;
    resultsPanel.classList.remove('show');
    el('resultTimestamp').classList.remove('show');
    trail = [];
    rerollIP();

    if(failToggle.checked){
      await runConnectionFailure();
      startBtn.disabled = false;
      startBtn.textContent = 'TRY AGAIN';
      return;
    }

    testing = true;

    const pingRes = await runPing();
    await sleep(200);
    const downRes = await runThroughput('download', cfg.dl);
    await sleep(200);
    const upRes = await runThroughput('upload', cfg.ul);

    setPhase('DONE', false);
    const finalDisp = formatSpeed(downRes.speed);
    bigUnit.textContent = finalDisp.unit;
    bigValue.textContent = finalDisp.value;

    const downDisp = formatSpeed(downRes.speed);
    const upDisp = formatSpeed(upRes.speed);
    el('resPing').textContent = pingRes.ping.toFixed(0);
    el('resDown').textContent = downDisp.value;
    el('resDownUnit').textContent = downDisp.unit;
    el('resUp').textContent = upDisp.value;
    el('resUpUnit').textContent = upDisp.unit;
    el('resLoss').textContent = Math.max(downRes.loss, upRes.loss, cfg.pl).toFixed(1);
    resultsPanel.classList.add('show');

    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'});
    const timeStr = now.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
    const tsEl = el('resultTimestamp');
    tsEl.textContent = `Test completed ${dateStr} at ${timeStr}`;
    tsEl.classList.add('show');

    testing = false;
    startBtn.disabled = false;
    startBtn.textContent = 'RUN AGAIN';
  }
