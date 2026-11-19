const MODE=document.body.dataset.mode||'all';
const COLS=[['S.No',d=>d.sno],['Doctor Name',d=>d.name],['Profile Page',null],['Designation',d=>d.designation],['Speciality',d=>d.speciality],['Educational Qualification',d=>d.qualification],['Exp (In Yrs)',d=>d.exp],['Working at',d=>d.workingAt],['City',d=>d.city],['Branch',d=>d.branches.map(b=>b.name).join(' ')],['State',d=>d.state],['Source',d=>d.source],['Last Verified',d=>d.verified],['Reg. ID',d=>d.regId]];
const P=new URLSearchParams(location.search).get('q')||'';
const S={q:P.toLowerCase(),cat:'All',city:'All',exp10:false,f:{},sort:[0,1],view:LS.get('di_view','list')};let DATA=[];
if(MODE=='shortlist'&&!user())location.replace('doctors.html');
fetch('data/doctors.json').then(r=>r.json()).then(j=>{DATA=j.map((d,i)=>({...d,sno:i+1}));init()}).catch(()=>{$('#out').innerHTML='<p class="empty">Could not load data/doctors.json. Open the site with a local server (e.g. VS Code Live Server).</p>'});
const chip=(v,on,label,n)=>`<button class="chip ${on?'on':''}" data-v="${esc(v)}">${esc(label)}${n!=null?`<span>${n}</span>`:''}</button>`;
function init(){
 $('#q').value=P;
 $('#fcol').innerHTML=COLS.map((c,i)=>c[1]&&i?`<label>${c[0]}<input data-f="${i}"></label>`:'').join('');
 $('#fcol').oninput=e=>{S.f[e.target.dataset.f]=e.target.value.toLowerCase();render()};
 $('#q').oninput=e=>{S.q=e.target.value.toLowerCase();render()};
 $('#vw').onclick=e=>{const b=e.target.closest('button');if(b){S.view=b.dataset.v;LS.set('di_view',S.view);render()}};
 $('#out').onclick=e=>{const b=e.target.closest('.bm');if(b){toggleDoctor(b.dataset.id);render();return}
  const th=e.target.closest('th[data-i]');if(th&&!th.classList.contains('nf')){const i=+th.dataset.i;S.sort=S.sort[0]==i?[i,-S.sort[1]]:[i,1];render()}};
 $('#fcat').onclick=e=>{const b=e.target.closest('.chip');if(b){S.cat=b.dataset.v;render()}};
 $('#fcity').onclick=e=>{const b=e.target.closest('.chip');if(b){S.city=b.dataset.v;render()}};
 $('#fexp').onclick=()=>{S.exp10=!S.exp10;render()};
 const dr=$('#dr'),sc=$('#scrim'),tog=o=>{dr.classList.toggle('open',o);sc.classList.toggle('on',o);dr.setAttribute('aria-hidden',!o)};
 $('#fb').onclick=()=>tog(true);$('#dx').onclick=$('#apply').onclick=sc.onclick=()=>tog(false);
 document.addEventListener('keydown',e=>{if(e.key=='Escape')tog(false)});
 $('#clr').onclick=()=>{S.cat='All';S.city='All';S.exp10=false;S.f={};document.querySelectorAll('#fcol input').forEach(i=>i.value='');render()};

 render()}
function render(){
 const sl=getSL(),B=MODE=='shortlist'?DATA.filter(d=>sl.includes(d.id)):DATA;
 const cats=['All',...new Set(B.map(d=>d.cat))],cities=['All',...new Set(B.map(d=>d.city))];
 $('#fcat').innerHTML=cats.map(c=>chip(c,S.cat==c,c,c=='All'?B.length:B.filter(d=>d.cat==c).length)).join('');
 $('#fcity').innerHTML=cities.map(c=>chip(c,S.city==c,c=='All'?'All cities':c)).join('');
 $('#fexp').innerHTML=`<button class="chip ${S.exp10?'on':''}">10+ yrs experience</button>`;
 let r=B.filter(d=>(S.cat=='All'||d.cat==S.cat)&&(S.city=='All'||d.city==S.city)&&(!S.exp10||parseFloat(d.exp)>=10));
 if(S.q)r=r.filter(d=>[d.name,d.speciality,d.city,d.workingAt,...d.branches.map(b=>b.name)].join(' ').toLowerCase().includes(S.q));
 Object.entries(S.f).forEach(([i,v])=>{if(v)r=r.filter(d=>String(COLS[i][1](d)).toLowerCase().includes(v))});
 const [si,dir]=S.sort,g=COLS[si][1];
 r.sort((a,b)=>{const x=g(a),y=g(b),nx=parseFloat(x),ny=parseFloat(y);return(isNaN(nx)||isNaN(ny)?String(x).localeCompare(String(y)):nx-ny)*dir});
 $('#cnt2').textContent=`${r.length} of ${B.length} doctors`;
 $('#fc').textContent=(S.cat!='All')+(S.city!='All')+S.exp10+Object.values(S.f).filter(Boolean).length;
 $('#apply').textContent=`Show ${r.length} doctors`;
 document.querySelectorAll('#vw button').forEach(b=>b.classList.toggle('on',b.dataset.v==S.view));
 const empty=`<p class="empty">${MODE=='shortlist'&&!B.length?"You haven't shortlisted any doctors yet. Explore the Doctors directory to save doctors you are interested in.":'No doctors match these filters.'}</p>`;
 if(!r.length){$('#out').innerHTML=empty;return}
 if(S.view=='card'){$('#out').innerHTML=`<div class="dgrid">${r.map(d=>cardHTML(d,sl.includes(d.id))).join('')}</div>`;return}
 const head='<thead><tr><th class="nf"></th>'+COLS.map((c,i)=>`<th data-i="${i}" class="${c[1]?'':'nf'}">${c[0]}${si==i?(dir>0?' ▲':' ▼'):''}</th>`).join('')+'</tr></thead>';
 const rows=r.map(d=>`<tr><td><button class="bm ${sl.includes(d.id)?'on':''}" data-id="${d.id}" aria-label="${sl.includes(d.id)?'Remove from':'Add to'} shortlist">${BM}</button></td>`+
 `<td>${d.sno}</td><td><a href="#">${esc(d.name)}</a></td><td>${d.branches.map(b=>`<a class="b" href="${b.url}" target="_blank" rel="noopener">Profile Page ↗</a>`).join('')}</td>`+
 [d.designation,d.speciality,d.qualification,d.exp,d.workingAt,d.city].map(v=>`<td>${esc(v)}</td>`).join('')+
 `<td>${d.branches.map(b=>`<span class="b">${esc(b.name)}</span>`).join('')}</td>`+[d.state,d.source,d.verified,d.regId].map(v=>`<td>${esc(v)}</td>`).join('')+'</tr>').join('');
 $('#out').innerHTML=`<div class="tw"><table>${head}<tbody>${rows}</tbody></table></div>`}
