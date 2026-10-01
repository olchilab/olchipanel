const assert=require('node:assert/strict');
const {renderTheme}=require('../desktop/theme-renderer.cjs');
for(const variant of ['studio','editorial'])for(const surface of ['index','plan']){
 const html=renderTheme(variant,surface);
 assert.ok(html.includes('data-design="'+variant+'"'));
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Function(m[1]);
 if(surface==='index'){
  assert.ok(html.includes('setInterval(refresh,'+(variant==='studio'?'1500':'5000')+')'));
  assert.ok(!html.includes('  beginWindow();'));
  assert.ok(html.includes("fetch('/api/state')"),'real API unchanged');
  assert.ok(html.includes('layout.v8.'),'workflow layout storage regression');
  assert.ok(html.includes('theme-goal'));
 }
}
assert.throws(()=>renderTheme('../','index'));
console.log('THEME RENDERER PASS: both themes, both surfaces, JS syntax, real API, isolated lease');
