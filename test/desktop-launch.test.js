'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {EventEmitter}=require('node:events');
const {prefersDesktop,openDesktop}=require('../src/desktop-launch');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'olchipanel-launch-'));
try {
  assert.equal(prefersDesktop(root,{}),false);
  assert.equal(prefersDesktop(root,{OLCHIPANEL_OPEN:'desktop'}),true);
  fs.writeFileSync(path.join(root,'preferences.json'),JSON.stringify({windowMode:'desktop'}));
  assert.equal(prefersDesktop(root,{OLCHIPANEL_OPEN:'tab'}),true);
  const errors=[];let calls=0,unref=false;
  const child=new EventEmitter();child.unref=()=>{unref=true;};
  assert.equal(openDesktop('http://127.0.0.1:6718',{
    resolve:()=>({command:'electron',args:['desktop/main.cjs']}),
    spawn:(command,args,options)=>{calls++;assert.equal(command,'electron');assert.deepEqual(args,['desktop/main.cjs']);assert.equal(options.env.OLCHIPANEL_PORT,'6718');assert.equal(options.env.OLCHIPANEL_OPEN,'0');assert.equal(options.env.ELECTRON_RUN_AS_NODE,undefined);assert.equal(options.windowsHide,true);return child;},
    report:error=>errors.push(error.message),
  }),true);
  assert.equal(unref,true);
  child.emit('error',new Error('spawn failed'));
  assert.deepEqual(errors,['spawn failed']);assert.equal(calls,1);
  assert.equal(openDesktop('http://127.0.0.1:6711',{
    resolve:()=>{throw new Error('missing Electron');},spawn:()=>{throw new Error('must not launch fallback');},report:error=>errors.push(error.message),
  }),false);
  assert.equal(errors[1],'missing Electron');
  fs.writeFileSync(path.join(root,'preferences.json'),'{bad');
  assert.throws(()=>prefersDesktop(root,{}),/could not be read/);
  console.log('DESKTOP LAUNCH PASS: preference, port, no recursive auto-open, failure without browser fallback');
}finally{fs.rmSync(root,{recursive:true,force:true});}
