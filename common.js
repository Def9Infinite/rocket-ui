/* ============================================================
   ORBITAL — shared overlay engine
   Used by every overlay page AND the control panel.
   State lives in localStorage and is broadcast to all pages
   (OBS browser sources) via BroadcastChannel + storage events
   + a polling fallback, so everything stays in sync.
   ============================================================ */

/* ---------- launch sites ---------- */
const SITES = {
  slc40:      {name:'Cape Canaveral SLC-40', region:'Florida, USA',    lat:28.562,  lon:-80.577},
  lc39a:      {name:'Kennedy LC-39A',         region:'Florida, USA',    lat:28.6084, lon:-80.6043},
  slc4e:      {name:'Vandenberg SLC-4E',      region:'California, USA', lat:34.632,  lon:-120.611},
  starbase:   {name:'Starbase OLP-1',         region:'Boca Chica, TX',  lat:25.997,  lon:-97.155},
  wallops:    {name:'Wallops LP-0A',          region:'Virginia, USA',   lat:37.834,  lon:-75.488},
  kourou:     {name:'Kourou ELA-4',           region:'French Guiana',   lat:5.236,   lon:-52.768},
  baikonur:   {name:'Baikonur 1/5',           region:'Kazakhstan',      lat:45.92,   lon:63.342},
  tanegashima:{name:'Tanegashima LA-Y',       region:'Japan',           lat:30.401,  lon:130.97},
  jiuquan:    {name:'Jiuquan SLS-2',          region:'Inner Mongolia, China', lat:40.958, lon:100.291},
  xichang:    {name:'Xichang LC-2',           region:'Sichuan, China',  lat:28.246,  lon:102.027},
  wenchang:   {name:'Wenchang LC-101',        region:'Hainan, China',   lat:19.614,  lon:110.951},
  taiyuan:    {name:'Taiyuan LC-9',           region:'Shanxi, China',   lat:38.849,  lon:111.608},
  andoya:     {name:'Andøya Spaceport',       region:'Nordland, Norway',lat:69.068,  lon:15.490},
};

/* ============================================================
   i18n — English / 简体中文
   ============================================================ */
const I18N = {
  en:{
    // status
    st_standby:'STANDBY', st_tminus:'T-MINUS', st_hold:'HOLD', st_inflight:'IN FLIGHT',
    // titlebar
    mission:'MISSION', live:'LIVE',
    // countdown
    countdown:'COUNTDOWN', count_held:'⚠ COUNT HELD ⚠',
    sub_await:'AWAITING COUNT START', sub_hold:'AUTO SEQUENCE PAUSED · AWAITING RESUME',
    sub_go:'AUTO SEQUENCE NOMINAL · GO FOR LAUNCH', sub_flight:'VEHICLE IN POWERED FLIGHT',
    prelaunch:'PRELAUNCH',
    // weather
    wx_title:'RANGE WEATHER', wx_wind:'Wind', wx_gust:'Gusts', wx_hum:'Humidity', wx_pres:'Pressure',
    wx_cloud:'Cloud', wx_vis:'Visibility', wx_launch:'Launch Weather', wx_go:'GO', wx_nogo:'NO-GO',
    wx_await:'Awaiting data…', wx_live:'live', wx_sim:'simulated · offline',
    // rocket sections / rows
    sec_vehicle:'Vehicle', sec_payload:'Payload', sec_boosters:'Boosters', sec_s1:'First Stage', sec_s2:'Second Stage', sec_s3:'Third Stage', sec_us:'Upper Stage',
    r_height:'Height', r_diameter:'Diameter', r_mass:'Liftoff Mass', r_payload:'Capacity', r_engines:'Engines',
    r_engine:'Engine', r_motors:'Motors', r_thrust:'Thrust', r_burn:'Burn Time', r_prop:'Propellant', r_fairing:'Fairing',
    p_name:'Name', p_customer:'Customer', p_type:'Type', p_mass:'Mass', p_orbit:'Target Orbit',
    // ticker
    tk_flightdata:'FLIGHT DATA', tk_vehicle:'VEHICLE', tk_mission:'MISSION', tk_site:'SITE', tk_height:'HEIGHT',
    tk_mass:'LIFTOFF MASS', tk_s1:'1ST STAGE', tk_thrust:'THRUST', tk_payload:'CAPACITY', tk_s2:'2ND STAGE',
    tk_phase:'PHASE', tk_next:'NEXT', tk_wind:'WIND', tk_temp:'TEMP', tk_wx:'WX',
    // control — chrome
    c_title:'MISSION CONTROL', c_obs_setup:'⛭ OBS SETUP', c_monitor:'PROGRAM MONITOR',
    c_monitor_legend:'overlays composite over your captured feed',
    c_feed_note:'YOUR VIDEO FEED', c_feed_sub:'captured separately in OBS — overlays sit on top',
    // control — transport
    c_seq:'SEQ', c_start:'START COUNT', c_hold:'HOLD', c_resume:'RESUME', c_sett:'SET T−',
    c_liftoff:'LIFTOFF', c_set:'SET', c_bottom:'BOTTOM', c_timeline:'TIMELINE', c_ticker:'TICKER', c_clear:'CLEAR', ph_mmss:'mm:ss',
    // control — sources
    c_sources:'OBS BROWSER SOURCES', c_copy:'⧉ COPY URL',
    src_titlebar:'Title Bar', src_countdown:'Countdown', src_weather:'Range Weather', src_rocket:'Vehicle Data', src_timeline:'Flight Timeline', src_ticker:'Data Ticker',
    pos_top:'Top · full width', pos_topcenter:'Top center', pos_lowerleft:'Lower left', pos_right:'Right · sized to content', pos_bottom:'Bottom · full width', pos_bottom_alt:'Bottom · alt to timeline',
    // control — T-0
    sec_t0:'Liftoff · T‑0', f_t0utc:'Set T‑0 as a UTC date / time', c_sett0utc:'SET T‑0 (UTC)', t0_notset:'T‑0: not set', t0_prefix:'T‑0 · ',
    // control — site/weather/broadcast
    sec_site_wx:'Launch Site & Weather', f_site:'Launch Site', c_refresh_wx:'↻ REFRESH LIVE WEATHER',
    sec_broadcast:'Broadcast', f_mission:'Mission', f_vehicle:'Vehicle',
    // control — vehicle spec / profiles
    sec_vspec:'Vehicle Spec', c_loadpreset:'LOAD PRESET', c_saveprofile:'⤓ SAVE PROFILE', c_loadprofile:'⤒ LOAD PROFILE',
    c_profile_hint:'A profile is one .json file with the rocket spec and the flight timeline — easy to reload or share.',
    f_name:'Name', f_operator:'Operator', f_height:'Height', f_diameter:'Diameter', f_mass:'Liftoff Mass', f_payload:'Capacity (LEO)',
    f_motors:'Motors', ph_boosters:'e.g. 4 × GEM-63', f_engines:'Engines', f_thrust:'Thrust', f_burn:'Burn Time', f_prop:'Propellant', f_engine:'Engine', f_fairing:'Fairing', ph_upper:'e.g. kick stage / Centaur',
    // control — timeline editor
    sec_ftimeline:'Flight Timeline', c_timeline_hint:'Time accepts T+02:35, -1:00, or 145 (seconds). ★ marks a major milestone. Events drive the moving timeline & the “next event” callouts.',
    c_addevent:'+ ADD EVENT', c_reset:'RESET ALL',
    // control — help modal
    h_title:'OBS SETUP', h_intro:'This control panel runs the show. Each overlay is its own transparent page you add to OBS as a Browser Source — they all sync to whatever you do here.',
    h_li1:'In OBS: + → Browser for each source. Tick “Local file” (or paste the served URL) and set the listed size.',
    h_li2:'Position & scale each source on your canvas — the Program Monitor here shows the reference layout.',
    h_li3:'Add your video capture (window / display / camera) as the bottom layer so overlays sit on top.',
    h_li4:'Keep this page open (it can be its own dock / window). Every control here updates all sources instantly.',
    h_li5:'Use TIMELINE or TICKER for the lower band — enable the matching OBS source.',
    h_sync:'Sync uses the browser’s shared storage on this machine. For best reliability serve the folder over a local URL and use that URL for every source + this panel.',
    h_gotit:'GOT IT',
  },
  zh:{
    st_standby:'待命', st_tminus:'倒计时', st_hold:'暂停', st_inflight:'飞行中',
    mission:'任务', live:'直播',
    countdown:'倒计时', count_held:'⚠ 倒计时暂停 ⚠',
    sub_await:'等待倒计时开始', sub_hold:'自动程序暂停 · 等待恢复',
    sub_go:'自动程序正常 · 允许发射', sub_flight:'火箭动力飞行中',
    prelaunch:'发射前',
    wx_title:'靶场气象', wx_wind:'风速', wx_gust:'阵风', wx_hum:'湿度', wx_pres:'气压',
    wx_cloud:'云量', wx_vis:'能见度', wx_launch:'发射气象', wx_go:'适宜', wx_nogo:'不适宜',
    wx_await:'等待数据…', wx_live:'实时', wx_sim:'模拟 · 离线',
    sec_vehicle:'运载器', sec_payload:'有效载荷', sec_boosters:'助推器', sec_s1:'一级', sec_s2:'二级', sec_s3:'三级', sec_us:'上面级',
    r_height:'高度', r_diameter:'直径', r_mass:'起飞质量', r_payload:'运力', r_engines:'发动机',
    r_engine:'发动机', r_motors:'助推发动机', r_thrust:'推力', r_burn:'工作时间', r_prop:'推进剂', r_fairing:'整流罩',
    p_name:'名称', p_customer:'客户', p_type:'类型', p_mass:'质量', p_orbit:'目标轨道',
    tk_flightdata:'飞行数据', tk_vehicle:'火箭', tk_mission:'任务', tk_site:'发射场', tk_height:'高度',
    tk_mass:'起飞质量', tk_s1:'一级', tk_thrust:'推力', tk_payload:'运力', tk_s2:'二级',
    tk_phase:'阶段', tk_next:'下一步', tk_wind:'风速', tk_temp:'温度', tk_wx:'气象',
    c_title:'任务控制', c_obs_setup:'⛭ OBS 设置', c_monitor:'节目监视器',
    c_monitor_legend:'叠加层合成于你采集的视频之上',
    c_feed_note:'你的视频画面', c_feed_sub:'在 OBS 中单独采集 — 叠加层位于其上',
    c_seq:'时序', c_start:'开始倒计时', c_hold:'暂停', c_resume:'恢复', c_sett:'设置 T−',
    c_liftoff:'起飞', c_set:'设置', c_bottom:'底栏', c_timeline:'时间轴', c_ticker:'滚动条', c_clear:'透明', ph_mmss:'分:秒',
    c_sources:'OBS 浏览器源', c_copy:'⧉ 复制网址',
    src_titlebar:'标题栏', src_countdown:'倒计时', src_weather:'靶场气象', src_rocket:'火箭数据', src_timeline:'飞行时间轴', src_ticker:'数据滚动条',
    pos_top:'顶部 · 通栏', pos_topcenter:'顶部居中', pos_lowerleft:'左下', pos_right:'右侧 · 随内容', pos_bottom:'底部 · 通栏', pos_bottom_alt:'底部 · 时间轴替代',
    sec_t0:'起飞 · T‑0', f_t0utc:'以 UTC 日期/时间设置 T‑0', c_sett0utc:'设置 T‑0（UTC）', t0_notset:'T‑0：未设置', t0_prefix:'T‑0 · ',
    sec_site_wx:'发射场与气象', f_site:'发射场', c_refresh_wx:'↻ 刷新实时气象',
    sec_broadcast:'转播信息', f_mission:'任务名称', f_vehicle:'运载器',
    sec_vspec:'火箭参数', c_loadpreset:'载入预设', c_saveprofile:'⤓ 保存配置', c_loadprofile:'⤒ 载入配置',
    c_profile_hint:'配置文件是一个 .json 文件，包含火箭参数与飞行时间轴 — 便于重新载入或分享。',
    f_name:'名称', f_operator:'运营方', f_height:'高度', f_diameter:'直径', f_mass:'起飞质量', f_payload:'运力（近地轨道）',
    f_motors:'助推发动机', ph_boosters:'例如 4 × GEM-63', f_engines:'发动机', f_thrust:'推力', f_burn:'工作时间', f_prop:'推进剂', f_engine:'发动机', f_fairing:'整流罩', ph_upper:'例如 上面级 / 半人马座',
    sec_ftimeline:'飞行时间轴', c_timeline_hint:'时间可输入 T+02:35、-1:00 或 145（秒）。★ 表示重要节点。事件驱动移动时间轴与“下一事件”提示。',
    c_addevent:'+ 添加事件', c_reset:'全部重置',
    h_title:'OBS 设置', h_intro:'本控制台用于导播。每个叠加层都是独立的透明页面，在 OBS 中作为“浏览器源”添加 — 它们会同步你在此处的所有操作。',
    h_li1:'在 OBS 中：+ → 浏览器，为每个源新建。勾选“本地文件”（或粘贴服务地址），并设置所列尺寸。',
    h_li2:'在画布上摆放与缩放各源 — 此处的“节目监视器”给出参考布局。',
    h_li3:'将你的视频采集（窗口 / 显示器 / 摄像头）放在最底层，使叠加层位于其上。',
    h_li4:'保持本页面打开（可作为独立停靠窗口）。此处每个操作都会即时更新所有源。',
    h_li5:'下方条带使用“时间轴”或“滚动条” — 启用对应的 OBS 源即可。',
    h_sync:'同步基于本机浏览器的共享存储。为获得最佳可靠性，请通过本地地址提供该文件夹，并对所有源与本面板使用该地址。',
    h_gotit:'知道了',
  },
};
function tr(key, lang){ const L=I18N[lang]||I18N.en; return (L[key]!=null) ? L[key] : (I18N.en[key]!=null ? I18N.en[key] : key); }
function applyI18n(root, lang){
  root.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = tr(el.getAttribute('data-i18n'), lang); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el=>{ el.placeholder = tr(el.getAttribute('data-i18n-ph'), lang); });
  if(root.documentElement) root.documentElement.setAttribute('lang', lang==='zh'?'zh-CN':'en');
}
/* localized flight-event labels (common phases only; custom labels pass through) */
const PHASE_I18N = {'Prop Load Begins':'推进剂加注开始','2nd Stage LOX Load':'二级液氧加注','Strongback Retract':'脐带塔回撤','Startup':'发动机启动','Engine Ignition':'发动机点火','Liftoff':'点火起飞','Max-Q':'最大动压','MECO':'一级关机','Stage Sep':'级间分离','SES-1':'二级一次点火','Boostback Burn':'返场点火','Fairing Sep':'整流罩分离','Entry Burn':'再入点火','Landing Burn':'着陆点火','Booster Landing':'助推器回收着陆','SECO-1':'二级一次关机'};
const evLabel = (label, lang) => (lang==='zh' && PHASE_I18N[label]) ? PHASE_I18N[label] : label;
/* localized weather condition + wind direction */
const WMO_ZH = {0:'晴',1:'晴间多云',2:'多云',3:'阴',45:'雾',48:'雾凇',51:'小毛雨',53:'毛毛雨',55:'毛毛雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',75:'大雪',80:'阵雨',81:'阵雨',82:'强阵雨',95:'雷暴',96:'雷暴',99:'雷暴'};
const DIR_ZH = ['北','北偏东','东北','东偏北','东','东偏南','东南','南偏东','南','南偏西','西南','西偏南','西','西偏北','西北','北偏西'];
function wxCondText(code, lang){ if(lang==='zh') return WMO_ZH[code]||'—'; const m=WMO[code]; return m?m[0]:'—'; }
function dirNameI18n(d, lang){ return lang==='zh' ? DIR_ZH[Math.round(d/22.5)%16] : dirName(d); }
function wxVerdictText(verdict, lang){ return verdict==='GO' ? tr('wx_go',lang) : tr('wx_nogo',lang); }

/* ---------- default mission ---------- */
function defaultState(){
  return {
    mission:'STARLINK 12-7',
    vehicle:'FALCON 9 BLOCK 5',
    site:'slc40',
    bottomView:'timeline',                    // 'timeline' | 'ticker'
    tlClear:false,                            // semi-transparent bottom band
    lang:'en',                                // 'en' | 'zh'
    clock:{mode:'idle', t0:null, holdT:null}, // mode: idle | counting | hold
    weather:null,
    rocket:{
      name:'Falcon 9 Block 5', operator:'SPACEX',
      height:'70 m', diameter:'3.7 m', mass:'549,054 kg', payload:'22,800 kg (LEO)',
      hasP:true, pName:'Starlink G12-7', pCustomer:'SpaceX', pType:'23 × V2 Mini', pMass:'17,500 kg', pOrbit:'550 km × 53° LEO',
      hasB:false, bEng:'', bThrust:'', bBurn:'',
      s1eng:'9 × Merlin 1D', s1thrust:'7,607 kN (SL)', s1burn:'162 s', s1prop:'LOX / RP-1',
      s2eng:'1 × Merlin 1D Vac', s2thrust:'981 kN', s2burn:'397 s', fairing:'13.1 m × 5.2 m',
      hasS3:false, s3eng:'', s3thrust:'', s3burn:'',
      hasUS:false, usEng:'', usThrust:'', usBurn:'',
    },
    events:[
      {t:-3540,l:'Prop Load Begins',m:false},{t:-1140,l:'2nd Stage LOX Load',m:false},
      {t:-420,l:'Strongback Retract',m:false},{t:-60,l:'Startup',m:false},{t:-3,l:'Engine Ignition',m:false},
      {t:0,l:'Liftoff',m:true},{t:72,l:'Max-Q',m:false},{t:145,l:'MECO',m:true},{t:149,l:'Stage Sep',m:true},
      {t:156,l:'SES-1',m:false},{t:165,l:'Boostback Burn',m:false},{t:222,l:'Fairing Sep',m:true},
      {t:390,l:'Entry Burn',m:false},{t:480,l:'Landing Burn',m:false},{t:512,l:'Booster Landing',m:true},{t:525,l:'SECO-1',m:true},
    ],
    _v:0,
  };
}

/* ---------- shared state store ---------- */
const STATE_KEY = 'orbital-state-v1';
const BUS_NAME  = 'orbital-bus-v1';

function readState(){
  try{ const s=JSON.parse(localStorage.getItem(STATE_KEY)); if(s && s.rocket && s.clock && s.events) return s; }catch(e){}
  return defaultState();
}
function writeState(s){
  s._v = (s._v||0) + 1;
  try{ localStorage.setItem(STATE_KEY, JSON.stringify(s)); }catch(e){}
  const bus=getBus(); if(bus){ try{ bus.postMessage(s._v); }catch(e){} }
  return s;
}
let _bus = null;
function getBus(){ if(_bus===null){ try{ _bus=new BroadcastChannel(BUS_NAME); }catch(e){ _bus=undefined; } } return _bus||null; }

/* subscribe(cb): cb(state) fires once now and on every change from any page */
function subscribe(cb){
  let lastV = null;
  function check(){ const s=readState(); if(s._v!==lastV){ lastV=s._v; cb(s); } }
  const bus=getBus(); if(bus) bus.addEventListener('message', check);
  window.addEventListener('storage', e=>{ if(e.key===STATE_KEY) check(); });
  setInterval(check, 300);   // robust fallback for OBS browser sources
  check();
}

/* ---------- clock math (pure; operate on clock object) ---------- */
function currentT(clock){
  if(!clock) return null;
  if(clock.mode==='hold') return clock.holdT;
  if(clock.t0==null) return null;
  return (Date.now()-clock.t0)/1000;
}
function clkSetCountdown(sec){ return {mode:'counting', t0:Date.now()+sec*1000, holdT:null}; }
function clkSetT0(epochMs){ return {mode:'counting', t0:epochMs, holdT:null}; }   // absolute liftoff instant
function clkHold(clock){ const t=currentT(clock); return {mode:'hold', t0:clock.t0, holdT:(t==null?0:t)}; }
function clkResume(clock){ return {mode:'counting', t0:Date.now()-(clock.holdT||0)*1000, holdT:null}; }

function fmt(sec){
  const sign = sec<=0?'−':'+';   // T-0 stays in countdown (T−) notation
  const a=Math.abs(sec);
  const hh=String(Math.floor(a/3600)).padStart(2,'0');
  const mm=String(Math.floor((a%3600)/60)).padStart(2,'0');
  const ss=String(Math.floor(a%60)).padStart(2,'0');
  return {sign, str:`${hh}:${mm}:${ss}`, full:`T${sign}${hh}:${mm}:${ss}`};
}
function statusInfo(clock){
  const t=currentT(clock);
  if(clock && clock.mode==='hold') return {cls:'hold', key:'st_hold'};
  if(t==null) return {cls:'standby', key:'st_standby'};
  if(t<0) return {cls:t>-600?'go':'count', key:'st_tminus'};
  return {cls:'flight', key:'st_inflight'};
}
function activePhase(state){
  const t=currentT(state.clock);
  if(t==null) return {now:null, next:null};   // now === null → prelaunch
  const e=[...state.events].sort((a,b)=>a.t-b.t);
  let now=null, next=null;
  for(const ev of e){ if(ev.t<=t) now=ev.l; else { next=ev; break; } }
  return {now, next};
}
function parseT(str){
  str=(str||'').trim().toUpperCase().replace(/^T/,'');
  let sign=1;
  if(str[0]==='+'){str=str.slice(1);} else if(str[0]==='-'||str[0]==='−'){sign=-1;str=str.slice(1);}
  str=str.trim(); if(str==='') return 0;
  const p=str.split(':').map(x=>parseInt(x,10)||0);
  let sec=0;
  if(p.length===3) sec=p[0]*3600+p[1]*60+p[2];
  else if(p.length===2) sec=p[0]*60+p[1];
  else sec=p[0];
  return sign*sec;
}

/* ---------- weather ---------- */
function wxClear(){return `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="9" fill="#ffd36b"/><g stroke="#ffd36b" stroke-width="2.4" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180;return `<line x1="${24+13*Math.cos(r)}" y1="${24+13*Math.sin(r)}" x2="${24+18*Math.cos(r)}" y2="${24+18*Math.sin(r)}"/>`}).join('')}</g></svg>`}
function wxCloud(){return `<svg viewBox="0 0 48 48" fill="none"><path d="M14 32a7 7 0 010-14 9 9 0 0117-2 6 6 0 011 12H14z" fill="#aebccf"/></svg>`}
function wxRain(){return `<svg viewBox="0 0 48 48" fill="none"><path d="M14 28a7 7 0 010-14 9 9 0 0117-2 6 6 0 011 12H14z" fill="#8fa2b8"/><g stroke="#4a8cff" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="33" x2="16" y2="39"/><line x1="26" y1="33" x2="24" y2="39"/><line x1="34" y1="33" x2="32" y2="39"/></g></svg>`}
function wxSnow(){return `<svg viewBox="0 0 48 48" fill="none"><path d="M14 28a7 7 0 010-14 9 9 0 0117-2 6 6 0 011 12H14z" fill="#aebccf"/><g fill="#dff"><circle cx="18" cy="36" r="1.6"/><circle cx="26" cy="38" r="1.6"/><circle cx="33" cy="36" r="1.6"/></g></svg>`}
function wxFog(){return `<svg viewBox="0 0 48 48" fill="none"><g stroke="#aebccf" stroke-width="3" stroke-linecap="round"><line x1="10" y1="20" x2="38" y2="20"/><line x1="12" y1="26" x2="36" y2="26"/><line x1="10" y1="32" x2="38" y2="32"/></g></svg>`}
function wxStorm(){return `<svg viewBox="0 0 48 48" fill="none"><path d="M14 26a7 7 0 010-14 9 9 0 0117-2 6 6 0 011 12H14z" fill="#7a8aa0"/><path d="M24 28l-5 8h5l-3 7 9-11h-5l4-4z" fill="#ffd36b"/></svg>`}
const WMO={0:['Clear',wxClear],1:['Mostly Clear',wxClear],2:['Partly Cloudy',wxCloud],3:['Overcast',wxCloud],45:['Fog',wxFog],48:['Rime Fog',wxFog],51:['Light Drizzle',wxRain],53:['Drizzle',wxRain],55:['Drizzle',wxRain],61:['Light Rain',wxRain],63:['Rain',wxRain],65:['Heavy Rain',wxRain],71:['Light Snow',wxSnow],73:['Snow',wxSnow],75:['Heavy Snow',wxSnow],80:['Showers',wxRain],81:['Showers',wxRain],82:['Heavy Showers',wxRain],95:['Thunderstorm',wxStorm],96:['Thunderstorm',wxStorm],99:['Thunderstorm',wxStorm]};
const dirName=d=>['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(d/22.5)%16];

function computeVerdict(w){ let n=false; if(w.gust>=40) n=true; if([65,75,82,95,96,99].includes(w.code)) n=true; if(w.vis<3) n=true; return n?'NO-GO':'GO'; }

/* fetch live weather for a site key; resolves to a weather object (live or simulated) */
async function fetchWeather(siteKey){
  const site=SITES[siteKey]||SITES.slc40;
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${site.lat}&longitude=${site.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,surface_pressure,weather_code,visibility&wind_speed_unit=kmh&timezone=auto`;
  let w;
  try{
    const r=await fetch(url); if(!r.ok) throw 0; const c=(await r.json()).current;
    w={temp:Math.round(c.temperature_2m),hum:Math.round(c.relative_humidity_2m),wind:Math.round(c.wind_speed_10m),gust:Math.round(c.wind_gusts_10m??c.wind_speed_10m*1.4),dir:c.wind_direction_10m,cloud:Math.round(c.cloud_cover),pres:Math.round(c.surface_pressure),vis:c.visibility!=null?+(c.visibility/1000).toFixed(1):10,code:c.weather_code,site:siteKey,region:site.region,live:true};
  }catch(e){
    const j=()=>Math.random(); const seed=[...siteKey].reduce((a,c)=>a+c.charCodeAt(0),0);
    w={temp:Math.round(14+(seed%18)+j()*6),hum:Math.round(45+j()*40),wind:Math.round(8+j()*22),gust:Math.round(14+j()*28),dir:Math.round(j()*360),cloud:Math.round(j()*100),pres:Math.round(1009+j()*16),vis:+(8+j()*7).toFixed(1),code:[0,1,2,3,61,80][Math.floor(j()*6)],site:siteKey,region:site.region,live:false};
  }
  w.verdict=computeVerdict(w);
  return w;
}

/* ---------- ticker items ---------- */
function tickerItems(state){
  const lang=state.lang||'en', r=state.rocket, wx=state.weather, p=activePhase(state);
  const phaseNow = p.now==null ? tr('prelaunch',lang) : evLabel(p.now, lang);
  return [
    [tr('tk_vehicle',lang),r.name],[tr('tk_mission',lang),state.mission],[tr('tk_site',lang),SITES[state.site].name],
    [tr('tk_height',lang),r.height],[tr('tk_mass',lang),r.mass],[tr('tk_s1',lang),r.s1eng],[tr('tk_thrust',lang),r.s1thrust],
    [tr('tk_payload',lang),r.payload],[tr('tk_s2',lang),r.s2eng],[tr('tk_phase',lang),phaseNow],
    p.next?[tr('tk_next',lang),`${fmt(p.next.t).full} ${evLabel(p.next.l,lang)}`]:null,
    wx?[tr('tk_wind',lang),`${wx.wind} km/h`]:null, wx?[tr('tk_temp',lang),`${wx.temp}°C`]:null, wx?[tr('tk_wx',lang),wxVerdictText(wx.verdict,lang)]:null,
  ].filter(Boolean);
}

const $ = id => document.getElementById(id);

/* escape user-supplied text before it goes into innerHTML templates */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
