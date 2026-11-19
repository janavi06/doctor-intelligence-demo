const $=(s,r=document)=>r.querySelector(s);
const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}},del(k){try{localStorage.removeItem(k)}catch{}}};
const FIRST_MS=20000, REPEAT_MS=20000; // PDF s5.2 says 20s repeat; s12 says 60s. Confirm with product owner.
const OTP_DEMO='123456', OTP_TTL=300000, OTP_COOLDOWN=30, OTP_MAX_TRIES=3;
const user=()=>LS.get('di_user',null);
const slKey=()=>'di_sl_'+user().mobile; // demo stand-in for the Production shortlist table
const getSL=()=>user()?LS.get(slKey(),[]):LS.get('di_pending',[]);
const setSL=a=>{LS.set(user()?slKey():'di_pending',a);paintCount()};
const log=t=>{const e=LS.get('di_events',[]);e.push({t,at:Date.now()});LS.set('di_events',e)};
function paintCount(){const c=$('#cnt');if(c)c.textContent=getSL().length}

const PAGES=[['doctors.html','Doctors']];
const cur=location.pathname.split('/').pop()||'index.html';
document.body.insertAdjacentHTML('afterbegin',`<header><div class="in"><a class="brand" href="index.html">Doctor <span>Intelligence</span></a><nav>${PAGES.map(([h,t])=>`<a href="${h}" class="${cur==h?'on':''}">${t}</a>`).join('')}</nav><span id="who"></span><button class="btn" id="authBtn"></button></div></header>`);
document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="md" hidden><div class="card" role="dialog" aria-modal="true"><button class="x" id="mx" aria-label="Close">×</button><div class="hd"><svg class="wv" viewBox="0 0 400 90" preserveAspectRatio="none"><path d="M0 90V46C60 6 140 14 215 44C290 74 350 64 400 22V90Z" fill="#fff"/></svg></div><div class="bd"><h3 id="mt"></h3><p class="sub" id="ms" hidden></p>
<div id="st1"><label class="reg">Name<input id="nm" autocomplete="name"></label><label>Mobile number<input id="mb" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number"></label>
<label class="chk reg"><input type="checkbox" id="cs"><span>I agree to the privacy notice and consent to my name and mobile number being stored.</span></label><button class="btn w" id="go">Send OTP</button></div>
<div id="st2" hidden><label>Enter OTP<input id="otp" inputmode="numeric" maxlength="6"></label><button class="btn w" id="vf">Verify and continue</button><p class="sub" style="margin-top:10px"><button class="lnk" id="rs">Resend OTP</button> <span id="hint"></span></p></div>
<p class="err" id="er" aria-live="polite"></p><p class="sw" id="sw"></p></div></div></div>`);

let mode='reg',trigger='manual',tries=0,cool=0,sentAt=0,T,timerOn=false,tick;
const md=$('#md'),er=$('#er');
const arm=ms=>{clearTimeout(T);if(!user())T=setTimeout(()=>openModal('timer'),ms)};
function setMode(m){mode=m;const r=m=='reg';
 $('#mt').textContent=r?'Register':'Login';
 $('#ms').textContent='';
 md.querySelectorAll('.reg').forEach(e=>e.style.display=r?'':'none');
 $('#sw').innerHTML=r?'Already have an Account? <button class="lnk" data-m="login">Login</button>':'Don\'t have an Account? <button class="lnk" data-m="reg">Sign up</button>';
 er.textContent='';$('#st1').hidden=false;$('#st2').hidden=true}
function openModal(trig,m='reg'){if(user())return;trigger=trig;setMode(m);md.hidden=false;log('impression:'+trig);$(m=='reg'?'#nm':'#mb').focus()}
function closeModal(){md.hidden=true;if(!user()){log('dismissal:'+trigger);if(timerOn)arm(REPEAT_MS)}}
window.DI={openModal,startTimer(){if(timerOn)return;timerOn=true;arm(FIRST_MS)}};
$('#mx').onclick=closeModal;
md.addEventListener('click',e=>{if(e.target==md)closeModal();const b=e.target.closest('[data-m]');if(b)setMode(b.dataset.m)});
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&!md.hidden)closeModal()});
function sendOtp(){tries=0;sentAt=Date.now();$('#st1').hidden=true;$('#st2').hidden=false;$('#hint').textContent='Demo OTP: '+OTP_DEMO;$('#otp').focus();cool=OTP_COOLDOWN;clearInterval(tick);
 tick=setInterval(()=>{cool--;$('#rs').textContent=cool>0?`Resend OTP in ${cool}s`:'Resend OTP';if(cool<=0)clearInterval(tick)},1000);$('#rs').textContent=`Resend OTP in ${cool}s`}
$('#go').onclick=()=>{const n=$('#nm').value.trim(),mob=$('#mb').value.trim(),users=LS.get('di_users',{});er.textContent='';
 if(mode=='reg'&&!n)return er.textContent='Enter your name.';
 if(!/^[6-9]\d{9}$/.test(mob))return er.textContent='Enter a valid 10-digit mobile number.';
 if(mode=='reg'&&!$('#cs').checked)return er.textContent='Please accept the privacy notice to continue.';
 if(mode=='reg'&&users[mob]){er.innerHTML='This number is already registered. <button class="lnk" data-m="login">Log in</button> instead.';return}
 if(mode=='login'&&!users[mob]){er.innerHTML='No account found for this number. <button class="lnk" data-m="reg">Register</button>';return}
 sendOtp()};
$('#rs').onclick=()=>{if(cool<=0)sendOtp()};
$('#vf').onclick=()=>{if(Date.now()-sentAt>OTP_TTL){er.textContent='OTP expired. Request a new one.';return}
 if($('#otp').value.trim()!==OTP_DEMO){tries++;if(tries>=OTP_MAX_TRIES){er.textContent='Too many attempts. Request a new OTP.';$('#st1').hidden=false;$('#st2').hidden=true}else er.textContent=`Incorrect OTP. ${OTP_MAX_TRIES-tries} attempt(s) left.`;return}
 const mob=$('#mb').value.trim(),users=LS.get('di_users',{});
 if(!users[mob])users[mob]={name:$('#nm').value.trim(),created:new Date().toISOString().slice(0,10)};LS.set('di_users',users);
 const pend=LS.get('di_pending',[]);LS.set('di_user',{name:users[mob].name,mobile:mob});
 LS.set(slKey(),[...new Set([...LS.get(slKey(),[]),...pend])]);LS.del('di_pending');log('registered');
 location.href=pend.length?'shortlist.html':'doctors.html'};

const ab=$('#authBtn');
if(user()){$('#who').textContent=user().name;ab.textContent='Log out';ab.className='btn ghost';ab.onclick=()=>{LS.del('di_user');location.href='doctors.html'}}
else{ab.textContent='Log in / Register';ab.onclick=()=>openModal('manual','reg')}
document.querySelectorAll('[data-auth]').forEach(a=>a.onclick=e=>{if(!user()){e.preventDefault();openModal('auth','login')}});
paintCount();
window.DI.startTimer();

/* shared helpers: card markup + shortlist toggle */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BM='<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
function toggleDoctor(id){const a=getSL(),i=a.indexOf(id);i>-1?a.splice(i,1):a.push(id);setSL(a);if(!user()&&i<0)openModal('shortlist')}
function cardHTML(d,on){const has=/\d/.test(d.exp),url=(d.branches[0]||{}).url||'#',ext=url!='#'?' target="_blank" rel="noopener"':'';
return `<article class="dcard"><button class="bm ${on?'on':''}" data-id="${d.id}" aria-label="${on?'Remove from':'Add to'} shortlist">${BM}</button>
<div class="dtop"><img class="dp" src="assets/docs/${d.id}.svg" alt="${esc(d.name)}"><div class="dm"><h3>${esc(d.name)}</h3><p class="ds">${esc(d.designation)}</p><i class="ul"></i><p class="dsp">${esc(d.speciality)}</p></div></div>
<div class="dtabs"><button class="tb on" data-t="q">Qualification</button><button class="tb" data-t="e">Experience</button></div>
<div class="tc"><p data-p="q">${esc(d.qualification)}</p><p data-p="e" hidden>${has?esc(d.exp)+' years of experience':'Experience not available'} · ${esc(d.workingAt)}, ${esc(d.city)}</p></div>
<div class="dfoot"><a class="vp" href="${url}"${ext}>Book appointment</a><a class="go" href="${url}"${ext} aria-label="Book an appointment with ${esc(d.name)}"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></a></div></article>`}
document.addEventListener('click',e=>{const t=e.target.closest('.tb');if(!t)return;const c=t.closest('.dcard');c.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b===t));c.querySelectorAll('[data-p]').forEach(p=>p.hidden=p.dataset.p!==t.dataset.t)});
