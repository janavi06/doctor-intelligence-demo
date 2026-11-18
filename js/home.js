let D=[];const hq=$('#hq');
fetch('data/doctors.json').then(r=>r.json()).then(j=>{D=j;draw()});
function draw(){const q=hq.value.trim().toLowerCase(),sl=getSL();
 const r=D.filter(d=>!q||[d.name,d.speciality,d.city,d.workingAt,...d.branches.map(b=>b.name)].join(' ').toLowerCase().includes(q));
 $('#hg').innerHTML=r.length?r.map(d=>cardHTML(d,sl.includes(d.id))).join(''):'<p class="empty">No doctors match your search.</p>'}
hq.oninput=draw;
const toDir=()=>{location.href='doctors.html'+(hq.value.trim()?'?q='+encodeURIComponent(hq.value.trim()):'')};
$('#hfind').onclick=e=>{e.preventDefault();toDir()};hq.onkeydown=e=>{if(e.key=='Enter')toDir()};
$('#hg').onclick=e=>{const b=e.target.closest('.bm');if(b){toggleDoctor(b.dataset.id);draw()}};
