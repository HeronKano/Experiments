
(function(){
'use strict';

const canvas=document.getElementById('world'),ctx=canvas.getContext('2d');
const mini=document.getElementById('mini'),mctx=mini.getContext('2d');
const $=id=>document.getElementById(id);
const WORLD={w:2800,h:1800};
const state={
  time:0,paused:false,speed:1,last:performance.now(),acc:0,nextId:1,
  units:[],buildings:[],nodes:[],shots:[],particles:[],events:[],
  factions:[],selected:[],mode:'select',winner:null,toastTimer:0
};
const camera={x:430,y:1250,z:.72};
const mouse={x:0,y:0,wx:0,wy:0,down:false,drag:false,sx:0,sy:0,cx:0,cy:0};

const FACTION_DATA=[
  ['Você','#59d5ff'],
  ['Carmim','#ff5e6c'],
  ['Âmbar','#ffbe55'],
  ['Violeta','#b985ff'],
  ['Esmeralda','#56d49b']
];
const UNIT={
  worker:{name:'Operário',r:8,hp:70,speed:72,damage:5,range:25,cd:1.1,cost:45,time:3.0},
  scout:{name:'Batedor',r:7,hp:65,speed:112,damage:10,range:85,cd:.75,cost:55,time:3.4},
  soldier:{name:'Soldado',r:10,hp:150,speed:67,damage:24,range:100,cd:.9,cost:75,time:4.4}
};
const BUILD={
  hq:{name:'Quartel-general',r:34,hp:1500,cost:0,territory:320},
  barracks:{name:'Quartel',r:27,hp:900,cost:160,territory:210},
  outpost:{name:'Posto avançado',r:23,hp:700,cost:140,territory:250}
};

function resize(){
  const r=canvas.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(r.width*d)); canvas.height=Math.max(1,Math.round(r.height*d));
  ctx.setTransform(d,0,0,d,0,0);
  mini.width=Math.round(mini.clientWidth*d); mini.height=Math.round(mini.clientHeight*d);
  mctx.setTransform(d,0,0,d,0,0);
}
window.addEventListener('resize',resize);

function rand(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function id(){return state.nextId++}
function faction(i){return state.factions[i]}
function entityById(v){return state.units.find(x=>x.id===v)||state.buildings.find(x=>x.id===v)}
function isEnemy(a,b){return a.f!==b.f && faction(a.f).alive && faction(b.f).alive}
function aliveEntity(e){return !!e && e.hp>0 && faction(e.f).alive}
function pushEvent(text,fid=null){
  state.events.unshift({text,fid,t:state.time});
  if(state.events.length>18)state.events.length=18;
  renderFeed();
}
function toast(text){
  const el=$('toast');el.textContent=text;el.classList.add('show');
  clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
function worldFromClient(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  const sx=clientX-r.left,sy=clientY-r.top;
  return {x:(sx-r.width/2)/camera.z+camera.x,y:(sy-r.height/2)/camera.z+camera.y,sx,sy};
}
function screenFromWorld(x,y){
  const r=canvas.getBoundingClientRect();
  return {x:(x-camera.x)*camera.z+r.width/2,y:(y-camera.y)*camera.z+r.height/2};
}

function makeFaction(i,name,color){
  return {
    id:i,name,color,res:260,alive:true,kills:0,losses:0,
    ai:i>0?{
      think:rand(.4,1.2),expand:rand(8,16),attack:rand(10,18),
      aggression:rand(.8,1.28),desiredOutposts:2+Math.floor(rand(0,3))
    }:null
  };
}
function addBuilding(type,f,x,y){
  const t=BUILD[type];
  const b={id:id(),kind:'building',type,f,x,y,r:t.r,hp:t.hp,maxHp:t.hp,queue:[],cool:0};
  state.buildings.push(b);return b;
}
function addUnit(type,f,x,y){
  if(state.units.length>=360)return null;
  const t=UNIT[type];
  const u={id:id(),kind:'unit',type,f,x,y,r:t.r,hp:t.hp,maxHp:t.hp,
    speed:t.speed,damage:t.damage,range:t.range,attackCd:0,
    order:{type:type==='worker'?'autoGather':'idle'},vx:0,vy:0,gatherCd:rand(0,.7)};
  state.units.push(u);return u;
}
function spawnAround(b,type){
  const a=rand(0,Math.PI*2),rr=b.r+30;
  return addUnit(type,b.f,b.x+Math.cos(a)*rr,b.y+Math.sin(a)*rr);
}
function addNode(x,y){
  state.nodes.push({id:id(),kind:'node',x,y,r:13,pulse:rand(0,6.28)});
}
function nearest(arr,p,filter=()=>true){
  let best=null,bd=Infinity;
  for(const x of arr){if(!filter(x))continue;const d=dist(x,p);if(d<bd){bd=d;best=x}}
  return best;
}
function ownBuildings(fid){return state.buildings.filter(b=>b.f===fid)}
function ownUnits(fid,type=null){return state.units.filter(u=>u.f===fid&&(!type||u.type===type))}
function enemyEntities(fid){return [...state.units,...state.buildings].filter(e=>e.f!==fid&&faction(e.f).alive)}
function baseOf(fid){return state.buildings.find(b=>b.f===fid&&b.type==='hq')||ownBuildings(fid)[0]}

function reset(){
  state.time=0;state.nextId=1;state.units=[];state.buildings=[];state.nodes=[];
  state.shots=[];state.particles=[];state.events=[];state.selected=[];state.winner=null;
  state.mode='select';
  state.factions=FACTION_DATA.map((x,i)=>makeFaction(i,x[0],x[1]));
  const starts=[
    [360,1450],[420,330],[2380,330],[2390,1450],[1420,850]
  ];
  for(let i=0;i<starts.length;i++){
    const [x,y]=starts[i],hq=addBuilding('hq',i,x,y);
    addBuilding('barracks',i,x+85*(i%2?1:-1),y+55);
    for(let n=0;n<4;n++)spawnAround(hq,'worker');
    for(let n=0;n<3;n++)spawnAround(hq,'soldier');
    if(i>0)spawnAround(hq,'scout');
  }
  for(let i=0;i<54;i++){
    let x,y,ok=false,tries=0;
    while(!ok&&tries++<60){
      x=rand(120,WORLD.w-120);y=rand(120,WORLD.h-120);
      ok=starts.every(s=>Math.hypot(x-s[0],y-s[1])>180)&&state.nodes.every(n=>Math.hypot(x-n.x,y-n.y)>75);
    }
    if(ok)addNode(x,y);
  }
  camera.x=520;camera.y=1320;camera.z=.72;
  $('endgame').classList.remove('show');
  pushEvent('A disputa pelo continente começou.');
  updateUI();
}
function queueUnit(fid,type,buildingType){
  const f=faction(fid),price=UNIT[type].cost;
  if(!f.alive||f.res<price)return false;
  const b=ownBuildings(fid).find(x=>x.type===buildingType&&x.queue.length<3);
  if(!b)return false;
  f.res-=price;b.queue.push({type,t:UNIT[type].time});
  return true;
}
function playerTrain(type){
  const src=type==='worker'?'hq':'barracks';
  if(!queueUnit(0,type,src))toast('Recursos ou edifício insuficientes.');
}
function canPlaceBuilding(fid,type,x,y){
  if(x<50||y<50||x>WORLD.w-50||y>WORLD.h-50)return false;
  if(state.buildings.some(b=>Math.hypot(x-b.x,y-b.y)<b.r+BUILD[type].r+30))return false;
  if(fid===0){
    const workers=state.selected.map(entityById).filter(e=>e&&e.kind==='unit'&&e.f===0&&e.type==='worker');
    if(!workers.length)return false;
    if(!workers.some(w=>Math.hypot(x-w.x,y-w.y)<300))return false;
  }
  return true;
}
function placeBuilding(fid,type,x,y,free=false){
  const f=faction(fid),cost=BUILD[type].cost;
  if(!free&&f.res<cost)return false;
  if(!canPlaceBuilding(fid,type,x,y)&&fid===0)return false;
  if(!free)f.res-=cost;
  const b=addBuilding(type,fid,x,y);
  b.hp=Math.round(b.maxHp*.35);
  b.constructing=6;
  pushEvent(f.name+' ergueu '+BUILD[type].name.toLowerCase()+'.',fid);
  return b;
}

function setMode(mode){
  state.mode=mode;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  const hints={
    select:'Toque numa unidade ou edifício. Arraste o mapa para navegar.',
    move:'Toque no terreno para mover as unidades selecionadas.',
    attack:'Toque numa unidade ou edifício inimigo para atacar.',
    outpost:'Selecione ao menos um operário e toque perto dele para construir um posto (140).',
    barracks:'Selecione ao menos um operário e toque perto dele para construir um quartel (160).'
  };
  $('modeHint').textContent=hints[mode]||'';
}
function selectedEntities(){return state.selected.map(entityById).filter(Boolean)}
function selectEntity(e,append=false){
  if(!append)state.selected=[];
  if(e&&e.f===0&&!state.selected.includes(e.id))state.selected.push(e.id);
  updateSelection();
}
function selectArmy(){
  state.selected=ownUnits(0).filter(u=>u.type!=='worker').map(u=>u.id);
  updateSelection();toast('Exército selecionado: '+state.selected.length+' unidades.');
}
function issueMove(x,y){
  const us=selectedEntities().filter(e=>e.kind==='unit'&&e.f===0);
  if(!us.length){toast('Selecione unidades primeiro.');return}
  const cols=Math.ceil(Math.sqrt(us.length)),gap=28;
  us.forEach((u,i)=>{
    const ox=(i%cols-(cols-1)/2)*gap,oy=(Math.floor(i/cols)-(Math.ceil(us.length/cols)-1)/2)*gap;
    u.order={type:'move',x:clamp(x+ox,20,WORLD.w-20),y:clamp(y+oy,20,WORLD.h-20)};
  });
}
function issueAttack(target){
  const us=selectedEntities().filter(e=>e.kind==='unit'&&e.f===0&&e.type!=='worker');
  if(!us.length){toast('Selecione unidades de combate.');return}
  if(!target||target.f===0){toast('Escolha um alvo inimigo.');return}
  us.forEach(u=>u.order={type:'attack',target:target.id});
}

function handleTap(wx,wy,append=false){
  const hit=pick(wx,wy);
  if(state.mode==='move'){issueMove(wx,wy);setMode('select');return}
  if(state.mode==='attack'){issueAttack(hit);setMode('select');return}
  if(state.mode==='outpost'||state.mode==='barracks'){
    const type=state.mode==='outpost'?'outpost':'barracks';
    const b=placeBuilding(0,type,wx,wy);
    if(!b)toast('Não é possível construir aqui.');
    else toast(BUILD[type].name+' em construção.');
    setMode('select');return;
  }
  if(hit&&hit.f===0)selectEntity(hit,append); else if(!append)selectEntity(null);
}
function pick(x,y){
  let hit=null,bd=Infinity;
  for(const e of [...state.units,...state.buildings]){
    const d=Math.hypot(x-e.x,y-e.y);
    if(d<e.r+8/camera.z&&d<bd){hit=e;bd=d}
  }
  return hit;
}

canvas.addEventListener('pointerdown',e=>{
  canvas.setPointerCapture(e.pointerId);
  const p=worldFromClient(e.clientX,e.clientY);
  Object.assign(mouse,{down:true,drag:false,sx:e.clientX,sy:e.clientY,cx:camera.x,cy:camera.y,x:p.sx,y:p.sy,wx:p.x,wy:p.y});
});
canvas.addEventListener('pointermove',e=>{
  const p=worldFromClient(e.clientX,e.clientY);mouse.x=p.sx;mouse.y=p.sy;mouse.wx=p.x;mouse.wy=p.y;
  if(mouse.down){
    const dx=e.clientX-mouse.sx,dy=e.clientY-mouse.sy;
    if(Math.hypot(dx,dy)>9)mouse.drag=true;
    if(mouse.drag&&state.mode==='select'){
      camera.x=clamp(mouse.cx-dx/camera.z,0,WORLD.w);
      camera.y=clamp(mouse.cy-dy/camera.z,0,WORLD.h);
    }
  }
});
canvas.addEventListener('pointerup',e=>{
  const p=worldFromClient(e.clientX,e.clientY);
  if(mouse.down&&!mouse.drag)handleTap(p.x,p.y,e.shiftKey);
  mouse.down=false;mouse.drag=false;
});
canvas.addEventListener('contextmenu',e=>{
  e.preventDefault();
  const p=worldFromClient(e.clientX,e.clientY),hit=pick(p.x,p.y);
  if(hit&&hit.f!==0)issueAttack(hit);else issueMove(p.x,p.y);
});
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const before=worldFromClient(e.clientX,e.clientY);
  camera.z=clamp(camera.z*Math.exp(-e.deltaY*.001),.35,1.55);
  const after=worldFromClient(e.clientX,e.clientY);
  camera.x+=before.x-after.x;camera.y+=before.y-after.y;
},{passive:false});
mini.addEventListener('pointerdown',e=>{
  const r=mini.getBoundingClientRect();
  camera.x=clamp((e.clientX-r.left)/r.width*WORLD.w,0,WORLD.w);
  camera.y=clamp((e.clientY-r.top)/r.height*WORLD.h,0,WORLD.h);
});

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('trainWorker').onclick=()=>playerTrain('worker');
$('trainScout').onclick=()=>playerTrain('scout');
$('trainSoldier').onclick=()=>playerTrain('soldier');
$('selectArmy').onclick=selectArmy;
$('pauseBtn').onclick=()=>{state.paused=!state.paused;$('pauseBtn').textContent=state.paused?'▶':'⏸';};
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{
  state.speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));
});
$('resetBtn').onclick=reset;$('restartBtn').onclick=reset;

function moveToward(u,x,y,dt){
  const dx=x-u.x,dy=y-u.y,d=Math.hypot(dx,dy);
  if(d<1)return true;
  const step=Math.min(d,u.speed*dt);u.vx=dx/d*u.speed;u.vy=dy/d*u.speed;
  u.x+=dx/d*step;u.y+=dy/d*step;
  u.x=clamp(u.x,8,WORLD.w-8);u.y=clamp(u.y,8,WORLD.h-8);
  return d<6;
}
function localEnemy(u,range){
  return nearest([...state.units,...state.buildings],u,e=>isEnemy(u,e)&&dist(u,e)<range);
}
function applyDamage(target,amount,attacker){
  if(!aliveEntity(target))return;
  target.hp-=amount;
  state.particles.push({x:target.x,y:target.y,t:.3,r:target.r+6,color:faction(attacker.f).color});
  if(target.hp<=0)killEntity(target,attacker);
}
function killEntity(e,killer){
  faction(e.f).losses++;faction(killer.f).kills++;
  if(e.kind==='building'){
    pushEvent(faction(killer.f).name+' destruiu '+BUILD[e.type].name.toLowerCase()+' de '+faction(e.f).name+'.',killer.f);
    if(e.type==='hq')eliminateFaction(e.f,killer.f);
  }
  state.selected=state.selected.filter(x=>x!==e.id);
}
function eliminateFaction(fid,by){
  const f=faction(fid);if(!f.alive)return;
  f.alive=false;
  pushEvent(f.name+' foi eliminado por '+faction(by).name+'.',by);
  state.units.forEach(u=>{if(u.f===fid)u.hp=0});
  state.buildings.forEach(b=>{if(b.f===fid)b.hp=0});
  if(fid===0)toast('Você foi eliminado. As IAs continuarão lutando.');
}
function updateConstruction(dt){
  for(const b of state.buildings){
    if(b.constructing>0){
      b.constructing-=dt;b.hp=Math.min(b.maxHp,b.hp+b.maxHp/6*dt);
      continue;
    }
    if(b.queue.length){
      b.queue[0].t-=dt;
      if(b.queue[0].t<=0){spawnAround(b,b.queue[0].type);b.queue.shift()}
    }
  }
}
function updateGather(dt){
  for(const u of state.units){
    if(u.type!=='worker'||u.hp<=0)continue;
    u.gatherCd-=dt;
    if(u.order.type==='move'||u.order.type==='attack')continue;
    let n=u.order.target?state.nodes.find(x=>x.id===u.order.target):null;
    if(!n||dist(u,n)>600)n=nearest(state.nodes,u);
    if(!n)continue;
    u.order={type:'autoGather',target:n.id};
    const d=dist(u,n);
    if(d>30)moveToward(u,n.x,n.y,dt);
    else if(u.gatherCd<=0){
      let mult=1;
      const out=ownBuildings(u.f).find(b=>b.type==='outpost'&&dist(b,n)<210);
      if(out)mult=1.45;
      faction(u.f).res+=5*mult;u.gatherCd=1.05;
      state.particles.push({x:n.x+rand(-6,6),y:n.y+rand(-6,6),t:.45,r:3,color:'#c6f56d'});
    }
  }
}
function updateCombat(dt){
  for(const u of state.units){
    if(u.hp<=0||u.type==='worker')continue;
    u.attackCd-=dt;
    let target=u.order.type==='attack'?entityById(u.order.target):null;
    if(!aliveEntity(target)||!isEnemy(u,target)){
      target=localEnemy(u,u.type==='scout'?200:170);
      if(target)u.order={type:'attack',target:target.id};
      else if(u.order.type==='attack')u.order={type:'idle'};
    }
    if(target){
      const d=dist(u,target);
      if(d>u.range+target.r)moveToward(u,target.x,target.y,dt);
      else if(u.attackCd<=0){
        u.attackCd=UNIT[u.type].cd;
        state.shots.push({x:u.x,y:u.y,tx:target.x,ty:target.y,t:.12,color:faction(u.f).color});
        applyDamage(target,u.damage,u);
      }
    }else if(u.order.type==='move'){
      if(moveToward(u,u.order.x,u.order.y,dt))u.order={type:'idle'};
    }
  }
}
function updateWorkersMove(dt){
  for(const u of state.units){
    if(u.hp<=0||u.type!=='worker')continue;
    if(u.order.type==='move'&&moveToward(u,u.order.x,u.order.y,dt))u.order={type:'autoGather'};
  }
}
function separation(){
  const us=state.units;
  for(let i=0;i<us.length;i++){
    const a=us[i];if(a.hp<=0)continue;
    for(let j=i+1;j<us.length;j++){
      const b=us[j];if(b.hp<=0)continue;
      const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,min=a.r+b.r+2;
      if(d2>0&&d2<min*min){
        const d=Math.sqrt(d2),push=(min-d)*.11,nx=dx/d,ny=dy/d;
        a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
      }
    }
  }
}
function strength(fid,x,y,r=99999){
  let s=0;
  for(const u of state.units)if(u.f===fid&&u.type!=='worker'&&Math.hypot(u.x-x,u.y-y)<r)s+=u.hp/u.maxHp*(u.type==='soldier'?1.4:1);
  return s;
}
function chooseExpansion(fid){
  const own=ownBuildings(fid),en=enemyEntities(fid);
  const candidates=state.nodes.filter(n=>
    own.every(b=>dist(n,b)>330)&&
    en.filter(e=>e.kind==='building').every(b=>dist(n,b)>300)
  );
  if(!candidates.length)return null;
  let best=null,score=-Infinity;
  for(const n of candidates){
    const hq=baseOf(fid),d=hq?dist(hq,n):1000;
    const nearNodes=state.nodes.filter(x=>dist(x,n)<260).length;
    const danger=en.reduce((m,e)=>Math.min(m,dist(e,n)),9999);
    const sc=danger<220 ? -500 : nearNodes*110-d*.06+Math.min(danger,700)*.25+rand(0,80);
    if(sc>score){score=sc;best=n}
  }
  return best;
}
function commandGroup(us,target){
  us.forEach((u,i)=>{
    const a=(i/us.length)*Math.PI*2,rr=18+Math.floor(i/8)*22;
    u.order={type:'attack',target:target.id,offsetX:Math.cos(a)*rr,offsetY:Math.sin(a)*rr};
  });
}
function aiThink(fid,dt){
  const f=faction(fid),ai=f.ai;if(!f.alive)return;
  ai.think-=dt;ai.expand-=dt;ai.attack-=dt;if(ai.think>0)return;ai.think=rand(.65,1.15);
  const hq=baseOf(fid);if(!hq)return;
  const workers=ownUnits(fid,'worker'),soldiers=ownUnits(fid,'soldier'),scouts=ownUnits(fid,'scout'),outs=ownBuildings(fid).filter(b=>b.type==='outpost');
  const barracks=ownBuildings(fid).filter(b=>b.type==='barracks');

  const threat=nearest(enemyEntities(fid),hq,e=>dist(e,hq)<500);
  if(threat){
    const defenders=[...soldiers,...scouts].filter(u=>dist(u,hq)<850);
    defenders.forEach(u=>u.order={type:'attack',target:threat.id});
  }

  const targetWorkers=Math.min(11,5+outs.length*2);
  if(workers.length<targetWorkers&&f.res>=UNIT.worker.cost)queueUnit(fid,'worker','hq');
  if(!barracks.length&&f.res>=BUILD.barracks.cost){
    const a=rand(0,6.28);placeBuilding(fid,'barracks',hq.x+Math.cos(a)*115,hq.y+Math.sin(a)*115);
  }
  if(f.res>=UNIT.soldier.cost&&soldiers.length<28)queueUnit(fid,'soldier','barracks');
  if(f.res>=UNIT.scout.cost&&scouts.length<3&&Math.random()<.25)queueUnit(fid,'scout','barracks');

  if(ai.expand<=0&&outs.length<ai.desiredOutposts&&f.res>=BUILD.outpost.cost){
    const n=chooseExpansion(fid);
    if(n){
      const a=rand(0,6.28),px=n.x+Math.cos(a)*45,py=n.y+Math.sin(a)*45;
      placeBuilding(fid,'outpost',px,py);
      ai.expand=rand(18,30);
    }else ai.expand=10;
  }

  if(ai.attack<=0){
    const army=[...soldiers,...scouts].filter(u=>u.hp>0);
    if(army.length>=5){
      let target=null,best=Infinity;
      for(const b of state.buildings){
        if(b.f===fid||!faction(b.f).alive)continue;
        const d=dist(hq,b),value=(b.type==='hq'?-.35:b.type==='outpost'?-.15:0);
        const enemyS=strength(b.f,b.x,b.y,440),ourS=army.reduce((s,u)=>s+(u.type==='soldier'?1.4:1),0);
        const risk=enemyS>ourS*ai.aggression?700:0;
        const sc=d*(1+value)+risk;
        if(sc<best){best=sc;target=b}
      }
      if(target){
        const local=army.filter(u=>dist(u,hq)<1300||Math.random()<.45);
        commandGroup(local,target);
        pushEvent(f.name+' lançou uma ofensiva contra '+faction(target.f).name+'.',fid);
      }
    }
    ai.attack=rand(16,29)/ai.aggression;
  }
}
function updateAI(dt){for(let i=1;i<state.factions.length;i++)aiThink(i,dt)}
function updateBuildings(dt){
  for(const b of state.buildings){
    if(b.constructing>0||b.hp<=0)continue;
    if(b.type==='outpost'){
      const t=nearest(state.units,b,u=>isEnemy(b,u)&&dist(b,u)<175);
      b.cool=(b.cool||0)-dt;
      if(t&&b.cool<=0){b.cool=1.25;applyDamage(t,13,b);state.shots.push({x:b.x,y:b.y,tx:t.x,ty:t.y,t:.14,color:faction(b.f).color})}
    }
  }
}
function cleanup(){
  state.units=state.units.filter(u=>u.hp>0);
  state.buildings=state.buildings.filter(b=>b.hp>0);
  state.shots=state.shots.filter(s=>(s.t-=.1)>0);
  state.particles=state.particles.filter(p=>(p.t-=.1)>0);
}
function checkWinner(){
  const alive=state.factions.filter(f=>f.alive);
  if(alive.length===1&&!state.winner){
    state.winner=alive[0].id;state.paused=true;
    $('endTitle').textContent=alive[0].id===0?'Vitória':'Vitória de '+alive[0].name;
    $('endText').textContent=alive[0].id===0?'Você conquistou o continente.':'A última potência sobrevivente dominou o mapa.';
    $('endgame').classList.add('show');
  }
}
function step(dt){
  state.time+=dt;
  updateConstruction(dt);updateAI(dt);updateGather(dt);updateWorkersMove(dt);updateCombat(dt);updateBuildings(dt);
  separation();
  if(Math.floor(state.time*10)%10===0)cleanup();
  checkWinner();
}

function drawTerrain(){
  ctx.fillStyle='#15231c';ctx.fillRect(0,0,WORLD.w,WORLD.h);
  ctx.strokeStyle='rgba(200,230,210,.055)';ctx.lineWidth=1/camera.z;
  for(let x=0;x<=WORLD.w;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD.h);ctx.stroke()}
  for(let y=0;y<=WORLD.h;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD.w,y);ctx.stroke()}
  const patches=[[790,520,180,90],[1650,320,220,110],[2050,980,240,130],[1030,1360,240,100],[1500,1080,120,180]];
  for(const p of patches){
    ctx.fillStyle='rgba(55,91,59,.25)';ctx.beginPath();ctx.ellipse(p[0],p[1],p[2],p[3],.3,0,6.28);ctx.fill();
  }
}
function drawTerritory(){
  for(const b of state.buildings){
    const c=faction(b.f).color,r=BUILD[b.type].territory;
    const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,r);
    g.addColorStop(0,hexAlpha(c,.12));g.addColorStop(1,hexAlpha(c,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,r,0,6.28);ctx.fill();
  }
}
function hexAlpha(hex,a){
  const h=hex.replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function drawNodes(){
  for(const n of state.nodes){
    n.pulse+=.02;const r=11+Math.sin(n.pulse)*1.5;
    ctx.fillStyle='#b5ea61';ctx.strokeStyle='#e1ffad';ctx.lineWidth=2/camera.z;
    ctx.beginPath();ctx.moveTo(n.x,n.y-r);ctx.lineTo(n.x+r,n.y);ctx.lineTo(n.x,n.y+r);ctx.lineTo(n.x-r,n.y);ctx.closePath();ctx.fill();ctx.stroke();
  }
}
function drawBuilding(b){
  const c=faction(b.f).color,sel=state.selected.includes(b.id);
  ctx.save();ctx.translate(b.x,b.y);
  ctx.fillStyle='#10191f';ctx.strokeStyle=c;ctx.lineWidth=(sel?4:2)/camera.z;
  if(b.type==='hq'){
    ctx.beginPath();ctx.rect(-26,-26,52,52);ctx.fill();ctx.stroke();
    ctx.fillStyle=c;ctx.fillRect(-12,-12,24,24);
  }else if(b.type==='barracks'){
    ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(26,20);ctx.lineTo(-26,20);ctx.closePath();ctx.fill();ctx.stroke();
  }else{
    ctx.beginPath();ctx.arc(0,0,22,0,6.28);ctx.fill();ctx.stroke();
    ctx.fillStyle=c;ctx.fillRect(-3,-30,6,30);ctx.fillRect(3,-29,14,8);
  }
  if(b.constructing>0){ctx.strokeStyle='#fff';ctx.setLineDash([5/camera.z,4/camera.z]);ctx.beginPath();ctx.arc(0,0,b.r+9,0,6.28);ctx.stroke();ctx.setLineDash([])}
  ctx.restore();drawHp(b);
}
function drawUnit(u){
  const c=faction(u.f).color,sel=state.selected.includes(u.id);
  ctx.save();ctx.translate(u.x,u.y);
  ctx.fillStyle=c;ctx.strokeStyle=sel?'#fff':'rgba(0,0,0,.75)';ctx.lineWidth=(sel?2.5:1.5)/camera.z;
  if(u.type==='worker'){
    ctx.beginPath();ctx.rect(-7,-7,14,14);ctx.fill();ctx.stroke();
  }else if(u.type==='scout'){
    ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,7);ctx.lineTo(-7,-7);ctx.closePath();ctx.fill();ctx.stroke();
  }else{
    ctx.beginPath();ctx.arc(0,0,10,0,6.28);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#e9f7ff';ctx.lineWidth=2/camera.z;ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(14,0);ctx.stroke();
  }
  ctx.restore();
  if(u.hp<u.maxHp*.75||sel)drawHp(u);
}
function drawHp(e){
  const w=Math.max(22,e.r*1.8),y=e.y-e.r-10,h=4;
  ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(e.x-w/2,y,w,h);
  ctx.fillStyle=e.hp/e.maxHp>.45?'#77df83':'#ff766f';ctx.fillRect(e.x-w/2,y,w*clamp(e.hp/e.maxHp,0,1),h);
}
function drawEffects(){
  for(const s of state.shots){ctx.strokeStyle=s.color;ctx.lineWidth=2/camera.z;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.tx,s.ty);ctx.stroke()}
  for(const p of state.particles){ctx.globalAlpha=clamp(p.t*2,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();ctx.globalAlpha=1}
}
function drawOrders(){
  for(const e of selectedEntities()){
    if(e.kind!=='unit')continue;
    if(e.order.type==='move'){
      ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1/camera.z;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.order.x,e.order.y);ctx.stroke();
    }
  }
}
function render(){
  const r=canvas.getBoundingClientRect();
  ctx.clearRect(0,0,r.width,r.height);
  ctx.save();
  ctx.translate(r.width/2,r.height/2);ctx.scale(camera.z,camera.z);ctx.translate(-camera.x,-camera.y);
  drawTerrain();drawTerritory();drawNodes();
  state.buildings.sort((a,b)=>a.y-b.y).forEach(drawBuilding);
  state.units.sort((a,b)=>a.y-b.y).forEach(drawUnit);
  drawEffects();drawOrders();
  ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=2/camera.z;ctx.strokeRect(0,0,WORLD.w,WORLD.h);
  ctx.restore();
  renderMini();updateUI();
}
function renderMini(){
  const r=mini.getBoundingClientRect(),w=r.width,h=r.height,sx=w/WORLD.w,sy=h/WORLD.h;
  mctx.clearRect(0,0,w,h);mctx.fillStyle='#101d18';mctx.fillRect(0,0,w,h);
  for(const n of state.nodes){mctx.fillStyle='#a4d95d';mctx.fillRect(n.x*sx-1,n.y*sy-1,2,2)}
  for(const b of state.buildings){mctx.fillStyle=faction(b.f).color;mctx.fillRect(b.x*sx-2,b.y*sy-2,4,4)}
  for(const u of state.units){if(u.type==='worker')continue;mctx.fillStyle=faction(u.f).color;mctx.fillRect(u.x*sx,u.y*sy,2,2)}
  const cr=canvas.getBoundingClientRect(),vw=cr.width/camera.z,vh=cr.height/camera.z;
  mctx.strokeStyle='#fff';mctx.lineWidth=1;mctx.strokeRect((camera.x-vw/2)*sx,(camera.y-vh/2)*sy,vw*sx,vh*sy);
}
function formatTime(){
  const m=Math.floor(state.time/5),year=1+Math.floor(m/12),month=m%12+1;
  return 'Ano '+year+' · mês '+month;
}
function updateSelection(){
  const arr=selectedEntities(),el=$('selectionInfo');
  if(!arr.length){el.innerHTML='<div class="title">Nada selecionado</div><div class="sub">Selecione suas unidades ou estruturas.</div>';return}
  if(arr.length>1){
    const types={};arr.forEach(e=>types[e.type]=(types[e.type]||0)+1);
    el.innerHTML='<div class="title">'+arr.length+' unidades selecionadas</div><div class="sub">'+Object.entries(types).map(([t,n])=>n+'× '+(UNIT[t]?UNIT[t].name:BUILD[t].name)).join(' · ')+'</div>';
    return;
  }
  const e=arr[0],t=e.kind==='unit'?UNIT[e.type]:BUILD[e.type];
  el.innerHTML='<div class="title">'+t.name+'</div><div class="sub">PV '+Math.ceil(e.hp)+' / '+e.maxHp+'</div><div class="bar"><i style="width:'+clamp(e.hp/e.maxHp*100,0,100)+'%"></i></div>'+
    (e.kind==='building'&&e.queue.length?'<div class="sub">Fila: '+e.queue.map(q=>UNIT[q.type].name).join(', ')+'</div>':'');
}
function renderFactions(){
  $('factions').innerHTML=state.factions.map(f=>{
    const bs=ownBuildings(f.id).length,us=ownUnits(f.id).length;
    return '<div class="faction" style="opacity:'+(f.alive?1:.35)+'"><i class="dot" style="background:'+f.color+'"></i><div><b>'+f.name+'</b><br><small>'+us+' unidades · '+bs+' bases</small></div><b>'+Math.floor(f.res)+'</b></div>';
  }).join('');
}
function renderFeed(){
  const el=$('feed');if(!el)return;
  el.innerHTML=state.events.slice(0,10).map(e=>'<div class="event">'+e.text+'</div>').join('');
}
function updateUI(){
  $('resource').textContent=Math.floor(faction(0)?.res||0);
  $('unitCount').textContent=ownUnits(0).length;
  $('worldTime').textContent=formatTime();
  $('aliveCount').textContent=state.factions.filter(f=>f.alive).length;
  updateSelection();renderFactions();
}
function loop(now){
  const raw=Math.min(.1,(now-state.last)/1000);state.last=now;
  if(!state.paused&&!state.winner){
    state.acc+=raw*state.speed;
    const FIX=.05;
    let guard=0;
    while(state.acc>=FIX&&guard++<12){step(FIX);state.acc-=FIX}
  }
  render();requestAnimationFrame(loop);
}

resize();reset();setMode('select');requestAnimationFrame(loop);
})();
