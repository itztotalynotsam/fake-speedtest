// Ties it all together: the Start/Try Again button, the connection-failure
// path, and the full ping -> download -> upload test sequence.

  const startBtn = el('startBtn');
  const resultsPanel = el('results');
  startBtn.addEventListener('click', runTest);

  // Pretends to connect for a moment, then shows the chosen error code and message.
  async function runConnectionFailure(){
    setPhase('CONNECTING', true);
    bigUnit.textContent = '';
    bigValue.textContent = '···';
    pingValEl.textContent = '—';
    jitterValEl.textContent = '—';
    await sleep(900 + Math.random()*900);
    const failure = currentFailure();
    phaseLabel.textContent = 'Connection failed';
    document.body.dataset.phase = 'error';   // turns the whole page (and sky) red
    aurora.setPhase('error');
    phaseLabel.classList.remove('active');
    phaseLabel.classList.add('error');
    bigNumber.classList.add('error');
    bigUnit.textContent = '';
    bigValue.textContent = failure.code;
    errorMessageEl.textContent = failure.msg;
    errorMessageEl.classList.add('show');
  }

  // Full test: ping -> download -> upload, then fills in the result tiles.
  async function runTest(){
    startBtn.disabled = true;
    resultsPanel.classList.remove('show');
    hideExtras();          // hide last run's verdict and save button
    graphReset();          // start a fresh live graph
    el('resultTimestamp').classList.remove('show');
    trail = [];            // clear the gauge's old trail
    rerollIP();            // pick a fresh fake IP for this run
    dlPingValEl.textContent = '—';   // clear last run's download/upload ping
    ulPingValEl.textContent = '—';

    if(failToggle.checked){
      await runConnectionFailure();
      startBtn.disabled = false;
      startBtn.textContent = 'Try again';
      return;
    }

    testing = true;
    await findServer();    // short 'finding nearest server' step

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
    dlPingValEl.textContent = downRes.loaded.toFixed(0);   // ping measured while downloading
    ulPingValEl.textContent = upRes.loaded.toFixed(0);     // ping measured while uploading
    el('resLoss').textContent = Math.max(downRes.loss, upRes.loss, cfg.pl).toFixed(1);
    resultsPanel.classList.add('show');

    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'});
    const timeStr = now.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
    const tsEl = el('resultTimestamp');
    tsEl.textContent = `Test completed ${dateStr} at ${timeStr}`;
    tsEl.classList.add('show');

    // verdict, save button, and history
    onTestComplete({down:downRes.speed, up:upRes.speed, ping:pingRes.ping, jitter:pingRes.jitter,
      loss:Math.max(downRes.loss, upRes.loss, cfg.pl), dlPing:downRes.loaded, ulPing:upRes.loaded});

    testing = false;
    startBtn.disabled = false;
    startBtn.textContent = 'Run again';
  }
