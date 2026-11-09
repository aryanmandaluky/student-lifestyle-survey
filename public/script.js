const $=id=>document.getElementById(id);
const token=()=>sessionStorage.getItem('surveyToken');
async function api(url,options={}){
  const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(token()?{Authorization:`Bearer ${token()}`}:{})}});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Request failed');
  return data;
}
function show(message,error=false){const el=$('message');el.textContent=message;el.className='message'+(error?' error':'');}
function requireLogin(){if(!token()){location.href='/index.html';return false;}return true;}
function logout(){sessionStorage.removeItem('surveyToken');location.href='/index.html';}
const fields=['major','year','studyPlace','studyHours','goals','clubs'];
function initLogin(){
  const remembered=localStorage.getItem('rememberUsername')==='true';
  $('remember').checked=remembered;
  if(remembered)$('username').value=localStorage.getItem('savedUsername')||'';
  function remember(){localStorage.setItem('rememberUsername',String($('remember').checked));if($('remember').checked)localStorage.setItem('savedUsername',$('username').value);else localStorage.removeItem('savedUsername');}
  $('remember').addEventListener('change',remember);$('username').addEventListener('input',remember);
  $('loginForm').addEventListener('submit',async e=>{e.preventDefault();remember();try{const result=await api('/api/login',{method:'POST',body:JSON.stringify({username:$('username').value,password:$('password').value})});sessionStorage.setItem('surveyToken',result.token);location.href='/form.html';}catch(err){show(err.message,true);alert(err.message);}});
}
function initSignup(){
  $('signupForm').addEventListener('submit',async e=>{e.preventDefault();const username=$('username').value.trim(),password=$('password').value;if(!username||!password){alert('Enter both a username and password.');return;}try{const result=await api('/api/register',{method:'POST',body:JSON.stringify({username,password})});$('signupForm').reset();show(`Account created! Your account ID is ${result.id}. Click Login to continue.`);$('loginLink').classList.remove('hidden');}catch(err){show(err.message,true);alert(err.message);}});
}
async function initForm(){if(!requireLogin())return;try{const me=await api('/api/me');$('welcome').textContent=`Welcome, ${me.username}!`;const saved=await api('/api/form');fields.forEach(field=>{if(field==='clubs')$('clubs').checked=saved.clubs==='Yes';else if(field==='studyPlace'){const radio=document.querySelector(`input[name="studyPlace"][value="${CSS.escape(saved.studyPlace||'')}"]`);if(radio)radio.checked=true;}else if($(field))$(field).value=saved[field]||'';});}catch(err){show(err.message,true);if(err.message==='Please log in.')logout();}
  $('surveyForm').addEventListener('submit',async e=>{e.preventDefault();const form={};fields.forEach(field=>{if(field==='clubs')form.clubs=$('clubs').checked?'Yes':'No';else if(field==='studyPlace')form.studyPlace=document.querySelector('input[name="studyPlace"]:checked')?.value||'';else form[field]=$(field).value;});try{const result=await api('/api/form',{method:'POST',body:JSON.stringify(form)});show(result.message);}catch(err){show(err.message,true);}});
}
const labels={major:'Major / field of study',year:'Year in college',studyPlace:'Favorite study location',studyHours:'Daily study hours',goals:'Academic goals',clubs:'Participates in clubs'};
async function initRecords(){if(!requireLogin())return;try{const records=await api('/api/records');const select=$('accountSelect');records.forEach(r=>{const opt=document.createElement('option');opt.value=r.id;opt.textContent=r.id;select.appendChild(opt);});function render(){const record=records.find(r=>r.id===select.value);const tbody=$('recordBody');tbody.replaceChildren();if(!record){$('tableArea').classList.add('hidden');return;}$('tableArea').classList.remove('hidden');Object.entries(labels).forEach(([key,label])=>{const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.textContent=label;const value=record.form?.[key];td.textContent=value||((key==='clubs'&&record.form)?'No':'Not provided');if(!value&&key!=='clubs')td.className='empty';tr.append(th,td);tbody.appendChild(tr);});}$('accountSelect').addEventListener('change',render);render();}catch(err){show(err.message,true);}}
