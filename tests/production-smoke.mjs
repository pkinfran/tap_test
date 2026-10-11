import assert from 'node:assert/strict';
import {chromium, devices} from 'playwright';
import {mkdir} from 'node:fs/promises';

const BASE = process.env.CLASSIC_PUBLIC_URL || 'https://pkinfran.github.io/tap_test/';
const out = 'test-artifacts';
await mkdir(out, {recursive:true});

function firstConnectedGroup(colors) {
  const n=10,seen=new Set();
  for(let start=0;start<colors.length;start++){
    if(seen.has(start)||colors[start]===null)continue;
    const stack=[start],group=[];seen.add(start);
    while(stack.length){
      const i=stack.pop();group.push(i);
      for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const r=Math.floor(i/n)+dr,c=i%n+dc,j=r*n+c;
        if(r>=0&&r<n&&c>=0&&c<n&&!seen.has(j)&&colors[j]===colors[start]){
          seen.add(j);stack.push(j);
        }
      }
    }
    if(group.length>=2)return group;
  }
  return null;
}

const browser=await chromium.launch({headless:true});
let failures=0;
try {
  for(const spec of [
    {name:'desktop',viewport:{width:1365,height:950}},
    {name:'mobile',...devices['Pixel 7']}
  ]){
    const context=await browser.newContext({locale:'zh-CN',...spec});
    const page=await context.newPage();
    const exceptions=[];
    const missing=[];
    page.on('pageerror',e=>exceptions.push(String(e)));
    page.on('response',r=>{
      if(r.status()>=400 && r.url().startsWith(new URL(BASE).origin)) missing.push(r.status()+' '+r.url());
    });
    try {
      const initial=await page.goto(new URL('?view=lab',BASE).toString(), {waitUntil:'networkidle',timeout:30000});
      assert.equal(initial?.status(),200,'Public Pages must return HTTP 200 for lab entry');
      assert.match(await page.title(),/非原 APK/,'Must identify independent H5, not official APK');
      await page.locator('[role=gridcell]').first().waitFor({timeout:15000});
      assert.equal(await page.locator('[role=gridcell]').count(),100,'Board must contain 100 cells');
      assert.equal((await page.locator('#stage-number').textContent()).trim(),'01');
      const colors=await page.locator('[role=gridcell]').evaluateAll(cells=>cells.map(c=>c.dataset.color===undefined?null:c.dataset.color));
      const group=firstConnectedGroup(colors);
      assert.ok(group,'A legal connected group must exist on live site');
      const before=Number((await page.locator('#score-number').textContent()).replaceAll(',',''));
      await page.locator('[role=gridcell]').nth(group[0]).click();
      await page.waitForFunction(v=>Number(document.querySelector('#score-number').textContent.replaceAll(',',''))>v, before,{timeout:10000});
      await page.waitForTimeout(1200);
      const after=Number((await page.locator('#score-number').textContent()).replaceAll(',',''));
      assert.equal(after-before, 5*group.length*group.length, 'Live gameplay scoring must follow 5*n*n');
      assert.ok(!missing.length,'Live assets must not 404: '+missing.join('; '));
      assert.ok(!exceptions.length,'No runtime exceptions: '+exceptions.join('; '));
      await page.screenshot({path:out+'/public-'+spec.name+'.png',fullPage:true});
      console.log('LIVE_CLASSIC_PAGES_SMOKE_PASS',JSON.stringify({
        device:spec.name,url:page.url(),firstGroup:group.length,score:after,assets:'OK',scriptErrors:0
      }));
    }catch(e){
      failures++;
      console.error('LIVE_CLASSIC_PAGES_SMOKE_FAIL',spec.name,e);
      await page.screenshot({path:out+'/public-'+spec.name+'-failure.png',fullPage:true}).catch(()=>{});
    }finally{await context.close()}
  }
}finally{await browser.close()}
if(failures)process.exitCode=1;
