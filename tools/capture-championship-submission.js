async(page)=>{
  // Render the canonical Studio UI at laptop density, then capture at 1.5 DPR.
  // Product screenshots have no tour shell; the public tour keeps sample labels.
  const base=page.url().split('/olchipanel/')[0]+'/olchipanel/';
  const context=await page.context().browser().newContext({viewport:{width:1280,height:720},deviceScaleFactor:1.5,reducedMotion:'reduce'});
  const shot=await context.newPage();
  const errors=[],failed=[],captures=[];
  shot.on('pageerror',e=>errors.push(e.message));
  shot.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  try{
    await shot.route('**/shell.js',route=>route.fulfill({contentType:'application/javascript',body:''}));
    await shot.goto(base);
    await shot.evaluate(()=>{
      localStorage.setItem('olchipanel.championship.studio.theme','light');
    });
    await shot.evaluate(url=>{document.body.replaceChildren();const f=document.createElement('iframe');f.id='captureApp';f.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0';f.src=url;document.body.appendChild(f);},base+'app.html?stage=6&pane=scope&presentation=1');
    const ui=shot.frameLocator('#captureApp');
    await ui.frameLocator('#scopeFrame').locator('.scope-results').waitFor();
    const scope=ui.frameLocator('#scopeFrame');
    await scope.getByLabel('분석 지표').selectOption('revenue');
    await scope.getByLabel('시작 날짜').fill('2026-08-23');
    await scope.getByLabel('끝 날짜').fill('2026-08-30');
    await scope.locator('.scope-results[data-count="8"]').waitFor();
    async function capture(name){
      for(const frame of shot.frames())await frame.evaluate(()=>document.activeElement?.blur());
      await shot.mouse.move(1278,718);
      const size=await shot.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
      if(size.width!==size.scrollWidth)throw new Error('Horizontal overflow: '+name);
      const text=await ui.locator('body').innerText();
      if(/데모|샘플 체험|0\.8\.2 · 샘플/.test(text))throw new Error('Tour wording remains in screenshot: '+name);
      await shot.screenshot({path:'output/championship-submission-r7/'+name+'.png',animations:'disabled'});
      captures.push({name,...size});
    }
    await capture('04-data-analysis');
    await scope.getByRole('button',{name:'노트·플랜에 반영 →'}).click();
    await ui.locator('#memoContent').filter({hasText:'311,700'}).waitFor();
    await capture('02-notes');
    await ui.locator('#tabPlan').click();
    await ui.frameLocator('#planFrame').locator('.card').filter({hasText:'선택 구간 추가 자료 확인'}).waitFor();
    await ui.locator('.panel-tab[data-session-id="demo-session-2"]').filter({hasText:'연결됨'}).waitFor();
    await ui.locator('.panel-tab[data-session-id="demo-session-1"]').filter({hasText:'연결 종료'}).waitFor();
    await capture('01-cover-plan');
    await ui.locator('#tabSituation').click();
    await ui.locator('#mapGraphBtn').click();
    await ui.getByRole('button',{name:'맞춤',exact:true}).click();
    await capture('03-work-graph');
    await ui.locator('.panel-tab[data-session-id="demo-session-1"]').click();
    await ui.locator('.resume-trigger').click();
    await ui.locator('#resumeDialog').waitFor();
    await capture('05-session-handoff');
    await ui.locator('#resumeDialogClose').click();
    await ui.locator('.panel-tab[data-session-id="demo-session-2"]').click();
    await ui.locator('#tabPlan').click();
    await ui.frameLocator('#planFrame').locator('.card').filter({hasText:'선택 구간 추가 자료 확인'}).waitFor();
    if(errors.length||failed.length)throw new Error(JSON.stringify({errors,failed}));
    return {captures,errors,failed,pixels:'1920x1080',sessionSwitch:'previous/current share plan and analysis note'};
  }finally{await context.close();}
}
