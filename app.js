/* 小日和 Hiyori */
'use strict';
/* ================= utilities ================= */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>(p||'')+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const a=String(s).split('-').map(Number);return new Date(a[0],a[1]-1,a[2]);};
const addDays=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ds(d);};
const addMonths=(s,n)=>{const d=pd(s);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return ds(d);};
const today=()=>ds(new Date());
const dow=s=>{const g=pd(s).getDay();return g===0?7:g;};
const WD=['','一','二','三','四','五','六','日'];
const toMin=t=>{if(!t)return null;const a=String(t).split(':').map(Number);return a[0]*60+(a[1]||0);};
const fromMin=m=>{m=((Math.round(m)%1440)+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60);};
const diffDays=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const nowHM=()=>fromMin(nowMin());
const fmtMD=s=>{const d=pd(s);return (d.getMonth()+1)+'/'+d.getDate();};
const fmtDay=s=>s?fmtMD(s)+'（'+WD[dow(s)]+'）':'';
const fmtDur=m=>{if(!m)return '';if(m<60)return m+' 分鐘';const h=Math.floor(m/60),r=m%60;return r?h+' 小時 '+r+' 分':h+' 小時';};
const fmtStamp=ts=>{if(!ts)return '';const d=new Date(ts);return (d.getMonth()+1)+'/'+d.getDate()+' '+pad(d.getHours())+':'+pad(d.getMinutes());};
const fmtNum=n=>Math.abs(n)>=100?String(Math.round(n)):String(Math.round(n*100)/100);
const trim=(s,n)=>{s=String(s||'');return s.length>n?s.slice(0,n)+'…':s;};
const hash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h);};
const ENC=encodeURIComponent;
/* icons cut from the user's own design board; anything else falls back to the inline SVG sprite */
const RASTER=new Set(['nav-home','nav-cal','nav-note','nav-flask','nav-cat','cake','note','flask','camera','sprout','trip','heart','gear','juice','cupcake','roll','toast','pencil','cup','croissant-s','cookie','tube','dish','scope','dropper','cam-s','icecream','drink','flower-s','pot','flowerpot','flower2','book','film','ticket','sliders','moon','bell','cat-white','cat-grey','slice','latte','croissant','camera2','flowers','plant','scenery','boat','daisies','cat-sleep','leaf','star','heart2','branch']);
const ALIAS={'n-home':'nav-home','n-cal':'nav-cal','n-note':'note','n-flask':'flask','n-camera':'camera','n-cat':'nav-cat','cat-sit':'cat-white','d-flower':'flower-s','l-tube':'tube','l-dish':'dish','l-scope':'scope','l-dropper':'dropper','coffee':'latte','matcha':'tube','pudding':'cupcake','soda':'juice','melon':'drink','hotcake':'roll','napolitan':'toast','taiyaki':'cookie','dango':'icecream','omurice':'slice'};
const svgUse=(id,cls)=>{let k=String(id);if(k.startsWith('f-'))k=k.slice(2);k=ALIAS[k]||k;if(RASTER.has(k))return `<i class="ic ic-${k}${cls?' '+cls:''}" aria-hidden="true"></i>`;return `<svg${cls?` class="${cls}"`:''} aria-hidden="true"><use href="#${id}"/></svg>`;};
const I=id=>svgUse('i-'+id);
const F=id=>svgUse('f-'+id);
const dayIndex=s=>Math.floor(pd(s).getTime()/864e5);
const splitTags=t=>[...new Set(String(t||'').split(/[\s,，、#]+/).map(x=>x.trim()).filter(Boolean))];
const LS={get(k,def){try{const v=localStorage.getItem(k);return v==null?def:JSON.parse(v);}catch(e){return def;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}};

/* ================= constants ================= */
const CAT_BUILTIN={
  study:{name:'讀書、考試',short:'課業',food:'cake'},
  lab:{name:'實驗、研究',short:'實驗',food:'tube'},
  chores:{name:'日常雜事',short:'雜事',food:'croissant'},
  friends:{name:'朋友、約會',short:'朋友',food:'juice'},
  rest:{name:'休息、娛樂',short:'休息',food:'cupcake'},
  habit:{name:'固定習慣',short:'習慣',food:'latte'}
};
const CAT_BUILTIN_ORDER=['study','lab','chores','friends','rest','habit'];
/* categories are editable: built-ins can be renamed/recoloured, new ones added (stored in settings.catDefs) */
const CAT_STORE={};const CAT_ORDER=[];
const CATS=new Proxy(CAT_STORE,{get(t,k){if(typeof k!=='string'||k in t)return t[k];return t.chores||t[CAT_ORDER[0]];}});
const CAT_TINTS=[['study','蜜桃粉'],['lab','抹茶綠'],['chores','奶茶色'],['friends','天空藍'],['rest','櫻花紫'],['habit','焦糖棕'],['mint','薄荷綠'],['lemon','檸檬黃'],['lilac','薰衣草']];
function catDefsNow(){return CAT_ORDER.map(id=>({id,name:CAT_STORE[id].name,short:CAT_STORE[id].short,tint:CAT_STORE[id].tint,kw:CAT_STORE[id].kw||''}));}
function rebuildCats(){
  const defs=(D.meta.settings&&Array.isArray(D.meta.settings.catDefs)&&D.meta.settings.catDefs.length)?D.meta.settings.catDefs:CAT_BUILTIN_ORDER.map(id=>({id,name:CAT_BUILTIN[id].name,short:CAT_BUILTIN[id].short,tint:id,kw:''}));
  Object.keys(CAT_STORE).forEach(k=>delete CAT_STORE[k]);CAT_ORDER.length=0;
  defs.forEach(d=>{if(!d||!d.id||CAT_STORE[d.id])return;const b=CAT_BUILTIN[d.id];
    CAT_STORE[d.id]={name:d.name||(b&&b.name)||'未命名',short:d.short||(d.name||'').slice(0,2)||(b&&b.short)||'分類',food:(b&&b.food)||'star',tint:CAT_TINTS.some(x=>x[0]===d.tint)?d.tint:(b?d.id:'mint'),kw:d.kw||''};CAT_ORDER.push(d.id);});
  let st=document.getElementById('catcss');if(!st){st=document.createElement('style');st.id='catcss';document.head.appendChild(st);}
  const css=CAT_ORDER.map(id=>`.c-${id}{--tint:var(--t-${CAT_STORE[id].tint})}`).join('');if(st.textContent!==css)st.textContent=css;
}
const FOODS=[
  {id:'cake',name:'草莓蛋糕',need:0,desc:'讀書、考試的好夥伴。'},
  {id:'latte',name:'貓咪拿鐵',need:0,desc:'每天固定的那一杯。'},
  {id:'croissant',name:'可頌',need:0,desc:'雜事一層一層來。'},
  {id:'juice',name:'檸檬氣泡飲',need:0,desc:'和朋友碰杯的氣泡。'},
  {id:'cupcake',name:'杯子蛋糕',need:0,desc:'休息時最適合。'},
  {id:'icecream',name:'冰淇淋',need:0,desc:'今天辛苦了，獎勵一下。'},
  {id:'slice',name:'蛋糕切片',need:5,desc:'切一小塊就好。'},
  {id:'roll',name:'年輪蛋糕',need:15,desc:'一圈一圈慢慢長大。'},
  {id:'toast',name:'草莓吐司',need:30,desc:'早餐也要可愛。'},
  {id:'cookie',name:'巧克力餅乾',need:50,desc:'口袋裡的小點心。'},
  {id:'drink',name:'柳橙冰飲',need:80,desc:'夏天的味道。'},
  {id:'cup',name:'熱可可',need:120,desc:'晚上捧在手心。'}
];
const CAT_EXTRA=[['tube','試管'],['flask','燒瓶'],['dish','培養皿'],['scope','顯微鏡'],['dropper','滴管'],['pencil','鉛筆'],['book','書'],['plant','植物'],['flowers','花朵'],['heart','愛心'],['star','星星'],['trip','出遊']];
const PALETTES=[['sage','鼠尾草綠','#A7B89F'],['peach','蜜桃橘','#F4A896'],['sky','天空藍','#A7C7E7'],['latte','淡暖棕','#D7B899']];
const TIPS=['別忘了喝水喔！','坐久了，起來伸展一下吧！','實驗不順也沒關係，記下來就是收穫。','今天也慢慢來，沒關係。','記得好好吃飯喔！','累了就休息一下，再繼續。','先做一件小事就好。','眼睛累了，看看遠方吧。'];
const ICON=id=>String(id||'').indexOf('-')>0?svgUse(id):F(id||'matcha');
function typeIcon(t){t=t||'';if(/Western/.test(t))return 'flask';if(/培養|BCA/.test(t))return 'dish';if(/藥物|轉染/.test(t))return 'dropper';if(/Starvation|蛋白|qPCR/.test(t))return 'tube';return 'scope';}
const PHRASES=['今天也慢慢來，沒關係。','先做一件小事就好。','記得喝水，也記得休息。','實驗不順也沒關係，記下來就是收穫。','今天的你也辛苦了。','留一點空白給自己。','把今天過好就夠了。','累了就坐下來喝杯茶。','一步一步，總會到的。'];
const QUESTIONS=['今天有什麼讓你笑出來的事？','今天吃到最好吃的東西是什麼？','今天想謝謝誰？','今天學到的一件小事？','如果今天有顏色，會是什麼顏色？','今天哪個瞬間想記住？','明天想對自己說什麼？','今天的天空是什麼樣子？','最近在期待什麼？','今天做得不錯的一件事？','今天聽到最喜歡的一句話？','今天最放鬆的時刻是什麼時候？'];
const MOODS=[{v:5,name:'晴朗'},{v:4,name:'晴時多雲'},{v:3,name:'陰天'},{v:2,name:'下雨'},{v:1,name:'雷雨'}];
const moodName=v=>(MOODS.find(m=>m.v===v)||{}).name||'';
const REC_TYPES=['細胞培養','Starvation / Stimulation','藥物處理','轉染 / shRNA','蛋白萃取','BCA 定量','SDS-PAGE / Western blot','qPCR','免疫螢光','其他'];
const REC_STATUS={plan:{name:'計畫中',cls:'st-plan'},doing:{name:'進行中',cls:'st-doing'},done:{name:'完成',cls:'st-done'},redo:{name:'需重做',cls:'st-redo'}};
const PROJ_STATUS={active:'進行中',paused:'暫停',done:'已結案'};
const REMIND_OPTS=[[null,'不提醒'],[0,'準時'],[5,'5 分鐘前'],[10,'10 分鐘前'],[30,'30 分鐘前'],[60,'1 小時前'],[120,'2 小時前'],[1440,'前一天']];
const remindLabel=v=>{const o=REMIND_OPTS.find(x=>x[0]===v);return o?o[1]:v+' 分鐘前';};
const DURS=[15,30,45,60,90,120,150,180,240,300,360,480];
const ROW_DEF={conditions:{label:'',time:'',treatment:'',note:''},params:{k:'',v:''},reagents:{name:'',conc:'',amount:'',lot:''},antibodies:{name:'',kind:'一抗',dilution:'',mw:'',source:''},steps:{text:'',min:0,done:false,at:'',note:''},samples:{code:'',location:'',desc:''},quant:{label:'',value:''},next:{text:'',done:false,todoId:''}};

const AA_ABS=[{name:'p-S6 (Ser235/236)',kind:'一抗',dilution:'',mw:'32',source:''},{name:'S6',kind:'一抗',dilution:'',mw:'32',source:''},{name:'p-4E-BP1 (Thr37/46)',kind:'一抗',dilution:'',mw:'15–20',source:''},{name:'4E-BP1',kind:'一抗',dilution:'',mw:'15–20',source:''},{name:'Loading control',kind:'一抗',dilution:'',mw:'',source:''}];
const stimConds=(starv)=>['0 min','15 min','30 min','60 min'].map((t,i)=>({label:t,time:t,treatment:i?starv+' → 加回胺基酸':starv+'，不加回',note:''}));
const BUILTIN_TPL=[
  {id:'tpl-aa',name:'胺基酸 Starvation / Stimulation',desc:'AA starvation 1 hr，stimulation 0 / 15 / 30 / 60 min',icon:'tube',rec:{
    type:'Starvation / Stimulation',title:'AA starvation / stimulation',cellLine:'HCT116 shRNA control',plate:'6-well',
    purpose:'觀察胺基酸刺激後 mTORC1 活性變化（p-S6、p-4E-BP1）',
    conditions:stimConds('AA starvation 1 hr'),
    params:[{k:'Starvation',v:'AA-free medium，1 hr'},{k:'Stimulation',v:'加回 AA，0 / 15 / 30 / 60 min'},{k:'收樣方式',v:''}],
    reagents:[{name:'AA-free medium',conc:'',amount:'',lot:''},{name:'Amino acid mixture',conc:'',amount:'',lot:''},{name:'Lysis buffer（含 protease / phosphatase inhibitor）',conc:'',amount:'',lot:''}],
    antibodies:AA_ABS,
    steps:[{text:'確認細胞密度與狀態，拍照記錄',min:0},{text:'PBS 洗一次，換成 AA-free medium 開始 starvation',min:60},{text:'依組別加回胺基酸，錯開時間開始 stimulation',min:0},{text:'15 min 組收樣',min:15},{text:'30 min 組收樣',min:30},{text:'60 min 組收樣',min:60},{text:'冰 PBS 洗，加 lysis buffer 收蛋白',min:0},{text:'樣本標記後放 -80 °C',min:0}]}},
  {id:'tpl-gl',name:'Gln / Leu Starvation / Stimulation',desc:'個別胺基酸 starvation 4 hr，stimulation 0 / 15 / 30 / 60 min',icon:'dropper',rec:{
    type:'Starvation / Stimulation',title:'Gln / Leu starvation / stimulation',cellLine:'HCT116 shRNA control',plate:'6-well',
    purpose:'比較 Gln、Leu 單一胺基酸刺激對 mTORC1 的效果',
    conditions:stimConds('starvation 4 hr'),
    params:[{k:'Starvation',v:'缺 Gln 或缺 Leu 的 medium，4 hr'},{k:'Stimulation',v:'加回 Gln 或 Leu，0 / 15 / 30 / 60 min'},{k:'對照',v:''}],
    reagents:[{name:'Gln-free medium',conc:'',amount:'',lot:''},{name:'Leu-free medium',conc:'',amount:'',lot:''},{name:'L-Glutamine',conc:'',amount:'',lot:''},{name:'L-Leucine',conc:'',amount:'',lot:''}],
    antibodies:AA_ABS,
    steps:[{text:'確認細胞密度與狀態，拍照記錄',min:0},{text:'PBS 洗一次，換成缺 Gln / Leu 的 medium 開始 starvation',min:240},{text:'依組別加回 Gln 或 Leu，錯開時間開始 stimulation',min:0},{text:'15 min 組收樣',min:15},{text:'30 min 組收樣',min:30},{text:'60 min 組收樣',min:60},{text:'冰 PBS 洗，加 lysis buffer 收蛋白',min:0},{text:'樣本標記後放 -80 °C',min:0}]}},
  {id:'tpl-wb',name:'Western blot',desc:'定量、跑膠、轉漬、抗體、曝光',icon:'flask',rec:{
    type:'SDS-PAGE / Western blot',title:'Western blot',
    params:[{k:'膠體濃度',v:''},{k:'上樣量 (µg)',v:''},{k:'Transfer 條件',v:''},{k:'Blocking',v:''},{k:'曝光時間',v:''}],
    reagents:[{name:'Sample buffer',conc:'',amount:'',lot:''},{name:'Blocking buffer',conc:'',amount:'',lot:''},{name:'ECL substrate',conc:'',amount:'',lot:''}],
    antibodies:[{name:'',kind:'一抗',dilution:'',mw:'',source:''},{name:'',kind:'二抗',dilution:'',mw:'',source:''}],
    steps:[{text:'BCA 定量，算好每個樣本的上樣體積',min:0},{text:'加 sample buffer，95 °C 加熱',min:5},{text:'SDS-PAGE 跑膠',min:0},{text:'Transfer 到膜上',min:0},{text:'Blocking',min:60},{text:'一抗 4 °C overnight',min:0},{text:'TBST wash 3 次',min:10},{text:'二抗 室溫',min:60},{text:'TBST wash 3 次',min:10},{text:'ECL 曝光，存圖',min:0}]}},
  {id:'tpl-pass',name:'細胞繼代',desc:'觀察、trypsin、計數、分盤',icon:'dish',rec:{
    type:'細胞培養',title:'細胞繼代',
    params:[{k:'分盤比例',v:''},{k:'細胞數',v:''},{k:'新代數',v:''}],
    reagents:[{name:'Trypsin-EDTA',conc:'',amount:'',lot:''},{name:'Culture medium',conc:'',amount:'',lot:''},{name:'PBS',conc:'',amount:'',lot:''}],
    steps:[{text:'觀察 confluency 和型態，拍照',min:0},{text:'吸掉舊 medium，PBS 洗',min:0},{text:'加 trypsin，37 °C',min:5},{text:'加 medium 中和，收集細胞',min:0},{text:'離心',min:5},{text:'回溶、計數',min:0},{text:'依比例分盤，標上新代數',min:0}]}},
  {id:'tpl-lys',name:'蛋白萃取 + BCA',desc:'收蛋白、離心、定量、分裝',icon:'tube',rec:{
    type:'蛋白萃取',title:'蛋白萃取 + BCA',
    params:[{k:'Lysis buffer 體積',v:''},{k:'離心條件',v:''},{k:'BCA 標準曲線',v:''}],
    reagents:[{name:'Lysis buffer',conc:'',amount:'',lot:''},{name:'Protease inhibitor',conc:'',amount:'',lot:''},{name:'Phosphatase inhibitor',conc:'',amount:'',lot:''},{name:'BCA reagent',conc:'',amount:'',lot:''}],
    steps:[{text:'冰 PBS 洗 2 次',min:0},{text:'加 lysis buffer，刮下細胞',min:0},{text:'冰上 lysis',min:30},{text:'4 °C 離心',min:15},{text:'取上清到新管',min:0},{text:'BCA 37 °C 反應',min:30},{text:'讀 562 nm，算濃度',min:0},{text:'分裝，-80 °C 保存',min:0}]}},
  {id:'tpl-blank',name:'空白紀錄',desc:'自己從頭寫',icon:'scope',rec:{type:'其他'}}
];

/* ================= storage ================= */
const COLS=['items','notes','projects','records','moments','templates','meta','posts'];
const D={};COLS.forEach(c=>{D[c]={};});
rebuildCats();
const S={tab:'home',day:today(),cal:today().slice(0,7),ready:false,qa:'',qn:'',ans:'',
  notes:{seg:'all',q:'',tag:''},
  lab:{view:'home',id:'',q:'',type:'',status:'',cell:'',ab:'',range:''},labHist:[],
  album:{seg:'post',month:today().slice(0,7),tag:''}};

const App={themeSet:false,t:0,dataChanged(ready){if(ready)S.ready=true;if(this.t)return;this.t=setTimeout(()=>{this.t=0;applyTheme();render();const s=SH.top();if(s&&s.live)paintSheet(true);},0);}};

/* Store lives in cloud.js */

const DEF_SET={name:'',palette:'sage',theme:'system',catFood:{},unlocked:null,remindOn:true,sound:true};
const SET=()=>Object.assign({},DEF_SET,D.meta.settings||{});
function saveSet(patch){const s=Object.assign(SET(),patch,{id:'settings'});Store.put('meta',s);applyTheme();}
function applyTheme(){
  rebuildCats();
  const s=SET(),r=document.documentElement;
  if(['peach','sky','latte'].includes(s.palette))r.setAttribute('data-palette',s.palette);else r.removeAttribute('data-palette');
  if(s.theme==='light'||s.theme==='dark'){r.setAttribute('data-theme',s.theme);App.themeSet=true;}
  else if(App.themeSet){r.removeAttribute('data-theme');App.themeSet=false;}
}
const catFood=c=>{const f=SET().catFood[c];return f&&(FOODS.some(x=>x.id===f)||CAT_EXTRA.some(x=>x[0]===f))?f:CATS[c].food;};

/* ================= images ================= */
function fileToImage(file){
  return new Promise((res,rej)=>{const url=URL.createObjectURL(file);const i=new Image();i.onload=()=>{res(i);setTimeout(()=>URL.revokeObjectURL(url),1500);};i.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('讀不到這張圖片'));};i.src=url;});
}
function drawScaled(img,max){const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;const s=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c;}
async function addImages(files,onEach,folder){
  for(const f of files){
    try{onEach(await storeImage(f,folder));}
    catch(e){const m=String(e&&e.message||'');toast(/size|large/i.test(m)?'照片太大了，換一張小一點的試試。':/quota|limit/i.test(m)?'照片空間已經滿了。':!navigator.onLine?'現在沒有網路，照片要連上網路才能上傳。':'這張照片沒有上傳成功。','bad');}
  }
}

/* ================= feedback ================= */
function toast(msg,kind,opts){
  opts=opts||{};const host=$('#toasts');if(!host)return;
  const el=document.createElement('div');el.className='toast '+(kind||'');
  el.innerHTML=`<span class="dot"></span><div>${esc(msg)}</div>${opts.action?`<button class="btn btn-sm btn-line" style="color:inherit;border-color:currentColor">${esc(opts.action)}</button>`:''}<button class="x" aria-label="關閉">${I('close')}</button>`;
  host.appendChild(el);const close=()=>el.remove();
  el.querySelector('.x').onclick=close;
  if(opts.action)el.querySelector('.btn').onclick=()=>{close();opts.onAction&&opts.onAction();};
  if(!opts.sticky)setTimeout(close,opts.ms||(opts.action?6000:3600));
  while(host.children.length>3)host.firstChild.remove();
}
function ask(msg,ok,danger){
  return new Promise(res=>{
    const m=$('#modal');
    m.innerHTML=`<div class="modal-wrap"><div class="sheet-back" data-x="0"></div><div class="modal" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p><div class="acts"><button class="btn btn-line" data-x="0">取消</button><button class="btn ${danger?'btn-danger':'btn-ink'}" data-x="1">${esc(ok||'確定')}</button></div></div></div>`;
    m.querySelectorAll('[data-x]').forEach(b=>{b.onclick=ev=>{ev.stopPropagation();m.innerHTML='';res(b.dataset.x==='1');};});
    const f=m.querySelector('[data-x="1"]');f&&f.focus();
  });
}
let AC=null;
function unlockAudio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});}
function beep(n){
  if(!SET().sound||!AC)return;n=n||3;
  try{const t0=AC.currentTime;for(let i=0;i<n;i++){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=i%2?988:784;const t=t0+i*.28;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.24);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.26);}}catch(e){}
}

/* ================= schedule logic ================= */
function mkItem(o){
  return {id:uid('i'),kind:o.kind||'todo',title:o.title||'',date:o.date||null,start:o.start||null,dur:o.dur||null,cat:o.cat||'chores',
    rep:o.rep||null,until:null,remind:o.remind==null?null:o.remind,note:o.note||'',loc:o.loc||'',deadline:!!o.deadline,subtasks:o.subtasks||[],
    done:false,doneDay:null,doneDates:{},skipDates:{},recordId:o.recordId||'',noteId:o.noteId||'',guessed:o.guessed||{},createdAt:Date.now()};
}
function occursOn(it,d){
  if(!it||it.dropped)return false;
  if(!it.rep)return it.date===d;
  if(!it.date||d<it.date)return false;
  if(it.until&&d>it.until)return false;
  if(it.skipDates&&it.skipDates[d])return false;
  if(it.rep.type==='daily')return true;
  if(it.rep.type==='weekly'){const days=it.rep.days&&it.rep.days.length?it.rep.days:[dow(it.date)];return days.includes(dow(d));}
  return false;
}
const sigOf=it=>[it.title,it.date||'',it.start||'',it.dur||'',it.remind==null?'':it.remind,it.rep?JSON.stringify(it.rep):'',it.until||'',it.deadline?1:0].join('|');
/* will this item ping the phone? (push reminders are computed from the items themselves) */
function phoneRelevant(it){if(!it||it.dropped)return false;if(!it.rep&&it.done)return false;if(!it.rep&&it.date&&it.date<today())return false;return !!((it.remind!=null&&it.start&&(it.date||it.rep))||(it.deadline&&it.date));}
function phoneState(it){return phoneRelevant(it)?(Push.on?'synced':'pending'):'none';}
function addPhoneTrash(){}
function phoneLists(){const all=Object.values(D.items);const pending=all.filter(i=>phoneState(i)==='pending').sort((a,b)=>(a.date||'')<(b.date||'')?-1:1);const synced=all.filter(i=>phoneState(i)==='synced');return {pending,synced,trash:[]};}
const isDone=(it,d)=>it.rep?!!(it.doneDates&&it.doneDates[d]):!!it.done;
const endMin=it=>it.start?toMin(it.start)+(it.dur||60):null;
function sortItems(a,b){
  if(a.start&&b.start)return a.start<b.start?-1:a.start>b.start?1:0;
  if(a.start)return -1;if(b.start)return 1;
  if(!!a.deadline!==!!b.deadline)return a.deadline?-1:1;
  return (a.createdAt||0)-(b.createdAt||0);
}
function itemsOn(d){return Object.values(D.items).filter(it=>occursOn(it,d)).sort(sortItems);}
function inboxItems(){return Object.values(D.items).filter(it=>!it.rep&&!it.date&&!it.done&&!it.dropped).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));}
function doneOn(d){return Object.values(D.items).filter(it=>it.rep?!!(it.doneDates&&it.doneDates[d]):(it.done&&(it.doneDay||it.date)===d));}
function completedTotal(){let n=0;Object.values(D.items).forEach(it=>{if(it.rep)n+=Object.keys(it.doneDates||{}).length;else if(it.done)n++;});return n;}
function stampedDays(){
  const t=today();let start=null;
  Object.values(D.items).forEach(it=>{if(it.date&&(!start||it.date<start))start=it.date;});
  if(!start||start>t)return [];
  if(diffDays(start,t)>400)start=addDays(t,-400);
  const out=[];for(let d=start;d<=t;d=addDays(d,1)){const its=itemsOn(d);if(its.length&&its.every(i=>isDone(i,d)))out.push(d);}
  return out;
}
function calcStreak(st){const set=new Set(st);let d=today();if(!set.has(d))d=addDays(d,-1);let n=0;while(set.has(d)){n++;d=addDays(d,-1);}return n;}
function noticesFor(d){
  const out=[],t=today(),its=itemsOn(d);
  if(d>=t){
    const timed=its.filter(i=>i.start&&!isDone(i,d));
    for(let i=0;i<timed.length;i++)for(let j=i+1;j<timed.length;j++){const a=timed[i],b=timed[j];if(toMin(b.start)<endMin(a))out.push({type:'conflict',a,b});}
    const total=timed.reduce((s,i)=>s+(i.dur||60),0);
    const movable=its.filter(i=>!i.rep&&!i.start&&!i.deadline&&!isDone(i,d));
    if(total>=540||its.length>=8)out.push({type:'load',total,count:its.length,movable});
    for(let i=0;i<timed.length-1;i++){const a=timed[i],b=timed[i+1];if(a.cat==='lab'){const gap=toMin(b.start)-endMin(a);if(gap>=0&&gap<15)out.push({type:'buffer',a,b,gap});}}
  }
  if(d===t){
    const past=Object.values(D.items).filter(it=>!it.rep&&it.date&&it.date<t&&diffDays(it.date,t)<=14&&!it.done&&!it.dropped).sort((a,b)=>a.date<b.date?-1:1);
    if(past.length)out.push({type:'carry',items:past});
  }
  return out;
}
function deadlines(){const t=today();return Object.values(D.items).filter(it=>it.deadline&&!it.rep&&it.date&&it.date>=t&&!it.done&&!it.dropped&&diffDays(t,it.date)<=120).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);}
function nextSlot(d){if(d!==today())return '09:00';const m=Math.ceil((nowMin()+5)/30)*30;return m>=1410?'09:00':fromMin(m);}
function repLabel(it){if(!it.rep)return '';if(it.rep.type==='daily')return '每天';const days=it.rep.days&&it.rep.days.length?it.rep.days:[dow(it.date||today())];return '每週'+days.map(k=>WD[k]).join('、');}
function gcalUrl(it,d){
  d=d||it.date||today();const dd=d.replace(/-/g,'');let dates;
  if(it.start){const s=toMin(it.start),e=s+(it.dur||60);const ed=(e>=1440?addDays(d,1):d).replace(/-/g,'');dates=dd+'T'+it.start.replace(':','')+'00/'+ed+'T'+fromMin(e).replace(':','')+'00';}
  else dates=dd+'/'+addDays(d,1).replace(/-/g,'');
  let tz='Asia/Taipei';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||tz;}catch(e){}
  let u='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+ENC(it.title)+'&dates='+dates+'&ctz='+ENC(tz);
  if(it.note)u+='&details='+ENC(it.note);if(it.loc)u+='&location='+ENC(it.loc);
  if(it.rep){const r=it.rep.type==='daily'?'RRULE:FREQ=DAILY':'RRULE:FREQ=WEEKLY;BYDAY='+(it.rep.days&&it.rep.days.length?it.rep.days:[dow(it.date)]).map(k=>['','MO','TU','WE','TH','FR','SA','SU'][k]).join(',');u+='&recur='+ENC(r);}
  return u;
}

/* ================= one-sentence parser (rule based, no AI) ================= */
const NUMRE='[0-9]+|[零〇一二兩两三四五六七八九十]+';
const CNN={'零':0,'〇':0,'一':1,'二':2,'兩':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
function cn2n(s){
  if(s==null||s==='')return NaN;s=String(s);
  if(/^[0-9.]+$/.test(s))return parseFloat(s);
  if(s.indexOf('十')>=0){const p=s.split('十');const a=p[0]?CNN[p[0]]:1,b=p[1]?CNN[p[1]]:0;if(a==null||b==null)return NaN;return a*10+b;}
  if(s.length===1&&CNN[s]!=null)return CNN[s];
  return NaN;
}
const WDMAP={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7,'天':7};
const PER='凌晨|清晨|早上|上午|中午|下午|傍晚|晚上|晚間|夜裡|半夜';
const PERDEF={'凌晨':'06:00','清晨':'07:00','早上':'09:00','上午':'10:00','中午':'12:00','下午':'14:00','傍晚':'17:30','晚上':'19:30','晚間':'19:30','夜裡':'22:00','半夜':'23:30'};
const TSRC=`(${PER})?\\s*(?:(\\d{1,2}):(\\d{2})|(${NUMRE})\\s*(?:點|点|時)(?!間|候|段|长|長)(?:\\s*(半|一刻|三刻|(\\d{1,2})\\s*分?(?!鐘|钟)|([一二三四五]?十[一二三四五六七八九]?)\\s*分?(?!鐘|钟)|([一二三四五六七八九])\\s*分(?!鐘|钟)))?)`;
function normText(t){return String(t||'').replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/：/g,':').replace(/[～〜]/g,'~').replace(/[ \t　]+/g,' ').trim();}
function cut(s,frag){const i=s.indexOf(frag);return i<0?s:s.slice(0,i)+' '+s.slice(i+frag.length);}
function adjHour(h,p){if(!p)return h;if(/下午|傍晚|晚上|晚間|夜裡/.test(p)&&h<12)return h+12;if(p==='中午'&&h<6)return h+12;if(p==='半夜'&&h===12)return 0;return h;}
function tFromGroups(g,o){
  const p=g[o];let h,m=0;
  if(g[o+1]!=null){h=+g[o+1];m=+g[o+2];}
  else{
    h=cn2n(g[o+3]);const sub=g[o+4];
    if(sub){if(sub==='半')m=30;else if(sub==='一刻')m=15;else if(sub==='三刻')m=45;else{const mm=g[o+5]!=null?+g[o+5]:g[o+6]!=null?cn2n(g[o+6]):g[o+7]!=null?cn2n(g[o+7]):0;m=isNaN(mm)?0:mm;}}
  }
  if(isNaN(h)||h>24||m>59)return null;h=adjHour(h,p);if(h===24)h=0;
  return {min:h*60+m,per:p||null};
}
function matchTime(s){
  let m=s.match(new RegExp(TSRC+'\\s*(?:到|至|~|-|－|—)\\s*'+TSRC));
  if(m){const a=tFromGroups(m,1),b=tFromGroups(m,9);if(a&&b){let bm=b.min;if(!b.per&&a.per){const hb=Math.floor(bm/60);bm=adjHour(hb,a.per)*60+bm%60;}if(bm<=a.min&&bm+720>a.min)bm+=720;return {start:fromMin(a.min),end:fromMin(bm),m:m[0]};}}
  m=s.match(new RegExp(TSRC));
  if(m){const a=tFromGroups(m,1);if(a)return {start:fromMin(a.min),m:m[0]};}
  m=s.match(new RegExp('('+PER+')'));
  if(m)return {period:m[1],m:m[1]};
  return null;
}
function matchDur(s){
  const re=new RegExp('(?:大概|大約|大约|約|约|預計|预计|需要|要花)?\\s*([0-9]+\\.[0-9]+|'+NUMRE+')?\\s*個?\\s*(半)?\\s*(?:小時|小时|鐘頭|钟头|hrs?\\b|h\\b)','gi');
  let m;
  while((m=re.exec(s))){
    if(m[1]||m[2]){let h=m[1]?cn2n(m[1]):0;if(m[2])h+=.5;if(h>0&&h<=24)return {min:Math.round(h*60),m:m[0]};}
    if(re.lastIndex===m.index)re.lastIndex++;
  }
  m=s.match(new RegExp('(?:大概|大約|約|預計|需要)?\\s*('+NUMRE+')\\s*分鐘'));
  if(m){const n=cn2n(m[1]);if(n>0&&n<1440)return {min:n,m:m[0]};}
  return null;
}
function matchRemind(s){
  let m=s.match(new RegExp('提前\\s*('+NUMRE+')\\s*(分鐘|分|小時|天)\\s*(?:提醒我?|通知我?)?'));
  if(m){const n=cn2n(m[1]);return {min:m[2]==='小時'?n*60:m[2]==='天'?n*1440:n,m:m[0]};}
  m=s.match(/(?:要|請|幫我)?(?:提醒我|提醒一下|提醒|通知我)/);
  if(m)return {min:null,generic:true,m:m[0]};
  return null;
}
function matchRepeat(s){
  let m=s.match(/每(?:天|日)/);if(m)return {rep:{type:'daily'},m:m[0]};
  m=s.match(/每(?:個)?(?:週|周|星期|禮拜|礼拜)([一二三四五六日天](?:[、,和跟及與]?[一二三四五六日天])*)/);
  if(m){const days=[...new Set(m[1].split('').map(c=>WDMAP[c]).filter(Boolean))].sort();return {rep:{type:'weekly',days},m:m[0]};}
  m=s.match(/每(?:個)?(?:週|周|星期|禮拜)/);if(m)return {rep:{type:'weekly',days:null},m:m[0]};
  return null;
}
function matchDate(s,T){
  const mon=addDays(T,1-dow(T));let m;
  if((m=s.match(/大後天|大后天/)))return {date:addDays(T,3),m:m[0]};
  if((m=s.match(/後天|后天/)))return {date:addDays(T,2),m:m[0]};
  if((m=s.match(/明天|明日|明早|明晚/)))return {date:addDays(T,1),m:m[0],period:m[0]==='明早'?'早上':m[0]==='明晚'?'晚上':null};
  if((m=s.match(/今天|今日|今晚|今早|今夜/)))return {date:T,m:m[0],period:(m[0]==='今晚'||m[0]==='今夜')?'晚上':m[0]==='今早'?'早上':null};
  if((m=s.match(/(下下|下|這|这|本)?(?:個)?(?:週|周|星期|禮拜|礼拜)([一二三四五六日天])/))){
    const k=WDMAP[m[2]];let date=addDays(mon,k-1);
    if(m[1]==='下下')date=addDays(date,14);else if(m[1]==='下')date=addDays(date,7);else if(!m[1]&&date<T)date=addDays(date,7);
    return {date,m:m[0]};
  }
  if((m=s.match(/(下|這|这|本)?(?:個)?(?:週末|周末)/))){let date=addDays(mon,5);if(m[1]==='下')date=addDays(date,7);else if(date<T)date=addDays(date,7);return {date,m:m[0]};}
  if((m=s.match(/(\d{1,2})\s*(?:\/|月)\s*(\d{1,2})\s*(?:日|號|号)?/))){
    const mo=+m[1],da=+m[2];
    if(mo>=1&&mo<=12&&da>=1&&da<=31){const y=pd(T).getFullYear();let date=y+'-'+pad(mo)+'-'+pad(da);if(diffDays(date,T)>150)date=(y+1)+'-'+pad(mo)+'-'+pad(da);return {date,m:m[0]};}
  }
  if((m=s.match(/下(?:個)?(?:週|周|星期|禮拜)/)))return {date:addDays(mon,7),m:m[0],guessed:true};
  if((m=s.match(/月底/))){const d=pd(T);return {date:ds(new Date(d.getFullYear(),d.getMonth()+1,0)),m:m[0]};}
  return null;
}
function detectCat(t,rep){
  t=t||'';
  const lc=t.toLowerCase();let best=null,bl=0;
  CAT_ORDER.forEach(id=>String(CAT_STORE[id].kw||'').split(/[,，、\s]+/).map(x=>x.trim().toLowerCase()).filter(Boolean).forEach(k=>{if(lc.includes(k)&&k.length>bl){best=id;bl=k.length;}}));
  if(best)return best;
  const r=detectBuiltinCat(t,rep);return CAT_STORE[r]?r:(CAT_STORE.chores?'chores':CAT_ORDER[0]);
}
function detectBuiltinCat(t,rep){
  if(/考試|考试|期中|期末|小考|作業|上課/.test(t))return 'study';
  if(/實驗|实验|WB|western|blot|細胞|细胞|HCT|starv|stimul|培養|培养|PCR|抗體|抗体|轉染|lysate|蛋白|跑膠|\blab\b|passage|繼代|mTOR|shRNA|BCA|transfect|medium|culture|加藥|收樣|顯微鏡/i.test(t))return 'lab';
  if(/考試|考试|期中|期末|讀書|讀|唸|念書|報告|作業|上課|課|論文|paper|研究所|推甄|複習|老師|教授|IELTS|托福|多益|簡報|meeting|專題|小考|預習/i.test(t))return 'study';
  if(/朋友|約會|聚餐|吃飯|聚會|生日|看電影|見面|同學會|喝咖啡/.test(t))return 'friends';
  if(/休息|午覺|追劇|放鬆|散步|逛街|娛樂|看劇|遊戲|按摩|泡澡|發呆/.test(t))return 'rest';
  if(rep||/習慣|運動|喝水|睡覺|早起|健身|跑步|瑜伽|芭蕾|跳舞|伸展|吃藥|冥想/.test(t))return 'habit';
  return 'chores';
}
function cleanTitle(s){
  let t=String(s||'').replace(/\s+/g,' ').trim();
  for(let k=0;k<4;k++)t=t.replace(/^(?:我要|我得|我想|我會|要去|需要|也要|還要|記得要|記得|提醒我|幫我|請|安排|然後|再|先|要|去|得|留|的|在|於|大概|大約|約)\s*/,'').trim();
  t=t.replace(/(?:左右|一下|喔|哦|吧|唷|囉|啦|呢)$/,'').replace(/^[，,、。.\s]+|[，,、。.\s]+$/g,'').trim();
  return t;
}
function parseClause(cl,T){
  let s=' '+cl+' ';const r={raw:cl};
  const rep=matchRepeat(s);if(rep){r.rep=rep.rep;s=cut(s,rep.m);}
  const rem=matchRemind(s);if(rem){r.remind=rem.min;r.remGeneric=!!rem.generic;s=cut(s,rem.m);}
  const dt=matchDate(s,T);if(dt){r.date=dt.date;r.dateGuessed=!!dt.guessed;r.periodHint=dt.period;s=cut(s,dt.m);}
  const tm=matchTime(s);if(tm){if(tm.start){r.start=tm.start;r.end=tm.end||null;}else r.period=tm.period;s=cut(s,tm.m);}
  if(!r.start&&!r.period&&r.periodHint)r.period=r.periodHint;
  const du=matchDur(s);if(du){r.dur=du.min;s=cut(s,du.m);}
  r.title=cleanTitle(s);
  r.hasDate=!!(r.date||r.rep);r.hasTime=!!(r.start||r.period);
  return r;
}
function finalize(r,T,fb){
  const g={};const kind=(r.start||r.period||r.dur)?'event':'todo';
  let start=r.start||null,dur=r.dur||null,date=r.date||null;
  if(!start&&r.period){start=PERDEF[r.period]||'14:00';g.start=true;}
  if(r.end&&start){dur=toMin(r.end)-toMin(start);if(dur<=0)dur+=1440;}
  const cat=detectCat(r.title+' '+r.raw,!!r.rep);
  if(!date&&fb&&!r.rep)date=fb;
  if(kind==='event'){
    if(!start){start='14:00';g.start=true;}
    if(!dur){dur=cat==='habit'?30:60;g.dur=true;}
    if(!date){if(r.rep)date=T;else{date=toMin(start)>nowMin()+5?T:addDays(T,1);g.date=true;}}
  }else if(!date&&r.rep)date=T;
  if(r.dateGuessed)g.date=true;
  let remind=r.remind;
  if(remind==null&&r.remGeneric)remind=kind==='event'?(r.rep?0:10):null;
  let rep=r.rep||null;
  if(rep&&rep.type==='weekly'&&(!rep.days||!rep.days.length))rep={type:'weekly',days:[dow(date||T)]};
  const deadline=kind==='todo'&&/交|截止|考試|考试|期中|期末|deadline|due|繳|報名/i.test(r.title);
  return mkItem({kind,title:r.title||(kind==='event'?'新的行程':'新的待辦'),date,start,dur,rep,remind,cat,deadline,guessed:g});
}
function parseSentence(text,T,fb){
  T=T||today();const src=normText(text);if(!src)return [];
  const clauses=src.split(/[，,；;。！!？?\n]+/).map(x=>x.trim()).filter(Boolean);
  const out=[];let main=null;
  for(const cl of clauses){
    let m=cl.match(/^(?:並且|然後|再|並)?\s*(前一天|前一晚|前天晚上|當天早上)\s*(早上|上午|中午|下午|傍晚|晚上)?\s*(?:要|請)?\s*(?:提醒我|提醒|記得|通知我)?\s*(.*)$/);
    if(m&&main){
      const per=m[2]||((m[1]==='前一晚'||m[1]==='前天晚上')?'晚上':m[1]==='當天早上'?'早上':null);
      const day=m[1]==='當天早上'?main.date:(main.date?addDays(main.date,-1):null);
      const st=per?PERDEF[per]:null;
      out.push(mkItem({kind:'todo',title:cleanTitle(m[3])||'事前確認',date:day,start:st,cat:main.cat,remind:st?0:null,note:'為了「'+main.title+'」',guessed:st?{start:true}:{}}));
      continue;
    }
    m=cl.match(/^(?:也要|要|並且|然後|並)?\s*(?:記得|別忘了|不要忘記|不要忘了)\s*(?:要|先)?\s*(.+)$/);
    if(m&&main){const c=detectCat(m[1]);out.push(mkItem({kind:'todo',title:cleanTitle(m[1]),date:main.date,cat:c==='chores'?main.cat:c,note:'跟「'+main.title+'」有關'}));continue;}
    const r=parseClause(cl,T);
    if(main&&!r.hasDate&&!r.title){
      if(r.dur){main.dur=r.dur;delete main.guessed.dur;if(!main.start){main.start='14:00';main.guessed.start=true;}main.kind='event';}
      if(r.start&&(main.guessed.start||!main.start)){main.start=r.start;delete main.guessed.start;if(r.end){main.dur=toMin(r.end)-toMin(r.start);delete main.guessed.dur;}}
      if(r.remind!=null||r.remGeneric)main.remind=r.remind!=null?r.remind:(main.rep?0:10);
      continue;
    }
    if(main&&!r.hasDate&&!r.hasTime&&!r.dur){main.note=(main.note?main.note+'；':'')+cl;continue;}
    const it=finalize(r,T,r.hasDate?null:(main?main.date:fb));
    out.push(it);if(!main||r.hasDate)main=it;
  }
  return out;
}

/* ================= lab records ================= */
function newRecord(o){
  const r=Object.assign({id:uid('r'),projectId:'',title:'',date:today(),start:'',end:'',status:'plan',type:'其他',cellLine:'',passage:'',confluency:'',plate:'',purpose:'',
    conditions:[],params:[],reagents:[],antibodies:[],steps:[],samples:[],observation:'',images:[],quantLabel:'',quant:[],problems:'',conclusion:'',next:[],
    prevId:'',prevRel:'',tags:[],eventId:'',createdAt:Date.now()},o||{});
  ['conditions','params','reagents','antibodies','steps','samples','images','quant','next','tags'].forEach(k=>{if(!Array.isArray(r[k]))r[k]=[];});
  if(!REC_STATUS[r.status])r.status='plan';
  return r;
}
const R=id=>D.records[id]?newRecord(clone(D.records[id])):null;
function recFromTpl(tpl,extra){
  const base=clone(tpl.rec||{});extra=Object.assign({},extra||{});
  Object.keys(extra).forEach(k=>{if(extra[k]===''||extra[k]==null)delete extra[k];});
  const r=newRecord(Object.assign(base,extra));r.id=uid('r');
  r.steps=r.steps.map(s=>({text:s.text||'',min:s.min||0,done:false,at:'',note:''}));
  if(!r.title)r.title=tpl.name;
  return r;
}
function stripRec(r,forTpl){
  const x=newRecord(clone(r));
  ['id','date','start','end','status','observation','images','quant','problems','conclusion','next','prevId','prevRel','eventId','createdAt','updatedAt','samples','quantLabel'].forEach(k=>delete x[k]);
  if(forTpl)delete x.projectId;
  x.steps=x.steps.map(s=>({text:s.text,min:s.min||0}));
  return x;
}
function recSort(a,b){
  if(a.date!==b.date){if(!a.date)return 1;if(!b.date)return -1;return a.date<b.date?1:-1;}
  if((a.start||'')!==(b.start||''))return (a.start||'')<(b.start||'')?1:-1;
  return (b.createdAt||0)-(a.createdAt||0);
}
function guessType(t){
  t=t||'';
  if(/WB|western|blot|跑膠/i.test(t))return 'SDS-PAGE / Western blot';
  if(/starv|stimul|刺激|胺基酸/i.test(t))return 'Starvation / Stimulation';
  if(/繼代|passage|培養|culture/i.test(t))return '細胞培養';
  if(/qPCR|PCR/i.test(t))return 'qPCR';
  if(/BCA/i.test(t))return 'BCA 定量';
  if(/轉染|shRNA|transfect/i.test(t))return '轉染 / shRNA';
  if(/lysate|萃取|收蛋白/i.test(t))return '蛋白萃取';
  if(/IF|免疫螢光|immuno/i.test(t))return '免疫螢光';
  return '其他';
}
function labLists(){
  const cells=new Set(),abs=new Set(),reag=new Set(),locs=new Set();
  Object.values(D.records).forEach(r=>{
    if(r.cellLine)cells.add(String(r.cellLine).trim());
    (r.antibodies||[]).forEach(a=>a&&a.name&&abs.add(String(a.name).trim()));
    (r.reagents||[]).forEach(a=>a&&a.name&&reag.add(String(a.name).trim()));
    (r.samples||[]).forEach(s=>s&&s.location&&locs.add(String(s.location).trim()));
  });
  Object.values(D.projects).forEach(p=>String(p.cellLines||'').split(/[,、，;]/).map(s=>s.trim()).filter(Boolean).forEach(c=>cells.add(c)));
  const sort=s=>[...s].sort((a,b)=>a.localeCompare(b));
  return {cells:sort(cells),abs:sort(abs),reag:sort(reag),locs:sort(locs)};
}
function recHay(r){
  const p=D.projects[r.projectId];
  return [r.title,r.type,r.cellLine,r.passage,r.purpose,r.observation,r.problems,r.conclusion,r.tags.join(' '),p&&p.name,r.quantLabel,
    ...r.conditions.map(c=>[c.label,c.treatment,c.time,c.note].join(' ')),...r.params.map(x=>x.k+' '+x.v),...r.reagents.map(x=>x.name+' '+x.lot),
    ...r.antibodies.map(x=>x.name+' '+x.source),...r.samples.map(x=>x.code+' '+x.desc+' '+x.location),...r.steps.map(s=>s.text+' '+(s.note||'')),...r.next.map(n=>n.text),
    ...r.images.map(i=>i.caption||'')].join(' ').toLowerCase();
}
function recMarkdown(r){
  r=newRecord(clone(r));const p=D.projects[r.projectId];const L=[];
  const cell=x=>String(x==null?'':x).replace(/\|/g,'/').replace(/\n/g,' ');
  const table=(h,rows)=>{if(!rows.length)return;L.push('| '+h.join(' | ')+' |','|'+h.map(()=>' --- ').join('|')+'|');rows.forEach(x=>L.push('| '+x.map(cell).join(' | ')+' |'));L.push('');};
  L.push('# '+(r.title||'實驗紀錄'),'');
  L.push('- 日期：'+(r.date||'未填')+(r.start?' '+r.start:'')+(r.end?'–'+r.end:''));
  if(p)L.push('- 專案：'+p.name);
  L.push('- 狀態：'+REC_STATUS[r.status].name,'- 類型：'+r.type);
  [['細胞株',r.cellLine],['代數',r.passage],['密度 / confluency',r.confluency],['培養格式',r.plate]].forEach(([k,v])=>{if(v)L.push('- '+k+'：'+v);});
  if(r.tags.length)L.push('- 標籤：'+r.tags.join('、'));
  L.push('');
  if(r.purpose)L.push('## 實驗目的','',r.purpose,'');
  if(r.conditions.length){L.push('## 實驗分組','');table(['組別','時間','處理','備註'],r.conditions.map(c=>[c.label,c.time,c.treatment,c.note]));}
  if(r.params.length){L.push('## 實驗參數','');table(['項目','內容'],r.params.map(x=>[x.k,x.v]));}
  if(r.reagents.length){L.push('## 試劑','');table(['名稱','濃度','用量','批號 / 廠牌'],r.reagents.map(x=>[x.name,x.conc,x.amount,x.lot]));}
  if(r.antibodies.length){L.push('## 抗體','');table(['目標','種類','稀釋','分子量 (kDa)','廠牌 / 貨號'],r.antibodies.map(x=>[x.name,x.kind,x.dilution,x.mw,x.source]));}
  if(r.steps.length){L.push('## 操作步驟','');r.steps.forEach(s=>L.push(`- [${s.done?'x':' '}] ${s.at?s.at+' ':''}${s.text}${s.min?`（${s.min} 分鐘）`:''}${s.note?' — '+s.note:''}`));L.push('');}
  if(r.samples.length){L.push('## 樣本','');table(['編號','存放位置','說明'],r.samples.map(x=>[x.code,x.location,x.desc]));}
  if(r.observation||r.quant.length||r.images.length){
    L.push('## 結果','');if(r.observation)L.push(r.observation,'');
    if(r.quant.length){L.push('定量'+(r.quantLabel?'：'+r.quantLabel:''),'');table(['樣本 / 組別','數值'],r.quant.map(q=>[q.label,q.value]));}
    if(r.images.length)L.push('（圖片 '+r.images.length+' 張：'+r.images.map(i=>[i.kind,i.caption].filter(Boolean).join(' ')||'未命名').join('、')+'，請在小日和查看）','');
  }
  if(r.problems)L.push('## 遇到的問題','',r.problems,'');
  if(r.conclusion)L.push('## 小結','',r.conclusion,'');
  if(r.next.length){L.push('## 下一步','');r.next.forEach(n=>L.push(`- [${n.done?'x':' '}] ${n.text}`));L.push('');}
  const pv=r.prevId&&D.records[r.prevId];
  if(pv)L.push((r.prevRel==='repeat'?'重複自：':'接續自：')+pv.title+'（'+(pv.date||'未填日期')+'）');
  return L.join('\n').trim()+'\n';
}
function safeName(s){return String(s||'').replace(/[\\/:*?"<>|\n]+/g,' ').trim().slice(0,60)||'未命名';}
/* ================= timers & reminders ================= */
let TIMERS=LS.get('hiyori.timers',[])||[];
function saveTimers(){LS.set('hiyori.timers',TIMERS);}
function startTimer(key,label,min,recId){
  TIMERS=TIMERS.filter(t=>t.key!==key);TIMERS.push({key,label,end:Date.now()+min*60000,recId,rang:false});
  saveTimers();paintTimers();toast('開始計時 '+min+' 分鐘：'+trim(label,18),'ok');
}
function paintTimers(){
  const host=$('#timers');if(!host)return;
  if(!TIMERS.length){if(host.innerHTML)host.innerHTML='';return;}
  const now=Date.now();
  host.innerHTML=TIMERS.map(t=>{const left=Math.max(0,Math.round((t.end-now)/1000));const h=Math.floor(left/3600),mm=Math.floor(left%3600/60),ss=left%60;
    return `<span class="timer ${left===0?'ring':''}"><button class="link-btn" style="color:inherit;font-weight:600" data-act="timerOpen" data-rec="${esc(t.recId||'')}">${esc(trim(t.label,12))}</button><b>${left===0?'時間到':(h?h+':':'')+pad(mm)+':'+pad(ss)}</b><button class="x" data-act="timerStop" data-key="${esc(t.key)}" aria-label="停止計時">${I('close')}</button></span>`;}).join('');
}
function tickTimers(){
  if(!TIMERS.length)return;const now=Date.now();
  TIMERS.forEach(t=>{if(!t.rang&&t.end<=now){t.rang=true;saveTimers();toast('時間到：'+t.label,'',{sticky:true});beep(6);try{navigator.vibrate&&navigator.vibrate([200,100,200]);}catch(e){}}});
  paintTimers();
}
const notified=new Set(LS.get('hiyori.notified',[])||[]);
function checkReminders(){
  if(!S.ready||!SET().remindOn)return;
  const t=today(),nm=nowMin();
  [[t,0],[addDays(t,1),1440]].forEach(([d,off])=>{
    itemsOn(d).forEach(it=>{
      if(it.remind==null||!it.start||isDone(it,d))return;
      const abs=off+toMin(it.start),fire=abs-it.remind,key=it.id+'@'+d+'@'+it.start+'@'+it.remind;
      if(nm>=fire&&nm<=abs+5&&!notified.has(key)){
        notified.add(key);LS.set('hiyori.notified',[...notified].slice(-300));
        const left=abs-nm;
        toast((left>=1440?'明天 ':'')+(left>0&&left<1440?left+' 分鐘後':left<=0?'現在':'')+'：'+it.start+' '+it.title,'',{sticky:true,action:'打開',onAction:()=>{const x=D.items[it.id];x&&sheetItem(clone(x),{day:d});}});
        if(!Push.on||document.visibilityState==='visible')beep(3);
      }
    });
  });
}

/* ================= cloud: Supabase storage, login, push ================= */
const CFG=window.HIYORI_CONFIG||{};
const sb=(window.supabase&&/^https:\/\//.test(CFG.url||'')&&CFG.key)?window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const Store={
  mode:'loading',uid:null,email:'',busy:{},channel:null,_warned:false,_ct:0,
  outbox:LS.get('hiyori.outbox',{})||{},
  async start(user){
    this.uid=user.id;this.email=user.email||'';
    const cache=LS.get('hiyori.cache.'+this.uid,null);
    if(cache){COLS.forEach(c=>{D[c]=cache[c]||{};});App.dataChanged(true);}
    this.flush();
    try{await this.loadAll();this.mode='cloud';}
    catch(e){console.warn(e);this.mode=cache?'offline':'error';toast(cache?'連不上雲端，先顯示這台裝置上次的資料。':'連不上雲端，請確認網路後重新打開。','bad');}
    this.subscribe();App.dataChanged(true);Push.init();scheduleReminderSync();
    if(this.mode==='cloud'){Friends.loadMine();Friends.loadToMe();}
  },
  async loadAll(){
    const rows=[];let from=0;
    for(;;){const {data,error}=await sb.from('docs').select('col,id,data').eq('user_id',this.uid).range(from,from+999);if(error)throw error;rows.push(...data);if(data.length<1000)break;from+=1000;}
    const fresh={};COLS.forEach(c=>{fresh[c]={};});
    rows.forEach(r=>{if(fresh[r.col])fresh[r.col][r.id]=r.data;});
    Object.values(this.outbox).forEach(o=>{if(!fresh[o.col])return;if(o.op==='put')fresh[o.col][o.id]=o.data;else delete fresh[o.col][o.id];});
    COLS.forEach(c=>{D[c]=fresh[c];});this.saveCache();
  },
  subscribe(){
    if(this.channel||!this.uid)return;
    this.channel=sb.channel('docs-'+this.uid)
      .on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'user_id=eq.'+this.uid},p=>{
        if(p.eventType==='DELETE'){const o=p.old||{};if(o.user_id&&o.user_id!==this.uid)return;if(!o.col||!D[o.col]||this.outbox[o.col+'/'+o.id])return;const n=Object.assign({},D[o.col]);delete n[o.id];D[o.col]=n;}
        else{const r=p.new||{};if(!r.col||!D[r.col]||this.outbox[r.col+'/'+r.id])return;D[r.col]=Object.assign({},D[r.col],{[r.id]:r.data});}
        this.saveCache();App.dataChanged(true);scheduleReminderSync();
      }).subscribe();
  },
  put(col,doc){doc.updatedAt=Date.now();if(col==='items')doc.sig=sigOf(doc);D[col]=Object.assign({},D[col],{[doc.id]:doc});App.dataChanged(true);this.enqueue({op:'put',col,id:doc.id,data:clone(doc)});},
  del(col,id){const n=Object.assign({},D[col]);delete n[id];D[col]=n;App.dataChanged(true);this.enqueue({op:'del',col,id});},
  enqueue(o){const k=o.col+'/'+o.id;this.outbox[k]=o;this.saveOutbox();this.saveCache();this.run(k);if(o.col==='items')scheduleReminderSync();},
  run(k){
    if(this.busy[k]||!this.uid)return;this.busy[k]=true;
    (async()=>{
      while(this.outbox[k]){
        const o=this.outbox[k];
        try{await this.send(o);if(this.outbox[k]===o){delete this.outbox[k];this.saveOutbox();}}
        catch(e){this.busy[k]=false;this.fail(e);return;}
      }
      this.busy[k]=false;
    })();
  },
  async send(o){
    const r=o.op==='put'
      ?await sb.from('docs').upsert({user_id:this.uid,col:o.col,id:o.id,data:o.data,updated_at:new Date().toISOString()},{onConflict:'user_id,col,id'})
      :await sb.from('docs').delete().match({user_id:this.uid,col:o.col,id:o.id});
    if(r.error)throw r.error;
  },
  flush(){Object.keys(this.outbox).forEach(k=>this.run(k));},
  fail(e){
    const offline=!navigator.onLine||/fetch|network|Failed/i.test(String(e&&e.message));
    if(offline){if(!this._warned){this._warned=true;toast('現在沒有網路，修改先存在這台裝置，連上網路後會自動上傳。','bad');}}
    else toast('有一筆沒有存到雲端：'+(e&&e.message||e),'bad');
  },
  saveOutbox(){LS.set('hiyori.outbox',this.outbox);},
  saveCache(){clearTimeout(this._ct);this._ct=setTimeout(()=>{if(this.uid)LS.set('hiyori.cache.'+this.uid,D);},500);},
  stop(){if(this.channel){try{sb.removeChannel(this.channel);}catch(e){}this.channel=null;}this.uid=null;this.mode='signedout';COLS.forEach(c=>{D[c]={};});S.ready=false;Friends.reset();}
};
window.addEventListener('online',()=>{Store._warned=false;Store.flush();scheduleReminderSync();});
setInterval(()=>{if(navigator.onLine&&Object.keys(Store.outbox).length)Store.flush();},30000);

/* ---------- login ---------- */
const Auth={
  user:null,
  async init(){
    if(!sb){S.auth=true;S.authMsg='網站還沒接上雲端（config.js 還沒設定）。';Store.mode='signedout';render();return;}
    sb.auth.onAuthStateChange((ev,session)=>{
      // never call other supabase methods inside this callback (it holds the auth lock) — hop out first
      setTimeout(()=>{
        if(ev==='PASSWORD_RECOVERY')setTimeout(sheetNewPassword,300);
        const u=session&&session.user;
        if(u&&(!this.user||this.user.id!==u.id)){this.user=u;S.auth=false;S.authMsg='';S.authErr='';Store.start(u);render();}
        else if(!u&&this.user&&ev==='SIGNED_OUT'){this.user=null;Store.stop();S.auth=true;S.tab='home';render();}
      },0);
    });
    const {data}=await sb.auth.getSession();
    const u=data&&data.session&&data.session.user;
    if(u){if(!this.user||this.user.id!==u.id){this.user=u;S.auth=false;Store.start(u);}}
    else if(!this.user){S.auth=true;Store.mode='signedout';}
    render();
  }
};
function authErr(e){
  const m=String(e&&e.message||e);
  if(/Invalid login/i.test(m))return 'Email 或密碼不對，再試一次。';
  if(/not confirmed/i.test(m))return '還沒到信箱點確認連結，點完再回來登入。';
  if(/already registered|already been registered/i.test(m))return '這個 email 已經註冊過了，直接登入就好。';
  if(/rate limit|too many/i.test(m))return '試太多次了，等幾分鐘再試。';
  if(/Password should/i.test(m))return '密碼至少要 6 個字。';
  if(/saving new user|allow list|not allowed/i.test(m))return '這個 email 不在小日和的允許名單裡，請先請網站主人把你加進去。';
  return m;
}

/* ---------- photos (private bucket, signed links) ---------- */
const PH_BLANK='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const PhotoURL={map:LS.get('hiyori.photoUrls',{})||{},want:new Set(),t:0,
  get(p){const e=this.map[p];if(e&&e.exp>Date.now()+3600e3)return e.url;this.want.add(p);clearTimeout(this.t);this.t=setTimeout(()=>this.fetch(),30);return e?e.url:PH_BLANK;},
  async fetch(){
    if(!sb||!this.want.size)return;const paths=[...this.want];this.want.clear();
    try{const {data,error}=await sb.storage.from('photos').createSignedUrls(paths,7*864e2*100);if(error)throw error;
      const exp=Date.now()+7*864e5;(data||[]).forEach(r=>{if(r.signedUrl)this.map[r.path]={url:r.signedUrl,exp};});LS.set('hiyori.photoUrls',this.map);
      render();const s=SH.top();if(s)paintSheet(true);}catch(e){console.warn(e);}
  }};
async function storeImage(file,folder){
  const img=await fileToImage(file);const c=drawScaled(img,1800);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));
  const path=Store.uid+'/'+(folder?folder+'/':'')+uid('p')+'.jpg';
  const {error}=await sb.storage.from('photos').upload(path,blob,{contentType:'image/jpeg',upsert:false});
  if(error)throw error;
  PhotoURL.map[path]={url:URL.createObjectURL(blob),exp:Date.now()+3*3600e3};
  return {sp:path};
}
const imgSrc=im=>im&&im.sp?PhotoURL.get(im.sp):(im&&im.data)||PH_BLANK;

/* ---------- files ---------- */
function saveFile(name,data){
  try{const type=/\.json$/.test(name)?'application/json':'text/markdown';const blob=new Blob([data],{type:type+';charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);toast('已下載 '+name,'ok');}
  catch(e){sheetText(name,data);}
}

/* ---------- push notifications ---------- */
const Push={
  on:false,supported:false,standalone:false,ios:false,count:null,busy:false,
  env(){
    this.ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    this.standalone=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
    this.supported='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
  },
  async reg(){if(!('serviceWorker' in navigator))return null;return Promise.race([navigator.serviceWorker.ready,new Promise(r=>setTimeout(()=>r(null),6000))]);},
  async init(){
    this.env();
    if(!this.supported||!Store.uid){App.dataChanged(true);return;}
    try{const reg=await this.reg();const sub=reg&&await reg.pushManager.getSubscription();
      this.on=!!sub&&Notification.permission==='granted';
      if(this.on){const j=sub.toJSON();await sb.from('push_subs').upsert({endpoint:j.endpoint,user_id:Store.uid,sub:j,ua:navigator.userAgent.slice(0,180)},{onConflict:'endpoint'});}
    }catch(e){console.warn(e);}
    App.dataChanged(true);
  },
  async vapid(){
    const c=LS.get('hiyori.vapid',null);if(c)return c;
    const r=await fetch(CFG.url+'/functions/v1/send-reminders',{headers:{apikey:CFG.key}});
    const j=await r.json();if(!j.publicKey)throw new Error(j.error||'拿不到推播金鑰');LS.set('hiyori.vapid',j.publicKey);return j.publicKey;
  },
  async enable(){
    this.env();
    if(!this.supported){toast(this.ios&&!this.standalone?'請先把小日和加到主畫面，從主畫面打開後再按一次。':'這個瀏覽器不支援推播通知。','bad');return;}
    if(this.busy)return;this.busy=true;
    try{
      const perm=await Notification.requestPermission();
      if(perm!=='granted'){toast('通知權限沒有打開。可以到 iPhone「設定 → 通知 → 小日和」打開。','bad');return;}
      const reg=await this.reg();if(!reg)throw new Error('背景程式還沒準備好，重新打開小日和再試一次');
      const key=await this.vapid();
      let sub=await reg.pushManager.getSubscription();
      if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:fromB64u(key)});
      const j=sub.toJSON();
      const {error}=await sb.from('push_subs').upsert({endpoint:j.endpoint,user_id:Store.uid,sub:j,ua:navigator.userAgent.slice(0,180)},{onConflict:'endpoint'});
      if(error)throw error;
      this.on=true;await syncReminders();toast('通知開好了，網頁關掉也會準時提醒。','ok');
    }catch(e){toast('沒有開成功：'+(e&&e.message||e),'bad');}
    finally{this.busy=false;App.dataChanged(true);}
  },
  async test(){
    try{const fire=new Date(Date.now()+5000).toISOString();
      const {error}=await sb.from('reminders').insert({user_id:Store.uid,key:'test|'+Date.now(),fire_at:fire,title:'小日和的測試通知',body:'看到這則，就代表準時提醒開好了。',url:'./#shop'});
      if(error)throw error;toast('一分鐘內會收到測試通知，可以先把小日和關掉。','ok');}
    catch(e){toast('測試沒送出：'+(e&&e.message||e),'bad');}
  },
  async disable(){
    try{const reg=await this.reg();const sub=reg&&await reg.pushManager.getSubscription();
      if(sub){await sb.from('push_subs').delete().eq('endpoint',sub.endpoint);await sub.unsubscribe();}
      this.on=false;toast('這台裝置的通知關掉了。');}catch(e){toast('沒有關成功：'+(e&&e.message||e),'bad');}
    App.dataChanged(true);
  }
};
const fromB64u=s=>{s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};

/* the next five weeks of reminders live in the cloud so the phone is notified even when the site is closed */
let remT=0;
function scheduleReminderSync(){clearTimeout(remT);remT=setTimeout(syncReminders,3000);}
function computeReminders(){
  const out=new Map();const now=Date.now();const t=today();
  const add=(key,fire,title,body)=>{const ms=fire.getTime();if(ms<=now+20e3||ms>now+36*864e5)return;const iso=fire.toISOString();out.set(key+'|'+iso,{fire_at:iso,title,body,url:'./#today'});};
  for(let i=0;i<36;i++){
    const d=addDays(t,i);
    itemsOn(d).forEach(it=>{
      if(it.remind==null||!it.start||isDone(it,d))return;
      const [y,m,dd]=d.split('-').map(Number);const [hh,mi]=it.start.split(':').map(Number);
      const f=new Date(y,m-1,dd,hh,mi);f.setMinutes(f.getMinutes()-it.remind);
      add(it.id+'@'+d,f,it.start+' '+it.title,(it.remind===0?'現在開始':remindLabel(it.remind)+'提醒')+(it.loc?'・'+it.loc:''));
    });
  }
  Object.values(D.items).forEach(it=>{
    if(!it.deadline||it.rep||!it.date||it.done||it.dropped)return;
    const [y,m,dd]=it.date.split('-').map(Number);
    add(it.id+'@dl1',new Date(y,m-1,dd-1,20,0),'明天：'+it.title,'倒數只剩一天，記得準備。');
    add(it.id+'@dl0',new Date(y,m-1,dd,8,0),'今天：'+it.title,'加油，你可以的！');
  });
  return out;
}
async function syncReminders(){
  if(!sb||!Store.uid||Store.mode!=='cloud')return;
  try{
    const want=computeReminders();
    const {data:have,error}=await sb.from('reminders').select('rid,key').eq('sent',false).gt('fire_at',new Date().toISOString()).limit(2000);
    if(error)throw error;
    const hk=new Set((have||[]).map(r=>r.key));
    const del=(have||[]).filter(r=>!want.has(r.key)&&!/^test\|/.test(r.key)).map(r=>r.rid);
    for(let i=0;i<del.length;i+=100){const r=await sb.from('reminders').delete().in('rid',del.slice(i,i+100));if(r.error)throw r.error;}
    const add=[...want].filter(([k])=>!hk.has(k)).map(([key,v])=>Object.assign({user_id:Store.uid,key},v));
    for(let i=0;i<add.length;i+=200){const r=await sb.from('reminders').upsert(add.slice(i,i+200),{onConflict:'user_id,key',ignoreDuplicates:true});if(r.error)throw r.error;}
    Push.count=want.size;
  }catch(e){console.warn('reminder sync',e);}
}

/* ---------- 發表紀錄 sharing: who I share with, who shares with me ---------- */
const Friends={
  mine:null,toMe:null,posts:null,loading:false,
  reset(){this.mine=null;this.toMe=null;this.posts=null;},
  async loadMine(){
    if(!sb||!Store.uid)return;
    const {data,error}=await sb.from('shares').select('viewer_email,created_at').eq('owner',Store.uid).order('created_at');
    if(!error){this.mine=data||[];App.dataChanged(true);}
  },
  async loadToMe(){
    if(!sb||!Store.uid||!Store.email)return;
    const {data,error}=await sb.from('shares').select('owner').eq('viewer_email',Store.email.toLowerCase());
    if(!error){this.toMe=(data||[]).filter(r=>r.owner!==Store.uid);App.dataChanged(true);}
  },
  async loadPosts(){
    if(!sb||!Store.uid||this.loading)return;this.loading=true;App.dataChanged(true);
    const {data,error}=await sb.from('docs').select('user_id,id,data').eq('col','posts').neq('user_id',Store.uid).limit(500);
    this.loading=false;
    if(error){toast('朋友的發表沒有載入成功：'+error.message,'bad');App.dataChanged(true);return;}
    this.posts=(data||[]).map(r=>Object.assign({},r.data,{owner:r.user_id}));App.dataChanged(true);
  },
  async add(email){
    email=String(email||'').trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(email)){toast('請輸入正確的 email。','bad');return false;}
    if(email===(Store.email||'').toLowerCase()){toast('這是你自己的 email 喔。','bad');return false;}
    const {error}=await sb.from('shares').insert({owner:Store.uid,viewer_email:email});
    if(error&&!/duplicate/i.test(error.message)){toast('沒有加成功：'+error.message,'bad');return false;}
    await this.loadMine();toast('加進分享名單了','ok');return true;
  },
  async remove(email){
    const {error}=await sb.from('shares').delete().match({owner:Store.uid,viewer_email:email});
    if(error){toast('沒有移除成功：'+error.message,'bad');return;}
    await this.loadMine();toast('已從分享名單移除');
  }
};

/* ================= shared view helpers ================= */
const TITLES={home:'首頁',today:'行程',notes:'筆記本',lab:'實驗紀錄',album:'生活小天地',shop:'我的'};
const NAV_OF={home:'home',today:'today',notes:'notes',lab:'lab',album:'home',shop:'shop'};
const CHEV=svgUse('i-right','chev');
function emptyBox(icon,title,text,cat){return `<div class="paper empty"><span class="plate lg c-${cat||'habit'}">${ICON(icon)}</span><b>${esc(title)}</b><span>${esc(text)}</span></div>`;}
function sel(model,ph,opts,val){return `<select data-model="${model}" data-live="1" aria-label="${esc(ph)}"><option value="">${esc(ph)}</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(l)}</option>`).join('')}</select>`;}
function sec(title,html,extra){return `<section class="sec"><div class="sec-t"><h4>${title}</h4><span class="sp"></span>${extra||''}</div>${html}</section>`;}
function tbl(heads,rows){return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function moodPick(v){return `<div class="moodpick">${MOODS.map(m=>`<button type="button" class="${v===m.v?'on':''}" data-act="moodPick" data-v="${m.v}" aria-pressed="${v===m.v}">${svgUse('w'+m.v)}${m.name}</button>`).join('')}</div>`;}
function linkcard(icon,cat,title,sub,attrs){return `<button class="paper linkcard" ${attrs}><span class="plate c-${cat}">${ICON(icon)}</span><span style="min-width:0"><b>${title}</b><small>${sub}</small></span>${CHEV}</button>`;}

function render(){
  const main=$('#main');if(!main)return;
  document.body.classList.toggle('authing',!!S.auth);
  if(S.auth){main.innerHTML=`<div class="stack">${vAuth()}</div>`;$('#appbar').hidden=true;$('#fab').hidden=true;return;}
  const ae=document.activeElement;let keep=null;
  if(ae&&main.contains(ae)&&ae.id){keep={id:ae.id,s:null,e:null};try{keep.s=ae.selectionStart;keep.e=ae.selectionEnd;}catch(e){}}
  const v={home:vHome,today:vToday,notes:vNotes,lab:vLab,album:vAlbum,shop:vShop}[S.tab]||vHome;
  let html;try{html=v();}catch(err){console.error(err);html=`<div class="paper empty"><b>這一頁暫時打不開</b><span>${esc(err&&err.message||String(err))}</span></div>`;}
  main.innerHTML=`<div class="stack">${html}</div>`;
  paintAppbar();
  const nav=NAV_OF[S.tab]||'home';
  $$('#tabs .tab').forEach(b=>{const on=b.dataset.tab===nav;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const fab=$('#fab');const fabLabel={today:'新增行程',notes:'新增筆記',lab:'新增實驗紀錄',album:'新增照片日記'}[S.tab];
  const fabOn=!!fabLabel&&!(S.tab==='lab'&&S.lab.view==='rec');
  fab.hidden=!fabOn;if(fabOn)fab.setAttribute('aria-label',fabLabel);
  if(keep){const el=document.getElementById(keep.id);if(el){el.focus({preventScroll:true});try{if(keep.s!=null)el.setSelectionRange(keep.s,keep.e);}catch(e){}}}
}
function paintAppbar(){
  const bar=$('#appbar');bar.hidden=S.tab==='home';
  let left='',right='',title=TITLES[S.tab];
  if(S.tab==='album')left=`<button class="icon-btn" data-act="tab" data-tab="home" aria-label="回首頁">${I('left')}</button>`;
  if(S.tab==='lab'&&S.lab.view!=='home')left=`<button class="icon-btn" data-act="labBack" aria-label="返回">${I('left')}</button>`;
  if(S.tab==='lab'&&S.lab.view==='proj')title='實驗專案';
  if(S.tab==='today'&&S.day!==today())right=`<button class="btn btn-sm btn-line" data-act="goToday">今天</button>`;
  if(!left)left=`<span class="brandmini" aria-hidden="true">Hiyori</span>`;
  if(Store.mode==='offline'||Store.mode==='error')right+=`<button class="mode-chip local" data-act="modeInfo">離線</button>`;
  else if(Store.mode==='loading')right+=`<span class="mode-chip">連線中</span>`;
  else if(Object.keys(Store.outbox).length)right+=`<button class="mode-chip" data-act="modeInfo">上傳中</button>`;
  $('#abLeft').innerHTML=left;$('#abRight').innerHTML=right;$('#abTitle').textContent=title;
}

/* ================= 首頁 ================= */
function greeting(){
  const h=new Date().getHours();
  if(h<5)return ['夜深了','早點休息喔'];if(h<11)return ['早安','今天也要開心喔！'];if(h<14)return ['午安','記得好好吃飯喔！'];if(h<18)return ['下午好','累了就休息一下'];return ['晚安','今天辛苦了'];
}
function vHome(){
  const t=today(),its=itemsOn(t),done=its.filter(i=>isDone(i,t)).length,left=its.length-done,dt=pd(t);
  const [g1,g2]=greeting();const name=SET().name;
  const nm=nowMin();const next=its.find(i=>i.start&&!isDone(i,t)&&toMin(i.start)+(i.dur||60)>nm);
  const sub=!S.ready?'正在把今天的行程端上桌…':its.length?(left?`${left} 項待完成${next?`，下一件 ${next.start} ${esc(trim(next.title,10))}`:''}`:'今天的事都完成了'):'今天還沒有安排';
  const recs=Object.values(D.records).map(r=>newRecord(clone(r)));const act=recs.filter(r=>r.status==='doing')[0]||recs.filter(r=>r.status==='plan').sort((a,b)=>(a.date||'9')<(b.date||'9')?-1:1)[0];
  const proj=Object.values(D.projects).find(p=>p.status==='active');
  const labSub=act?`${esc(trim(act.title,16))} ${REC_STATUS[act.status].name}`:proj?`${esc(trim(proj.name,16))} 進行中`:'還沒有實驗紀錄';
  const soon=its.find(i=>i.start&&!isDone(i,t)&&toMin(i.start)>=nm&&toMin(i.start)-nm<=120);
  const pend=Push.on?0:phoneLists().pending.length;
  const tip=soon?`${soon.start} 的「${esc(trim(soon.title,12))}」快到了喔！`:pend?`有 ${pend} 筆提醒，到「我的」打開通知，網頁關掉也會準時提醒你喔`:esc(TIPS[dayIndex(t)%TIPS.length]);
  const h=new Date().getHours();
  return `<section class="hero"><div class="hero-img" role="img" aria-label="Hiyori 招牌、窗邊的蛋糕與咖啡、睡在椅子上的小貓，遠方是湖和小鎮"></div></section>
  <div class="greet"><p class="hello">${esc(g1)}${name?'，'+esc(name):''}，${esc(g2)}</p><span class="hero-date">${dt.getMonth()+1} 月 ${dt.getDate()} 日 · 星期${WD[dow(t)]}</span></div>
  <div class="linkcards">${linkcard('cake','study','今日行程',sub,`data-act="tab" data-tab="today" data-go="today"`)}${linkcard('sprout','lab','實驗紀錄',labSub,`data-act="tab" data-tab="lab"`)}${linkcard('pencil','rest','發表紀錄',postSub(),`data-act="tab" data-tab="album" data-seg="post"`)}</div>
  ${h>=18&&its.length?`<button class="btn btn-peach btn-block" data-act="review">${I('moon')}晚上回顧今天</button>`:''}
  <div class="tiles">${[['cake','study','行程管理','today'],['note','rest','筆記本','notes'],['flask','lab','實驗紀錄','lab'],['camera','friends','生活小天地','album']].map(([ic,c,l,tab])=>`<button class="paper tile" data-act="tab" data-tab="${tab}" data-go="today"><span class="plate lg c-${c}">${ICON(ic)}</span>${l}</button>`).join('')}</div>
  ${S.ready?ticketsBlock():''}
  <div class="tipcard">${svgUse('cat-white','cat')}<p class="tip-t"><b>小提醒：</b><br>${tip}</p></div>
  <div class="quote">${svgUse('leaf','qleaf')}<span>每一個小小的計劃，<br>都是更喜歡自己的開始。</span>${svgUse('cat-sleep','qcat')}</div>`;
}
function ticketsBlock(){
  const list=deadlines();if(!list.length)return '';const t=today();
  return `<section class="block"><div class="sec-head"><h2 class="h2">倒數</h2><span class="eyebrow">Countdown</span></div><div class="tickets">${list.map(it=>{const n=diffDays(t,it.date);
    return `<button class="ticket ${n<=3?'urgent':''}" data-act="openItem" data-id="${it.id}"><span class="tk-l">${n===0?'<span class="tk-n" style="font-size:17px">今天</span>':`<span class="tk-n">${n}</span><span class="tk-u">天後</span>`}</span><span class="tk-r"><b>${esc(it.title)}</b><small>${fmtDay(it.date)}${it.start?' '+it.start:''}</small></span></button>`;}).join('')}</div></section>`;
}

/* ================= 行程 ================= */
function vToday(){
  const d=S.day,t=today();const its=itemsOn(d);const done=its.filter(i=>isDone(i,d)).length;
  if(!S.ready)return calBlock(d)+`<p class="loading-line">正在把行程端上桌…</p>`;
  const timed=its.filter(i=>i.start),untimed=its.filter(i=>!i.start);const dt=pd(d);const pct=its.length?Math.round(done/its.length*100):0;
  const rel=d===t?'今天':diffDays(t,d)===1?'明天':diffDays(t,d)===-1?'昨天':diffDays(t,d)>0?diffDays(t,d)+' 天後':-diffDays(t,d)+' 天前';
  const h=new Date().getHours();
  return [calBlock(d),
    `<section class="dayhead"><div><div class="dh-date">${dt.getMonth()+1} 月 ${dt.getDate()} 日 星期${WD[dow(d)]}</div><div class="dh-sub">${rel} · 民國 ${dt.getFullYear()-1911} 年</div></div><div class="dh-prog">${done} / ${its.length}</div><div class="meter" role="progressbar" aria-label="完成進度" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>${d===t?`<div class="acts"><button class="btn btn-sm ${h>=18?'btn-peach':'btn-line'}" data-act="review">${I('moon')}晚上回顧今天</button></div>`:`<div class="acts"><button class="btn btn-sm btn-line" data-act="openDay" data-day="${d}">那天做了什麼</button></div>`}</section>`,
    quickAddBlock(),noticesBlock(d),
    `<section class="block"><div class="sec-head"><h2 class="h2">時間表</h2><span class="sp"></span><button class="btn btn-sm btn-line" data-act="addItem" data-kind="event">${I('plus')}行程</button></div>
    ${timed.length?`<div class="paper tl-card">${timed.map(i=>tlRow(i,d)).join('')}</div>`:emptyBox('latte',d===t?'今天還沒有排行程':'這天還沒有行程','用「一句話新增」，或按右下角的＋。')}</section>`,
    `<section class="block"><div class="sec-head"><h2 class="h2">待辦</h2><span class="sp"></span><button class="btn btn-sm btn-line" data-act="addItem" data-kind="todo">${I('plus')}待辦</button></div>
    ${untimed.length?`<div class="paper tl-card">${untimed.map(i=>tlRow(i,d)).join('')}</div>`:`<p class="muted small">這天沒有待辦。</p>`}</section>`,
    d===t?inboxBlock():''].join('');
}
function calBlock(d){
  const [y,mo]=S.cal.split('-').map(Number);const first=new Date(y,mo-1,1);const lead=first.getDay();const days=new Date(y,mo,0).getDate();const t=today();
  let h=['日','一','二','三','四','五','六'].map((w,i)=>`<span class="hd ${i===0||i===6?'we':''}">${w}</span>`).join('');
  const start=ds(new Date(y,mo-1,1-lead));const cells=Math.ceil((lead+days)/7)*7;
  for(let i=0;i<cells;i++){
    const x=addDays(start,i);const out=x.slice(0,7)!==S.cal;const its=S.ready?itemsOn(x):[];const all=its.length&&its.every(it=>isDone(it,x));const g=pd(x).getDay();
    const dots=all?'<i class="stamp"></i>':its.slice(0,3).map(it=>`<i class="${isDone(it,x)?'on':''}"></i>`).join('');
    h+=`<button class="cday ${out?'out':''} ${g===0||g===6?'we':''} ${x===t?'is-today':''} ${x===d?'is-sel':''}" data-act="day" data-day="${x}" aria-label="${fmtDay(x)}${x===t?'，今天':''}${its.length?'，'+its.length+' 件':''}" aria-pressed="${x===d}"><b>${pd(x).getDate()}</b><span class="dots">${dots}</span></button>`;
  }
  return `<section class="paper calcard"><div class="cal-head"><button class="icon-btn" data-act="calShift" data-n="-1" aria-label="上個月">${I('left')}</button><b>${y} 年 ${mo} 月</b><button class="icon-btn" data-act="calShift" data-n="1" aria-label="下個月">${I('right')}</button></div><div class="cal">${h}</div></section>`;
}
function quickAddBlock(){
  return `<form class="order" data-form="quick"><div class="order-top">${I('spark')}<label class="order-title" for="qa">一句話新增</label></div>
  <div class="order-row"><input class="in" id="qa" data-model="qa" value="${esc(S.qa)}" placeholder="明天下午兩點跟老師討論，大概一小時" autocomplete="off" enterkeyhint="done"><button class="btn btn-accent" type="submit">整理</button></div>
  <div class="hint">會先整理給你確認；沒說清楚的地方會標「建議」。</div></form>`;
}
function noticesBlock(d){const ns=noticesFor(d);if(!ns.length)return '';return `<section class="block"><div class="sec-head"><h2 class="h2">小管家提醒</h2></div><div class="notices">${ns.map(n=>noticeHtml(n,d)).join('')}</div></section>`;}
function noticeHtml(n,d){
  if(n.type==='conflict')return `<div class="notice warn">${I('warn')}<div><b>時間重疊</b>：${esc(n.a.start)}「${esc(n.a.title)}」和 ${esc(n.b.start)}「${esc(n.b.title)}」撞在一起了。<div class="acts"><button class="btn btn-sm btn-line" data-act="openItem" data-id="${n.b.id}" data-day="${d}">調整「${esc(trim(n.b.title,10))}」</button></div></div></div>`;
  if(n.type==='load')return `<div class="notice warn">${I('warn')}<div><b>這天排得有點滿</b>：${n.count} 件事，排定的時間共 ${fmtDur(n.total)}。${n.movable.length?`有 ${n.movable.length} 件沒指定時間的待辦，可以先移到隔天。`:'挑一件比較不急的往後移，會輕鬆一點。'}${n.movable.length?`<div class="acts"><button class="btn btn-sm btn-line" data-act="moveLoose" data-day="${d}">把這 ${n.movable.length} 件移到隔天</button></div>`:''}</div></div>`;
  if(n.type==='buffer')return `<div class="notice">${I('clock')}<div><b>留一點緩衝</b>：「${esc(n.a.title)}」結束後${n.gap===0?'馬上':'只隔 '+n.gap+' 分鐘'}就是「${esc(n.b.title)}」。實驗常常會拖一點，也要留時間整理紀錄。</div></div>`;
  if(n.type==='carry')return `<div class="notice">${I('repeat')}<div><b>之前還沒完成的 ${n.items.length} 件</b>：要接著做，還是先放下？<div class="carry">${n.items.slice(0,6).map(it=>`<div class="carry-row"><span>${esc(it.title)} <span class="muted small">${fmtDay(it.date)}</span></span><div class="acts"><button class="btn btn-sm btn-accent" data-act="carry" data-to="today" data-id="${it.id}">移到今天</button><button class="btn btn-sm btn-line" data-act="carry" data-to="tomorrow" data-id="${it.id}">明天</button><button class="btn btn-sm btn-line" data-act="carry" data-to="done" data-id="${it.id}">其實做完了</button><button class="btn btn-sm btn-ghost" data-act="carry" data-to="drop" data-id="${it.id}">不做了</button></div></div>`).join('')}${n.items.length>6?`<p class="small muted">還有 ${n.items.length-6} 件，處理完上面的就會出現。</p>`:''}</div></div></div>`;
  return '';
}
function tlRow(it,d){
  const done=isDone(it,d),nm=nowMin();
  const isNow=d===today()&&it.start&&!done&&toMin(it.start)<=nm&&endMin(it)>nm;
  const meta=[`<span>${esc(CATS[it.cat]?CATS[it.cat].short:'')}</span>`];
  if(it.loc)meta.push(`<span>${I('map')}${esc(it.loc)}</span>`);
  if(it.rep)meta.push(`<span>${I('repeat')}${esc(repLabel(it))}</span>`);
  if(it.remind!=null)meta.push(`<span>${I('bell')}${remindLabel(it.remind)}</span>`);
  const ps=phoneState(it);if(ps==='pending')meta.push(`<span class="ph-sync wait">通知未開</span>`);
  if(it.recordId&&D.records[it.recordId])meta.push(`<span>${I('lab')}實驗紀錄</span>`);
  const subs=it.subtasks||[];if(subs.length)meta.push(`<span>${I('list')}${subs.filter(s=>s.done).length}/${subs.length}</span>`);
  if(it.deadline)meta.push(`<span class="badge">倒數</span>`);
  if(it.note&&!it.loc)meta.push(`<span>${esc(trim(it.note,18))}</span>`);
  return `<div class="tl ${it.start?'':'no-time'} ${done?'is-done':''} ${isNow?'is-now':''}" data-act="openItem" data-id="${it.id}" data-day="${d}" role="button" tabindex="0">${it.start?`<div class="tl-time"><b>${it.start}</b><small>${it.dur?'到 '+fromMin(toMin(it.start)+it.dur):''}</small></div>`:''}<span class="plate c-${it.cat}">${F(catFood(it.cat))}</span><div style="min-width:0"><div class="tl-title">${esc(it.title)}</div><div class="tl-meta">${meta.join('')}</div></div><button class="chk ${done?'on':''}" data-act="toggle" data-id="${it.id}" data-day="${d}" aria-label="${done?'標成未完成':'標成完成'}：${esc(it.title)}" aria-pressed="${done}">${I('check')}</button></div>`;
}
function inboxBlock(){
  const list=inboxItems();if(!list.length)return '';
  return `<section class="block"><div class="sec-head"><h2 class="h2">還沒排日期</h2></div><div class="paper tl-card">${list.map(it=>`<div class="tl no-time" data-act="openItem" data-id="${it.id}" role="button" tabindex="0"><span class="plate c-${it.cat}">${F(catFood(it.cat))}</span><div style="min-width:0"><div class="tl-title">${esc(it.title)}</div><div class="tl-meta"><span>${esc(CATS[it.cat].short)}</span>${it.noteId?'<span>來自筆記</span>':''}${it.recordId?'<span>來自實驗</span>':''}</div></div><button class="btn btn-sm btn-line" data-act="inboxToday" data-id="${it.id}">排今天</button></div>`).join('')}</div></section>`;
}

/* ================= 筆記本 ================= */
function vNotes(){
  const st=S.notes;let list=Object.values(D.notes);
  const tags=[...new Set(list.flatMap(n=>n.tags||[]))].sort((a,b)=>a.localeCompare(b));
  if(st.seg==='quick')list=list.filter(n=>n.type!=='full');else if(st.seg==='full')list=list.filter(n=>n.type==='full');else if(st.seg==='pin')list=list.filter(n=>n.pinned);
  if(st.tag)list=list.filter(n=>(n.tags||[]).includes(st.tag));
  const q=st.q.trim().toLowerCase();if(q)list=list.filter(n=>((n.title||'')+' '+(n.body||'')+' '+(n.tags||[]).join(' ')).toLowerCase().includes(q));
  list.sort((a,b)=>(!!b.pinned-!!a.pinned)||((b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0)));
  const any=Object.keys(D.notes).length;
  return `${any?`<div class="searchbar">${I('search')}<input class="in" id="ns" type="search" data-model="notes.q" data-live="1" value="${esc(st.q)}" placeholder="搜尋筆記…" aria-label="搜尋筆記"></div>`:''}
  <form class="memo-in" data-form="memo"><label class="sr" for="qn">快速便條</label><textarea id="qn" data-model="qn" rows="2" placeholder="想到什麼，先記下來…（可以加 #標籤）">${esc(S.qn)}</textarea><div class="row"><span class="hint">三秒就好，之後再整理。</span><span class="sp"></span><button class="btn btn-sm btn-accent" type="submit">記下</button></div></form>
  ${any?`<div class="block"><div class="seg-scroll"><div class="seg">${[['all','全部'],['quick','便條'],['full','筆記'],['pin','收藏']].map(([k,l])=>`<button class="${st.seg===k?'on':''}" data-act="noteSeg" data-seg="${k}" aria-pressed="${st.seg===k}">${l}</button>`).join('')}</div></div>
  ${tags.length?`<div class="chips">${tags.map(t=>`<button class="chip ${st.tag===t?'on':''}" data-act="noteTag" data-tag="${esc(t)}">${I('tag')}${esc(t)}</button>`).join('')}</div>`:''}</div>`:''}
  ${list.length?`<div class="nlist">${list.map(noteRow).join('')}</div>`:(any?`<p class="muted">找不到符合的筆記。</p>`:emptyBox('note','筆記本還是空的','在上面寫一句話按「記下」；按右下角的＋可以寫有標題、圖片和標籤的完整筆記。','rest'))}`;
}
function noteRow(n){
  const foods=['pencil','cup','croissant-s','cookie','book','juice'];const icon=n.type==='full'?'note':foods[hash(n.id)%foods.length];
  const cat=['chores','habit','study','lab','rest','friends'][hash(n.id)%6];
  const body=String(n.body||'');const lines=body.split('\n');
  const title=n.type==='full'?(n.title||'未命名筆記'):lines[0];const sub=n.type==='full'?body:lines.slice(1).join('\n');
  const img=(n.images||[])[0];const conv=n.convertedTo&&D.items[n.convertedTo];
  return `<button class="paper nrow" data-act="openNote" data-id="${n.id}"><span class="plate c-${cat}">${ICON(icon)}</span><span style="min-width:0;display:block"><span class="nr-t ${n.type==='full'?'':'hand'}">${esc(title)}</span>${sub.trim()?`<span class="nr-s">${esc(sub)}</span>`:''}<span class="nr-m">${n.pinned?`${svgUse('heart','pinic')}<span>收藏</span>`:''}<span class="num">${fmtStamp(n.updatedAt||n.createdAt)}</span>${(n.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join('')}${conv?'<span>已排進行程</span>':''}</span></span>${img?`<img class="nr-img" src="${esc(imgSrc(img))}" alt="" loading="lazy">`:'<span class="nr-pad"></span>'}${CHEV}</button>`;
}

/* ================= 實驗紀錄 ================= */
function vLab(){
  const L=S.lab;
  if(L.view==='rec'&&D.records[L.id])return vRec(L.id);
  if(L.view==='proj'&&D.projects[L.id])return vProj(L.id);
  if(!S.ready)return `<p class="loading-line">正在翻開實驗紀錄本…</p>`;
  const lists=labLists();let recs=Object.values(D.records).map(r=>newRecord(clone(r)));
  const filtering=!!(L.q||L.type||L.status||L.cell||L.ab||L.range);
  if(L.q){const q=L.q.toLowerCase();recs=recs.filter(r=>recHay(r).includes(q));}
  if(L.type)recs=recs.filter(r=>r.type===L.type);
  if(L.status)recs=recs.filter(r=>r.status===L.status);
  if(L.cell)recs=recs.filter(r=>String(r.cellLine||'').trim()===L.cell);
  if(L.ab)recs=recs.filter(r=>r.antibodies.some(a=>String(a.name||'').trim()===L.ab));
  if(L.range){const t=today();recs=recs.filter(r=>r.date&&(L.range==='m'?r.date.slice(0,7)===t.slice(0,7):r.date<=t&&diffDays(r.date,t)<=+L.range));}
  recs.sort(recSort);
  const projs=Object.values(D.projects).sort((a,b)=>((a.status==='done')-(b.status==='done'))||((b.updatedAt||0)-(a.updatedAt||0)));
  const total=Object.keys(D.records).length;let body;
  if(!total)body=emptyBox('flask','還沒有實驗紀錄','按右下角的＋，可以從胺基酸刺激、Western blot、細胞繼代等模板開始。','lab');
  else if(!recs.length)body=`<p class="muted">沒有符合條件的紀錄。</p>`;
  else if(filtering)body=`<p class="small muted">找到 ${recs.length} 筆</p><div class="recs">${recs.map(recRow).join('')}</div>`;
  else{
    const groups={};recs.forEach(r=>{const k=r.date?r.date.slice(0,7):'none';(groups[k]=groups[k]||[]).push(r);});
    body=Object.keys(groups).sort((a,b)=>a==='none'?1:b==='none'?-1:(a<b?1:-1)).map(k=>`<div class="block"><div class="month-label">${k==='none'?'還沒填日期':k.slice(0,4)+' 年 '+(+k.slice(5))+' 月'}</div><div class="recs">${groups[k].map(recRow).join('')}</div></div>`).join('');
  }
  return `${total?`<div class="block"><div class="searchbar">${I('search')}<input class="in" id="ls" type="search" data-model="lab.q" data-live="1" value="${esc(L.q)}" placeholder="搜尋細胞株、蛋白、試劑、步驟…" aria-label="搜尋實驗紀錄"></div>
  <div class="filters">${sel('lab.type','類型：全部',REC_TYPES.map(t=>[t,t]),L.type)}${sel('lab.status','狀態：全部',Object.entries(REC_STATUS).map(([k,v])=>[k,v.name]),L.status)}${sel('lab.range','日期：全部',[['m','這個月'],['30','近 30 天'],['90','近 90 天']],L.range)}${sel('lab.cell','細胞株：全部',lists.cells.map(c=>[c,c]),L.cell)}${sel('lab.ab','蛋白 / 抗體：全部',lists.abs.map(c=>[c,c]),L.ab)}${filtering?`<button class="btn btn-sm btn-line" data-act="labClear">清除篩選</button>`:''}</div></div>`:''}
  <section class="block"><div class="sec-head"><h2 class="h2">實驗專案</h2></div><div class="projs">${projs.map(projCard).join('')}<button class="proj add" data-act="newProj">${I('plus')}<span>新專案</span></button></div></section>
  <section class="block"><div class="sec-head"><h2 class="h2">紀錄時間軸</h2></div>${body}</section>`;
}
function projCard(p){
  const rs=Object.values(D.records).filter(r=>r.projectId===p.id);const done=rs.filter(r=>r.status==='done').length;const last=rs.map(r=>r.date).filter(Boolean).sort().pop();
  const stc=p.status==='done'?'st-done':p.status==='paused'?'st-plan':'st-doing';
  return `<button class="proj" data-act="openProj" data-id="${p.id}"><span class="plate sm c-lab">${svgUse('sprout')}</span><span class="proj-name">${esc(p.name)}</span><span><span class="st ${stc}">${PROJ_STATUS[p.status]||'進行中'}</span></span>${p.readouts||p.cellLines?`<span class="proj-meta">${esc([p.cellLines,p.readouts].filter(Boolean).join(' · '))}</span>`:''}<span class="proj-stats"><span><b>${rs.length}</b>筆</span><span><b>${done}</b>完成</span>${last?`<span>最近 ${fmtMD(last)}</span>`:''}</span></button>`;
}
function recRow(r){
  const p=D.projects[r.projectId];const prev=r.prevId&&D.records[r.prevId];const st=REC_STATUS[r.status]||REC_STATUS.plan;const sd=r.steps.filter(s=>s.done).length;
  return `<button class="rec" data-act="openRec" data-id="${r.id}"><span class="plate c-lab">${svgUse(typeIcon(r.type))}</span><span style="min-width:0;display:block"><span class="rec-title" style="display:block">${esc(r.title||'未命名實驗')}</span><span class="rec-meta"><span class="st ${st.cls}">${st.name}</span><span class="num">${r.date?r.date.replace(/-/g,'/'):'未填日期'}</span><span>${esc(r.type)}</span>${r.cellLine?`<span>${esc(r.cellLine)}</span>`:''}${r.steps.length?`<span>步驟 ${sd}/${r.steps.length}</span>`:''}${r.images.length?`<span>${I('image')}${r.images.length}</span>`:''}</span>${p||prev?`<span class="rec-link">${I('link')}<span>${p?esc(trim(p.name,16)):''}${p&&prev?' · ':''}${prev?(r.prevRel==='repeat'?'重複自「':'接續自「')+esc(trim(prev.title,14))+'」':''}</span></span>`:''}</span>${CHEV}</button>`;
}
function quantChart(r){
  const rows=(r.quant||[]).map(q=>({l:q.label||'',v:parseFloat(q.value)})).filter(q=>!isNaN(q.v));
  if(!rows.length)return '';
  const max=Math.max(...rows.map(q=>q.v),0)||1;const W=340,lw=96,bh=22,gap=10,top=8;const bw=W-lw-46;const H=top+rows.length*(bh+gap)+16;
  let s=`<svg class="qchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc((r.quantLabel||'定量結果')+'：'+rows.map(q=>q.l+' '+fmtNum(q.v)).join('，'))}">`;
  [0,.5,1].forEach(f=>{const x=lw+bw*f;s+=`<line x1="${x}" y1="${top-4}" x2="${x}" y2="${H-14}" style="stroke:var(--line-2)" stroke-dasharray="3 3"/><text x="${x}" y="${H-3}" font-size="10" text-anchor="middle" style="fill:var(--ink-3)">${fmtNum(max*f)}</text>`;});
  rows.forEach((q,i)=>{const y=top+i*(bh+gap);const w=Math.max(1,bw*Math.max(0,q.v)/max);
    s+=`<text x="${lw-8}" y="${y+bh/2+4}" font-size="12" text-anchor="end" style="fill:var(--ink-2)">${esc(trim(q.l,9))}</text><rect x="${lw}" y="${y}" width="${w}" height="${bh}" rx="6" style="fill:var(--sage-btn);opacity:${(.55+.45*Math.max(0,q.v)/max).toFixed(2)}"/><text x="${lw+w+6}" y="${y+bh/2+4}" font-size="12" style="fill:var(--ink)">${fmtNum(q.v)}</text>`;});
  return s+'</svg>';
}
function vRec(id){
  const r=R(id);const p=D.projects[r.projectId];const st=REC_STATUS[r.status];
  const prev=r.prevId&&D.records[r.prevId];const nexts=Object.values(D.records).filter(x=>x.prevId===r.id).map(x=>newRecord(clone(x))).sort(recSort);
  const ev=r.eventId&&D.items[r.eventId];const sd=r.steps.filter(s=>s.done).length;
  const out=[];
  out.push(`<div class="rd-head"><div class="paper rd-card"><span class="plate c-lab">${svgUse(typeIcon(r.type))}</span><div style="min-width:0"><h2 class="rd-title">${esc(r.title||'未命名實驗')}</h2><div class="rd-sub"><span class="st ${st.cls}">${st.name}</span><span>${esc(r.cellLine||r.type)}</span><span class="num">${r.date?r.date.replace(/-/g,'/'):'未填日期'}${r.start?' '+r.start:''}${r.end?'–'+r.end:''}</span></div></div></div>
  <div class="seg-scroll"><div class="seg" role="group" aria-label="狀態">${Object.entries(REC_STATUS).map(([k,v])=>`<button class="${r.status===k?'on':''}" data-act="recStatus" data-id="${r.id}" data-st="${k}" aria-pressed="${r.status===k}">${v.name}</button>`).join('')}</div></div>
  <div class="toolbar"><button class="btn btn-sm btn-accent" data-act="editRec" data-id="${r.id}">${I('edit')}編輯</button><button class="btn btn-sm btn-line" data-act="recNext" data-id="${r.id}">${I('arrow')}下一步實驗</button><button class="btn btn-sm btn-line" data-act="recDup" data-id="${r.id}">${I('copy')}複製一份</button><button class="btn btn-sm btn-line" data-act="recEvent" data-id="${r.id}">${I('cal-plus')}${ev?'看行程':'加入行程'}</button><button class="btn btn-sm btn-line" data-act="recCopy" data-id="${r.id}">${I('copy')}複製文字</button><button class="btn btn-sm btn-line" data-act="recMd" data-id="${r.id}">${I('download')}匯出 .md</button><button class="btn btn-sm btn-line" data-act="recTpl" data-id="${r.id}">${I('book')}存成模板</button><button class="btn btn-sm btn-danger" data-act="recDel" data-id="${r.id}">${I('trash')}刪除</button></div></div>`);
  const kv=[['細胞株',r.cellLine],['類型',r.type],['代數',r.passage],['密度',r.confluency],['培養格式',r.plate]].filter(x=>x[1]);
  if(kv.length||r.purpose||p||r.tags.length)out.push(sec('基本資料',`<dl class="kv">${p?`<dt>專案</dt><dd><button class="link-btn" data-act="openProj" data-id="${p.id}">${esc(p.name)}</button></dd>`:''}${kv.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${r.purpose?`<div><div class="lbl">研究目標 / 實驗目的</div><p class="prose">${esc(r.purpose)}</p></div>`:''}${r.tags.length?`<div class="chips">${r.tags.map(t=>`<span class="chip">#${esc(t)}</span>`).join('')}</div>`:''}`));
  if(r.conditions.length)out.push(sec('實驗條件',tbl(['組別','時間','處理','備註'],r.conditions.map(c=>[c.label,c.time,c.treatment,c.note])),`<span class="small muted">${r.conditions.length} 組</span>`));
  if(r.params.length)out.push(sec('實驗參數',`<dl class="kv">${r.params.map(x=>`<dt>${esc(x.k)}</dt><dd>${esc(x.v)||'<span class="muted">未填</span>'}</dd>`).join('')}</dl>`));
  if(r.reagents.length)out.push(sec('試劑',tbl(['名稱','濃度','用量','批號 / 廠牌'],r.reagents.map(x=>[x.name,x.conc,x.amount,x.lot]))));
  if(r.antibodies.length)out.push(sec('抗體',tbl(['目標','種類','稀釋','kDa','廠牌 / 貨號'],r.antibodies.map(x=>[x.name,x.kind,x.dilution,x.mw,x.source]))));
  if(r.steps.length)out.push(sec('操作步驟',`<div class="steps">${r.steps.map((s,i)=>`<div class="step ${s.done?'done':''}"><button class="chk ${s.done?'on':''}" data-act="stepToggle" data-id="${r.id}" data-i="${i}" aria-label="${s.done?'取消完成':'完成'}第 ${i+1} 步" aria-pressed="${!!s.done}">${I('check')}</button><div style="min-width:0"><div class="step-txt">${i+1}. ${esc(s.text)}</div>${s.at||s.note?`<div class="step-at">${s.at?esc(s.at)+' 完成':''}${s.at&&s.note?' · ':''}${s.note?`<span class="muted">${esc(s.note)}</span>`:''}</div>`:''}</div>${s.min?`<button class="btn btn-sm btn-line" data-act="timerStart" data-id="${r.id}" data-i="${i}" aria-label="計時 ${s.min} 分鐘">${I('timer')}${s.min} 分</button>`:'<span></span>'}</div>`).join('')}</div>`,`<span class="small muted num">${sd}/${r.steps.length}</span>`));
  if(r.samples.length)out.push(sec('樣本',tbl(['編號','存放位置','說明'],r.samples.map(x=>[x.code,x.location,x.desc]))));
  if(r.observation||r.images.length||r.quant.length)out.push(sec('紀錄與結果',`${r.observation?`<p class="prose">${esc(r.observation)}</p>`:''}${r.images.length?`<div class="gallery">${r.images.map(im=>`<figure><button data-act="lightbox" data-src="${esc(imgSrc(im))}" data-cap="${esc([im.kind,im.caption].filter(Boolean).join(' · '))}" aria-label="放大圖片"><img src="${esc(imgSrc(im))}" alt="${esc(im.caption||im.kind||'實驗圖片')}" loading="lazy"></button><figcaption>${esc([im.kind,im.caption].filter(Boolean).join(' · '))}</figcaption></figure>`).join('')}</div>`:''}${r.quant.length?`<div><div class="lbl">定量${r.quantLabel?'：'+esc(r.quantLabel):''}</div>${quantChart(r)}</div>`:''}`));
  if(r.problems||r.conclusion)out.push(sec('問題與小結',`${r.problems?`<div><div class="lbl">遇到的問題 / 異常狀況</div><p class="prose">${esc(r.problems)}</p></div>`:''}${r.conclusion?`<div><div class="lbl">小結</div><p class="prose">${esc(r.conclusion)}</p></div>`:''}`));
  if(r.next.length)out.push(sec('下一步',`<div class="steps">${r.next.map((n,i)=>`<div class="step ${n.done?'done':''}"><button class="chk ${n.done?'on':''}" data-act="nextToggle" data-id="${r.id}" data-i="${i}" aria-label="${n.done?'取消完成':'完成'}" aria-pressed="${!!n.done}">${I('check')}</button><div class="step-txt">${esc(n.text)}</div>${n.todoId&&D.items[n.todoId]?'<span class="chip">已在待辦</span>':`<button class="btn btn-sm btn-line" data-act="nextTodo" data-id="${r.id}" data-i="${i}">轉成待辦</button>`}</div>`).join('')}</div>`));
  if(prev||nexts.length||ev)out.push(sec('串連',`<div class="chain">${prev?`<div class="lbl">${r.prevRel==='repeat'?'重複自':'接續自'}</div>${recRow(newRecord(clone(prev)))}`:''}${nexts.length?`<div class="lbl">後續實驗</div>${nexts.map(recRow).join('')}`:''}${ev?`<div class="lbl">行程</div><button class="btn btn-sm btn-line" style="align-self:flex-start" data-act="openItem" data-id="${ev.id}">${I('today')}${ev.date?fmtDay(ev.date):''} ${esc(ev.start||'')} ${esc(trim(ev.title,16))}</button>`:''}</div>`));
  const miss=[];if(!r.conditions.length)miss.push('實驗條件');if(!r.reagents.length)miss.push('試劑');if(!r.antibodies.length&&/Western|Stimulation/.test(r.type))miss.push('抗體');if(!r.steps.length)miss.push('步驟');if(!r.samples.length&&r.status!=='plan')miss.push('樣本');if(!r.observation&&!r.images.length&&r.status!=='plan')miss.push('結果');if(!r.conclusion&&r.status==='done')miss.push('小結');if(!r.date)miss.push('日期');
  if(miss.length)out.push(`<div class="missing">還沒填：${miss.join('、')}　<button class="link-btn" data-act="editRec" data-id="${r.id}">現在補上</button></div>`);
  out.push(`<p class="legal">建立於 ${fmtStamp(r.createdAt)}${r.updatedAt?'，最後修改 '+fmtStamp(r.updatedAt):''}。這裡適合當個人實驗日誌；正式紀錄仍以實驗室規定的系統為準。</p>`);
  return out.join('');
}
function vProj(id){
  const p=D.projects[id];const rs=Object.values(D.records).filter(r=>r.projectId===id).map(r=>newRecord(clone(r))).sort((a,b)=>{const x=a.date||'9999',y=b.date||'9999';return x<y?-1:x>y?1:(a.createdAt||0)-(b.createdAt||0);});
  const cnt=k=>rs.filter(r=>r.status===k).length;const stc=p.status==='done'?'st-done':p.status==='paused'?'st-plan':'st-doing';
  return `<section class="proj-hero"><div style="display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;align-items:center"><span class="plate c-lab" style="width:52px;height:52px">${svgUse('sprout')}</span><div style="min-width:0"><h2 class="rd-title">${esc(p.name)}</h2><div class="rd-sub"><span class="st ${stc}">${PROJ_STATUS[p.status]||'進行中'}</span>${p.start?`<span class="num">開始 ${fmtMD(p.start)}</span>`:''}</div></div></div>
  ${p.goal?`<div><div class="lbl">研究目標 / 假說</div><p class="prose">${esc(p.goal)}</p></div>`:''}
  ${p.cellLines||p.readouts?`<dl class="kv">${p.cellLines?`<dt>細胞株</dt><dd>${esc(p.cellLines)}</dd>`:''}${p.readouts?`<dt>觀察指標</dt><dd>${esc(p.readouts)}</dd>`:''}</dl>`:''}${p.note?`<div><div class="lbl">備註</div><p class="prose">${esc(p.note)}</p></div>`:''}
  <div class="proj-stats"><span><b>${rs.length}</b>筆紀錄</span><span><b>${cnt('done')}</b>完成</span><span><b>${cnt('plan')+cnt('doing')}</b>計畫 / 進行中</span>${cnt('redo')?`<span><b>${cnt('redo')}</b>需重做</span>`:''}</div>
  <div class="toolbar"><button class="btn btn-sm btn-accent" data-act="newRec" data-proj="${p.id}">${I('plus')}新紀錄</button><button class="btn btn-sm btn-line" data-act="editProj" data-id="${p.id}">${I('edit')}編輯專案</button></div></section>
  <section class="block"><div class="sec-head"><h2 class="h2">實驗流程</h2></div>${rs.length?`<div class="ptl">${rs.map(r=>`<div class="ptl-item"><span class="node"></span>${recRow(r)}</div>`).join('')}</div>`:emptyBox('flask','這個專案還沒有紀錄','按「新紀錄」開始第一筆。','lab')}</section>`;
}

/* ================= 生活小天地 ================= */
function vAlbum(){
  const A=S.album,t=today();const q=QUESTIONS[dayIndex(t)%QUESTIONS.length];
  const ans=Object.values(D.moments).find(m=>m.kind==='answer'&&m.date===t);
  const ask=`<section class="ask"><span class="eyebrow">今日一問 · ${fmtDay(t)}</span><div class="ask-q">${esc(q)}</div>${ans?`<div class="ans">${esc(ans.text)}</div><div class="row"><span class="sp"></span><button class="btn btn-sm btn-line" data-act="momentOpen" data-id="${ans.id}">修改</button></div>`:`<form data-form="answer" style="display:flex;flex-direction:column;gap:8px"><label class="sr" for="ans">回答今日一問</label><textarea id="ans" data-model="ans" rows="2" placeholder="寫一兩句就好">${esc(S.ans)}</textarea><div class="row"><span class="sp"></span><button class="btn btn-sm btn-accent" type="submit">收進小天地</button></div></form>`}</section>`;
  const acts=`<div class="qa-acts"><button data-act="momentNew" data-kind="photo">${svgUse('camera2')}照片日記</button><button data-act="momentNew" data-kind="joy">${svgUse('heart2')}今日小確幸</button><button data-act="momentNew" data-kind="mood">${svgUse('flowers')}心情手帳</button></div>`;
  const segs=[['post','發表'],['photo','照片'],['joy','小確幸'],['mood','心情'],['past','時光回顧']];
  if(Friends.toMe&&Friends.toMe.length)segs.splice(1,0,['friends','朋友的發表']);
  if(A.seg==='friends'&&!(Friends.toMe&&Friends.toMe.length))A.seg='post';
  const seg=`<div class="seg-scroll"><div class="seg">${segs.map(([k,l])=>`<button class="${A.seg===k?'on':''}" data-act="albumSeg" data-seg="${k}" aria-pressed="${A.seg===k}">${l}</button>`).join('')}</div></div>`;
  let body='';const all=Object.values(D.moments);
  const byDate=(a,b)=>(a.date===b.date?(b.createdAt||0)-(a.createdAt||0):(a.date<b.date?1:-1));
  if(!S.ready)body=`<p class="loading-line">正在翻開相簿…</p>`;
  else if(A.seg==='post')body=postFeed();
  else if(A.seg==='friends')body=friendFeed();
  else if(A.seg==='photo'){
    const ms=all.filter(m=>m.kind==='photo'||(m.photos&&m.photos.length)).sort(byDate);
    body=ms.length?`<div class="pols">${ms.map(m=>{const ph=(m.photos||[])[0];const lines=String(m.text||'').split('\n');
      return `<button class="pol" data-act="momentOpen" data-id="${m.id}"><span class="pol-h"><span class="plate sm round c-friends">${svgUse(hash(m.id)%2?'cat-white':'cat-grey')}</span><span style="min-width:0"><b>${esc(trim(lines[0]||'照片日記',22))}</b></span><small>${esc(m.date.replace(/-/g,'/'))}</small></span>${ph?`<span class="ph"><img src="${esc(imgSrc(ph))}" alt="" loading="lazy"></span>`:''}${(ph?m.text:lines.slice(1).join('\n'))?`<span class="cap">${esc(ph?m.text:lines.slice(1).join('\n'))}</span>`:''}<span class="ft">${m.mood?`<span>${esc(moodName(m.mood))}</span>`:''}${m.photos&&m.photos.length>1?`<span>${I('image')} ${m.photos.length} 張</span>`:''}</span></button>`;}).join('')}</div>`:emptyBox('camera2','還沒有照片日記','按上面的「照片日記」，放一張今天的照片，配一句話就好。','friends');
  }else if(A.seg==='joy'){
    const ms=all.filter(m=>m.kind==='joy').sort(byDate);
    body=ms.length?`<div class="slips">${ms.map(m=>`<button class="slip joy" data-act="momentOpen" data-id="${m.id}"><span class="hd"><span>今日小確幸</span><span>${esc(m.date.replace(/-/g,'/'))}</span></span><span class="tx">${esc(m.text)}</span></button>`).join('')}</div>`:emptyBox('heart2','還沒有小確幸','今天最喜歡的一件事是什麼？按「今日小確幸」寫下來。','rest');
  }else if(A.seg==='mood'){
    const mm=all.filter(m=>m.date&&m.date.startsWith(A.month)&&(m.kind==='mood'||m.kind==='review'||m.kind==='answer')).sort(byDate);
    body=moodCal(A.month)+(mm.length?`<div class="slips">${mm.map(momentMini).join('')}</div>`:`<p class="muted small">這個月還沒有心情手帳。按上面的「心情手帳」選個心情天氣吧。</p>`);
  }else body=pastBlock();
  if(A.seg==='post'||A.seg==='friends')return `<section class="block">${seg}${body}</section><p class="legal">發表預設只有你自己看得到；選「分享名單」的那幾篇，名單上的人登入後才看得到，而且只能看。</p>`;
  return ask+acts+`<section class="block">${seg}${body}</section><p class="legal">生活小天地預設只有你自己看得到。</p>`;
}
function postPhotos(ph){
  if(!ph.length)return '';const n=ph.length;const show=ph.slice(0,n>4?4:n);
  return `<span class="pgrid n${Math.min(n,4)}">${show.map((im,i)=>`<span class="pg"><img src="${esc(imgSrc(im))}" alt="" loading="lazy">${i===3&&n>4?`<b>+${n-4}</b>`:''}</span>`).join('')}</span>`;
}
function postCard(p,friend){
  const lines=String(p.body||'').trim();const title=p.title||'';
  return `<button class="post" data-act="${friend?'friendPostOpen':'postOpen'}" data-id="${esc(p.id)}"${friend?` data-o="${esc(p.owner)}"`:''}>
    <span class="post-h"><span class="plate sm round c-${friend?'friends':'rest'}">${svgUse(friend?'cat-grey':'pencil')}</span><span style="min-width:0"><b>${esc(trim(title||lines.split('\n')[0]||'照片',26))}</b><small>${friend?esc(p.author||'朋友')+' · ':''}${esc((p.date||'').replace(/-/g,'/'))}${(p.tags||[]).length?' · '+esc(p.tags.join('、')):''}</small></span>${friend?'':`<span class="vis ${p.vis==='friends'?'on':''}">${p.vis==='friends'?'分享':'只有我'}</span>`}</span>
    ${postPhotos(p.photos||[])}
    ${(title?lines:lines.split('\n').slice(1).join('\n'))?`<span class="post-tx">${esc(title?lines:lines.split('\n').slice(1).join('\n'))}</span>`:''}
  </button>`;
}
const postSort=(a,b)=>(a.date===b.date?(b.createdAt||0)-(a.createdAt||0):((a.date||'')<(b.date||'')?1:-1));
function postFeed(){
  const all=Object.values(D.posts).sort(postSort);const tag=S.album.tag;
  const tags=[...new Set(POST_TAGS.concat(...all.map(p=>p.tags||[])))];
  const list=tag?all.filter(p=>(p.tags||[]).includes(tag)):all;
  const chips=`<div class="chips post-filter">${[['','全部']].concat(tags.map(t=>[t,t])).map(([v,l])=>`<button class="chip ${tag===v?'on':''}" data-act="postFilter" data-t="${esc(v)}" aria-pressed="${tag===v}">${esc(l)}</button>`).join('')}</div>`;
  const write=`<button class="btn btn-accent btn-block" data-act="postNew">${I('edit')}寫一篇發表</button>`;
  return write+chips+(list.length?`<div class="posts">${list.map(p=>postCard(p,false)).join('')}</div>`:emptyBox('pencil',tag?'這個分類還沒有發表':'還沒有發表','日常、奶蓋的照片、生活日誌，都可以寫成一篇收在這裡。','rest'));
}
function friendFeed(){
  const ps=(Friends.posts||[]).slice().sort(postSort);
  const head=`<div class="toolbar"><span class="small muted">朋友分享給你的發表（只能看）</span><span class="sp" style="flex:1"></span><button class="btn btn-sm btn-line" data-act="friendsReload">${I('repeat')}重新整理</button></div>`;
  if(Friends.loading&&!Friends.posts)return head+`<p class="loading-line">正在載入朋友的發表…</p>`;
  return head+(ps.length?`<div class="posts">${ps.map(p=>postCard(p,true)).join('')}</div>`:emptyBox('cat-grey','還沒有分享給你的發表','朋友選了「分享名單」的發表，會出現在這裡。','friends'));
}
function momentMini(m){
  const ph=(m.photos||[]).slice(0,3);const label={photo:'照片日記',joy:'小確幸',mood:'心情手帳',answer:'今日一問',review:'每日回顧'}[m.kind]||'回憶';
  return `<button class="slip" data-act="momentOpen" data-id="${m.id}"><span class="hd"><span>${label}${m.mood?' · '+moodName(m.mood):''}</span><span>${esc(m.date.replace(/-/g,'/'))}</span></span>${m.question?`<span class="small muted">${esc(m.question)}</span>`:''}${m.text?`<span class="tx">${esc(m.text)}</span>`:''}${ph.length?`<span class="thumbs">${ph.map(p=>`<span class="thumb"><img src="${esc(imgSrc(p))}" alt="" loading="lazy"></span>`).join('')}</span>`:''}</button>`;
}
function moodCal(month){
  const [y,mo]=month.split('-').map(Number);const first=new Date(y,mo-1,1);const days=new Date(y,mo,0).getDate();const lead=first.getDay();const t=today();
  const byDay={};Object.values(D.moments).forEach(m=>{if(m.mood&&m.date&&m.date.startsWith(month)){const c=byDay[m.date];if(!c||(m.createdAt||0)>(c.createdAt||0))byDay[m.date]=m;}});
  let h=['日','一','二','三','四','五','六'].map(w=>`<span class="hd">${w}</span>`).join('');for(let i=0;i<lead;i++)h+='<span class="mday out"></span>';
  for(let d=1;d<=days;d++){const key=month+'-'+pad(d);const m=byDay[key];h+=`<button class="mday ${key===t?'is-today':''}" data-act="openDay" data-day="${key}" aria-label="${mo} 月 ${d} 日${m?'，'+moodName(m.mood):''}"><span>${d}</span>${m?svgUse('w'+m.mood):''}</button>`;}
  return `<div class="mcal-head"><button class="icon-btn" data-act="monthShift" data-n="-1" aria-label="上個月">${I('left')}</button><h3 class="h3">${y} 年 ${mo} 月</h3><button class="icon-btn" data-act="monthShift" data-n="1" aria-label="下個月">${I('right')}</button></div><div class="mcal">${h}</div>`;
}
function pastBlock(){
  const t=today();const ly=addMonths(t,-12),lm=addMonths(t,-1);
  const dayCard=(d,label,icon)=>{const ms=Object.values(D.moments).filter(m=>m.date===d);const dn=doneOn(d);const rs=Object.values(D.records).filter(r=>r.date===d);
    const sub=(!ms.length&&!dn.length&&!rs.length)?fmtDay(d)+' 還沒有留下紀錄':fmtDay(d)+'：'+[ms.length?ms.length+' 則回憶':'',dn.length?'完成 '+dn.length+' 件事':'',rs.length?rs.length+' 筆實驗':''].filter(Boolean).join('、');
    return linkcard(icon,'friends',label,esc(sub),`data-act="openDay" data-day="${d}"`);};
  return `<div class="linkcards">${dayCard(ly,'去年的今天','scenery')}${dayCard(lm,'上個月的今天','boat')}</div>`+memCard(S.album.month);
}
function memCard(month){
  const [y,mo]=month.split('-').map(Number);const ms=Object.values(D.moments).filter(m=>m.date&&m.date.startsWith(month));
  const photos=ms.flatMap(m=>m.photos||[]).slice(0,4);
  let done=0;const catCount={};const days=new Date(y,mo,0).getDate();const t=today();
  for(let d=1;d<=days;d++){const k=month+'-'+pad(d);if(k>t)break;doneOn(k).forEach(it=>{done++;catCount[it.cat]=(catCount[it.cat]||0)+1;});}
  const recs=Object.values(D.records).filter(r=>r.date&&r.date.startsWith(month)).length;
  const moods=ms.filter(m=>m.mood);const avg=moods.length?Math.round(moods.reduce((s,m)=>s+m.mood,0)/moods.length):0;
  const top=Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0];const joys=ms.filter(m=>m.kind==='joy').slice(0,2);
  return `<div class="block"><div class="mcal-head"><button class="icon-btn" data-act="monthShift" data-n="-1" aria-label="上個月">${I('left')}</button><h3 class="h3">月回憶卡</h3><button class="icon-btn" data-act="monthShift" data-n="1" aria-label="下個月">${I('right')}</button></div>
  <article class="memcard"><span class="stampc">${F(top?catFood(top[0]):'melon')}</span><h4>${y} 年 ${mo} 月的回憶</h4>${photos.length?`<div class="collage">${photos.map(p=>`<img src="${esc(imgSrc(p))}" alt="" loading="lazy">`).join('')}</div>`:''}
  <div class="memstats"><div><b>${done}</b><span>完成的事</span></div><div><b>${recs}</b><span>實驗紀錄</span></div><div><b>${ms.length}</b><span>留下的回憶</span></div></div>
  ${avg?`<p class="hand" style="font-size:16px">這個月的心情大多是「${moodName(avg)}」。</p>`:''}${top?`<p class="hand" style="font-size:16px">最常做的是${CATS[top[0]].name}，一共 ${top[1]} 件。</p>`:''}${joys.map(j=>`<p class="hand" style="font-size:16px">小確幸：${esc(trim(j.text,40))}</p>`).join('')}${!done&&!recs&&!ms.length?'<p class="hand" style="font-size:16px">這個月還是一張白紙。</p>':''}</article></div>`;
}

/* ================= 我的 ================= */
function postSub(){const ps=Object.values(D.posts).sort(postSort);if(!ps.length)return '日常、奶蓋和生活日誌';const p=ps[0];return esc(trim(p.title||String(p.body||'').split('\n')[0]||'照片',14))+' · '+esc(fmtDay(p.date));}
function shareBlock(){
  const list=Friends.mine;
  return `<section class="block" id="share"><div class="sec-head">${svgUse('heart2','hic')}<h2 class="h2">分享名單</h2><span class="eyebrow">${list?list.length+' 人':''}</span></div><div class="sec">
    <p class="small">名單上的人用自己的 email 登入小日和後，只看得到你選「分享名單」的發表，不能改；你的行程、筆記、實驗紀錄和其他發表都看不到。</p>
    ${list===null?'<p class="loading-line">載入中…</p>':list.length?`<div class="sync-list">${list.map(r=>`<div><span>${esc(r.viewer_email)}</span><button class="link-btn" data-act="shareRemove" data-e="${esc(r.viewer_email)}">移除</button></div>`).join('')}</div>`:'<p class="small muted">目前沒有分享給任何人。</p>'}
    <form class="toolbar" data-form="share" novalidate style="flex-wrap:nowrap"><input class="in" type="email" inputmode="email" autocapitalize="off" placeholder="朋友的 email" aria-label="朋友的 email" style="flex:1;min-width:0"><button class="btn btn-sm btn-accent" type="submit">加入</button></form>
    <p class="legal">加進名單的人也能用這個 email 註冊小日和。</p></div></section>`;
}
function pushBlock(ph){
  Push.env();const n=ph.pending.length+ph.synced.length;
  let body;
  if(Push.ios&&!Push.standalone){
    body=`<p class="small">iPhone 要先把小日和放到主畫面，才收得到通知（網頁關掉也會準時響）。</p>
    <ol class="steps-ol"><li>用 Safari 打開這個網址</li><li>點下方的「分享」按鈕 ${I('upload')}</li><li>往下滑，選「加入主畫面」，再按「加入」</li><li>從主畫面的小日和圖示打開，回到這裡按「打開通知」</li></ol>`;
  }else if(!Push.supported){
    body=`<p class="small">這個瀏覽器收不到推播通知。iPhone 請用 Safari 把小日和加到主畫面；電腦可以用 Chrome、Edge 或 Safari。</p>`;
  }else if(!Push.on){
    body=`<p class="small">打開以後，設了提醒的行程和倒數日，時間到會直接通知這台裝置，網頁關掉也一樣。${n?`現在有 <b>${n}</b> 筆在等著提醒你。`:''}</p>
    <button class="btn btn-accent btn-block" data-act="pushOn" ${Push.busy?'disabled':''}>${I('bell')}打開通知</button>
    ${typeof Notification!=='undefined'&&Notification.permission==='denied'?'<p class="legal">之前按過「不允許」。請到 iPhone「設定 → 通知 → 小日和」打開，再回來按一次。</p>':'<p class="legal">按下去會跳出「允許通知」，選允許就好。每台想收通知的裝置都要各按一次。</p>'}`;
  }else{
    body=`<div class="sync-stat"><span class="ok"><b>${n}</b>筆會準時通知</span><span>這台裝置已開啟</span></div>
    <p class="small">提醒時間一到就會通知，網頁關掉也一樣。改了時間或提醒，通知會自動跟著改。</p>
    <div class="toolbar" style="flex-wrap:wrap"><button class="btn btn-sm btn-line" data-act="pushTest">${I('bell')}送一則測試通知</button><button class="btn btn-sm btn-line" data-act="pushOff">關掉這台的通知</button></div>`;
  }
  return `<section class="block" id="phone"><div class="sec-head">${svgUse('bell','hic')}<h2 class="h2">手機提醒</h2><span class="eyebrow">${Push.on?'已開啟':'Push'}</span></div><div class="sec">${body}</div></section>`;
}
function vAuth(){
  const m=S.authMode||'in';const busy=!!S.authBusy;
  const title={in:'登入小日和',up:'建立帳號',forgot:'忘記密碼'}[m];
  return `<section class="hero"><div class="hero-img" role="img" aria-label="Hiyori 招牌、窗邊的蛋糕與咖啡、睡在椅子上的小貓"></div></section>
  <div class="greet"><p class="hello">歡迎回來，今天也要開心喔！</p><span class="hero-date">${m==='up'?'第一次使用，先建立一個帳號':'登入後，手機和電腦會是同一份資料'}</span></div>
  <form class="paper auth-card form" data-form="auth" novalidate>
    <h2 class="h2">${title}</h2>
    ${S.authMsg?`<p class="auth-msg ok">${esc(S.authMsg)}</p>`:''}${S.authErr?`<p class="auth-msg bad">${esc(S.authErr)}</p>`:''}
    <div class="field"><label class="lbl" for="au-email">Email</label><input type="email" id="au-email" data-model="authEmail" value="${esc(S.authEmail||'')}" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com"></div>
    ${m!=='forgot'?`<div class="field"><label class="lbl" for="au-pw">密碼</label><input type="password" id="au-pw" data-model="authPw" value="${esc(S.authPw||'')}" autocomplete="${m==='up'?'new-password':'current-password'}" placeholder="${m==='up'?'至少 6 個字':''}"></div>`:''}
    <button class="btn btn-accent btn-block" type="submit" ${busy||!sb?'disabled':''}>${busy?'請稍等…':m==='in'?'登入':m==='up'?'建立帳號':'寄重設密碼的信'}</button>
    <div class="auth-links">${m==='in'?`<button type="button" class="link-btn" data-act="authMode" data-m="up">第一次使用？建立帳號</button><button type="button" class="link-btn" data-act="authMode" data-m="forgot">忘記密碼</button>`:`<button type="button" class="link-btn" data-act="authMode" data-m="in">已經有帳號了，登入</button>`}</div>
  </form>
  <div class="quote">${svgUse('leaf','qleaf')}<span>每一個小小的計劃，<br>都是更喜歡自己的開始。</span>${svgUse('cat-sleep','qcat')}</div>`;
}
function vShop(){
  const s=SET();const total=completedTotal();const stamped=stampedDays();const streak=calcStreak(stamped);
  const filled=stamped.length?(stamped.length%10||10):0;const cardNo=Math.max(1,Math.ceil(stamped.length/10));const lastDates=stamped.slice(stamped.length-filled);
  const slots=[...Array(10)].map((_,i)=>i<filled?`<span class="slot on" style="--rot:${(hash(lastDates[i])%30)-15}deg" title="${fmtDay(lastDates[i])}">日和</span>`:`<span class="slot">${i+1}</span>`).join('');
  const unlockedN=FOODS.filter(f=>f.need<=total).length;const ph=phoneLists();
  return `<section class="shop-sign">${svgUse('cat-grey','cat')}<div><span class="t">${s.name?esc(s.name)+' 的小店':'我的小店'}</span><small>完成 ${total} 件事 · 印章 ${stamped.length} 格${streak>1?' · 連續 '+streak+' 天':''}</small></div></section>
${pushBlock(ph)}
  ${shareBlock()}
  <section class="block"><div class="sec-head">${svgUse('star','hic')}<h2 class="h2">集點卡</h2><span class="eyebrow">Stamp card</span></div><div class="stampcard"><div class="top"><b>第 ${cardNo} 張</b><small>一天的事全部完成，就蓋一格</small></div><div class="slots">${slots}</div><div class="top"><small>累計 ${stamped.length} 格</small><small>一共完成 ${total} 件事</small></div></div></section>
  <section class="block"><div class="sec-head">${svgUse('book','hic')}<h2 class="h2">食物圖鑑</h2><span class="eyebrow">${unlockedN} / ${FOODS.length}</span></div><div class="zukan">${FOODS.map(f=>{const ok=f.need<=total;return `<div class="stk ${ok?'':'locked'}"><span class="plate c-${['study','lab','chores','friends','rest','habit'][FOODS.indexOf(f)%6]}">${F(f.id)}</span><b>${ok?f.name:'？？？'}</b><small>${ok?esc(f.desc):'完成 '+f.need+' 件解鎖'}</small></div>`;}).join('')}</div></section>
  <section class="block" id="cats"><div class="sec-head">${svgUse('ticket','hic')}<h2 class="h2">分類</h2><span class="eyebrow">${CAT_ORDER.length} 種</span></div><div class="paper" style="padding:4px 14px">${CAT_ORDER.map((c,i)=>`<div class="catrow" style="grid-template-columns:36px minmax(0,1fr) auto"><span class="plate sm c-${c}">${F(catFood(c))}</span><span style="min-width:0"><b style="display:block">${esc(CATS[c].name)}</b>${CATS[c].kw?`<small class="muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">自動分類：${esc(CATS[c].kw)}</small>`:''}</span><span style="display:flex;gap:6px">${i?`<button class="btn btn-sm btn-line" data-act="catUp" data-c="${c}" aria-label="把${esc(CATS[c].name)}往上移">↑</button>`:''}<button class="btn btn-sm btn-line" data-act="catEdit" data-c="${c}">編輯</button></span></div>`).join('')}<div style="padding:10px 0"><button class="btn btn-sm btn-accent" data-act="catNew">${I('plus')}新增分類</button></div></div>
  <p class="legal">「自動分類」的字出現在一句話新增的句子裡，就會自動分到那一類。</p></section>
  <section class="block"><div class="sec-head">${svgUse('plant','hic')}<h2 class="h2">習慣統計</h2></div>
  ${sec('近七天',chart7(),'<span class="small muted">綠色是完成的件數</span>')}
  ${sec('近 30 天完成的事',catBars())}
  ${habitBlock()}
  ${sec('實驗紀錄',recChart(),'<span class="small muted">近六個月</span>')}</section>
  <section class="block"><div class="sec-head">${svgUse('sliders','hic')}<h2 class="h2">外觀</h2></div><div class="sec"><div class="lbl">主色</div><div class="swatches">${PALETTES.map(([k,l,c])=>`<button class="swatch ${(s.palette===k||(k==='sage'&&!['peach','sky','latte'].includes(s.palette)))?'on':''}" data-act="palette" data-p="${k}"><i style="--sw:${c}"></i>${l}</button>`).join('')}</div><div class="lbl">白天 / 夜晚</div><div><div class="seg">${[['system','跟隨系統'],['light','白天'],['dark','夜晚']].map(([k,l])=>`<button class="${s.theme===k?'on':''}" data-act="themeSet" data-t="${k}" aria-pressed="${s.theme===k}">${l}</button>`).join('')}</div></div></div></section>
  <section class="block"><div class="sec-head">${svgUse('moon','hic')}<h2 class="h2">頁面提醒</h2></div><div class="sec">
    <div class="set-row"><div><div class="t">頁面開著時也在畫面上提醒</div><div class="d">小日和開著的時候，時間到會在畫面上方跳出來。</div></div><button class="switch ${s.remindOn?'on':''}" data-act="toggleSet" data-k="remindOn" role="switch" aria-checked="${s.remindOn}" aria-label="頁面提醒"></button></div>
    <div class="set-row"><div><div class="t">提醒與計時音效</div><div class="d">打開頁面後點一下畫面才會響。</div></div><button class="switch ${s.sound?'on':''}" data-act="toggleSet" data-k="sound" role="switch" aria-checked="${s.sound}" aria-label="音效"></button></div></div></section>
  <section class="block"><div class="sec-head">${svgUse('gear','hic')}<h2 class="h2">資料</h2></div><div class="sec">
    <div class="set-row"><div><div class="t">儲存位置</div><div class="d">${Store.mode==='cloud'?'雲端。用同一個帳號登入，手機、平板、電腦都是同一份，改了會自動同步。':Store.mode==='offline'||Store.mode==='error'?'暫時連不上雲端，先用這台裝置上次的資料；連上網路後會自動上傳。':'連線中…'}</div></div></div>
    <div class="toolbar" style="flex-wrap:wrap"><button class="btn btn-sm btn-line" data-act="exportJson">${I('download')}匯出備份 .json</button><label class="btn btn-sm btn-line">${I('upload')}匯入備份<input type="file" accept="application/json,.json" data-import="1" hidden></label><button class="btn btn-sm btn-line" data-act="exportMdAll">${I('download')}全部實驗紀錄 .md</button></div>
    <p class="legal">備份檔包含所有文字資料；照片留在雲端，不放進備份檔。</p></div></section>
  <section class="block"><div class="sec-head">${svgUse('cat-white','hic')}<h2 class="h2">招呼</h2></div><div class="sec form"><div class="field"><label class="lbl" for="set-name">首頁要怎麼稱呼你</label><input type="text" id="set-name" data-setting="name" value="${esc(s.name||'')}" placeholder="留空就只說早安、晚安"></div></div></section>
  <section class="block"><div class="sec-head">${svgUse('nav-cat','hic')}<h2 class="h2">帳號</h2></div><div class="sec">
    <div class="set-row"><div><div class="t">登入中</div><div class="d">${esc(Store.email||'')}</div></div></div>
    <div class="toolbar" style="flex-wrap:wrap"><button class="btn btn-sm btn-line" data-act="pwChange">${I('edit')}改密碼</button><button class="btn btn-sm btn-line" data-act="logout">${I('left')}登出這台裝置</button></div></div></section>`;
}
function chart7(){
  const t=today();const data=[...Array(7)].map((_,i)=>{const d=addDays(t,i-6);const its=itemsOn(d);return {d,n:its.length,k:its.filter(x=>isDone(x,d)).length};});
  const max=Math.max(1,...data.map(x=>x.n));const W=320,H=150,bw=26,gap=(W-40-7*bw)/6,base=120;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="近七天：${data.map(x=>WD[dow(x.d)]+' '+x.k+'/'+x.n).join('，')}"><line x1="16" y1="${base}" x2="${W-12}" y2="${base}" style="stroke:var(--line-2)"/>`;
  data.forEach((x,i)=>{const X=20+i*(bw+gap);const hN=x.n/max*92,hK=x.k/max*92;
    s+=`${x.n?`<rect x="${X}" y="${base-hN}" width="${bw}" height="${hN}" rx="7" style="fill:var(--bg-2)"/>`:''}${x.k?`<rect x="${X}" y="${base-hK}" width="${bw}" height="${hK}" rx="7" style="fill:var(--sage-btn)"/>`:''}<text x="${X+bw/2}" y="${base-hN-6}" text-anchor="middle" font-size="11" style="fill:var(--ink-2)">${x.n?x.k+'/'+x.n:''}</text><text x="${X+bw/2}" y="${base+17}" text-anchor="middle" font-size="12" style="fill:${x.d===t?'var(--sage-ink)':'var(--ink-3)'};font-weight:${x.d===t?700:400}">${WD[dow(x.d)]}</text>`;});
  return s+'</svg>';
}
function catBars(){
  const t=today();const cnt={};for(let i=0;i<30;i++){doneOn(addDays(t,-i)).forEach(it=>{cnt[it.cat]=(cnt[it.cat]||0)+1;});}
  const max=Math.max(1,...Object.values(cnt));
  return `<div>${CAT_ORDER.map(c=>`<div class="catrow" style="grid-template-columns:36px 46px minmax(0,1fr) 34px"><span class="plate sm c-${c}">${F(catFood(c))}</span><span class="small">${CATS[c].short}</span><span class="meter"><i style="width:${((cnt[c]||0)/max*100).toFixed(1)}%"></i></span><b class="num" style="text-align:right">${cnt[c]||0}</b></div>`).join('')}</div>`;
}
function habitBlock(){
  const hs=Object.values(D.items).filter(i=>i.rep&&i.cat==='habit'&&!i.dropped);if(!hs.length)return '';
  const t=today();const days=[...Array(14)].map((_,i)=>addDays(t,i-13));
  return sec('固定習慣打卡',hs.map(h=>{const occ=days.filter(d=>occursOn(h,d));const ok=occ.filter(d=>isDone(h,d)).length;
    return `<div class="habit-row"><div style="display:flex;justify-content:space-between;gap:8px"><b class="small">${esc(h.title)}</b><span class="small muted num">${ok}/${occ.length}</span></div><div class="habit-dots" aria-label="近兩週完成 ${ok} 次">${days.map(d=>`<i class="${occursOn(h,d)?(isDone(h,d)?'on':''):'off'}" title="${fmtDay(d)}"></i>`).join('')}</div></div>`;}).join(''),'<span class="small muted">近兩週</span>');
}
function recChart(){
  const t=today();const months=[...Array(6)].map((_,i)=>addMonths(t.slice(0,7)+'-01',i-5).slice(0,7));
  const cnt=months.map(m=>Object.values(D.records).filter(r=>r.date&&r.date.startsWith(m)).length);const max=Math.max(1,...cnt);
  const W=320,H=130,bw=30,gap=(W-40-6*bw)/5,base=100;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="近六個月實驗紀錄：${months.map((m,i)=>(+m.slice(5))+'月 '+cnt[i]+' 筆').join('，')}"><line x1="16" y1="${base}" x2="${W-12}" y2="${base}" style="stroke:var(--line-2)"/>`;
  months.forEach((m,i)=>{const X=20+i*(bw+gap);const h=cnt[i]/max*72;s+=`${cnt[i]?`<rect x="${X}" y="${base-h}" width="${bw}" height="${h}" rx="7" style="fill:var(--peach)"/>`:''}<text x="${X+bw/2}" y="${base-h-6}" text-anchor="middle" font-size="11" style="fill:var(--ink-2)">${cnt[i]||''}</text><text x="${X+bw/2}" y="${base+17}" text-anchor="middle" font-size="11.5" style="fill:var(--ink-3)">${+m.slice(5)}月</text>`;});
  return s+'</svg>';
}

/* ================= sheet infrastructure ================= */
const SH={stack:[],
  open(s){this.stack.push(s);paintSheet(false);},
  close(){this.stack.pop();paintSheet(false);},
  top(){return this.stack[this.stack.length-1];},
  repaint(){paintSheet(true);},
  clear(){this.stack=[];paintSheet(false);}};
function paintSheet(keep){
  const host=$('#sheets');const s=SH.top();
  if(!s){host.innerHTML='';document.body.classList.remove('lock');return;}
  document.body.classList.add('lock');
  const ob=host.querySelector('.sheet-body');const st=keep&&ob?ob.scrollTop:0;
  const ae=document.activeElement;const keepId=keep&&ae&&host.contains(ae)&&ae.id?ae.id:null;let selS=null,selE=null;
  if(keepId){try{selS=ae.selectionStart;selE=ae.selectionEnd;}catch(e){}}
  let body;try{body=s.body();}catch(err){console.error(err);body=`<p class="muted">這個畫面出了點問題：${esc(err&&err.message||err)}</p>`;}
  host.innerHTML=`<div class="sheet-wrap"><div class="sheet-back" data-act="sheetClose"></div><div class="sheet ${s.full?'full':''}" role="dialog" aria-modal="true" aria-label="${esc(s.title)}"><div class="sheet-head">${SH.stack.length>1?`<button class="icon-btn" data-act="sheetClose" aria-label="返回">${I('left')}</button>`:''}<h3>${esc(s.title)}</h3><button class="icon-btn" data-act="sheetCloseAll" aria-label="關閉">${I('close')}</button></div>${s.jump?s.jump():''}<div class="sheet-body">${body}</div>${s.foot?`<div class="sheet-foot">${s.foot()}</div>`:''}</div></div>`;
  const nb=host.querySelector('.sheet-body');if(nb)nb.scrollTop=st;
  if(keepId){const el=document.getElementById(keepId);if(el){el.focus({preventScroll:true});try{if(selS!=null)el.setSelectionRange(selS,selE);}catch(e){}}}
  else if(!keep){const f=host.querySelector('[autofocus]');if(f&&!('ontouchstart' in window))f.focus({preventScroll:true});}
}
function setPath(o,path,val){const ks=path.split('.');let x=o;for(let i=0;i<ks.length-1;i++){const k=ks[i];if(x[k]==null)x[k]=/^\d+$/.test(ks[i+1])?[]:{};x=x[k];}x[ks[ks.length-1]]=val;}
function getPath(o,path){return path.split('.').reduce((x,k)=>x==null?x:x[k],o);}
function onBind(el){
  const s=SH.top();if(!s||!s.draft)return;let v;
  if(el.type==='checkbox')v=el.checked;
  else if(el.dataset.json!=null){try{v=JSON.parse(el.value);}catch(e){v=null;}}
  else if(el.dataset.num!=null)v=el.value===''?0:+el.value;
  else v=el.value;
  if(el.dataset.null!=null&&v==='')v=null;
  setPath(s.draft,el.dataset.bind,v);s.dirty=true;
  if(el.dataset.rp)SH.repaint();
}
function focusLater(sel){setTimeout(()=>{const el=$(sel);if(el){el.focus();try{el.scrollIntoView({block:'center'});}catch(e){}}},40);}

/* ================= item editor ================= */
function durOpts(v){const list=DURS.slice();if(v&&!list.includes(v))list.push(v);list.sort((a,b)=>a-b);return list.map(m=>`<option value="${m}" ${m===v?'selected':''}>${fmtDur(m)}</option>`).join('');}
function sheetItem(draft,opts){
  opts=opts||{};draft.subtasks=draft.subtasks||[];
  const isNew=!D.items[draft.id]||opts.preview;
  SH.open({title:opts.title||(isNew?(draft.kind==='event'?'新增行程':'新增待辦'):(draft.kind==='event'?'行程':'待辦')),draft,full:true,opts,isNew,
    body(){
      const x=this.draft,d0=this.opts.day||x.date||today();
      const days=x.rep&&x.rep.type==='weekly'?(x.rep.days&&x.rep.days.length?x.rep.days:[dow(x.date||today())]):[];
      const recs=Object.values(D.records).map(r=>newRecord(clone(r))).sort(recSort).slice(0,40);
      return `<div class="form">
      ${!this.isNew?itemQuickActs(x,d0):''}
      <div><div class="seg"><button type="button" class="${x.kind==='event'?'on':''}" data-act="itemKind" data-k="event" aria-pressed="${x.kind==='event'}">行程</button><button type="button" class="${x.kind==='todo'?'on':''}" data-act="itemKind" data-k="todo" aria-pressed="${x.kind==='todo'}">待辦</button></div></div>
      <div class="field"><label class="lbl" for="it-title">名稱</label><input type="text" id="it-title" data-bind="title" value="${esc(x.title)}" ${this.isNew&&!x.title?'autofocus':''} placeholder="${x.kind==='event'?'例如：跟老師討論研究所方向':'例如：確認抗體庫存'}"></div>
      <div class="field"><span class="lbl">分類</span><div class="catpick">${CAT_ORDER.map(c=>`<button type="button" class="${x.cat===c?'on':''}" data-act="itemCat" data-c="${c}" aria-pressed="${x.cat===c}"><span class="plate sm c-${c}">${F(catFood(c))}</span>${CATS[c].name}</button>`).join('')}</div></div>
      <div class="g2"><div class="field"><label class="lbl" for="it-date">${x.rep?'從哪天開始':'日期'}</label><input type="date" id="it-date" data-bind="date" data-null value="${esc(x.date||'')}"></div>
      <div class="field"><label class="lbl" for="it-start">時間${x.kind==='todo'?'（可空白）':''}</label><input type="time" id="it-start" data-bind="start" data-null data-rp="1" value="${esc(x.start||'')}"></div></div>
      ${x.start?`<div class="field"><label class="lbl" for="it-dur">預計多久</label><select id="it-dur" data-bind="dur" data-num>${durOpts(x.dur||60)}</select></div>`:''}
      ${x.kind==='todo'&&!x.rep&&!x.date?`<p class="hint">沒有日期的待辦，會先放在今日頁的「還沒排日期」。</p>`:''}
      <div class="g2"><div class="field"><label class="lbl" for="it-rep">重複</label><select id="it-rep" data-change="itemRep"><option value="" ${!x.rep?'selected':''}>不重複</option><option value="daily" ${x.rep&&x.rep.type==='daily'?'selected':''}>每天</option><option value="weekly" ${x.rep&&x.rep.type==='weekly'?'selected':''}>每週</option></select></div>
      <div class="field"><label class="lbl" for="it-rem">提醒</label><select id="it-rem" data-bind="remind" data-json>${REMIND_OPTS.map(([v,l])=>`<option value="${esc(JSON.stringify(v))}" ${x.remind===v?'selected':''}>${l}</option>`).join('')}</select></div></div>
      ${phoneLine(x)}
      ${x.rep&&x.rep.type==='weekly'?`<div class="field"><span class="lbl">每週哪幾天</span><div class="wd-chips">${[1,2,3,4,5,6,7].map(k=>`<button type="button" class="${days.includes(k)?'on':''}" data-act="itemWd" data-k="${k}" aria-pressed="${days.includes(k)}">${WD[k]}</button>`).join('')}</div></div>`:''}
      ${x.rep?`<div class="field"><label class="lbl" for="it-until">重複到哪一天（可空白）</label><input type="date" id="it-until" data-bind="until" data-null value="${esc(x.until||'')}"></div>`:''}
      <div class="field"><label class="lbl" for="it-loc">地點</label><input type="text" id="it-loc" data-bind="loc" value="${esc(x.loc||'')}"></div>
      <div class="field"><label class="lbl" for="it-note">備註</label><textarea id="it-note" data-bind="note">${esc(x.note||'')}</textarea></div>
      <div class="field"><span class="lbl">拆成小步驟</span>${x.subtasks.length?`<div class="steps">${x.subtasks.map((s,i)=>`<div class="step ${s.done?'done':''}" style="grid-template-columns:36px minmax(0,1fr) 36px"><button type="button" class="chk ${s.done?'on':''}" data-act="subToggle" data-i="${i}" aria-label="完成這個步驟" aria-pressed="${!!s.done}">${I('check')}</button><input class="in" type="text" id="sub-${i}" data-bind="subtasks.${i}.text" value="${esc(s.text)}" aria-label="步驟 ${i+1}"><button type="button" class="icon-btn" data-act="subDel" data-i="${i}" aria-label="刪除步驟">${I('close')}</button></div>`).join('')}</div>`:''}<button type="button" class="btn btn-sm btn-line" data-act="subAdd" style="align-self:flex-start">${I('plus')}加一個步驟</button><span class="hint">例如把「準備研究所推甄」拆成找資料、整理成績、寫自傳。</span></div>
      <label class="check-row"><input type="checkbox" id="it-dl" data-bind="deadline" ${x.deadline?'checked':''}>放進今日頁的「倒數」票卡</label>
      ${x.cat==='lab'?`<div class="field"><label class="lbl" for="it-rec">連結實驗紀錄</label><select id="it-rec" data-bind="recordId"><option value="">不連結</option><option value="__new" ${x.recordId==='__new'?'selected':''}>儲存時建立新的實驗紀錄（計畫中）</option>${recs.map(r=>`<option value="${r.id}" ${x.recordId===r.id?'selected':''}>${esc((r.date?fmtMD(r.date)+' ':'')+trim(r.title,24))}</option>`).join('')}</select></div>`:''}
      </div>`;
    },
    foot(){return `${!this.isNew?`<button class="btn btn-danger btn-sm" data-act="itemDelete">${I('trash')}刪除</button>`:''}<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="itemSave">${this.opts.preview?'更新':'儲存'}</button>`;}
  });
}
function phoneLine(x){
  if(!phoneRelevant(x))return `<p class="hint">設定提醒或放進倒數，時間到就會通知手機。</p>`;
  if(Push.on)return `<p class="hint"><span class="ph-sync ok">會通知手機</span> 時間到會準時通知，網頁關掉也一樣。</p>`;
  return `<p class="hint"><span class="ph-sync wait">通知未開</span> 到「我的 → 手機提醒」打開通知，網頁關掉也會準時提醒。</p>`;
}
function sheetNewPassword(){
  SH.open({title:'設定新密碼',draft:{pw:''},
    body(){return `<div class="form"><p class="hint">輸入新的密碼，之後就用它登入。</p><div class="field"><label class="lbl" for="np-pw">新密碼</label><input type="password" id="np-pw" data-bind="pw" autocomplete="new-password" placeholder="至少 6 個字" autofocus></div></div>`;},
    foot(){return `<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="pwSave">儲存</button>`;}});
}
function itemQuickActs(x,d){
  const it=D.items[x.id]||x;const done=isDone(it,d);
  return `<div class="toolbar"><button type="button" class="btn btn-sm ${done?'btn-line':'btn-ink'}" data-act="itemDoneToggle" data-day="${d}">${I('check')}${done?'取消完成':'完成'}${it.rep?'（'+fmtMD(d)+'）':''}</button>${it.rep?`<button type="button" class="btn btn-sm btn-line" data-act="itemSkip" data-day="${d}">這次跳過</button>`:''}${!it.rep&&it.date?`<button type="button" class="btn btn-sm btn-line" data-act="itemMove" data-n="1">移到隔天</button>`:''}${it.date||it.rep?`<a class="btn btn-sm btn-line" href="${esc(gcalUrl(it,d))}" target="_blank" rel="noopener">${I('cal-plus')}加入 Google 日曆</a>`:''}${it.recordId&&D.records[it.recordId]?`<button type="button" class="btn btn-sm btn-line" data-act="openRecFromItem" data-id="${it.recordId}">${I('lab')}實驗紀錄</button>`:''}</div>`;
}

/* ================= parse preview ================= */
function sheetPreview(items,opts){
  opts=opts||{};
  SH.open({title:'幫你整理成這樣',draft:{items,mkRec:{}},opts,
    body(){const its=this.draft.items;if(!its.length)return `<p class="muted">沒有可以新增的內容。</p>`;
      return `<div class="form">${this.opts.fromNote?`<p class="hint">來自筆記：${esc(trim(this.opts.fromNote,40))}</p>`:''}${its.map((x,i)=>pvCard(x,i,this.draft)).join('')}${its.some(x=>Object.keys(x.guessed||{}).length)?`<p class="hint">標「建議」的欄位是我推測的，可以按「修改」調整。</p>`:''}</div>`;},
    foot(){const n=this.draft.items.length;return `<button class="btn btn-line" data-act="sheetClose">取消</button><span class="sp"></span><button class="btn btn-accent" data-act="prevSave" ${n?'':'disabled'}>全部加入（${n}）</button>`;}
  });
}
function pvCard(x,i,dr){
  const g=x.guessed||{};const gb=k=>g[k]?'<span class="guess">建議</span>':'';
  return `<div class="pv"><div class="pv-top"><span class="plate sm c-${x.cat}">${F(catFood(x.cat))}</span><span class="pv-title">${esc(x.title)}</span><span class="chip">${x.kind==='event'?'行程':'待辦'}</span></div>
  <dl><dt>日期</dt><dd>${x.rep?esc(repLabel(x))+(x.date?'，從 '+fmtDay(x.date)+' 開始':''):x.date?fmtDay(x.date):'還沒排'}${gb('date')}</dd>${x.start?`<dt>時間</dt><dd><span class="num">${x.start}${x.dur?'–'+fromMin(toMin(x.start)+x.dur):''}</span>${gb('start')}${x.dur?`<span class="muted small">${fmtDur(x.dur)}</span>${gb('dur')}`:''}</dd>`:''}<dt>分類</dt><dd>${CATS[x.cat].name}</dd>${x.remind!=null?`<dt>提醒</dt><dd>${remindLabel(x.remind)}</dd>`:''}${x.deadline?`<dt>倒數</dt><dd>會出現在倒數票卡</dd>`:''}${x.note?`<dt>備註</dt><dd>${esc(x.note)}</dd>`:''}</dl>
  ${x.cat==='lab'&&x.kind==='event'&&!x.recordId?`<label class="check-row"><input type="checkbox" data-bind="mkRec.${x.id}" ${dr.mkRec[x.id]?'checked':''}>同時建立實驗紀錄（計畫中）</label>`:''}
  <div class="acts"><button class="btn btn-sm btn-line" data-act="prevEdit" data-i="${i}">${I('edit')}修改</button><button class="btn btn-sm btn-ghost" data-act="prevRemove" data-i="${i}">不要這筆</button></div></div>`;
}

/* ================= notes ================= */
function thumbsEditor(field,imgs,folder){
  imgs=imgs||[];const up=SH.top()&&SH.top().uploading;
  return `<div class="thumbs">${imgs.map((im,i)=>`<div class="thumb"><img src="${esc(imgSrc(im))}" alt=""><button type="button" class="row-del" data-act="imgDel" data-f="${field}" data-i="${i}" aria-label="移除圖片">${I('close')}</button></div>`).join('')}<label class="upload">${I('image')}<span>${up?'上傳中…':'加照片'}</span><input type="file" accept="image/*" multiple data-upload="${field}"${folder?` data-folder="${folder}"`:''}></label></div>`;
}
function sheetNote(draft){
  const isNew=!D.notes[draft.id];draft.images=draft.images||[];draft.tagText=(draft.tags||[]).join(' ');
  SH.open({title:isNew?'新筆記':(draft.type==='full'?'筆記':'便條'),draft,full:true,isNew,
    body(){const x=this.draft;return `<div class="form">
      <div><div class="seg"><button type="button" class="${x.type!=='full'?'on':''}" data-act="noteType" data-t="quick" aria-pressed="${x.type!=='full'}">便條</button><button type="button" class="${x.type==='full'?'on':''}" data-act="noteType" data-t="full" aria-pressed="${x.type==='full'}">完整筆記</button></div></div>
      ${x.type==='full'?`<div class="field"><label class="lbl" for="nt-title">標題</label><input type="text" id="nt-title" data-bind="title" value="${esc(x.title||'')}" ${this.isNew?'autofocus':''}></div>`:''}
      <div class="field"><label class="lbl" for="nt-body">內容</label><textarea id="nt-body" data-bind="body" style="min-height:${x.type==='full'?240:130}px;font-family:var(--f-hand);font-size:17px" ${this.isNew&&x.type!=='full'?'autofocus':''}>${esc(x.body||'')}</textarea></div>
      <div class="field"><label class="lbl" for="nt-tags">標籤</label><input type="text" id="nt-tags" data-bind="tagText" value="${esc(x.tagText||'')}" placeholder="用空白分開，例如：研究所 課業"></div>
      <div class="field"><span class="lbl">圖片</span>${thumbsEditor('images',x.images)}</div>
      <label class="check-row"><input type="checkbox" id="nt-pin" data-bind="pinned" ${x.pinned?'checked':''}>收藏，固定在最上面</label>
      <div class="field"><span class="lbl">變成行動</span><div class="toolbar"><button type="button" class="btn btn-sm btn-line" data-act="noteConvert" data-k="todo">${I('check')}轉成待辦</button><button type="button" class="btn btn-sm btn-line" data-act="noteConvert" data-k="event">${I('cal-plus')}排進行程</button></div><span class="hint">會用「一句話新增」的方式讀內容，先給你確認再加入。</span></div>
      </div>`;},
    foot(){return `${!this.isNew?`<button class="btn btn-danger btn-sm" data-act="noteDelete">${I('trash')}刪除</button>`:''}<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="noteSave">儲存</button>`;}
  });
}
function noteFromDraft(x){const n=clone(x);n.tags=splitTags(n.tagText);delete n.tagText;n.body=(n.body||'').trim();n.title=(n.title||'').trim();if(n.type!=='full')n.title='';return n;}

/* ================= lab editors ================= */
function rowsEd(field,rows,cols,addLabel){
  rows=rows||[];
  return `<div class="rows">${rows.map((row,i)=>`<div class="row-ed"><span class="no">${i+1}</span>${cols.map(([k,l,ph,full,dl,opts,type])=>{const id=`${field}-${i}-${k}`;const v=row[k]==null?'':row[k];
    const inp=opts?`<select class="in" id="${id}" data-bind="${field}.${i}.${k}">${opts.map(o=>`<option ${v===o?'selected':''}>${o}</option>`).join('')}</select>`
      :`<input class="in" id="${id}" type="${type==='number'?'number':'text'}" ${type==='decimal'?'inputmode="decimal"':''} ${type==='number'?'inputmode="numeric" min="0" data-num':''} ${dl?`list="${dl}"`:''} data-bind="${field}.${i}.${k}" value="${esc(v)}" placeholder="${esc(ph||'')}">`;
    return `<div class="field ${full?'full':''}"><label class="lbl" for="${id}">${l}</label>${inp}</div>`;}).join('')}<button type="button" class="row-del" data-act="rowDel" data-f="${field}" data-i="${i}" aria-label="刪除第 ${i+1} 項">${I('close')}</button></div>`).join('')}<button type="button" class="btn btn-sm btn-line" data-act="rowAdd" data-f="${field}" style="align-self:flex-start">${I('plus')}${addLabel}</button></div>`;
}
function recImagesEd(imgs){
  const up=SH.top()&&SH.top().uploading;
  return `<div class="rows">${imgs.map((im,i)=>`<div class="row-ed" style="grid-template-columns:84px minmax(0,1fr)"><div class="thumb" style="grid-row:span 2"><img src="${esc(imgSrc(im))}" alt=""></div><div class="field"><label class="lbl" for="img-${i}-c">說明</label><input class="in" id="img-${i}-c" data-bind="images.${i}.caption" value="${esc(im.caption||'')}" placeholder="例如 p-S6，曝光 30 秒"></div><div class="field"><label class="lbl" for="img-${i}-k">種類</label><select class="in" id="img-${i}-k" data-bind="images.${i}.kind">${['WB 膠片','顯微鏡','膠體','細胞照片','其他'].map(o=>`<option ${im.kind===o?'selected':''}>${o}</option>`).join('')}</select></div><button type="button" class="row-del" data-act="imgDel" data-f="images" data-i="${i}" aria-label="移除圖片">${I('close')}</button></div>`).join('')}<label class="upload" style="aspect-ratio:auto;padding:16px;flex-direction:row">${I('image')}<span>${up?'上傳中…':'加入圖片（可以一次選多張）'}</span><input type="file" accept="image/*" multiple data-upload="images" data-cap="1"></label></div>`;
}
const REC_SECS=[['b','基本'],['c','分組'],['p','參數'],['r','試劑'],['a','抗體'],['s','步驟'],['sm','樣本'],['res','結果'],['sum','小結'],['n','下一步'],['l','串連']];
function sheetRec(draft){
  const isNew=!D.records[draft.id];draft=newRecord(draft);draft.tagText=draft.tags.join(' ');
  SH.open({title:isNew?'新實驗紀錄':'編輯實驗紀錄',draft,full:true,isNew,
    jump(){return `<div class="jump">${REC_SECS.map(([k,l])=>`<button class="chip" data-act="jumpTo" data-k="${k}">${l}</button>`).join('')}</div>`;},
    body(){
      const x=this.draft;const lists=labLists();const projs=Object.values(D.projects).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      const others=Object.values(D.records).filter(r=>r.id!==x.id).map(r=>newRecord(clone(r))).sort(recSort).slice(0,60);
      const dl=(id,arr)=>`<datalist id="${id}">${arr.map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist>`;
      return `${dl('dl-cell',lists.cells)}${dl('dl-reag',lists.reag)}${dl('dl-ab',lists.abs)}${dl('dl-loc',lists.locs)}<div class="form">
      <section class="ed-sec" id="sec-b"><h4>基本資料</h4>
        <div class="field"><label class="lbl" for="r-title">實驗名稱</label><input type="text" id="r-title" data-bind="title" value="${esc(x.title)}" ${this.isNew&&!x.title?'autofocus':''} placeholder="例如：AA stimulation 0–60 min"></div>
        <div class="g2"><div class="field"><label class="lbl" for="r-type">類型</label><select id="r-type" data-bind="type">${REC_TYPES.map(t=>`<option ${x.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label class="lbl" for="r-status">狀態</label><select id="r-status" data-bind="status">${Object.entries(REC_STATUS).map(([k,v])=>`<option value="${k}" ${x.status===k?'selected':''}>${v.name}</option>`).join('')}</select></div></div>
        <div class="field"><label class="lbl" for="r-proj">實驗專案</label><select id="r-proj" data-bind="projectId"><option value="">不屬於專案</option>${projs.map(p=>`<option value="${p.id}" ${x.projectId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
        <div class="field"><label class="lbl" for="r-date">日期</label><input type="date" id="r-date" data-bind="date" value="${esc(x.date||'')}"></div>
        <div class="g2"><div class="field"><label class="lbl" for="r-start">開始時間</label><input type="time" id="r-start" data-bind="start" value="${esc(x.start||'')}"></div><div class="field"><label class="lbl" for="r-end">結束時間</label><input type="time" id="r-end" data-bind="end" value="${esc(x.end||'')}"></div></div>
        <div class="g2"><div class="field"><label class="lbl" for="r-cell">細胞株 / 樣本</label><input type="text" id="r-cell" list="dl-cell" data-bind="cellLine" value="${esc(x.cellLine)}"></div><div class="field"><label class="lbl" for="r-pass">代數</label><input type="text" id="r-pass" data-bind="passage" value="${esc(x.passage)}" placeholder="例如 P12"></div></div>
        <div class="g2"><div class="field"><label class="lbl" for="r-conf">密度 / confluency</label><input type="text" id="r-conf" data-bind="confluency" value="${esc(x.confluency)}" placeholder="例如 70–80%"></div><div class="field"><label class="lbl" for="r-plate">培養格式</label><input type="text" id="r-plate" data-bind="plate" value="${esc(x.plate)}" placeholder="例如 6-well"></div></div>
        <div class="field"><label class="lbl" for="r-purpose">研究目標 / 實驗目的</label><textarea id="r-purpose" data-bind="purpose">${esc(x.purpose)}</textarea></div>
        <div class="field"><label class="lbl" for="r-tags">標籤</label><input type="text" id="r-tags" data-bind="tagText" value="${esc(x.tagText||'')}" placeholder="用空白分開，例如：mTORC1 time-course"></div>
      </section>
      <section class="ed-sec" id="sec-c"><h4>實驗分組 <small>每一組的處理條件</small></h4>${rowsEd('conditions',x.conditions,[['label','組別','例如 15 min'],['time','時間',''],['treatment','處理','',true],['note','備註','',true]],'新增一組')}</section>
      <section class="ed-sec" id="sec-p"><h4>實驗參數 <small>膠體濃度、上樣量、離心條件…</small></h4>${rowsEd('params',x.params,[['k','項目',''],['v','內容','']],'新增參數')}</section>
      <section class="ed-sec" id="sec-r"><h4>試劑</h4>${rowsEd('reagents',x.reagents,[['name','名稱','',true,'dl-reag'],['conc','濃度',''],['amount','用量',''],['lot','批號 / 廠牌','',true]],'新增試劑')}</section>
      <section class="ed-sec" id="sec-a"><h4>抗體</h4>${rowsEd('antibodies',x.antibodies,[['name','目標蛋白 / 抗體','',true,'dl-ab'],['kind','一抗 / 二抗','',false,null,['一抗','二抗']],['dilution','稀釋倍率','例如 1:1000'],['mw','分子量 (kDa)',''],['source','廠牌 / 貨號','']],'新增抗體')}</section>
      <section class="ed-sec" id="sec-s"><h4>操作步驟 <small>做實驗時可以打勾、計時</small></h4>${rowsEd('steps',x.steps,[['text','步驟','',true],['min','計時（分鐘）','0 是不計時',false,null,null,'number'],['note','備註','']],'新增步驟')}</section>
      <section class="ed-sec" id="sec-sm"><h4>樣本 <small>收下來的樣本放在哪裡</small></h4>${rowsEd('samples',x.samples,[['code','樣本編號',''],['location','存放位置','例如 -80 °C 盒 A3',false,'dl-loc'],['desc','說明','',true]],'新增樣本')}</section>
      <section class="ed-sec" id="sec-res"><h4>結果</h4>
        <div class="field"><label class="lbl" for="r-obs">觀察結果</label><textarea id="r-obs" data-bind="observation" style="min-height:120px">${esc(x.observation)}</textarea></div>
        <div class="field"><span class="lbl">圖片（WB 膠片、顯微鏡照片…）</span>${recImagesEd(x.images)}</div>
        <div class="field"><label class="lbl" for="r-ql">定量指標</label><input type="text" id="r-ql" data-bind="quantLabel" value="${esc(x.quantLabel)}" placeholder="例如 p-S6 / S6（相對 0 min）"></div>
        ${rowsEd('quant',x.quant,[['label','樣本 / 組別',''],['value','數值','',false,null,null,'decimal']],'新增數值')}
        ${quantChart(x)}
      </section>
      <section class="ed-sec" id="sec-sum"><h4>問題與小結</h4><div class="field"><label class="lbl" for="r-prob">遇到的問題 / 異常狀況</label><textarea id="r-prob" data-bind="problems">${esc(x.problems)}</textarea></div><div class="field"><label class="lbl" for="r-conc">小結</label><textarea id="r-conc" data-bind="conclusion">${esc(x.conclusion)}</textarea></div></section>
      <section class="ed-sec" id="sec-n"><h4>下一步 <small>下次要做、要確認的事</small></h4>${rowsEd('next',x.next,[['text','要做什麼','',true]],'新增一項')}</section>
      <section class="ed-sec" id="sec-l"><h4>串連 <small>讓實驗可以一筆接一筆看</small></h4><div class="field"><label class="lbl" for="r-prev">接續或重複自哪一次</label><select id="r-prev" data-bind="prevId" data-rp="1"><option value="">沒有</option>${others.map(r=>`<option value="${r.id}" ${x.prevId===r.id?'selected':''}>${esc((r.date?fmtMD(r.date)+' ':'')+trim(r.title,28))}</option>`).join('')}</select></div>${x.prevId?`<div class="field"><label class="lbl" for="r-rel">關係</label><select id="r-rel" data-bind="prevRel"><option value="next" ${x.prevRel!=='repeat'?'selected':''}>接續（下一步實驗）</option><option value="repeat" ${x.prevRel==='repeat'?'selected':''}>重複同一個實驗</option></select></div>`:''}</section>
      </div>`;
    },
    foot(){return `${!this.isNew?`<button class="btn btn-danger btn-sm" data-act="recDel" data-id="${this.draft.id}" data-from="sheet">${I('trash')}刪除</button>`:''}<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="recSave">儲存紀錄</button>`;}
  });
}
function sheetNewRec(extra){
  SH.open({title:'從模板開始',draft:{},extra:extra||{},
    body(){const user=Object.values(D.templates).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      const btn=(t,u)=>`<button class="tpl" data-act="pickTpl" data-id="${t.id}"><span class="plate c-${u?'habit':'lab'}">${ICON(t.icon||'l-tube')}</span><span style="min-width:0"><b>${esc(t.name)}</b><small>${esc(t.desc||'')}</small></span>${I('right')}</button>`;
      return `<div class="tpl-list">${this.extra.prevId&&D.records[this.extra.prevId]?`<p class="hint">會接續「${esc(trim(D.records[this.extra.prevId].title,24))}」。</p>`:''}${user.length?`<div class="lbl">你存的模板</div>${user.map(t=>`<div style="display:grid;grid-template-columns:minmax(0,1fr) 40px;gap:6px;align-items:center">${btn(t,true)}<button class="icon-btn" data-act="tplDel" data-id="${t.id}" aria-label="刪除模板 ${esc(t.name)}">${I('trash')}</button></div>`).join('')}<div class="lbl" style="margin-top:6px">內建模板</div>`:''}${BUILTIN_TPL.map(t=>btn(t,false)).join('')}</div>`;}
  });
}
function sheetProj(draft){
  const isNew=!D.projects[draft.id];
  SH.open({title:isNew?'新實驗專案':'編輯專案',draft,isNew,full:true,
    body(){const x=this.draft;return `<div class="form"><div class="field"><label class="lbl" for="p-name">專案名稱</label><input type="text" id="p-name" data-bind="name" value="${esc(x.name||'')}" ${this.isNew?'autofocus':''} placeholder="例如：胺基酸對 mTORC1 的刺激"></div>
      <div class="field"><label class="lbl" for="p-st">狀態</label><select id="p-st" data-bind="status">${Object.entries(PROJ_STATUS).map(([k,v])=>`<option value="${k}" ${x.status===k?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label class="lbl" for="p-goal">研究目標 / 假說</label><textarea id="p-goal" data-bind="goal">${esc(x.goal||'')}</textarea></div>
      <div class="g2"><div class="field"><label class="lbl" for="p-cell">細胞株</label><input type="text" id="p-cell" data-bind="cellLines" value="${esc(x.cellLines||'')}"></div><div class="field"><label class="lbl" for="p-read">觀察指標</label><input type="text" id="p-read" data-bind="readouts" value="${esc(x.readouts||'')}" placeholder="例如 p-S6、p-4E-BP1"></div></div>
      <div class="field"><label class="lbl" for="p-start">開始日期</label><input type="date" id="p-start" data-bind="start" value="${esc(x.start||'')}"></div>
      <div class="field"><label class="lbl" for="p-note">備註</label><textarea id="p-note" data-bind="note">${esc(x.note||'')}</textarea></div></div>`;},
    foot(){return `${!this.isNew?`<button class="btn btn-danger btn-sm" data-act="projDelete">${I('trash')}刪除</button>`:''}<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="projSave">儲存</button>`;}
  });
}
function sheetTplName(r){
  SH.open({title:'存成模板',draft:{name:r.title||'我的模板',desc:r.type+(r.cellLine?' · '+r.cellLine:''),rid:r.id},
    body(){return `<div class="form"><div class="field"><label class="lbl" for="t-name">模板名稱</label><input type="text" id="t-name" data-bind="name" value="${esc(this.draft.name)}"></div><div class="field"><label class="lbl" for="t-desc">說明</label><input type="text" id="t-desc" data-bind="desc" value="${esc(this.draft.desc)}"></div><p class="hint">會保留分組、參數、試劑、抗體和步驟；日期、結果、樣本不會帶過去。</p></div>`;},
    foot(){return `<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="tplSave">儲存模板</button>`;}
  });
}
function sheetText(title,text){
  SH.open({title:'複製這段文字',draft:{},body(){return `<p class="hint" style="margin-bottom:8px">${esc(title)}：長按下面的文字可以全選複製。</p><textarea class="in ta" id="copybox" readonly style="min-height:320px;font-family:ui-monospace,Menlo,monospace;font-size:13px">${esc(text)}</textarea>`;}});
  setTimeout(()=>{const t=$('#copybox');if(t){t.focus();t.select();}},60);
}

/* ================= 分類 ================= */
function catIcons(){const total=completedTotal();return FOODS.filter(f=>f.need<=total).map(f=>[f.id,f.name]).concat(CAT_EXTRA);}
function sheetCat(draft){
  const isNew=!CAT_STORE[draft.id];
  SH.open({title:isNew?'新增分類':'編輯分類',draft,isNew,full:true,
    body(){const x=this.draft;
      return `<div class="form">
      <div class="field"><label class="lbl" for="ct-name">名稱</label><input type="text" id="ct-name" data-bind="name" value="${esc(x.name||'')}" placeholder="例如：上課"></div>
      <div class="field"><label class="lbl" for="ct-short">簡稱（行程旁邊的小字，2～3 個字）</label><input type="text" id="ct-short" data-bind="short" value="${esc(x.short||'')}" maxlength="4" placeholder="例如：上課"></div>
      <div class="field"><span class="lbl">圖示</span><div class="icon-pick">${catIcons().map(([id,nm])=>`<button type="button" class="${x.food===id?'on':''}" data-act="catIcon" data-f="${id}" aria-label="${esc(nm)}" aria-pressed="${x.food===id}"><span class="plate sm c-${esc(x.id)}" style="--tint:var(--t-${x.tint})">${F(id)}</span></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">顏色</span><div class="swatches">${CAT_TINTS.map(([k,l])=>`<button type="button" class="swatch ${x.tint===k?'on':''}" data-act="catTint" data-t="${k}"><i style="--sw:var(--t-${k})"></i>${l}</button>`).join('')}</div></div>
      <div class="field"><label class="lbl" for="ct-kw">自動分類的關鍵字（可不填，用逗號分開）</label><input type="text" id="ct-kw" data-bind="kw" value="${esc(x.kw||'')}" placeholder="例如：上課, 課堂, 選修"><p class="hint">一句話新增時，句子裡有這些字，就會自動分到這一類。</p></div></div>`;},
    foot(){return `${!this.isNew&&CAT_ORDER.length>1?`<button class="btn btn-danger btn-sm" data-act="catDelete">${I('trash')}刪除</button>`:''}<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="catSave">儲存</button>`;}
  });
}

/* ================= 發表紀錄 ================= */
const POST_TAGS=['日常','奶蓋','生活日誌'];
function sheetPost(draft){
  const isNew=!D.posts[draft.id];draft.photos=draft.photos||[];draft.tags=draft.tags||[];
  const custom=draft.tags.filter(t=>!POST_TAGS.includes(t));draft.tags=draft.tags.filter(t=>POST_TAGS.includes(t));draft.extraTags=custom.join(' ');
  SH.open({title:isNew?'寫一篇發表':'編輯發表',draft,full:true,isNew,
    body(){const x=this.draft;const shareN=(Friends.mine||[]).length;
      return `<div class="form">
      <div class="field"><span class="lbl">分類</span><div class="chips">${POST_TAGS.map(t=>`<button type="button" class="chip ${x.tags.includes(t)?'on':''}" data-act="postTag" data-t="${esc(t)}" aria-pressed="${x.tags.includes(t)}">${esc(t)}</button>`).join('')}</div>
        <input class="in" style="margin-top:8px" data-bind="extraTags" value="${esc(x.extraTags||'')}" placeholder="其他標籤（可不填，用空格分開）" aria-label="其他標籤"></div>
      <div class="field"><label class="lbl" for="po-title">標題（可不填）</label><input type="text" id="po-title" data-bind="title" value="${esc(x.title||'')}" placeholder="例如：奶蓋今天第一次洗澡"></div>
      <div class="field"><label class="lbl" for="po-body">內容</label><textarea id="po-body" data-bind="body" style="font-family:var(--f-hand);font-size:17px;min-height:160px" placeholder="今天發生了什麼？">${esc(x.body||'')}</textarea></div>
      <div class="field"><span class="lbl">照片</span>${thumbsEditor('photos',x.photos,'posts')}</div>
      <div class="field"><label class="lbl" for="po-date">日期</label><input type="date" id="po-date" data-bind="date" value="${esc(x.date||today())}"></div>
      <div class="field"><span class="lbl">誰看得到</span><div class="seg">${[['me','只有我'],['friends','分享名單']].map(([v,l])=>`<button type="button" class="${x.vis===v?'on':''}" data-act="postVis" data-v="${v}" aria-pressed="${x.vis===v}">${l}</button>`).join('')}</div>
        <p class="hint">${x.vis==='friends'?(shareN?`分享名單上的 ${shareN} 個人登入後看得到這篇（只能看，不能改）。`:'分享名單目前是空的，所以還是只有你看得到。要分享的話，到「我的 → 分享名單」加人。'):'只有你自己看得到。'}</p></div></div>`;},
    foot(){return `${!this.isNew?`<button class="btn btn-danger btn-sm" data-act="postDelete">${I('trash')}刪除</button>`:''}<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="postSave">${this.isNew?'發表':'儲存'}</button>`;}
  });
}
function sheetPostView(p,friend){
  SH.open({title:friend?((p.author||'朋友')+' 的發表'):'發表紀錄',pid:p.id,draft:null,full:true,
    body(){const ph=p.photos||[];
      return `<article class="post-full">
        <div class="post-meta"><span>${esc((p.date||'').replace(/-/g,'/'))}</span>${(p.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}${friend?'':`<span class="vis ${p.vis==='friends'?'on':''}">${p.vis==='friends'?'分享名單看得到':'只有我'}</span>`}</div>
        ${p.title?`<h2 class="post-title">${esc(p.title)}</h2>`:''}
        ${p.body?`<p class="post-body">${esc(p.body)}</p>`:''}
        ${ph.length?`<div class="post-photos">${ph.map(im=>`<button type="button" data-act="lightbox" data-src="${esc(imgSrc(im))}" data-cap=""><img src="${esc(imgSrc(im))}" alt="" loading="lazy"></button>`).join('')}</div>`:''}
      </article>`;},
    foot(){return friend?`<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">關閉</button>`:`<button class="btn btn-danger btn-sm" data-act="postDelete">${I('trash')}刪除</button><span class="sp"></span><button class="btn btn-accent" data-act="postEdit">${I('edit')}編輯</button>`;}
  });
}

/* ================= album ================= */
function sheetMoment(draft){
  const isNew=!D.moments[draft.id];draft.photos=draft.photos||[];
  const labels={photo:'照片日記',joy:'今日小確幸',mood:'心情手帳',answer:'今日一問',review:'每日回顧'};
  SH.open({title:(isNew?'新增':'')+labels[draft.kind],draft,full:true,isNew,
    body(){const x=this.draft;const kinds=['photo','joy','mood'].concat(['answer','review'].includes(x.kind)?[x.kind]:[]);
      return `<div class="form"><div class="seg-scroll"><div class="seg">${kinds.map(k=>`<button type="button" class="${x.kind===k?'on':''}" data-act="momentKind" data-k="${k}" aria-pressed="${x.kind===k}">${labels[k]}</button>`).join('')}</div></div>
      <div class="field"><label class="lbl" for="m-date">日期</label><input type="date" id="m-date" data-bind="date" value="${esc(x.date||today())}"></div>
      ${x.question?`<p class="hand" style="font-size:17px">${esc(x.question)}</p>`:''}
      <div class="field"><span class="lbl">照片${x.kind==='photo'?'':'（可以不放）'}</span>${thumbsEditor('photos',x.photos)}</div>
      <div class="field"><label class="lbl" for="m-text">${x.kind==='joy'?'今天最喜歡的一件事':x.kind==='mood'?'心情、想法、生活心得':x.kind==='photo'?'配一句話':'寫點什麼'}</label><textarea id="m-text" data-bind="text" style="font-family:var(--f-hand);font-size:17px;min-height:140px">${esc(x.text||'')}</textarea></div>
      <div class="field"><span class="lbl">心情天氣</span>${moodPick(x.mood)}</div></div>`;},
    foot(){return `${!this.isNew?`<button class="btn btn-danger btn-sm" data-act="momentDelete">${I('trash')}刪除</button>`:''}<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">取消</button><button class="btn btn-accent" data-act="momentSave">收進相簿</button>`;}
  });
}
function sheetDay(d){
  SH.open({title:fmtDay(d)+' 的小日子',draft:{},live:true,
    body(){const dn=doneOn(d);const left=itemsOn(d).filter(i=>!isDone(i,d));const ms=Object.values(D.moments).filter(m=>m.date===d).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));const rs=Object.values(D.records).filter(r=>r.date===d).map(r=>newRecord(clone(r)));
      const mood=ms.filter(m=>m.mood).pop();
      return `<div class="form">${mood?`<div class="check-row"><span class="plate sm c-rest">${svgUse('w'+mood.mood)}</span>那天的心情是「${moodName(mood.mood)}」</div>`:''}
      <section class="block"><h4 class="h3">那天原來做了這些事</h4>${dn.length?`<div class="dayline">${dn.map(it=>`<div class="it"><span class="plate sm c-${it.cat}">${F(catFood(it.cat))}</span><span>${it.start?`<span class="num muted">${it.start}</span> `:''}${esc(it.title)}</span></div>`).join('')}</div>`:'<p class="muted small">那天沒有打勾的事。</p>'}${left.length?`<p class="small muted">另外還有 ${left.length} 件沒有完成。</p>`:''}</section>
      ${rs.length?`<section class="block"><h4 class="h3">實驗</h4><div class="recs">${rs.map(recRow).join('')}</div></section>`:''}
      <section class="block"><h4 class="h3">留下的回憶</h4>${ms.length?`<div class="slips">${ms.map(momentMini).join('')}</div>`:'<p class="muted small">這天還沒有照片或文字。</p>'}<button class="btn btn-sm btn-line" data-act="momentNew" data-kind="photo" data-day="${d}" style="align-self:flex-start">${I('plus')}補一則回憶</button></section></div>`;}
  });
}
function sheetReview(){
  const t=today();const ex=Object.values(D.moments).find(m=>m.kind==='review'&&m.date===t);
  SH.open({title:'晚上回顧今天',draft:{mood:ex?ex.mood:0,text:ex?ex.text:'',id:ex?ex.id:null},full:true,live:true,
    body(){const its=itemsOn(t);const done=its.filter(i=>isDone(i,t));const left=its.filter(i=>!isDone(i,t));const ms=Object.values(D.moments).filter(m=>m.date===t&&m.photos&&m.photos.length);const tm=itemsOn(addDays(t,1));
      return `<div class="form"><div class="stampcard"><div class="top"><b>今天完成 ${done.length} / ${its.length}</b><small>${its.length&&!left.length?'集點卡多了一格印章':'全部完成就能蓋一格印章'}</small></div></div>
      ${done.length?`<section class="block"><h4 class="h3">做完的事</h4><div class="dayline">${done.map(it=>`<div class="it"><span class="plate sm c-${it.cat}">${F(catFood(it.cat))}</span><span>${esc(it.title)}</span></div>`).join('')}</div></section>`:''}
      ${left.length?`<section class="block"><h4 class="h3">還沒完成的</h4>${left.map(it=>`<div class="carry-row"><span>${esc(it.title)}</span><div class="acts">${!it.rep?`<button class="btn btn-sm btn-ink" data-act="carry" data-to="tomorrow" data-id="${it.id}">移到明天</button>`:''}<button class="btn btn-sm btn-line" data-act="toggle" data-id="${it.id}" data-day="${t}">其實做完了</button>${!it.rep?`<button class="btn btn-sm btn-ghost" data-act="carry" data-to="drop" data-id="${it.id}">不做了</button>`:''}</div></div>`).join('')}</section>`:''}
      ${ms.length?`<section class="block"><h4 class="h3">今天的照片</h4><div class="thumbs">${ms.flatMap(m=>m.photos).slice(0,6).map(p=>`<span class="thumb"><img src="${esc(imgSrc(p))}" alt="" loading="lazy"></span>`).join('')}</div></section>`:''}
      <section class="block"><h4 class="h3">今天的心情</h4>${moodPick(this.draft.mood)}<div class="field"><label class="lbl" for="rv-text">一句話心得</label><textarea id="rv-text" data-bind="text" style="font-family:var(--f-hand);font-size:17px">${esc(this.draft.text)}</textarea></div></section>
      <section class="block"><h4 class="h3">明天的安排</h4>${tm.length?`<div class="dayline">${tm.slice(0,5).map(it=>`<div class="it"><span class="plate sm c-${it.cat}">${F(catFood(it.cat))}</span><span>${it.start?`<span class="num muted">${it.start}</span> `:''}${esc(it.title)}</span></div>`).join('')}</div>${tm.length>5?`<p class="small muted">還有 ${tm.length-5} 件</p>`:''}`:'<p class="muted small">明天還沒有安排。</p>'}</section></div>`;},
    foot(){return `<span class="sp"></span><button class="btn btn-line" data-act="sheetClose">晚點再說</button><button class="btn btn-accent" data-act="reviewSave">收進心情手帳</button>`;}
  });
}
function lightbox(src,cap){$('#modal').innerHTML=`<div class="lightbox" data-act="lbClose"><button class="icon-btn x" data-act="lbClose" aria-label="關閉">${I('close')}</button><img src="${esc(src)}" alt="${esc(cap||'')}">${cap?`<div>${esc(cap)}</div>`:''}</div>`;}

/* ================= actions ================= */
function setHash(){try{history.replaceState(null,'','#'+S.tab);}catch(e){}}
function goTab(tab){S.tab=tab;setHash();render();try{window.scrollTo(0,0);}catch(e){}}
function setDay(d){S.day=d;S.cal=d.slice(0,7);}
function openRec(id){
  if(!D.records[id])return;SH.clear();
  if(S.tab==='lab'&&S.lab.view!=='home'&&!(S.lab.view==='rec'&&S.lab.id===id))S.labHist.push({view:S.lab.view,id:S.lab.id});
  else if(S.tab!=='lab'||S.lab.view==='home')S.labHist=[];
  S.lab.view='rec';S.lab.id=id;goTab('lab');
}
function openProj(id){
  if(!D.projects[id])return;SH.clear();
  if(S.tab==='lab'&&S.lab.view!=='home')S.labHist.push({view:S.lab.view,id:S.lab.id});else S.labHist=[];
  S.lab.view='proj';S.lab.id=id;goTab('lab');
}
function toggleDone(id,d){
  const it=D.items[id];if(!it)return;const x=clone(it);let on;
  if(x.rep){x.doneDates=x.doneDates||{};if(x.doneDates[d]){delete x.doneDates[d];on=false;}else{x.doneDates[d]=true;on=true;}}
  else{x.done=!x.done;x.doneDay=x.done?(x.date||today()):null;x.doneAt=x.done?Date.now():null;on=x.done;}
  Store.put('items',x);
  if(on){const its=itemsOn(d);if(its.length&&its.every(i=>isDone(i,d)))toast(d===today()?'今天的事都完成了，集點卡蓋上一格印章。':fmtDay(d)+'全部完成，蓋上一格印章。','ok');checkUnlock();}
}
function checkUnlock(){
  const s=SET();const total=completedTotal();const unlocked=FOODS.filter(f=>f.need<=total).map(f=>f.id);
  const prev=s.unlocked||FOODS.filter(f=>f.need===0).map(f=>f.id);const fresh=unlocked.filter(id=>!prev.includes(id));
  if(fresh.length){fresh.forEach(id=>toast('解鎖新貼紙：'+FOODS.find(f=>f.id===id).name+'，到小店的圖鑑看看。','ok'));saveSet({unlocked});}
}
function itemDraftSave(s){
  const x=clone(s.draft);x.title=(x.title||'').trim();
  if(!x.title){toast('先幫它取個名字。','bad');focusLater('#it-title');return null;}
  if(x.kind==='event'&&!x.date&&!x.rep)x.date=today();
  if(x.rep&&!x.date)x.date=today();
  if(!x.start)x.dur=null;else if(!x.dur)x.dur=60;
  x.subtasks=(x.subtasks||[]).filter(t=>t.text&&t.text.trim());
  delete x.guessed;return x;
}
function persistItem(x,mkRec){
  if(x.recordId==='__new'||mkRec){
    const r=newRecord({title:x.title,date:x.date||today(),start:x.start||'',end:x.start?fromMin(toMin(x.start)+(x.dur||60)):'',status:'plan',eventId:x.id,type:guessType(x.title+' '+(x.note||''))});
    Store.put('records',r);x.recordId=r.id;
  }else if(x.recordId){const r=D.records[x.recordId];if(r&&r.eventId!==x.id){const rr=clone(r);rr.eventId=x.id;Store.put('records',rr);}}
  Store.put('items',x);
}
function noteConvert(kind){
  const s=SH.top();const n=noteFromDraft(s.draft);if(!n.body&&!n.title){toast('先寫點內容。','bad');return;}
  n.createdAt=n.createdAt||Date.now();Store.put('notes',n);s.dirty=false;
  const text=[n.title,n.body].filter(Boolean).join('，');
  let its=parseSentence(text.split('\n')[0],today());
  if(!its.length)its=[mkItem({kind:'todo',title:trim(n.title||n.body,40)})];
  its=its.slice(0,4).map(it=>{
    if(kind==='todo'&&it.kind==='event'&&it.guessed.start){it.kind='todo';it.start=null;it.dur=null;delete it.guessed.start;delete it.guessed.dur;}
    if(kind==='event'&&it.kind==='todo'){it.kind='event';if(!it.start){it.start='14:00';it.guessed.start=true;}if(!it.dur){it.dur=60;it.guessed.dur=true;}if(!it.date){it.date=today();it.guessed.date=true;}}
    it.noteId=n.id;return it;
  });
  SH.close();sheetPreview(its,{fromNote:n.title||n.body,noteId:n.id});
}
async function handleUpload(el){
  const s=SH.top();if(!s||!s.draft)return;const field=el.dataset.upload;const files=Array.from(el.files||[]);el.value='';if(!files.length)return;
  s.uploading=(s.uploading||0)+1;SH.repaint();
  await addImages(files,im=>{let arr=getPath(s.draft,field);if(!Array.isArray(arr)){arr=[];setPath(s.draft,field,arr);}arr.push(el.dataset.cap?Object.assign(im,{caption:'',kind:'WB 膠片'}):im);s.dirty=true;if(SH.top()===s)SH.repaint();},el.dataset.folder);
  s.uploading--;if(SH.top()===s)SH.repaint();
}
function importJson(el){
  const f=el.files&&el.files[0];el.value='';if(!f)return;
  f.text().then(txt=>{
    let j;try{j=JSON.parse(txt);}catch(e){toast('這個檔案不是小日和的備份。','bad');return;}
    if(!j||j.app!=='hiyori'||!j.data){toast('這個檔案不是小日和的備份。','bad');return;}
    let n=0;COLS.forEach(c=>{n+=Object.keys(j.data[c]||{}).length;});
    ask('要匯入 '+n+' 筆資料嗎？相同的項目會被備份檔裡的版本取代。','匯入').then(ok=>{if(!ok)return;COLS.forEach(c=>Object.values(j.data[c]||{}).forEach(doc=>{if(doc&&doc.id)Store.put(c,clone(doc));}));toast('匯入完成','ok');});
  }).catch(()=>toast('讀不到這個檔案。','bad'));
}
const ACT={
  tab(el){const t=el.dataset.tab;if(t==='album'&&el.dataset.seg)S.album.seg=el.dataset.seg;if(t==='lab'&&(S.tab==='lab'||S.tab==='home')){S.lab.view='home';S.labHist=[];}if(t==='today'&&(el.dataset.go==='today'||S.tab==='today'))setDay(today());goTab(t);},
  day(el){setDay(el.dataset.day);render();},
  goToday(){setDay(today());render();},
  calShift(el){S.cal=addMonths(S.cal+'-01',+el.dataset.n).slice(0,7);render();},
  fab(){if(S.tab==='today')ACT.addItem({dataset:{kind:'event'}});else if(S.tab==='notes')ACT.newNote();else if(S.tab==='lab')sheetNewRec(S.lab.view==='proj'?{projectId:S.lab.id}:{});else if(S.tab==='album'){if(S.album.seg==='post'||S.album.seg==='friends')ACT.postNew();else ACT.momentNew({dataset:{kind:'photo'}});}},
  pushOn(){unlockAudio();Push.enable();App.dataChanged(true);},
  pushTest(){Push.test();},
  pushOff(){ask('關掉這台裝置的通知？之後在這台就不會收到提醒。','關掉',true).then(ok=>{if(ok)Push.disable();});},
  authMode(el){S.authMode=el.dataset.m;S.authErr='';S.authMsg='';render();},
  logout(){ask('登出這台裝置？資料都還在雲端，重新登入就會回來。','登出').then(async ok=>{if(!ok)return;try{await Push.disable();}catch(e){}try{localStorage.removeItem('hiyori.cache.'+Store.uid);}catch(e){}await sb.auth.signOut();});},
  pwChange(){sheetNewPassword();},
  async pwSave(){const s=SH.top();const pw=(s.draft.pw||'');if(pw.length<6){toast('密碼至少要 6 個字。','bad');return;}
    const {error}=await sb.auth.updateUser({password:pw});if(error){toast(authErr(error),'bad');return;}SH.close();toast('新密碼設好了','ok');},
  addItem(el){const k=el.dataset.kind||'todo';const d=S.day;sheetItem(mkItem({kind:k,date:d,start:k==='event'?nextSlot(d):null,dur:k==='event'?60:null,cat:'chores'}),{day:d});},
  openItem(el){const it=D.items[el.dataset.id];if(!it)return;sheetItem(clone(it),{day:el.dataset.day||(it.rep?S.day:it.date)||S.day});},
  toggle(el){toggleDone(el.dataset.id,el.dataset.day||S.day);},
  carry(el){const it=D.items[el.dataset.id];if(!it)return;const orig=clone(it),x=clone(it),to=el.dataset.to,t=today();
    if(to==='today')x.date=t;else if(to==='tomorrow')x.date=addDays(t,1);else if(to==='done'){x.done=true;x.doneDay=x.date;}else if(to==='drop'){x.dropped=true;addPhoneTrash(it);}
    Store.put('items',x);if(to==='done')checkUnlock();
    toast(to==='drop'?'先放下了':to==='done'?'已標成完成':'已移到'+fmtDay(x.date),'ok',to==='drop'?{action:'復原',onAction:()=>Store.put('items',orig)}:{});},
  moveLoose(el){const d=el.dataset.day,n=addDays(d,1);itemsOn(d).filter(i=>!i.rep&&!i.start&&!i.deadline&&!isDone(i,d)).forEach(i=>{const x=clone(i);x.date=n;Store.put('items',x);});toast('已移到'+fmtDay(n),'ok');},
  review(){sheetReview();},
  inboxToday(el){const x=clone(D.items[el.dataset.id]);if(!x)return;x.date=today();Store.put('items',x);toast('排進今天了','ok');},
  sheetClose(){const s=SH.top();if(!s)return;if(s.dirty){ask('還沒儲存，要放棄這次的修改嗎？','放棄修改',true).then(ok=>{if(ok){s.dirty=false;SH.close();}});return;}SH.close();},
  sheetCloseAll(){const go=()=>SH.clear();if(SH.stack.some(s=>s.dirty))ask('還沒儲存，要放棄這次的修改嗎？','放棄修改',true).then(ok=>{if(ok)go();});else go();},
  itemKind(el){const s=SH.top();s.draft.kind=el.dataset.k;if(el.dataset.k==='event'){if(!s.draft.date)s.draft.date=S.day||today();if(!s.draft.start){s.draft.start=nextSlot(s.draft.date);s.draft.dur=s.draft.dur||60;}}s.dirty=true;SH.repaint();},
  itemCat(el){const s=SH.top();s.draft.cat=el.dataset.c;s.dirty=true;SH.repaint();},
  itemWd(el){const s=SH.top();const k=+el.dataset.k;const r=s.draft.rep;const set=new Set(r.days&&r.days.length?r.days:[dow(s.draft.date||today())]);if(set.has(k)&&set.size>1)set.delete(k);else set.add(k);r.days=[...set].sort();s.dirty=true;SH.repaint();},
  subAdd(){const s=SH.top();s.draft.subtasks.push({text:'',done:false});s.dirty=true;SH.repaint();focusLater('#sub-'+(s.draft.subtasks.length-1));},
  subDel(el){const s=SH.top();s.draft.subtasks.splice(+el.dataset.i,1);s.dirty=true;SH.repaint();},
  subToggle(el){const s=SH.top();const t=s.draft.subtasks[+el.dataset.i];t.done=!t.done;s.dirty=true;SH.repaint();},
  itemSave(){const s=SH.top();const x=itemDraftSave(s);if(!x)return;
    if(s.opts.preview){s.dirty=false;s.opts.onSave(x);SH.close();return;}
    const isNew=!D.items[x.id];persistItem(x);s.dirty=false;SH.close();toast(isNew?'已加入'+(x.rep?repLabel(x):x.date?fmtDay(x.date):'「還沒排日期」'):'已儲存','ok');},
  itemDelete(){const s=SH.top();const it=D.items[s.draft.id];if(!it)return;
    ask('刪除「'+it.title+'」？'+(it.rep?'這是重複行程，所有日期都會一起刪掉。':''),'刪除',true).then(ok=>{if(!ok)return;const orig=clone(it);addPhoneTrash(it);Store.del('items',it.id);s.dirty=false;SH.close();toast('已刪除','',{action:'復原',onAction:()=>Store.put('items',orig)});});},
  itemDoneToggle(el){const s=SH.top();s.dirty=false;SH.close();toggleDone(s.draft.id,el.dataset.day);},
  itemSkip(el){const s=SH.top();const d=el.dataset.day;const x=clone(D.items[s.draft.id]);x.skipDates=x.skipDates||{};x.skipDates[d]=true;Store.put('items',x);s.dirty=false;SH.close();
    toast(fmtDay(d)+' 這次跳過','ok',{action:'復原',onAction:()=>{const y=clone(D.items[x.id]);if(y){delete y.skipDates[d];Store.put('items',y);}}});},
  itemMove(el){const s=SH.top();const x=clone(D.items[s.draft.id]);x.date=addDays(x.date||today(),+el.dataset.n||1);Store.put('items',x);s.dirty=false;SH.close();toast('已移到'+fmtDay(x.date),'ok');},
  openRecFromItem(el){openRec(el.dataset.id);},
  prevEdit(el){const s=SH.top();const i=+el.dataset.i;const dr=s.draft;sheetItem(clone(dr.items[i]),{preview:true,title:'修改這筆',onSave:x=>{x.guessed={};dr.items[i]=x;}});},
  prevRemove(el){const s=SH.top();s.draft.items.splice(+el.dataset.i,1);SH.repaint();},
  prevSave(){const s=SH.top();const its=s.draft.items;if(!its.length)return;
    its.forEach(x=>{const y=clone(x);delete y.guessed;if(s.opts.noteId)y.noteId=s.opts.noteId;persistItem(y,!!s.draft.mkRec[x.id]);});
    if(s.opts.noteId&&D.notes[s.opts.noteId]){const n=clone(D.notes[s.opts.noteId]);n.convertedTo=its[0].id;Store.put('notes',n);}
    if(!s.opts.noteId)S.qa='';
    const first=its.find(x=>x.date);SH.clear();
    if(first&&S.tab==='today'&&first.date!==S.day&&its.every(x=>x.date===first.date))setDay(first.date);
    render();toast('已加入 '+its.length+' 筆'+(first?'，'+fmtDay(first.date):''),'ok');},
  noteSeg(el){S.notes.seg=el.dataset.seg;render();},
  noteTag(el){S.notes.tag=S.notes.tag===el.dataset.tag?'':el.dataset.tag;render();},
  newNote(){sheetNote({id:uid('n'),type:'full',title:'',body:S.qn||'',tags:[],images:[],pinned:false,createdAt:Date.now()});},
  openNote(el){const n=D.notes[el.dataset.id];if(n)sheetNote(clone(n));},
  noteType(el){const s=SH.top();s.draft.type=el.dataset.t;s.dirty=true;SH.repaint();},
  noteSave(){const s=SH.top();const n=noteFromDraft(s.draft);if(!n.body&&!n.title&&!n.images.length){toast('先寫點內容。','bad');return;}
    n.createdAt=n.createdAt||Date.now();const isNew=!D.notes[n.id];if(isNew&&D.notes[n.id]==null&&S.qn&&n.body===S.qn.trim())S.qn='';Store.put('notes',n);s.dirty=false;SH.close();toast('已儲存','ok');},
  noteDelete(){const s=SH.top();const n=D.notes[s.draft.id];if(!n)return;ask('刪除這則筆記？','刪除',true).then(ok=>{if(!ok)return;const orig=clone(n);Store.del('notes',n.id);s.dirty=false;SH.close();toast('已刪除','',{action:'復原',onAction:()=>Store.put('notes',orig)});});},
  noteConvert(el){noteConvert(el.dataset.k);},
  imgDel(el){const s=SH.top();const arr=getPath(s.draft,el.dataset.f);if(Array.isArray(arr)){arr.splice(+el.dataset.i,1);s.dirty=true;SH.repaint();}},
  newRec(el){sheetNewRec(el.dataset.proj?{projectId:el.dataset.proj}:{});},
  pickTpl(el){const s=SH.top();const id=el.dataset.id;const tpl=BUILTIN_TPL.find(t=>t.id===id)||D.templates[id];if(!tpl)return;
    const r=recFromTpl(tpl,Object.assign({date:today(),status:'plan'},s.extra||{}));SH.stack.pop();sheetRec(r);SH.top().dirty=true;},
  tplDel(el){const t=D.templates[el.dataset.id];if(!t)return;ask('刪除模板「'+t.name+'」？已經建立的紀錄不受影響。','刪除',true).then(ok=>{if(ok){Store.del('templates',t.id);SH.repaint();}});},
  openRec(el){openRec(el.dataset.id);},
  openProj(el){openProj(el.dataset.id);},
  labBack(){const h=S.labHist.pop();if(h&&((h.view==='proj'&&D.projects[h.id])||(h.view==='rec'&&D.records[h.id]))){S.lab.view=h.view;S.lab.id=h.id;}else{S.lab.view='home';S.labHist=[];}render();try{window.scrollTo(0,0);}catch(e){}},
  labClear(){Object.assign(S.lab,{q:'',type:'',status:'',cell:'',ab:'',range:''});render();},
  editRec(el){const r=R(el.dataset.id);if(r)sheetRec(r);},
  recStatus(el){const r=R(el.dataset.id);if(!r)return;r.status=el.dataset.st;if(r.status==='doing'&&!r.start)r.start=nowHM();if(r.status==='done'&&!r.end&&r.date===today())r.end=nowHM();Store.put('records',r);},
  stepToggle(el){const r=R(el.dataset.id);if(!r)return;const st=r.steps[+el.dataset.i];if(!st)return;st.done=!st.done;st.at=st.done?nowHM():'';
    if(st.done&&r.status==='plan'){r.status='doing';if(!r.start)r.start=st.at;}
    Store.put('records',r);if(st.done&&r.steps.every(x=>x.done))toast('步驟都完成了，記得補上結果和樣本位置。','ok');},
  timerStart(el){const r=R(el.dataset.id);if(!r)return;const st=r.steps[+el.dataset.i];if(!st||!st.min)return;unlockAudio();startTimer(r.id+':'+el.dataset.i,st.text,st.min,r.id);},
  timerStop(el){TIMERS=TIMERS.filter(t=>t.key!==el.dataset.key);saveTimers();paintTimers();},
  timerOpen(el){if(el.dataset.rec&&D.records[el.dataset.rec])openRec(el.dataset.rec);},
  recDup(el){const r=R(el.dataset.id);if(!r)return;const x=newRecord(Object.assign(stripRec(r),{id:uid('r'),date:today(),status:'plan',projectId:r.projectId,prevId:r.id,prevRel:'repeat',title:r.title,createdAt:Date.now()}));
    x.steps=x.steps.map(s=>({text:s.text,min:s.min||0,done:false,at:'',note:''}));sheetRec(x);SH.top().dirty=true;},
  recNext(el){const r=R(el.dataset.id);if(!r)return;const nx=r.next.find(n=>!n.done);sheetNewRec({projectId:r.projectId,cellLine:r.cellLine,passage:'',prevId:r.id,prevRel:'next',title:nx?nx.text:''});},
  recEvent(el){const r=R(el.dataset.id);if(!r)return;const ev=r.eventId&&D.items[r.eventId];if(ev){sheetItem(clone(ev),{day:ev.date});return;}
    const dur=r.start&&r.end?Math.max(15,toMin(r.end)-toMin(r.start)):120;
    const prep=r.reagents.map(x=>x.name).filter(Boolean).slice(0,4).join('、');
    sheetItem(mkItem({kind:'event',title:r.title||'實驗',date:r.date||today(),start:r.start||'13:30',dur,cat:'lab',remind:30,recordId:r.id,note:prep?'準備：'+prep:''}),{title:'加入行程',day:r.date});},
  recCopy(el){const r=D.records[el.dataset.id];if(!r)return;const md=recMarkdown(r);
    try{navigator.clipboard.writeText(md).then(()=>toast('已複製，可以貼到其他地方','ok')).catch(()=>sheetText('實驗紀錄',md));}catch(e){sheetText('實驗紀錄',md);}},
  recMd(el){const r=D.records[el.dataset.id];if(!r)return;saveFile('實驗紀錄_'+(r.date||'未填日期')+'_'+safeName(r.title)+'.md',recMarkdown(r));},
  recTpl(el){const r=R(el.dataset.id);if(r)sheetTplName(r);},
  tplSave(){const s=SH.top();const r=R(s.draft.rid);if(!r)return;const name=(s.draft.name||'').trim()||r.title||'我的模板';
    Store.put('templates',{id:uid('t'),name,desc:s.draft.desc||'',icon:'coffee',rec:stripRec(r,true),createdAt:Date.now()});SH.close();toast('模板存好了，新紀錄時可以選它','ok');},
  recDel(el){const r=D.records[el.dataset.id];if(!r)return;ask('刪除「'+(r.title||'這筆紀錄')+'」？照片和步驟紀錄都會一起刪掉。','刪除',true).then(ok=>{if(!ok)return;const orig=clone(r);Store.del('records',r.id);if(el.dataset.from==='sheet'){const s=SH.top();if(s)s.dirty=false;SH.clear();}
    if(S.lab.view==='rec'&&S.lab.id===r.id)ACT.labBack();toast('已刪除','',{action:'復原',onAction:()=>Store.put('records',orig)});});},
  recSave(){const s=SH.top();const x=newRecord(clone(s.draft));x.title=(x.title||'').trim()||'未命名實驗';x.tags=splitTags(x.tagText);delete x.tagText;
    x.steps=x.steps.filter(st=>st.text&&st.text.trim()).map(st=>Object.assign({done:false,at:'',note:''},st,{min:+st.min||0}));
    const meaningful=row=>Object.entries(row).some(([k,v])=>!['done','todoId','kind','min','at'].includes(k)&&String(v==null?'':v).trim());
    ['conditions','params','reagents','antibodies','samples','quant','next'].forEach(f=>{x[f]=x[f].filter(meaningful);});
    if(!x.prevId)x.prevRel='';else if(!x.prevRel)x.prevRel='next';
    Store.put('records',x);s.dirty=false;SH.clear();
    if(!(S.tab==='lab'&&S.lab.view==='rec'&&S.lab.id===x.id))openRec(x.id);else render();toast('紀錄已儲存','ok');},
  rowAdd(el){const s=SH.top();const f=el.dataset.f;const arr=s.draft[f]||(s.draft[f]=[]);arr.push(clone(ROW_DEF[f]));s.dirty=true;SH.repaint();const k=Object.keys(ROW_DEF[f])[0];focusLater('#'+f+'-'+(arr.length-1)+'-'+(f==='steps'||f==='next'?'text':k));},
  rowDel(el){const s=SH.top();const arr=s.draft[el.dataset.f];if(Array.isArray(arr)){arr.splice(+el.dataset.i,1);s.dirty=true;SH.repaint();}},
  jumpTo(el){const t=$('#sec-'+el.dataset.k);if(t)t.scrollIntoView({block:'start',behavior:'smooth'});},
  nextToggle(el){const r=R(el.dataset.id);if(!r)return;const n=r.next[+el.dataset.i];if(!n)return;n.done=!n.done;Store.put('records',r);},
  nextTodo(el){const r=R(el.dataset.id);if(!r)return;const n=r.next[+el.dataset.i];if(!n)return;const it=mkItem({kind:'todo',title:n.text,cat:'lab',recordId:r.id,note:'來自實驗「'+r.title+'」'});delete it.guessed;Store.put('items',it);n.todoId=it.id;Store.put('records',r);toast('放進待辦了（還沒排日期）','ok');},
  newProj(){sheetProj({id:uid('p'),name:'',status:'active',goal:'',cellLines:'',readouts:'',start:today(),note:'',createdAt:Date.now()});},
  editProj(el){const p=D.projects[el.dataset.id];if(p)sheetProj(clone(p));},
  projSave(){const s=SH.top();const p=clone(s.draft);p.name=(p.name||'').trim();if(!p.name){toast('先幫專案取個名字。','bad');focusLater('#p-name');return;}const isNew=!D.projects[p.id];Store.put('projects',p);s.dirty=false;SH.close();if(isNew)openProj(p.id);toast('專案已儲存','ok');},
  projDelete(){const s=SH.top();const p=D.projects[s.draft.id];if(!p)return;ask('刪除專案「'+p.name+'」？裡面的實驗紀錄會留著，只是不再屬於這個專案。','刪除',true).then(ok=>{if(!ok)return;Store.del('projects',p.id);s.dirty=false;SH.clear();S.lab.view='home';S.labHist=[];render();toast('專案已刪除');});},
  albumSeg(el){S.album.seg=el.dataset.seg;if(S.album.seg==='friends'&&!Friends.posts)Friends.loadPosts();render();},
  catNew(){sheetCat({id:uid('cat'),name:'',short:'',food:'pencil',tint:'mint',kw:''});},
  catEdit(el){const c=el.dataset.c;const k=CAT_STORE[c];if(!k)return;sheetCat({id:c,name:k.name,short:k.short,food:catFood(c),tint:k.tint,kw:k.kw||''});},
  catIcon(el){const s=SH.top();s.draft.food=el.dataset.f;s.dirty=true;SH.repaint();},
  catTint(el){const s=SH.top();s.draft.tint=el.dataset.t;s.dirty=true;SH.repaint();},
  catSave(){const s=SH.top();const x=s.draft;const name=(x.name||'').trim();if(!name){toast('先幫分類取個名字。','bad');focusLater('#ct-name');return;}
    const defs=catDefsNow();const d={id:x.id,name,short:(x.short||'').trim()||name.slice(0,2),tint:x.tint,kw:(x.kw||'').trim()};
    const i=defs.findIndex(v=>v.id===x.id);if(i>=0)defs[i]=d;else defs.push(d);
    saveSet({catDefs:defs,catFood:Object.assign({},SET().catFood,{[x.id]:x.food})});s.dirty=false;SH.close();toast(i>=0?'分類已更新':'新增了「'+name+'」','ok');},
  catDelete(){const s=SH.top();const id=s.draft.id;const k=CAT_STORE[id];if(!k)return;
    const to=id!=='chores'&&CAT_STORE.chores?'chores':CAT_ORDER.find(c=>c!==id);const its=Object.values(D.items).filter(i=>i.cat===id);
    ask('刪除分類「'+k.name+'」？'+(its.length?'裡面的 '+its.length+' 個行程會移到「'+CAT_STORE[to].name+'」。':''),'刪除',true).then(ok=>{if(!ok)return;
      its.forEach(i=>{const x=clone(i);x.cat=to;Store.put('items',x);});saveSet({catDefs:catDefsNow().filter(d=>d.id!==id)});s.dirty=false;SH.close();toast('已刪除分類');});},
  catUp(el){const defs=catDefsNow();const i=defs.findIndex(d=>d.id===el.dataset.c);if(i<1)return;[defs[i-1],defs[i]]=[defs[i],defs[i-1]];saveSet({catDefs:defs});},
  postNew(){sheetPost({id:uid('po'),date:today(),title:'',body:'',photos:[],tags:[],vis:'me',createdAt:Date.now()});},
  postOpen(el){const p=D.posts[el.dataset.id];if(p)sheetPostView(p,false);},
  postEdit(){const s=SH.top();const p=s&&D.posts[s.pid];if(!p)return;SH.close();sheetPost(clone(p));},
  postTag(el){const s=SH.top();const t=el.dataset.t;const tags=s.draft.tags||[];s.draft.tags=tags.includes(t)?tags.filter(x=>x!==t):tags.concat([t]);s.dirty=true;SH.repaint();},
  postVis(el){const s=SH.top();s.draft.vis=el.dataset.v;s.dirty=true;SH.repaint();},
  postFilter(el){S.album.tag=el.dataset.t||'';render();},
  postSave(){const s=SH.top();const p=clone(s.draft);p.title=(p.title||'').trim();p.body=(p.body||'').trim();p.photos=p.photos||[];
    const extra=String(s.draft.extraTags||'').split(/[\s,，、#]+/).map(x=>x.trim()).filter(Boolean);delete p.extraTags;
    p.tags=[...new Set((p.tags||[]).concat(extra))];
    if(!p.title&&!p.body&&!p.photos.length){toast('寫一句話或放張照片再發表喔。','bad');return;}
    if(s.uploading){toast('照片還在上傳，等一下下。','bad');return;}
    p.author=SET().name||'';p.date=p.date||today();const isNew=!D.posts[p.id];
    Store.put('posts',p);s.dirty=false;SH.close();toast(isNew?(p.vis==='friends'?'發表了，分享名單上的人看得到':'發表了（只有你看得到）'):'已更新','ok');},
  postDelete(){const s=SH.top();const p=D.posts[s.pid||s.draft&&s.draft.id];if(!p)return;ask('刪除這篇發表？','刪除',true).then(ok=>{if(!ok)return;const orig=clone(p);Store.del('posts',p.id);if(s)s.dirty=false;SH.clear();toast('已刪除','',{action:'復原',onAction:()=>Store.put('posts',orig)});});},
  friendPostOpen(el){const p=(Friends.posts||[]).find(x=>x.id===el.dataset.id&&x.owner===el.dataset.o);if(p)sheetPostView(p,true);},
  friendsReload(){Friends.loadPosts();},
  shareRemove(el){const e=el.dataset.e;ask('把 '+e+' 從分享名單移除？之後他就看不到你分享的發表了。','移除',true).then(ok=>{if(ok)Friends.remove(e);});},
  momentNew(el){const k=el.dataset.kind||'photo';const d=el.dataset.day||today();sheetMoment({id:uid('m'),kind:k,date:d,text:'',photos:[],mood:0,createdAt:Date.now()});},
  momentOpen(el){const m=D.moments[el.dataset.id];if(m)sheetMoment(clone(m));},
  momentKind(el){const s=SH.top();s.draft.kind=el.dataset.k;s.dirty=true;SH.repaint();},
  momentSave(){const s=SH.top();const x=clone(s.draft);x.photos=x.photos||[];x.text=(x.text||'').trim();if(!x.text&&!x.photos.length&&!x.mood){toast('寫一句話、放張照片，或選個心情天氣都可以。','bad');return;}if(!x.date)x.date=today();Store.put('moments',x);s.dirty=false;SH.close();toast('收進相簿了','ok');},
  momentDelete(){const s=SH.top();const m=D.moments[s.draft.id];if(!m)return;ask('刪除這則回憶？','刪除',true).then(ok=>{if(!ok)return;const orig=clone(m);Store.del('moments',m.id);s.dirty=false;SH.close();toast('已刪除','',{action:'復原',onAction:()=>Store.put('moments',orig)});});},
  moodPick(el){const s=SH.top();if(!s)return;const v=+el.dataset.v;s.draft.mood=s.draft.mood===v?0:v;s.dirty=true;SH.repaint();},
  monthShift(el){S.album.month=addMonths(S.album.month+'-01',+el.dataset.n).slice(0,7);render();},
  openDay(el){sheetDay(el.dataset.day);},
  reviewSave(){const s=SH.top();const t=today();const text=(s.draft.text||'').trim();if(!text&&!s.draft.mood){toast('選個心情天氣，或寫一句話。','bad');return;}
    const ex=s.draft.id&&D.moments[s.draft.id];const m=ex?clone(ex):{id:uid('m'),kind:'review',date:t,photos:[],createdAt:Date.now()};m.text=text;m.mood=s.draft.mood||0;Store.put('moments',m);s.dirty=false;SH.close();toast('收好了，晚安。','ok');},
  lightbox(el){lightbox(el.dataset.src,el.dataset.cap);},
  lbClose(){$('#modal').innerHTML='';},
  palette(el){saveSet({palette:el.dataset.p});},
  themeSet(el){saveSet({theme:el.dataset.t});},
  toggleSet(el){const k=el.dataset.k;saveSet({[k]:!SET()[k]});if(k==='sound'&&SET().sound){unlockAudio();beep(2);}},
  exportJson(){saveFile('小日和備份_'+today()+'.json',JSON.stringify({app:'hiyori',version:1,exportedAt:new Date().toISOString(),data:D},null,1));},
  exportMdAll(){const rs=Object.values(D.records).map(r=>newRecord(clone(r))).sort(recSort);if(!rs.length){toast('還沒有實驗紀錄。');return;}saveFile('實驗紀錄_全部_'+today()+'.md',rs.map(recMarkdown).join('\n---\n\n'));},
  modeInfo(){const n=Object.keys(Store.outbox).length;toast(Store.mode==='offline'||Store.mode==='error'?'現在連不上雲端，先顯示這台裝置上次的資料。修改會先存在這台，連上網路後自動上傳。':n?'還有 '+n+' 筆修改正在上傳到雲端。':'正在連線雲端…','',{ms:7000});}
};
const CHG={
  itemRep(el){const s=SH.top();const v=el.value;s.draft.rep=v==='daily'?{type:'daily'}:v==='weekly'?{type:'weekly',days:[dow(s.draft.date||today())]}:null;if(s.draft.rep&&!s.draft.date)s.draft.date=today();s.dirty=true;SH.repaint();},
  catFood(el){saveSet({catFood:Object.assign({},SET().catFood,{[el.dataset.c]:el.value})});}
};
const FORM={
  async share(f){const inp=f.querySelector('input');const v=inp?inp.value:'';const ok=await Friends.add(v);if(ok&&inp)inp.value='';},
  async auth(){
    const m=S.authMode||'in';const email=(S.authEmail||'').trim();const pw=S.authPw||'';
    S.authErr='';S.authMsg='';
    if(!/^\S+@\S+\.\S+$/.test(email)){S.authErr='請輸入正確的 email。';render();return;}
    if(m!=='forgot'&&pw.length<6){S.authErr='密碼至少要 6 個字。';render();return;}
    S.authBusy=true;render();
    const back=location.origin+location.pathname;
    try{
      if(m==='in'){const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error;S.authPw='';}
      else if(m==='up'){const {data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:back}});if(error)throw error;
        if(!data.session){S.authMode='in';S.authMsg='確認信寄到 '+email+' 了。到信箱點「Confirm your mail」，再回來這裡登入。';}else S.authPw='';}
      else{const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:back});if(error)throw error;S.authMode='in';S.authMsg='重設密碼的信寄出了，點信裡的連結就能設新密碼。';}
    }catch(e){S.authErr=authErr(e);}
    S.authBusy=false;render();
  },
  quick(){const txt=S.qa.trim();if(!txt){const q=$('#qa');q&&q.focus();return;}const its=parseSentence(txt,today(),S.day!==today()?S.day:null);if(!its.length){toast('看不太懂，換個說法試試。','bad');return;}sheetPreview(its);},
  memo(){const t=S.qn.trim();if(!t){const q=$('#qn');q&&q.focus();return;}const tags=(t.match(/#([^\s#，,]+)/g)||[]).map(x=>x.slice(1));
    Store.put('notes',{id:uid('n'),type:'quick',title:'',body:t,tags,images:[],pinned:false,createdAt:Date.now()});S.qn='';render();toast('記下了','ok');},
  answer(){const t=S.ans.trim();if(!t)return;Store.put('moments',{id:uid('m'),kind:'answer',date:today(),question:QUESTIONS[dayIndex(today())%QUESTIONS.length],text:t,photos:[],mood:0,createdAt:Date.now()});S.ans='';toast('收進相簿了','ok');}
};

/* ================= wiring ================= */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const fn=ACT[el.dataset.act];if(!fn)return;
  e.preventDefault();e.stopPropagation();
  try{fn(el,e);}catch(err){console.error(err);toast('出了點問題：'+(err&&err.message||err),'bad');}
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click();return;}
  if(e.key==='Escape'){if($('#modal').innerHTML)$('#modal').innerHTML='';else if(SH.top())ACT.sheetClose();}
});
let liveT=0;
document.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset)return;
  if(el.dataset.bind){onBind(el);return;}
  if(el.dataset.model){setPath(S,el.dataset.model,el.value);if(el.dataset.live){clearTimeout(liveT);liveT=setTimeout(render,el.tagName==='SELECT'?0:180);}}
});
document.addEventListener('change',e=>{
  const el=e.target;if(!el.dataset)return;
  if(el.dataset.upload){handleUpload(el);return;}
  if(el.dataset.import){importJson(el);return;}
  if(el.dataset.change&&CHG[el.dataset.change]){CHG[el.dataset.change](el);return;}
  if(el.dataset.bind){onBind(el);return;}
  if(el.dataset.setting){saveSet({[el.dataset.setting]:el.value.trim()});toast('已更新','ok');return;}
  if(el.dataset.model){setPath(S,el.dataset.model,el.value);if(el.dataset.live)render();}
});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target.dataset&&e.target.dataset.form;if(f&&FORM[f])FORM[f](e.target);});
document.addEventListener('pointerdown',unlockAudio,{passive:true});

(function init(){
  const h=(location.hash||'').slice(1);if(TITLES[h])S.tab=h;
  render();paintTimers();
  window.addEventListener('scroll',()=>{const b=$('#appbar');if(b)b.classList.toggle('scrolled',window.scrollY>4);},{passive:true});
  setInterval(tickTimers,1000);
  setInterval(checkReminders,20000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Store.uid){Store.flush();if(Push.on)scheduleReminderSync();render();}});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('sw',e));
  let lastDay=today();
  setInterval(()=>{const t=today();if(t!==lastDay){if(S.day===lastDay)setDay(t);lastDay=t;render();}else if(S.tab==='today'&&!SH.top()&&!document.activeElement.matches('input,textarea,select'))render();},60000);
  Auth.init().then(()=>{applyTheme();setTimeout(checkReminders,1500);});
})();
