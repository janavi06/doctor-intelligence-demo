// DEMO ONLY: localStorage stands in for the Production DB and the OTP is simulated. Replace with real API calls (spec section 10).
const CFG={popupDelay:20000,repeatDelay:20000,otpCooldown:30,otpAttempts:3,perPage:25};
const $=s=>document.querySelector(s),L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},W=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const NA='Not available',esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const COLS=[['sno','S.No'],['name','Doctor Name'],['profile','Profile Page'],['designation','Designation'],['speciality','Speciality'],['education','Education Qualification'],['exp','Exp (In Yrs)'],['workingAt','Working at'],['city','City'],['branch','Branch'],['state','State'],['source','Source'],['lastVerified','Last Verified'],['regId','Reg. ID']];
let D=[],DC=[],S={sort:'sno',dir:1,f:{},q:'',page:1},otp=null,ctx='timer',tm=null,cd=null;
const users=()=>L('di_users',{}),sess=()=>sessionStorage.getItem('di_sess'),me=()=>users()[sess()],sl=()=>(L('di_short',{})[sess()]||[]),pend=()=>L('di_pend',[]);
const stats=()=>L('di_stats',{imp:0,dis:0,reg:0});const bump=k=>{const s=stats();s[k]++;W('di_stats',s)};
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2600)};
const val=(d,k)=>k==='profile'||k==='branch'?d.branches.map(b=>k==='branch'?b.name:b.url||NA).join(' '):(d[k]??NA);
const cell=(d,k)=>k==='branch'?d.branches.map(b=>`<div class="ln">${esc(b.name)}</div>`).join(''):k==='profile'?d.branches.map(b=>b.url?`<div class="ln"><a href="${esc(b.url)}" target="_blank" rel="noopener">Profile Page ↗</a></div>`:`<div class="ln na">${NA}</div>`).join(''):k==='name'?`<span class="nm">${esc(d.name)}</span>`:esc(val(d,k));
const bmk=on=>`<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>`;
function table(id,list,filters){const f=filters?S.f:{};
 let h=`<div class="tw"><table><thead><tr><th class="nos c0"></th>${COLS.map(([k,l])=>`<th data-k="${k}">${l}${filters&&S.sort===k?(S.dir>0?' ▲':' ▼'):''}</th>`).join('')}</tr>`;
 if(filters)h+=`<tr class="f"><td></td>${COLS.map(([k])=>`<td><input data-f="${k}" value="${esc(S.f[k]||'')}"></td>`).join('')}</tr>`;
 h+='</thead><tbody>'+list.map(d=>{const on=me()?sl().includes(d.sno):pend().includes(d.sno);return `<tr><td class="c0"><button class="bm ${on?'on':''}" data-id="${d.sno}" title="${on?'Remove from shortlist':'Save to shortlist'}">${bmk()}</button></td>${COLS.map(([k])=>`<td>${cell(d,k)}</td>`).join('')}</tr>`}).join('')+'</tbody></table></div>';
 $(id).innerHTML=h}
function filtered(){let r=D.filter(d=>(!S.q||[d.name,d.speciality,d.city,d.workingAt,val(d,'branch')].join(' ').toLowerCase().includes(S.q))&&Object.entries(S.f).every(([k,v])=>!v||String(val(d,k)).toLowerCase().includes(v.toLowerCase())));
 return r.sort((a,b)=>{const x=val(a,S.sort),y=val(b,S.sort);return S.dir*(S.sort==='sno'?a.sno-b.sno:String(x).localeCompare(String(y),undefined,{numeric:true}))})}
function renderDocs(keepFocus){const r=filtered(),pg=Math.max(1,Math.ceil(r.length/CFG.perPage));S.page=Math.min(S.page,pg);
 $('#meta').textContent=`${r.length} of ${D.length} doctors`;const af=document.activeElement?.dataset?.f,pos=document.activeElement?.selectionStart;
 table('#t-doctors',r.slice((S.page-1)*CFG.perPage,S.page*CFG.perPage),true);
 $('#pager').innerHTML=pg>1?Array.from({length:pg},(_,i)=>`<button class="${i+1===S.page?'on':''}" data-p="${i+1}">${i+1}</button>`).join(''):'';
 if(af){const e=$(`[data-f="${af}"]`);e.focus();e.setSelectionRange(pos,pos)}}
function renderShort(){const l=D.filter(d=>sl().includes(d.sno));$('#smeta').textContent=`${l.length} saved`;
 l.length?table('#t-shortlist',l,false):$('#t-shortlist').innerHTML=`<div class="empty">You haven't shortlisted any doctors yet. Explore the Doctors directory to save doctors you are interested in.<br><br><a class="btn" href="#doctors">Explore doctors</a></div>`}
function renderProf(){const u=me();$('#prof').innerHTML=`<div class="kv"><span>Name</span><b>${esc(u.name)}</b><span>Verified mobile</span><b>${esc(u.mobile)}</b></div><p><button class="btn o sm" id="out">Log out</button></p>`;$('#out').onclick=()=>{sessionStorage.removeItem('di_sess');upd();go('doctors')}}
function renderAdmin(){const a=L('di_admin',{status:'Never synced',changes:[],staged:0,rel:[]}),pc=a.changes.filter(c=>c.st==='pending').length,st=stats(),us=Object.values(users());
 $('#v-admin').innerHTML=`<div class="head"><div><h1>Admin demo: data workflow</h1><p>Simulates Google Sheets → Staging → Production. Sample changes are placeholders for the client demo.</p></div></div>
 <div class="pipe"><span class="pill ${a.last?'on':''}">Google Sheets</span>→<span class="pill ${a.staged?'on':''}">Staging</span>→<span class="pill ${a.rel.length?'on':''}">Production</span></div>
 <div class="grid"><div class="card"><h2>1. Sync from Google Sheets (Staging)</h2><p>Last sync: ${a.last||'never'} · Status: <span class="tag">${a.status}</span></p><button class="btn sm" id="sync">Sync from Google Sheets</button></div>
 <div class="card"><h2>2. Staging change review</h2>${a.changes.length?a.changes.map(c=>`<div class="row"><div><span class="tag">${c.type}</span> <b>${esc(c.who)}</b><br>${c.field}: ${esc(c.from)} → ${esc(c.to)}</div><div>${c.st==='pending'?`<button class="btn sm" data-ap="${c.id}">Approve</button> <button class="btn o sm" data-rj="${c.id}">Reject</button>`:`<span class="tag">${c.st}</span>`}</div></div>`).join(''):'<p class="na">No changes. Run a sync first.</p>'}</div>
 <div class="card"><h2>3. Publish to Production</h2><p>${pc?pc+' change(s) still pending review.':a.staged?'Approved staging data ready for release.':'Nothing staged.'} Release approval is separate from record approval.</p><button class="btn sm" id="pub" ${(!a.staged||pc)?'disabled':''}>Publish to Production</button> <button class="btn o sm" id="rb" ${a.rel.length?'':'disabled'}>Roll back last release</button>${a.rel.map(r=>`<div class="row"><span>${r.id} · ${r.at}</span><span class="tag">${r.status}</span></div>`).join('')}</div>
 <div class="card"><h2>Visitor activity (Production)</h2><div class="kv"><span>Pop-up shown</span><b>${st.imp}</b><span>Dismissed</span><b>${st.dis}</b><span>Registered</span><b>${st.reg}</b></div></div>
 <div class="card"><h2>Restricted Staging visitor copy (masked, one-way)</h2>${us.length?us.map(u=>`<div class="row"><span>${esc(u.name)}</span><span>******${u.mobile.slice(-4)}</span></div>`).join(''):'<p class="na">No visitors yet.</p>'}</div></div>`;
 const save=x=>{W('di_admin',x);renderAdmin()},now=()=>new Date().toLocaleString();
 $('#sync').onclick=()=>save({...a,last:now(),status:'Success',changes:DC.map(c=>({...c,st:'pending'}))});
 document.querySelectorAll('[data-ap],[data-rj]').forEach(b=>b.onclick=()=>{const id=b.dataset.ap||b.dataset.rj,ok=!!b.dataset.ap;a.changes.find(c=>c.id===id).st=ok?'approved':'rejected';a.staged=a.changes.some(c=>c.st==='approved')||a.staged;save(a)});
 $('#pub').onclick=()=>{a.rel.push({id:'REL-'+String(a.rel.length+1).padStart(3,'0'),at:now(),status:'Live'});if(a.rel.length>1)a.rel[a.rel.length-2].status='Superseded';save(a);toast('Published to Production')};
 $('#rb').onclick=()=>{a.rel[a.rel.length-1].status='Rolled back';if(a.rel.length>1)a.rel[a.rel.length-2].status='Live';save(a)}}
function go(v){location.hash=v;route()}
function route(){let v=location.hash.slice(1)||'doctors';if((v==='shortlist'||v==='profile')&&!me()){ctx='gate';openM();v='doctors'}
 document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!=='v-'+v);document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===v));
 clearTimeout(tm);if(v==='doctors'){renderDocs();if(!me())timer(CFG.popupDelay)}if(v==='shortlist')renderShort();if(v==='profile')renderProf();if(v==='admin')renderAdmin()}
function timer(ms){clearTimeout(tm);tm=setTimeout(()=>{if(!me()&&$('#modal').hidden&&(location.hash||'#doctors')==='#doctors'){ctx='timer';openM()}},ms)}
function upd(){$('#cnt').textContent=me()?sl().length:pend().length;$('#authBtn').textContent=me()?me().name.split(' ')[0]+' · Log out':'Log in / Register';$('#authBtn').onclick=()=>{if(me()){sessionStorage.removeItem('di_sess');upd();route()}else{ctx='manual';openM()}}}
function toggle(id){if(!me()){const p=pend();if(!p.includes(id))p.push(id);W('di_pend',p);upd();renderDocs();ctx='bookmark';openM();return}
 const all=L('di_short',{}),l=all[sess()]||[],i=l.indexOf(id);i<0?l.push(id):l.splice(i,1);all[sess()]=l;W('di_short',all);upd();(location.hash==='#shortlist')?renderShort():renderDocs()}
function openM(mode='reg'){bump('imp');$('#modal').hidden=false;form(mode)}
function closeM(dismiss){$('#modal').hidden=true;if(dismiss&&!me()){bump('dis');if(ctx!=='gate')timer(CFG.repeatDelay)}}
function form(mode) {
  otp = null;
  const lg = mode === 'login';

  $('#mbody').innerHTML = `
    <h2 style="font-size:15px">${lg ? 'Login' : 'Register'}</h2>
    ${lg ? '' : '<label>Name</label><input id="nm" autocomplete="name" placeholder="Your name">'}
    <label>Mobile number</label>
    <input id="mb" inputmode="numeric" maxlength="10" placeholder="10-digit number">
    <div id="ex"></div>
    ${lg ? '' : '<label class="chk"><input type="checkbox" id="cs">I agree to the privacy notice and consent to my name and mobile number being stored.</label>'}
    <div class="err" id="er"></div>
    <button class="btn" id="go" style="width:100%;margin-top:8px">Send OTP</button>
    <p style="text-align:center;margin:10px 0 0">
      ${lg
        ? 'New here? <button class="lk" id="sw">Register</button>'
        : 'Already registered? <button class="lk" id="sw">Log in</button>'}
    </p>`;

  $('#sw').onclick = () => form(lg ? 'reg' : 'login');

  $('#mb').oninput = e => {
    $('#ex').innerHTML = !lg && users()[e.target.value]
      ? '<div class="note">This number is already registered. <button class="lk" id="sw2">Log in instead</button></div>'
      : '';

    if ($('#sw2')) {
      $('#sw2').onclick = () => form('login');
    }
  };

  $('#go').onclick = () => {
    const m = $('#mb').value.trim();
    const n = lg ? '' : $('#nm').value.trim();
    const e = $('#er');

    if (!lg && !n) return e.textContent = 'Enter your name.';
    if (!/^[6-9]\d{9}$/.test(m)) {
      return e.textContent = 'Enter a valid 10-digit mobile number.';
    }
    if (lg && !users()[m]) {
      return e.textContent = 'No account found for this number. Register instead.';
    }
    if (!lg && !$('#cs').checked) {
      return e.textContent = 'Accept the privacy notice to continue.';
    }

    otpStep(m, n);
  };
}
function otpStep(m,n){const code=String(Math.floor(100000+Math.random()*900000));otp={h:btoa(code),tries:0};
 $('#mbody').innerHTML=`<h2 style="font-size:15px">Verify your mobile</h2><p>Enter the 6-digit code sent to ******${m.slice(-4)}.</p><div class="note">Demo OTP: <b>${code}</b> (a real SMS provider replaces this)</div><label>OTP</label><input id="ot" inputmode="numeric" maxlength="6"><div class="err" id="er"></div><button class="btn" id="vf" style="width:100%;margin-top:8px">Verify and continue</button><p style="text-align:center;margin:10px 0 0"><button class="lk" id="rs">Resend OTP</button></p>`;
 let s=CFG.otpCooldown;const r=$('#rs');r.disabled=true;cd=setInterval(()=>{r.textContent=s>0?`Resend OTP in ${s--}s`:'Resend OTP';if(s<0){clearInterval(cd);r.disabled=false}},1000);r.onclick=()=>{if(!r.disabled){clearInterval(cd);otpStep(m,n)}};
 $('#vf').onclick=()=>{if(btoa($('#ot').value)!==otp.h){otp.tries++;return $('#er').textContent=otp.tries>=CFG.otpAttempts?'Too many attempts. Request a new OTP.':'Incorrect OTP. Try again.'}
  clearInterval(cd);const u=users();let isNew=!u[m];if(isNew){u[m]={id:'V'+Date.now(),name:n,mobile:m};W('di_users',u);bump('reg')}
  sessionStorage.setItem('di_sess',m);const p=pend(),all=L('di_short',{}),l=all[m]||[];p.forEach(i=>{if(!l.includes(i))l.push(i)});all[m]=l;W('di_short',all);W('di_pend',[]);
  closeM(false);upd();toast(isNew?'Account created':'Welcome back');go(p.length?'shortlist':ctx==='gate'?'doctors':(location.hash.slice(1)||'doctors'))}}
document.addEventListener('click',e=>{const b=e.target.closest('.bm');if(b)return toggle(+b.dataset.id);const th=e.target.closest('th[data-k]');if(th){S.dir=S.sort===th.dataset.k?-S.dir:1;S.sort=th.dataset.k;renderDocs()}const p=e.target.closest('[data-p]');if(p){S.page=+p.dataset.p;renderDocs()}if(e.target.id==='modal')closeM(true)});
document.addEventListener('input',e=>{if(e.target.dataset.f!==undefined){S.f[e.target.dataset.f]=e.target.value;S.page=1;renderDocs()}if(e.target.id==='q'){S.q=e.target.value.toLowerCase();S.page=1;renderDocs()}});
$('#mx').onclick=()=>closeM(true);addEventListener('hashchange',route);
fetch('data.json').then(r=>r.json()).then(j=>{D=j.doctors;DC=j.demoChanges;upd();route()}).catch(()=>{document.querySelector('main').innerHTML='<div class="empty">Could not load data.json. Open this folder with Live Server instead of double-clicking index.html.</div>'});
