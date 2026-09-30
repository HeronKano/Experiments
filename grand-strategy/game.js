
(function(){
'use strict';

var canvas=document.getElementById('world');
var ctx=canvas.getContext('2d');
var W=canvas.width,H=canvas.height;
var N_REALMS=28;
var HEX=18;
var DX=HEX*1.5;
var DY=Math.sqrt(3)*HEX;

var realmNames=[
'Aurélia','Nordmark','Verdânia','Drávia','Selênia','Orthen','Karsovia','Ilíria',
'Vesper','Arken','Meren','Talassar','Ruthenia','Belvar','Cyranor','Dalmor',
'Estravia','Falken','Galdor','Helvec','Iskaria','Jorvik','Korven','Lysara',
'Moravia','Nereth','Ostara','Prydain'
];
var traits=['expansionista','mercantil','militarista','diplomático','industrial','cauteloso','oportunista'];
var goods=['Grãos','Ferro','Madeira','Sal','Tecidos','Cavalos'];
var goodSymbols=['●','◆','♣','◇','▦','♞'];

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rnd(a,b){return (b===undefined?0:b)+Math.random()*((b===undefined?a:a)- (b===undefined?0:b));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function key(a,b){return a<b?a+'-'+b:b+'-'+a;}
function colorFor(i){return 'hsl('+((i*137.508)%360).toFixed(1)+',58%,55%)';}
function relClass(v){return v>35?'pos':v<-35?'neg':'neu';}

var state=null;

function generateWorld(){
  var provinces=[];
  var byCoord={};
  var id=0;
  for(var q=0;q<42;q++){
    for(var r=0;r<23;r++){
      var x=48+q*DX;
      var y=38+(r+(q%2)*0.5)*DY;
      if(x>W-35||y>H-28)continue;
      var nx=(x-W*0.50)/(W*0.48);
      var ny=(y-H*0.50)/(H*0.45);
      var edge=nx*nx+ny*ny;
      var noise=Math.sin(q*0.73+r*0.37)*0.11+Math.cos(q*0.31-r*0.81)*0.08;
      var bay=(q>29&&q<35&&r>7&&r<14)?0.38:0;
      var gulf=(q>8&&q<14&&r>13)?0.28:0;
      if(edge+bay+gulf>1.0+noise)continue;
      var p={id:id++,q:q,r:r,x:x,y:y,o:-1,dev:Math.round(rnd(11,4)),pop:rnd(18,5),res:Math.floor(rnd(goods.length)),fort:0,unrest:0,capital:false};
      provinces.push(p);byCoord[q+','+r]=p;
    }
  }
  var even=[[0,-1],[1,-1],[1,0],[0,1],[-1,0],[-1,-1]];
  var odd=[[0,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
  provinces.forEach(function(p){
    var dirs=p.q%2?odd:even;
    p.nei=[];
    dirs.forEach(function(d){
      var n=byCoord[(p.q+d[0])+','+(p.r+d[1])];
      if(n)p.nei.push(n.id);
    });
  });

  var seeds=[];
  var candidates=provinces.slice();
  var first=pick(candidates);seeds.push(first);
  while(seeds.length<N_REALMS){
    var best=null,score=-1;
    for(var i=0;i<candidates.length;i++){
      var p=candidates[i],mind=1e9;
      for(var j=0;j<seeds.length;j++){
        var d=Math.hypot(p.x-seeds[j].x,p.y-seeds[j].y);
        if(d<mind)mind=d;
      }
      var coast=p.nei.length<6?20:0;
      var s=mind+coast+rnd(18,0);
      if(s>score){score=s;best=p;}
    }
    seeds.push(best);
  }

  provinces.forEach(function(p){
    var bi=0,bd=1e9;
    for(var i=0;i<seeds.length;i++){
      var d=Math.hypot(p.x-seeds[i].x,p.y-seeds[i].y);
      if(d<bd){bd=d;bi=i;}
    }
    if(bd<58+rnd(10,-4))p.o=bi;
  });
  seeds.forEach(function(s,i){s.o=i;s.capital=true;});

  var realms=[];
  for(var i=0;i<N_REALMS;i++){
    var t=traits[i%traits.length];
    realms.push({
      id:i,n:realmNames[i],color:colorFor(i),trait:t,alive:true,
      gold:rnd(330,180),manpower:rnd(120,65),army:rnd(58,30),tech:rnd(1.22,.82),
      stability:rnd(84,57),prestige:rnd(45,8),warEx:0,income:0,
      aggression: t==='militarista'?rnd(1.35,1.05):t==='expansionista'?rnd(1.25,.98):rnd(1.0,.45),
      diplomacy:t==='diplomático'?rnd(1.35,1.05):rnd(1.0,.5),
      commerce:t==='mercantil'?rnd(1.35,1.05):rnd(1.0,.55),
      caution:t==='cauteloso'?rnd(1.4,1.1):rnd(1.05,.65),
      capital:seeds[i].id,kills:0
    });
  }
  return {provinces:provinces,realms:realms};
}

function reset(){
  var world=generateWorld();
  var rel={};
  for(var i=0;i<N_REALMS;i++)for(var j=i+1;j<N_REALMS;j++)rel[key(i,j)]=Math.round(rnd(50,-30));
  state={
    days:0,running:true,speed:1,layer:'political',
    provinces:world.provinces,realms:world.realms,relations:rel,
    alliances:new Set(),trade:new Set(),wars:[],campaigns:[],events:[],
    battles:0,selected:null,prices:goods.map(function(){return rnd(1.55,.7);}),
    lastEco:0,lastDip:0,lastStrat:0,lastColonize:0,lastRenderSide:0
  };
  log('diplo','O equilíbrio continental começou com <b>'+N_REALMS+' Estados soberanos</b>.');
  renderAllPanels();
}
function owned(fid){return state.provinces.filter(function(p){return p.o===fid;});}
function realm(fid){return state.realms[fid];}
function relation(a,b){if(a===b)return 100;return state.relations[key(a,b)]||0;}
function setRelation(a,b,v){if(a!==b)state.relations[key(a,b)]=clamp(v,-100,100);}
function allied(a,b){return state.alliances.has(key(a,b));}
function trading(a,b){return state.trade.has(key(a,b));}
function activeWar(a,b){
  return state.wars.find(function(w){return !w.ended&&((w.a===a&&w.b===b)||(w.a===b&&w.b===a));});
}
function warsOf(fid){return state.wars.filter(function(w){return !w.ended&&(w.a===fid||w.b===fid);});}
function enemies(fid){
  var out=[];
  warsOf(fid).forEach(function(w){out.push(w.a===fid?w.b:w.a);});
  return out;
}
function neighborsOf(fid){
  var set=new Set();
  owned(fid).forEach(function(p){
    p.nei.forEach(function(nid){
      var o=state.provinces[nid].o;
      if(o>=0&&o!==fid)set.add(o);
    });
  });
  return Array.from(set);
}
function borderProvs(a,b){
  return owned(a).filter(function(p){
    return p.nei.some(function(n){return state.provinces[n].o===b;});
  });
}
function frontierTarget(a,b){
  var list=[];
  borderProvs(a,b).forEach(function(p){
    p.nei.forEach(function(nid){
      var t=state.provinces[nid];
      if(t.o===b)list.push(t);
    });
  });
  if(!list.length)return null;
  list.sort(function(x,y){return strategicProvinceValue(y,a)-strategicProvinceValue(x,a);});
  return list[0];
}
function strategicProvinceValue(p,attacker){
  var v=p.dev*1.3+p.pop*.35+(p.capital?26:0)+p.fort*5;
  var friendly=p.nei.filter(function(n){return state.provinces[n].o===attacker;}).length;
  return v+friendly*4+rnd(4,0);
}
function power(fid){
  var r=realm(fid);if(!r||!r.alive)return 0;
  var prov=owned(fid).length;
  return (r.army*(.72+r.tech*.35))*(1-r.warEx*.004)+prov*2+r.manpower*.08+r.gold*.012;
}
function threatTo(fid,other){
  var p=power(other)/(power(fid)+1);
  var border=neighborsOf(fid).indexOf(other)>=0?1.18:1;
  var hostile=relation(fid,other)<-20?1.18:1;
  return p*border*hostile;
}
function log(type,text){
  state.events.unshift({day:state.days,type:type,text:text});
  if(state.events.length>180)state.events.length=180;
  renderFeed();
}
function dateText(){
  var d=new Date(1444,0,1);d.setDate(d.getDate()+Math.floor(state.days));
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).replace('.','');
}
function year(){return 1444+Math.floor(state.days/365);}

function economyTick(){
  state.realms.forEach(function(r){
    if(!r.alive)return;
    var ps=owned(r.id);
    if(!ps.length){eliminate(r.id);return;}
    var dev=0,pop=0,resValue=0;
    ps.forEach(function(p){dev+=p.dev;pop+=p.pop;resValue+=state.prices[p.res];});
    var tradeCount=0;
    state.trade.forEach(function(k){if(k.split('-').map(Number).indexOf(r.id)>=0)tradeCount++;});
    var base=dev*.42+pop*.08+resValue*.35;
    var tradeBonus=tradeCount*(2.8*r.commerce);
    var warCost=warsOf(r.id).length*r.army*.035;
    r.income=base+tradeBonus-warCost;
    r.gold+=r.income;
    r.manpower+=pop*.016;
    r.warEx=clamp(r.warEx+(warsOf(r.id).length?1.35:-1.0),0,100);
    r.stability=clamp(r.stability+rnd(.8,-.7)-r.warEx*.005,15,95);

    var desiredArmy=ps.length*(3.3+(r.trait==='militarista'?1.2:0));
    if(r.army<desiredArmy&&r.manpower>6&&r.gold>18){
      var recruit=Math.min(r.manpower*.055,desiredArmy-r.army,5+r.tech*2);
      r.army+=recruit;r.manpower-=recruit;r.gold-=recruit*1.9;
    }
    if(r.gold>120&&Math.random()<.18){
      var p=pick(ps);
      p.dev=clamp(p.dev+1,3,20);
      r.gold-=25;
    }
    if(r.gold>160&&Math.random()<.08){
      r.tech+=.006;r.gold-=38;
    }
    if(r.gold>135&&Math.random()<.08){
      var fp=pick(ps.filter(function(p){return p.fort<3;}));
      if(fp){fp.fort++;r.gold-=32;}
    }
    ps.forEach(function(p){
      p.pop=clamp(p.pop*(1+rnd(.0025,.0004)),3,40);
      p.unrest=clamp(p.unrest+rnd(.5,-.65)+(r.stability<40?.35:0),0,100);
    });
  });

  for(var g=0;g<goods.length;g++){
    var supply=0;
    state.provinces.forEach(function(p){if(p.o>=0&&realm(p.o).alive&&p.res===g)supply+=p.dev;});
    var target=1.35+(150-supply)*.0016;
    state.prices[g]=clamp(state.prices[g]*.9+target*.1+rnd(.025,-.025),.5,2.6);
  }
}

function colonizeTick(){
  var order=state.realms.filter(function(r){return r.alive;}).sort(function(a,b){return power(b.id)-power(a.id);});
  order.forEach(function(r){
    if(r.gold<45||r.manpower<8)return;
    var options=[];
    owned(r.id).forEach(function(p){
      p.nei.forEach(function(nid){
        var n=state.provinces[nid];
        if(n.o===-1&&options.indexOf(n)<0)options.push(n);
      });
    });
    if(!options.length)return;
    options.sort(function(a,b){
      return strategicProvinceValue(b,r.id)-strategicProvinceValue(a,r.id);
    });
    var chance=(r.trait==='expansionista'?.78:.46)*(warsOf(r.id).length?0.35:1);
    if(Math.random()<chance){
      var p=options[0];p.o=r.id;
      r.gold-=42;r.manpower-=5;r.prestige+=.7;
      if(Math.random()<.16)log('diplo','<b>'+r.n+'</b> incorporou novas terras de fronteira.');
    }
  });
}

function formTrade(a,b){
  var k=key(a,b);if(state.trade.has(k)||activeWar(a,b))return;
  state.trade.add(k);setRelation(a,b,relation(a,b)+7);
  log('trade','<b>'+realm(a).n+'</b> e <b>'+realm(b).n+'</b> abriram um pacto comercial.');
}
function formAlliance(a,b){
  var k=key(a,b);if(state.alliances.has(k)||activeWar(a,b))return;
  state.alliances.add(k);setRelation(a,b,relation(a,b)+15);
  log('diplo','<b>'+realm(a).n+'</b> e <b>'+realm(b).n+'</b> formaram uma aliança.');
}
function breakDeals(a,b){
  var k=key(a,b);
  if(state.alliances.delete(k))log('diplo','A aliança entre <b>'+realm(a).n+'</b> e <b>'+realm(b).n+'</b> foi dissolvida.');
  state.trade.delete(k);
}
function diplomacyTick(){
  var alive=state.realms.filter(function(r){return r.alive;});
  for(var i=0;i<alive.length;i++){
    for(var j=i+1;j<alive.length;j++){
      var a=alive[i],b=alive[j],v=relation(a.id,b.id);
      var delta=rnd(.9,-.9);
      if(allied(a.id,b.id))delta+=.55;
      if(trading(a.id,b.id))delta+=.25;
      if(neighborsOf(a.id).indexOf(b.id)>=0)delta-=.08;
      if(activeWar(a.id,b.id))delta-=1.5;
      setRelation(a.id,b.id,v+delta);
    }
  }

  alive.forEach(function(a){
    if(Math.random()>.62)return;
    var candidates=alive.filter(function(b){return b.id!==a.id&&!activeWar(a.id,b.id);});
    candidates.sort(function(x,y){
      var sx=relation(a.id,x.id)+a.diplomacy*12-threatTo(a.id,x.id)*5;
      var sy=relation(a.id,y.id)+a.diplomacy*12-threatTo(a.id,y.id)*5;
      return sy-sx;
    });
    var b=candidates[0];if(!b)return;
    var rv=relation(a.id,b.id);
    if(!trading(a.id,b.id)&&rv>22&&Math.random()<.28*a.commerce)formTrade(a.id,b.id);

    var strongest=neighborsOf(a.id).sort(function(x,y){return power(y)-power(x);})[0];
    var balancing=strongest!==undefined&&threatTo(a.id,strongest)>1.25;
    if(!allied(a.id,b.id)&&rv>50&&Math.random()<.12*a.diplomacy*(balancing?1.8:1)){
      formAlliance(a.id,b.id);
    }
    if(allied(a.id,b.id)&&rv<5&&Math.random()<.35)breakDeals(a.id,b.id);
  });
}

function warDesire(a,b){
  var ra=realm(a),rb=realm(b);
  var ratio=power(a)/(power(b)+1);
  var rv=relation(a,b);
  var opportunity=1+rb.warEx*.008+warsOf(b).length*.18;
  var border=neighborsOf(a).indexOf(b)>=0?1:0;
  if(!border||allied(a,b)||activeWar(a,b))return 0;
  var caution=ra.caution;
  var relationFactor=rv<-50?1.55:rv<-20?1.1:rv<10?.55:.12;
  var expansion=ra.trait==='expansionista'?1.35:1;
  var prestigeNeed=ra.prestige<20?1.12:1;
  return ratio*opportunity*relationFactor*expansion*prestigeNeed*ra.aggression/caution;
}
function declareWar(a,b){
  if(a===b||!realm(a).alive||!realm(b).alive||activeWar(a,b)||allied(a,b))return false;
  breakDeals(a,b);
  setRelation(a,b,-100);
  var w={id:Date.now()+Math.random(),a:a,b:b,start:state.days,score:0,battles:0,ended:false,lastBattle:state.days};
  state.wars.push(w);
  log('war','⚔ <b>'+realm(a).n+'</b> declarou guerra a <b>'+realm(b).n+'</b>.');

  var defenders=[];
  state.realms.forEach(function(r){
    if(r.alive&&r.id!==a&&r.id!==b&&allied(b,r.id)&&!allied(a,r.id)&&warsOf(r.id).length<2)defenders.push(r.id);
  });
  defenders.slice(0,1).forEach(function(x){
    if(Math.random()<.72){
      log('war','<b>'+realm(x).n+'</b> honrou a aliança com '+realm(b).n+'.');
      declareWar(a,x);
    }
  });
  return true;
}
function strategicTick(){
  var alive=state.realms.filter(function(r){return r.alive;});
  alive.forEach(function(a){
    if(warsOf(a.id).length>=2)return;
    var targets=neighborsOf(a.id).filter(function(b){return realm(b).alive&&!allied(a.id,b)&&!activeWar(a.id,b);});
    if(!targets.length)return;
    var scored=targets.map(function(b){return {b:b,s:warDesire(a.id,b)};}).sort(function(x,y){return y.s-x.s;});
    if(scored[0]&&scored[0].s>1.05&&Math.random()<.19*clamp(scored[0].s,0,2.5))declareWar(a.id,scored[0].b);
  });

  state.wars.filter(function(w){return !w.ended;}).forEach(function(w){
    if(state.days-w.lastBattle>rnd(42,24)){
      launchCampaign(w);
      w.lastBattle=state.days;
    }
    var age=state.days-w.start;
    if(age>210&&(Math.abs(w.score)>34||realm(w.a).warEx>75||realm(w.b).warEx>75)&&Math.random()<.26)makePeace(w);
    else if(age>720&&Math.random()<.22)makePeace(w);
  });
}

function launchCampaign(w){
  if(!realm(w.a).alive||!realm(w.b).alive){w.ended=true;return;}
  var attacker,defender;
  var pa=power(w.a)*(1+rnd(.12,-.12)),pb=power(w.b)*(1+rnd(.12,-.12));
  if(pa>pb){attacker=w.a;defender=w.b;}else{attacker=w.b;defender=w.a;}
  if(Math.random()<.35){var tmp=attacker;attacker=defender;defender=tmp;}
  var target=frontierTarget(attacker,defender);
  if(!target)return;
  var source=pick(borderProvs(attacker,defender));
  if(!source)return;
  state.campaigns.push({
    war:w.id,attacker:attacker,defender:defender,from:source.id,to:target.id,
    start:state.days,duration:rnd(32,18),done:false
  });
}
function resolveCampaign(c){
  var w=state.wars.find(function(x){return x.id===c.war;});
  if(!w||w.ended)return;
  var a=realm(c.attacker),d=realm(c.defender),p=state.provinces[c.to];
  if(!a.alive||!d.alive||p.o!==c.defender)return;
  var friendlyBorders=p.nei.filter(function(n){return state.provinces[n].o===c.attacker;}).length;
  var atk=a.army*(.11+rnd(.07,.01))*a.tech*(1-a.warEx*.004)*(1+friendlyBorders*.08);
  var def=d.army*(.095+rnd(.07,.01))*d.tech*(1+p.fort*.18)*(1+d.stability*.002);
  var total=atk+def+1;
  var lossA=clamp(def/total*a.army*rnd(.12,.06),1,a.army*.22);
  var lossD=clamp(atk/total*d.army*rnd(.13,.065),1,d.army*.24);
  a.army-=lossA;d.army-=lossD;a.manpower=Math.max(0,a.manpower-lossA*.25);d.manpower=Math.max(0,d.manpower-lossD*.3);
  a.warEx=clamp(a.warEx+lossA*.11,0,100);d.warEx=clamp(d.warEx+lossD*.11,0,100);
  state.battles++;w.battles++;

  var attackWins=atk*rnd(1.13,.9)>def;
  if(attackWins){
    p.o=c.attacker;p.unrest=clamp(p.unrest+24,0,100);
    if(p.capital){
      p.capital=false;
      var repl=owned(c.defender).sort(function(x,y){return y.dev-x.dev;})[0];
      if(repl){repl.capital=true;d.capital=repl.id;}
    }
    var swing=6+p.dev+(p.capital?12:0);
    w.score+=(w.a===c.attacker?1:-1)*swing;
    a.prestige+=1.5;d.stability-=1.8;
    log('battle','⚔ <b>'+a.n+'</b> tomou uma província de <b>'+d.n+'</b>.');
    if(owned(c.defender).length===0)eliminate(c.defender,c.attacker);
  }else{
    w.score+=(w.a===c.attacker?-1:1)*(3+p.fort*2);
    log('battle','🛡 <b>'+d.n+'</b> repeliu uma ofensiva de <b>'+a.n+'</b>.');
  }
}
function makePeace(w){
  if(w.ended)return;
  w.ended=true;
  state.campaigns=state.campaigns.filter(function(c){return c.war!==w.id;});
  var winner=w.score===0?null:(w.score>0?w.a:w.b);
  var loser=winner===null?null:(winner===w.a?w.b:w.a);
  if(winner!==null&&realm(winner).alive){
    realm(winner).prestige+=5;realm(loser).stability-=3;
    log('war','☮ <b>'+realm(winner).n+'</b> encerrou a guerra em posição vantajosa contra <b>'+realm(loser).n+'</b>.');
  }else{
    log('war','☮ <b>'+realm(w.a).n+'</b> e <b>'+realm(w.b).n+'</b> firmaram paz sem vencedor claro.');
  }
  if(realm(w.a))realm(w.a).warEx*=.72;
  if(realm(w.b))realm(w.b).warEx*=.72;
  setRelation(w.a,w.b,-52);
}
function eliminate(fid,by){
  var r=realm(fid);if(!r||!r.alive)return;
  r.alive=false;r.army=0;
  state.alliances.forEach(function(k){if(k.split('-').map(Number).indexOf(fid)>=0)state.alliances.delete(k);});
  state.trade.forEach(function(k){if(k.split('-').map(Number).indexOf(fid)>=0)state.trade.delete(k);});
  state.wars.forEach(function(w){if(!w.ended&&(w.a===fid||w.b===fid))w.ended=true;});
  log('war','☠ <b>'+r.n+'</b> deixou de existir como Estado soberano'+(by!==undefined?' após ser absorvido por <b>'+realm(by).n+'</b>.':'.'));
}
function updateCampaigns(){
  state.campaigns.forEach(function(c){
    if(c.done)return;
    var t=(state.days-c.start)/c.duration;
    if(t>=1){c.done=true;resolveCampaign(c);}
  });
  state.campaigns=state.campaigns.filter(function(c){return !c.done&&state.days-c.start<120;});
}

function randomEvent(){
  if(Math.random()>.018)return;
  var alive=state.realms.filter(function(r){return r.alive;});
  var r=pick(alive);if(!r)return;
  var roll=Math.random();
  if(roll<.25){r.gold+=35;log('trade','Uma safra excepcional elevou a receita de <b>'+r.n+'</b>.');}
  else if(roll<.5){r.stability=clamp(r.stability-8,0,100);log('diplo','Distúrbios internos reduziram a estabilidade de <b>'+r.n+'</b>.');}
  else if(roll<.75){r.tech+=.018;log('diplo','<b>'+r.n+'</b> realizou um avanço administrativo e militar.');}
  else{r.manpower+=18;log('diplo','Um crescimento demográfico fortaleceu <b>'+r.n+'</b>.');}
}

function update(dt){
  if(!state.running)return;
  state.days+=dt/1000*state.speed*2.0;
  updateCampaigns();
  if(state.days-state.lastEco>=30){state.lastEco=state.days;economyTick();randomEvent();}
  if(state.days-state.lastColonize>=55){state.lastColonize=state.days;colonizeTick();}
  if(state.days-state.lastDip>=75){state.lastDip=state.days;diplomacyTick();}
  if(state.days-state.lastStrat>=48){state.lastStrat=state.days;strategicTick();}
}

function hexPath(p){
  ctx.beginPath();
  for(var i=0;i<6;i++){
    var a=Math.PI/3*i;
    var x=p.x+HEX*Math.cos(a),y=p.y+HEX*Math.sin(a);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
}
function econColor(dev){
  var t=clamp((dev-3)/17,0,1);
  var g=Math.round(75+t*110),r=Math.round(45+t*65),b=Math.round(55+t*20);
  return 'rgb('+r+','+g+','+b+')';
}
function relationColor(v){
  if(v>45)return '#4f9d73';
  if(v<-45)return '#a84f56';
  return '#777d84';
}
function draw(){
  ctx.clearRect(0,0,W,H);
  var grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#102a39');grad.addColorStop(1,'#071a25');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

  state.provinces.forEach(function(p){
    hexPath(p);
    var fill='#26333b';
    if(p.o>=0){
      if(state.layer==='political')fill=realm(p.o).color;
      else if(state.layer==='economy')fill=econColor(p.dev);
      else if(state.layer==='relations'&&state.selected&&state.selected.kind==='realm')fill=relationColor(relation(state.selected.id,p.o));
      else fill=realm(p.o).color;
    }
    ctx.fillStyle=fill;ctx.fill();
    ctx.strokeStyle='#0b141b';ctx.lineWidth=1;ctx.stroke();
  });

  state.provinces.forEach(function(p){
    if(p.o<0)return;
    p.nei.forEach(function(nid){
      var n=state.provinces[nid];
      if(n.o===p.o)return;
      var dx=n.x-p.x,dy=n.y-p.y,len=Math.hypot(dx,dy),mx=(p.x+n.x)/2,my=(p.y+n.y)/2;
      if(len===0)return;
      var px=-dy/len*HEX*.53,py=dx/len*HEX*.53;
      ctx.strokeStyle='#071019';ctx.lineWidth=3.2;
      ctx.beginPath();ctx.moveTo(mx-px,my-py);ctx.lineTo(mx+px,my+py);ctx.stroke();
    });
  });

  state.provinces.forEach(function(p){
    if(p.capital&&p.o>=0&&realm(p.o).alive){
      ctx.fillStyle='#fff2b5';ctx.font='15px Georgia';ctx.textAlign='center';ctx.fillText('★',p.x,p.y+5);
    }
  });

  state.campaigns.forEach(function(c){
    var a=state.provinces[c.from],b=state.provinces[c.to];if(!a||!b)return;
    var t=clamp((state.days-c.start)/c.duration,0,1);
    var x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    ctx.strokeStyle=realm(c.attacker).color;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x,y);ctx.stroke();
    ctx.fillStyle='#0a0f14';ctx.strokeStyle=realm(c.attacker).color;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.stroke();
  });

  if(state.selected&&state.selected.kind==='province'){
    var sp=state.provinces[state.selected.id];
    if(sp){hexPath(sp);ctx.strokeStyle='#fff6c8';ctx.lineWidth=4;ctx.stroke();}
  }

  drawRealmLabels();
}
function drawRealmLabels(){
  ctx.textAlign='center';ctx.textBaseline='middle';
  state.realms.forEach(function(r){
    if(!r.alive)return;
    var ps=owned(r.id);if(ps.length<2)return;
    var sx=0,sy=0;ps.forEach(function(p){sx+=p.x;sy+=p.y;});
    sx/=ps.length;sy/=ps.length;
    ctx.font='700 '+clamp(9+Math.sqrt(ps.length)*1.1,10,18)+'px Georgia';
    ctx.lineWidth=3;ctx.strokeStyle='rgba(4,8,11,.75)';ctx.strokeText(r.n,sx,sy);
    ctx.fillStyle='#f4f0df';ctx.fillText(r.n,sx,sy);
  });
}

function pointInHex(x,y,p){
  var dx=Math.abs(x-p.x),dy=Math.abs(y-p.y);
  if(dx>HEX||dy>DY/2)return false;
  return Math.sqrt(3)*dx+dy<=Math.sqrt(3)*HEX;
}
function canvasPos(e){
  var r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,rx:e.clientX-r.left,ry:e.clientY-r.top};
}
canvas.addEventListener('mousemove',function(e){
  var m=canvasPos(e),p=null;
  for(var i=0;i<state.provinces.length;i++){if(pointInHex(m.x,m.y,state.provinces[i])){p=state.provinces[i];break;}}
  var tip=document.getElementById('tooltip');
  if(!p){tip.style.display='none';return;}
  tip.style.display='block';tip.style.left=Math.min(m.rx+14,canvas.clientWidth-175)+'px';tip.style.top=Math.max(6,m.ry-10)+'px';
  if(p.o<0)tip.innerHTML='<b>Fronteira não reclamada</b><span>desenvolvimento '+p.dev+' · '+goods[p.res]+'</span>';
  else{
    var r=realm(p.o);
    tip.innerHTML='<b>'+r.n+'</b><span>província · dev '+p.dev+' · pop '+Math.round(p.pop)+'k · '+goods[p.res]+'</span>';
  }
});
canvas.addEventListener('mouseleave',function(){document.getElementById('tooltip').style.display='none';});
canvas.addEventListener('click',function(e){
  var m=canvasPos(e),p=null;
  for(var i=0;i<state.provinces.length;i++){if(pointInHex(m.x,m.y,state.provinces[i])){p=state.provinces[i];break;}}
  if(!p)return;
  state.selected={kind:'province',id:p.id};
  renderSelected();
  document.querySelectorAll('.tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab==='selected');});
  document.querySelectorAll('.tabpane').forEach(function(x){x.classList.toggle('active',x.id==='selected');});
});

function renderFeed(){
  var el=document.getElementById('feed');if(!el||!state)return;
  el.innerHTML=state.events.slice(0,55).map(function(e){
    return '<div class="event '+e.type+'"><time>'+Math.floor(e.day)+'d</time>'+e.text+'</div>';
  }).join('');
}
function renderRealmList(){
  var list=state.realms.slice().sort(function(a,b){
    if(a.alive!==b.alive)return a.alive?-1:1;
    return power(b.id)-power(a.id);
  });
  document.getElementById('realmList').innerHTML=list.map(function(r){
    var ps=owned(r.id);
    return '<div class="realmrow" data-realm="'+r.id+'" style="opacity:'+(r.alive?1:.35)+'">'+
      '<div class="rhead"><strong style="color:'+r.color+'">'+r.n+'</strong><span class="badge">'+r.trait+'</span></div>'+
      '<div class="subline"><span>'+ps.length+' prov.</span><span>Poder '+Math.round(power(r.id))+'</span><span>Exército '+Math.round(r.army)+'</span></div>'+
      '<div class="meters"><div class="meter"><i style="width:'+clamp(r.stability,0,100)+'%;background:#6fc18c"></i></div>'+
      '<div class="meter"><i style="width:'+clamp(r.warEx,0,100)+'%;background:#e26f76"></i></div></div></div>';
  }).join('');
  document.querySelectorAll('.realmrow').forEach(function(row){
    row.onclick=function(){
      var rid=Number(row.dataset.realm);state.selected={kind:'realm',id:rid};renderSelected();
      document.querySelectorAll('.tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab==='selected');});
      document.querySelectorAll('.tabpane').forEach(function(x){x.classList.toggle('active',x.id==='selected');});
    };
  });
}
function renderDiplo(){
  var alive=state.realms.filter(function(r){return r.alive;});
  var pairs=[];
  for(var i=0;i<alive.length;i++)for(var j=i+1;j<alive.length;j++){
    var a=alive[i],b=alive[j],v=relation(a.id,b.id);
    if(allied(a.id,b.id)||activeWar(a.id,b.id)||neighborsOf(a.id).indexOf(b.id)>=0)pairs.push({a:a,b:b,v:v});
  }
  pairs.sort(function(x,y){
    var sx=activeWar(x.a.id,x.b.id)?1000:allied(x.a.id,x.b.id)?500:Math.abs(x.v);
    var sy=activeWar(y.a.id,y.b.id)?1000:allied(y.a.id,y.b.id)?500:Math.abs(y.v);
    return sy-sx;
  });
  document.getElementById('diploMatrix').innerHTML='<div class="matrix">'+pairs.slice(0,38).map(function(p){
    var tags=[];
    if(activeWar(p.a.id,p.b.id))tags.push('<span class="tag">GUERRA</span>');
    if(allied(p.a.id,p.b.id))tags.push('<span class="tag">ALIANÇA</span>');
    if(trading(p.a.id,p.b.id))tags.push('<span class="tag">COMÉRCIO</span>');
    return '<div class="pair"><div class="pairhead"><span>'+p.a.n+' ↔ '+p.b.n+'</span><b class="relation '+relClass(p.v)+'">'+Math.round(p.v)+'</b></div><div class="tags">'+tags.join('')+'</div></div>';
  }).join('')+'</div>';
}
function renderSelected(){
  var el=document.getElementById('selectedInfo');
  if(!state.selected){el.innerHTML='<div class="empty">Clique em uma província ou Estado no mapa.</div>';return;}
  if(state.selected.kind==='province'){
    var p=state.provinces[state.selected.id];
    if(p.o<0){
      el.innerHTML='<div class="inspect"><h2>Fronteira</h2><div class="owner">terra ainda não reclamada</div><div class="stats"><div class="stat"><span>Desenvolvimento</span><b>'+p.dev+'</b></div><div class="stat"><span>Recurso</span><b>'+goods[p.res]+'</b></div></div></div>';return;
    }
    var r=realm(p.o);
    el.innerHTML='<div class="inspect"><h2>'+r.n+'</h2><div class="owner">província '+(p.capital?'· CAPITAL':'')+'</div>'+
      '<div class="stats"><div class="stat"><span>Desenvolvimento</span><b>'+p.dev+'</b></div><div class="stat"><span>População</span><b>'+Math.round(p.pop)+'k</b></div>'+
      '<div class="stat"><span>Recurso</span><b>'+goods[p.res]+'</b></div><div class="stat"><span>Fortificação</span><b>'+p.fort+'</b></div></div>'+
      '<p>Estado: '+r.trait+'. Poder agregado '+Math.round(power(r.id))+'.</p></div>';
  }else{
    var rr=realm(state.selected.id),ps=owned(rr.id),ens=enemies(rr.id);
    el.innerHTML='<div class="inspect"><h2 style="color:'+rr.color+'">'+rr.n+'</h2><div class="owner">'+rr.trait+' · '+(rr.alive?'Estado soberano':'extinto')+'</div>'+
      '<div class="stats"><div class="stat"><span>Províncias</span><b>'+ps.length+'</b></div><div class="stat"><span>Exército</span><b>'+Math.round(rr.army)+'</b></div>'+
      '<div class="stat"><span>Tesouro</span><b>'+Math.round(rr.gold)+'</b></div><div class="stat"><span>Tecnologia</span><b>'+rr.tech.toFixed(2)+'</b></div>'+
      '<div class="stat"><span>Estabilidade</span><b>'+Math.round(rr.stability)+'</b></div><div class="stat"><span>Exaustão</span><b>'+Math.round(rr.warEx)+'</b></div></div>'+
      '<p>Renda mensal: '+rr.income.toFixed(1)+'. '+(ens.length?'Em guerra com '+ens.map(function(x){return realm(x).n;}).join(', ')+'.':'Em paz.')+'</p></div>';
  }
}
function renderMarket(){
  document.getElementById('market').innerHTML=goods.map(function(g,i){
    var w=clamp(state.prices[i]/2.6*100,5,100);
    return '<div class="commodity"><span>'+goodSymbols[i]+' '+g+'</span><div class="spark"><i style="width:'+w+'%"></i></div><b>'+state.prices[i].toFixed(2)+'</b></div>';
  }).join('');
}
function renderLegend(){
  document.getElementById('legend').innerHTML=
    '<span><i style="background:#26333b"></i>fronteira</span>'+
    '<span>★ capital</span><span>linhas grossas = fronteiras estatais</span><span>círculo = campanha militar</span>';
}
function renderAllPanels(){
  renderFeed();renderRealmList();renderDiplo();renderSelected();renderMarket();renderLegend();
}
function updateTop(){
  document.getElementById('dateLabel').textContent=dateText();
  document.getElementById('eraLabel').textContent='Ano '+year();
  document.getElementById('kpiRealms').textContent=state.realms.filter(function(r){return r.alive;}).length;
  document.getElementById('kpiWars').textContent=state.wars.filter(function(w){return !w.ended;}).length;
  document.getElementById('kpiTrade').textContent=state.alliances.size;
  document.getElementById('kpiBattles').textContent=state.battles;
  document.getElementById('simState').textContent=state.running?'RODANDO':'PAUSADO';
}
function maybeRefreshPanels(){
  if(state.days-state.lastRenderSide>10){
    state.lastRenderSide=state.days;renderRealmList();renderDiplo();renderMarket();
    if(state.selected)renderSelected();
  }
}
document.querySelectorAll('.tab').forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('active',x===b);});
    document.querySelectorAll('.tabpane').forEach(function(x){x.classList.toggle('active',x.id===b.dataset.tab);});
  });
});
document.querySelectorAll('.layer').forEach(function(b){
  b.addEventListener('click',function(){
    state.layer=b.dataset.layer;
    document.querySelectorAll('.layer').forEach(function(x){x.classList.toggle('active',x===b);});
  });
});
document.querySelectorAll('.speed').forEach(function(b){
  b.addEventListener('click',function(){
    state.speed=Number(b.dataset.speed);
    document.querySelectorAll('.speed').forEach(function(x){x.classList.toggle('active',x===b);});
  });
});
document.getElementById('pauseBtn').onclick=function(){
  state.running=!state.running;
  this.textContent=state.running?'⏸':'▶';
  this.classList.toggle('active',state.running);
};
document.getElementById('resetBtn').onclick=function(){reset();};

var last=performance.now();
function frame(now){
  var dt=Math.min(100,now-last);last=now;
  update(dt);draw();updateTop();maybeRefreshPanels();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
})();
