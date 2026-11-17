let menu = document.querySelector('#menu-btn');
let navbar = document.querySelector('.navbar');

menu.onclick = () =>{
    menu.classList.toggle('fa-times');
    navbar.classList.toggle('active');
}

window.onscroll = () =>{
    menu.classList.remove('fa-times');
    navbar.classList.remove('active');
    toTop.style.display = window.scrollY > 600 ? 'block' : 'none';
}

const toTop = document.querySelector('.to-top');
toTop.onclick = () => window.scrollTo({top:0});

/* ---------- Project library (saved in this browser) ---------- */
const SEED = [
 {id:1,title:'Microplastics in Local Water Sources',field:'environment',level:'undergraduate',author:'Amara P.',tags:['water','sampling'],summary:'Sampling tap and river water to estimate microplastic concentration and compare filtration methods.',likes:24},
 {id:2,title:'Sleep Patterns and Exam Performance',field:'psychology',level:'high school',author:'Kavindu R.',tags:['survey','sleep'],summary:'A survey of 200 students examining the link between sleep hours and test scores.',likes:31},
 {id:3,title:'Low-Cost Sensors for Crop Moisture',field:'engineering',level:'undergraduate',author:'Nimal S.',tags:['IoT','agriculture'],summary:'Designing an affordable soil-moisture sensor and testing it on small farms.',likes:18},
 {id:4,title:'Bias in Student Essay Grading Models',field:'computer science',level:'postgraduate',author:'Dr. Lena M.',tags:['NLP','fairness'],summary:'Evaluating whether automated essay scorers favour certain writing styles or dialects.',likes:42},
 {id:5,title:'Mobile Money and Small Business Growth',field:'economics',level:'undergraduate',author:'Tariq H.',tags:['finance','case study'],summary:'Interviews with 30 shop owners on how digital payments changed their revenue.',likes:12},
 {id:6,title:'Gut Microbiome and Stress in Students',field:'biology',level:'postgraduate',author:'Sana K.',tags:['lab','health'],summary:'Comparing microbiome diversity across low- and high-stress periods of the semester.',likes:20}
];
const store = {
  get(){ try{ return JSON.parse(localStorage.getItem('rm_projects')) || SEED; }catch(e){ return SEED; } },
  set(v){ try{ localStorage.setItem('rm_projects', JSON.stringify(v)); }catch(e){} }
};
let projects = store.get();
const grid = document.querySelector('#project-grid');
const q = document.querySelector('#search'), fieldSel = document.querySelector('#field'), levelSel = document.querySelector('#level');

function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function render(){
  const t = q.value.trim().toLowerCase();
  const list = projects.filter(p =>
    (fieldSel.value==='all' || p.field===fieldSel.value) &&
    (levelSel.value==='all' || p.level===levelSel.value) &&
    (!t || (p.title+p.summary+p.tags.join(' ')+p.author).toLowerCase().includes(t)));
  grid.innerHTML = list.length ? list.map(p => `
    <div class="box">
      <span class="tag">${esc(p.field)}</span><span class="tag">${esc(p.level)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.summary)}</p>
      <div>${p.tags.map(x=>`<span class="tag">#${esc(x)}</span>`).join('')}</div>
      <div class="meta"><span><i class="fas fa-user"></i> ${esc(p.author)}</span>
      <button data-like="${p.id}" aria-label="Like project"><i class="fas fa-heart"></i> ${p.likes}</button></div>
    </div>`).join('') : '<p class="empty">No projects match your search. Try another keyword or submit your own below.</p>';
}
[q,fieldSel,levelSel].forEach(el => el.addEventListener('input', render));
grid.addEventListener('click', e => {
  const b = e.target.closest('[data-like]'); if(!b) return;
  const p = projects.find(x => x.id == b.dataset.like); p.likes++; store.set(projects); render(); renderProfile();
});

document.querySelector('#submit-form').addEventListener('submit', e => {
  e.preventDefault();
  if(!user){ openAuth('login','Please log in to publish a project.'); return; }
  const f = new FormData(e.target);
  projects.unshift({ownerId:user.id,id:Date.now(),title:f.get('title'),field:f.get('field'),level:f.get('level'),author:f.get('author'),
    tags:(f.get('tags')||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,4),summary:f.get('summary'),likes:0});
  store.set(projects); e.target.reset(); fillAuthor(); render(); renderProfile();
  document.querySelector('#toast').textContent = 'Project published to the library.';
  document.querySelector('#projects').scrollIntoView();
});
render();

/* ---------- ResearchMe AI Agent ---------- */
/* To use a real AI model, set AGENT_ENDPOINT to your own server URL that accepts
   POST {messages:[{role,content}]} and returns {reply:"..."}. Never put API keys in this file. */
const AGENT_ENDPOINT = '';
const log = document.querySelector('#chat-log'), input = document.querySelector('#chat-input');
const history = [];

function say(text, who){
  const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = text;
  log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
}

const stop = new Set('a an the of in on for to and or with about is are my me i project research study topic idea ideas help give need want'.split(' '));
function keyTopic(s){ return s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w&&!stop.has(w)).join(' ') || 'your topic'; }

function localAgent(msg){
  const m = msg.toLowerCase(), t = keyTopic(msg.replace(/^(.*?)(on|about|for|:)\s/i,''));
  if(/cite|citation|apa|reference/.test(m))
    return 'APA 7 pattern for a journal article:\nAuthor, A. A., & Author, B. B. (Year). Title of article. Journal Name, Volume(Issue), pages. https://doi.org/xxxx\n\nBook: Author, A. A. (Year). Title of book (Edition). Publisher.\n\nPaste your source details and I will format them for you.';
  if(/question|hypothes/.test(m))
    return `Research questions for "${t}":\n1. How does ${t} affect the group you are studying?\n2. What factors best predict outcomes related to ${t}?\n3. How do two methods or groups differ in ${t}?\n\nA testable hypothesis follows a pattern: "If [change], then [measurable result], because [reason]."`;
  if(/method|design|survey|experiment/.test(m))
    return `Choosing a method for "${t}":\n• Survey: best for opinions and habits across many people.\n• Experiment: best for cause and effect; needs a control group.\n• Interview or case study: best for depth and "why" questions.\n• Secondary data analysis: fastest when good datasets already exist.\n\nTell me your question and sample size and I will narrow it down.`;
  if(/outline|structure|paper|report|write/.test(m))
    return `Paper outline for "${t}":\n1. Abstract (150–250 words)\n2. Introduction: problem, gap, research question\n3. Literature review: 8–15 key sources\n4. Methodology: participants, tools, procedure, ethics\n5. Results: tables and charts first, interpretation second\n6. Discussion: meaning, limits, next steps\n7. Conclusion and references`;
  if(/abstract|summar/.test(m))
    return `Abstract template:\nBackground: ${t} is important because ___.\nAim: This study examines ___.\nMethod: We used ___ with n = ___.\nResults: We found ___.\nConclusion: This suggests ___.`;
  if(/plan|timeline|schedule/.test(m))
    return 'A 12-week plan:\nWeeks 1–2 choose topic and read\nWeeks 3–4 refine question and method\nWeek 5 ethics approval and pilot\nWeeks 6–8 collect data\nWeeks 9–10 analyse\nWeeks 11–12 write, revise, present';
  if(/topic|idea|suggest|what should/.test(m))
    return `Topic ideas around "${t}":\n• A small survey on how ${t} affects students at your school or campus\n• A comparison of two approaches to ${t}\n• A case study of one local example of ${t}\n\nPick the one you can finish with the data you can realistically collect.`;
  return 'I can help with: topic ideas, research questions, methodology, paper outlines, abstracts, APA citations and project timelines. Try "Suggest topics on renewable energy" or "Write an outline about sleep and grades".';
}

async function ask(text){
  say(text,'me'); history.push({role:'user',content:text});
  const wait = say('Thinking…','bot');
  let reply;
  if(AGENT_ENDPOINT){
    try{
      const r = await fetch(AGENT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history})});
      reply = (await r.json()).reply;
    }catch(e){ reply = 'I could not reach the AI service, so here is a built-in answer:\n\n' + localAgent(text); }
  } else { await new Promise(r=>setTimeout(r,500)); reply = localAgent(text); }
  wait.textContent = reply; history.push({role:'assistant',content:reply}); log.scrollTop = log.scrollHeight;
}
document.querySelector('#chat-form').addEventListener('submit', e => {
  e.preventDefault(); const v = input.value.trim(); if(!v) return; input.value=''; ask(v);
});
document.querySelectorAll('[data-prompt]').forEach(b => b.onclick = () => {
  document.querySelector('#agent').scrollIntoView(); ask(b.dataset.prompt);
});
say('Hi, I am the ResearchMe assistant. Tell me your subject and I will help you find a topic, shape a question, pick a method or outline your paper.','bot');


/* ---------- Accounts (demo: stored in this browser only) ---------- */
const $ = s => document.querySelector(s);
const read = (k,d) => { try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch(e){ return d; } };
const write = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
let users = read('rm_users', []);
let user = users.find(u => u.id === read('rm_session', null)) || null;

async function hashPw(pw, salt){
  const data = new TextEncoder().encode(salt + pw);
  if(window.crypto && crypto.subtle){
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  let h = 0; for(const c of salt+pw) h = (h*31 + c.charCodeAt(0)) | 0; return String(h);
}

const modal = $('#auth-modal');
function setTab(name){
  const login = name === 'login';
  $('#login-form').hidden = !login; $('#register-form').hidden = login;
  $('#tab-login').setAttribute('aria-selected', login); $('#tab-register').setAttribute('aria-selected', !login);
  $('#login-msg').textContent = $('#register-msg').textContent = '';
  (login ? $('#login-form') : $('#register-form')).querySelector('input').focus();
}
function openAuth(tab='login', msg=''){
  modal.hidden = false; setTab(tab); if(msg) $('#'+tab+'-msg').textContent = msg;
}
function closeAuth(){ modal.hidden = true; }
$('#nav-login').addEventListener('click', e => { e.preventDefault(); openAuth('login'); });
$('#auth-close').onclick = closeAuth;
modal.addEventListener('click', e => { if(e.target === modal) closeAuth(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.hidden) closeAuth(); });
$('#tab-login').onclick = () => setTab('login');
$('#tab-register').onclick = () => setTab('register');

$('#register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), msg = $('#register-msg');
  const email = f.email.trim().toLowerCase();
  if(f.password.length < 8) return msg.textContent = 'Use a password with at least 8 characters.';
  if(f.password !== f.confirm) return msg.textContent = 'The passwords do not match.';
  if(users.some(u => u.email === email)) return msg.textContent = 'An account with this email already exists. Try logging in.';
  const salt = crypto.getRandomValues ? [...crypto.getRandomValues(new Uint8Array(8))].join('') : String(Date.now());
  const u = {id:'u'+Date.now(), name:f.name.trim(), email, institution:f.institution.trim(), field:f.field, level:f.level,
    bio:'', joined:new Date().toISOString(), salt, hash:await hashPw(f.password, salt)};
  users.push(u); write('rm_users', users); signIn(u); e.target.reset();
});

$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), msg = $('#login-msg');
  const u = users.find(x => x.email === f.email.trim().toLowerCase());
  if(!u || u.hash !== await hashPw(f.password, u.salt)) return msg.textContent = 'Email or password is incorrect.';
  signIn(u); e.target.reset();
});

function signIn(u){ user = u; curView = 'overview'; curChat = null; write('rm_session', u.id); closeAuth(); refreshUI(); }
function signOut(){ user = null; curChat = null; write('rm_session', null); refreshUI(); window.scrollTo({top:0}); }
$('#logout-btn').onclick = signOut;

function fillAuthor(){ const a = $('#submit-form [name=author]'); if(a && user) a.value = user.name; }

function refreshUI(){
  const on = !!user;
  $('#nav-login').hidden = on; $('#public').hidden = on; $('#dashboard').hidden = !on;
  if(on){ fillAuthor(); renderSide(); showView(curView); }
}

function renderProfile(){
  if(!user) return;
  const mine = projects.filter(p => p.ownerId === user.id);
  $('#p-avatar').textContent = user.name.split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
  $('#p-name').textContent = user.name; $('#p-level').textContent = user.level; $('#p-field').textContent = user.field;
  $('#p-email').textContent = user.email; $('#p-inst').textContent = user.institution;
  $('#p-joined').textContent = new Date(user.joined).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  $('#p-bio').textContent = user.bio || 'No bio yet. Use edit profile to tell others about your research interests.';
  $('#p-projects').textContent = mine.length; $('#p-likes').textContent = mine.reduce((n,p) => n + p.likes, 0);
  $('#my-projects').innerHTML = mine.length ? mine.map(p => `
    <div class="box"><span class="tag">${esc(p.field)}</span><span class="tag">${esc(p.level)}</span>
    <h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
    <div class="meta"><span>${p.tags.map(t=>'#'+esc(t)).join(' ')}</span><span><i class="fas fa-heart"></i> ${p.likes}</span></div></div>`).join('')
    : '<p class="empty">You have not published a project yet. <a href="#submit" style="color:var(--green)">Submit your first one.</a></p>';
}

$('#edit-btn').onclick = () => {
  const f = $('#edit-form'); f.hidden = !f.hidden;
  if(!f.hidden) for(const k of ['name','institution','field','level','bio']) f.elements[k].value = user[k] || '';
};
$('#edit-form').addEventListener('submit', e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
  Object.assign(user, {name:f.name.trim(), institution:f.institution.trim(), field:f.field, level:f.level, bio:f.bio.trim()});
  write('rm_users', users); e.target.hidden = true; refreshUI();
});

/* ---------- Theme toggle ---------- */
const themeBtns = [...document.querySelectorAll('.theme-btn')];
function applyTheme(t, save){
  document.documentElement.setAttribute('data-theme', t);
  themeBtns.forEach(b => {
    b.classList.toggle('fa-moon', t === 'light'); b.classList.toggle('fa-sun', t === 'dark');
    b.setAttribute('aria-pressed', t === 'dark');
    b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
  if(save){ try{ localStorage.setItem('rm_theme', t); }catch(e){} }
}
applyTheme(document.documentElement.getAttribute('data-theme') || 'light', false);
themeBtns.forEach(b => b.onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  let saved = null; try{ saved = localStorage.getItem('rm_theme'); }catch(_){}
  if(!saved) applyTheme(e.matches ? 'dark' : 'light', false);
});

/* ---------- Hero rotating word ---------- */
const rot = document.querySelector('#rotator'), words = ['topic','question','method','mentor','paper'];
let wi = 0;
setInterval(() => {
  rot.classList.add('out');
  setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 300);
}, 2600);


/* ---------- Dashboard (shown instead of the website when logged in) ---------- */
let curView = 'overview', curChat = null;
const VIEWS = {overview:'Overview',assistant:'AI assistant',history:'AI history',projects:'My projects',explore:'Explore projects',planner:'Research planner',profile:'My profile'};
const uk = k => k + '_' + (user ? user.id : 'x');
const getChats = () => read(uk('rm_chats'), []), setChats = v => write(uk('rm_chats'), v);
const getTasks = () => read(uk('rm_tasks'), []), setTasks = v => write(uk('rm_tasks'), v);
const getSaved = () => read(uk('rm_saved'), []), setSaved = v => write(uk('rm_saved'), v);
const fmt = ts => new Date(ts).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
const side = $('#side'), scrim = $('#scrim'), dlog = $('#d-log');

function toggleSide(open){ side.classList.toggle('open', open); scrim.hidden = !open; }
$('#side-toggle').onclick = () => toggleSide(!side.classList.contains('open'));
scrim.onclick = () => toggleSide(false);
$('#side-logout').onclick = signOut;
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

function renderSide(){
  $('#s-avatar').textContent = $('#t-avatar').textContent = initials(user.name);
  $('#s-name').textContent = user.name; $('#s-email').textContent = user.email;
}
function showView(v){
  curView = v;
  document.querySelectorAll('.view').forEach(x => x.hidden = x.id !== 'view-' + v);
  document.querySelectorAll('.side-nav [data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $('#view-title').textContent = VIEWS[v]; toggleSide(false); window.scrollTo({top:0});
  ({overview:renderOverview, assistant:renderChat, history:renderHistory, projects:renderMine, explore:renderExplore, planner:renderTasks, profile:renderProfile})[v]();
}

function renderOverview(){
  const c = getChats().sort((a,b) => b.ts - a.ts), t = getTasks(), mine = projects.filter(p => p.ownerId === user.id);
  $('#o-hello').textContent = 'Welcome back, ' + user.name.split(' ')[0];
  $('#o-chats').textContent = c.length; $('#o-projects').textContent = mine.length;
  $('#o-likes').textContent = mine.reduce((n,p) => n + p.likes, 0);
  $('#o-tasks').textContent = t.filter(x => x.done).length + '/' + t.length;
  $('#o-recent').innerHTML = c.length ? c.slice(0,4).map(x => `<button class="row-item" data-open="${x.id}"><i class="fas fa-comment-dots"></i><span>${esc(x.title)}</span><small>${fmt(x.ts)}</small></button>`).join('')
    : '<p class="empty">No AI chats yet. Open the AI assistant to start one.</p>';
}

/* AI assistant with saved history */
function bubble(t, w){ const d = document.createElement('div'); d.className = 'msg ' + w; d.textContent = t; dlog.appendChild(d); dlog.scrollTop = dlog.scrollHeight; return d; }
function renderChat(){
  const c = getChats().find(x => x.id == curChat);
  $('#d-chat-title').textContent = c ? c.title : 'New conversation';
  dlog.innerHTML = '';
  if(!c || !c.messages.length) bubble('Hi ' + user.name.split(' ')[0] + ', I am your research assistant. Tell me what you are working on. Every conversation is saved in your AI history.', 'bot');
  else c.messages.forEach(m => bubble(m.content, m.role === 'user' ? 'me' : 'bot'));
}
async function dAsk(text){
  const all = getChats(); let c = all.find(x => x.id == curChat);
  if(!c){ c = {id:Date.now(), title:text.slice(0,48), ts:Date.now(), messages:[]}; all.unshift(c); curChat = c.id; }
  c.messages.push({role:'user', content:text}); c.ts = Date.now(); setChats(all); renderChat();
  const wait = bubble('Thinking…', 'bot'); let reply;
  if(AGENT_ENDPOINT){
    try{ const r = await fetch(AGENT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:c.messages})}); reply = (await r.json()).reply; }
    catch(e){ reply = 'I could not reach the AI service, so here is a built-in answer:\n\n' + localAgent(text); }
  } else { await new Promise(r => setTimeout(r, 500)); reply = localAgent(text); }
  const fresh = getChats(), cc = fresh.find(x => x.id == c.id);
  if(cc){ cc.messages.push({role:'assistant', content:reply}); cc.ts = Date.now(); setChats(fresh); }
  if(curView === 'assistant' && curChat == c.id) renderChat();
}
$('#d-form').addEventListener('submit', e => { e.preventDefault(); const i = $('#d-input'), v = i.value.trim(); if(!v) return; i.value = ''; dAsk(v); });
document.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => dAsk(b.dataset.ask));
$('#d-new').onclick = () => { curChat = null; renderChat(); $('#d-input').focus(); };

function renderHistory(){
  const q = $('#h-search').value.trim().toLowerCase();
  const list = getChats().sort((a,b) => b.ts - a.ts).filter(c => !q || (c.title + c.messages.map(m => m.content).join(' ')).toLowerCase().includes(q));
  $('#h-list').innerHTML = list.length ? list.map(c => `<div class="row-item static"><i class="fas fa-comment-dots"></i>
    <div class="grow"><b>${esc(c.title)}</b><small>${c.messages.length} messages, ${fmt(c.ts)}</small><p>${esc((c.messages[c.messages.length-1] || {content:''}).content.slice(0,110))}</p></div>
    <button class="mini" data-open="${c.id}" aria-label="Open chat"><i class="fas fa-arrow-right"></i></button>
    <button class="mini danger" data-delchat="${c.id}" aria-label="Delete chat"><i class="fas fa-trash"></i></button></div>`).join('')
    : '<p class="empty">' + (q ? 'No conversations match your search.' : 'Your AI history is empty. Start a chat in the AI assistant.') + '</p>';
}
$('#h-search').addEventListener('input', renderHistory);
$('#h-clear').onclick = () => { if(getChats().length && confirm('Delete all AI conversations? This cannot be undone.')){ setChats([]); curChat = null; renderHistory(); } };

/* Projects */
const card = (p, extra) => `<div class="box"><span class="tag">${esc(p.field)}</span><span class="tag">${esc(p.level)}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
  <div>${p.tags.map(x => `<span class="tag">#${esc(x)}</span>`).join('')}</div><div class="meta"><span><i class="fas fa-user"></i> ${esc(p.author)}</span><span>${extra}</span></div></div>`;
function renderMine(){
  const mine = projects.filter(p => p.ownerId === user.id);
  $('#mp-list').innerHTML = mine.length ? mine.map(p => card(p, `<i class="fas fa-heart"></i> ${p.likes} <button data-delproj="${p.id}" aria-label="Delete project"><i class="fas fa-trash"></i></button>`)).join('')
    : '<p class="empty">You have not published a project yet. Choose new project to add your first one.</p>';
}
$('#mp-new').onclick = () => { const f = $('#mp-form'); f.hidden = !f.hidden; };
$('#mp-form').addEventListener('submit', e => {
  e.preventDefault(); const f = new FormData(e.target);
  projects.unshift({ownerId:user.id, id:Date.now(), title:f.get('title'), field:f.get('field'), level:f.get('level'), author:user.name,
    tags:(f.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0,4), summary:f.get('summary'), likes:0});
  store.set(projects); e.target.reset(); e.target.hidden = true; render(); renderMine();
});
function renderExplore(){
  const q = $('#e-search').value.trim().toLowerCase(), saved = getSaved(), only = $('#e-saved').checked;
  const list = projects.filter(p => (!only || saved.includes(p.id)) && (!q || (p.title + p.summary + p.tags.join(' ') + p.author).toLowerCase().includes(q)));
  $('#e-list').innerHTML = list.length ? list.map(p => card(p, `<button data-like2="${p.id}" aria-label="Like"><i class="fas fa-heart"></i> ${p.likes}</button> <button data-save="${p.id}" aria-label="Save" class="${saved.includes(p.id) ? 'on' : ''}"><i class="fas fa-bookmark"></i></button>`)).join('')
    : '<p class="empty">' + (only ? 'You have not saved any projects yet.' : 'No projects match your search.') + '</p>';
}
$('#e-search').addEventListener('input', renderExplore); $('#e-saved').addEventListener('change', renderExplore);

/* Planner */
function renderTasks(){
  const t = getTasks(), d = t.filter(x => x.done).length, pct = t.length ? Math.round(d / t.length * 100) : 0;
  $('#t-bar').style.width = pct + '%'; $('#t-text').textContent = t.length ? d + ' of ' + t.length + ' tasks done (' + pct + '%)' : 'No tasks yet. Add your first step below.';
  $('#t-list').innerHTML = t.map(x => `<li class="${x.done ? 'done' : ''}"><button data-task="${x.id}" aria-label="Toggle task"><i class="far fa-${x.done ? 'check-square' : 'square'}"></i></button><span>${esc(x.text)}</span><button class="mini danger" data-deltask="${x.id}" aria-label="Delete task"><i class="fas fa-trash"></i></button></li>`).join('');
}
$('#t-form').addEventListener('submit', e => { e.preventDefault(); const i = $('#t-input'), v = i.value.trim(); if(!v) return; const t = getTasks(); t.push({id:Date.now(), text:v, done:false}); setTasks(t); i.value = ''; renderTasks(); });

/* One click handler for dynamic buttons */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open],[data-delchat],[data-delproj],[data-like2],[data-save],[data-task],[data-deltask]'); if(!b || !user) return;
  const d = b.dataset;
  if(d.open){ curChat = d.open; showView('assistant'); }
  else if(d.delchat){ setChats(getChats().filter(c => c.id != d.delchat)); if(curChat == d.delchat) curChat = null; renderHistory(); }
  else if(d.delproj){ if(confirm('Delete this project?')){ projects = projects.filter(p => p.id != d.delproj); store.set(projects); render(); renderMine(); } }
  else if(d.like2){ const p = projects.find(x => x.id == d.like2); p.likes++; store.set(projects); render(); renderExplore(); }
  else if(d.save){ let s = getSaved(); const id = +d.save; s = s.includes(id) ? s.filter(x => x !== id) : [...s, id]; setSaved(s); renderExplore(); }
  else if(d.task){ const t = getTasks(), x = t.find(y => y.id == d.task); x.done = !x.done; setTasks(t); renderTasks(); }
  else if(d.deltask){ setTasks(getTasks().filter(x => x.id != d.deltask)); renderTasks(); }
});

refreshUI();
