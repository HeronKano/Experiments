
(function(){
'use strict';

var canvas=document.getElementById('world'),ctx=canvas.getContext('2d');
var W=canvas.width,H=canvas.height;
var N=56,HEX=13.2,DX=HEX*1.5,DY=Math.sqrt(3)*HEX;

var names=[
'Aurélia','Nordmark','Verdânia','Drávia','Selênia','Orthen','Karsovia','Ilíria',
'Vesper','Arken','Meren','Talassar','Ruthenia','Belvar','Cyranor','Dalmor',
'Estravia','Falken','Galdor','Helvec','Iskaria','Jorvik','Korven','Lysara',
'Moravia','Nereth','Ostara','Prydain','Quorath','Ravenna','Sarmatia','Thyren',
'Uldria','Valdren','Westaria','Xandor','Ysmir','Zoravia','Aster','Brannor',
'Caelia','Dunmar','Eldwyn','Faron','Gresvia','Hadria','Ilyon','Jadvar',
'Kelmor','Lorica','Mavren','Norvia','Orelia','Pelas','Rovina','Sydria'
];
var doctrines=['agrária','mercantil','industrial','tecnocrática','militar','administrativa','equilibrada'];
var goods=[
{name:'Grãos',s:'●'}, {name:'Madeira',s:'♣'}, {name:'Ferro',s:'◆'},
{name:'Sal',s:'◇'}, {name:'Lã',s:'◈'}, {name:'Têxteis',s:'▦'}, {name:'Ferramentas',s:'⚒'}
];

function rand(a,b){return b+Math.random()*(a-b);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function pick(a){return a.length?a[Math.floor(Math.random()*a.length)]:null;}
function kpair(a,b){return a<b?a+'-'+b:b+'-'+a;}
function hue(i){return 'hsl('+((i*137.508)%360).toFixed(1)+',56%,54%)';}
function fmt(n){if(Math.abs(n)>=1000)return (n/1000).toFixed(1)+'k';return Math.round(n).toString();}
function sum(a){var s=0;for(var i=0;i<a.length;i++)s+=a[i];return s;}

var state;

function makeWorld(){
  var prov=[],lookup={},id=0,q,r;
  for(q=0;q<59;q++){
    for(r=0;r<32;r++){
      var x=25+q*DX,y=23+(r+(q%2)*.5)*DY;
      if(x>W-22||y>H-20)continue;
      var nx=(x-W*.5)/(W*.48),ny=(y-H*.5)/(H*.46);
      var shape=nx*nx+ny*ny;
      var noise=Math.sin(q*.61+r*.37)*.08+Math.cos(q*.28-r*.82)*.07;
      var bay1=(q>36&&q<43&&r>8&&r<16)?.23:0;
      var bay2=(q>9&&q<15&&r>19)?.18:0;
      var bay3=(q>23&&q<28&&r<7)?.16:0;
      if(shape+bay1+bay2+bay3>1.01+noise)continue;
      var height=(Math.sin(q*.47)+Math.cos(r*.63)+Math.sin((q+r)*.21))/3;
      var fertility=clamp(.7+Math.sin(q*.22-r*.29)*.22+rand(.18,-.12),.35,1.25);
      var resource;
      if(height>.48)resource=2;
      else if(height<-.45)resource=3;
      else if(Math.sin(q*.31+r*.44)>.48)resource=1;
      else if(Math.cos(q*.41-r*.23)>.55)resource=4;
      else resource=0;
      var p={
        id:id++,q:q,r:r,x:x,y:y,o:-1,capital:false,
        pop:rand(15,5),fertility:fertility,res:resource,
        farm:1+Math.floor(rand(2.2,0)),extract:1+Math.floor(rand(2.0,0)),
        workshop:Math.random()<.22?1:0,infra:1+Math.floor(rand(1.8,0)),
        urban:rand(.22,.04),fort:0,unrest:rand(8,0)
      };
      prov.push(p);lookup[q+','+r]=p;
    }
  }
  var even=[[0,-1],[1,-1],[1,0],[0,1],[-1,0],[-1,-1]];
  var odd=[[0,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
  prov.forEach(function(p){
    var dirs=p.q%2?odd:even;p.nei=[];
    dirs.forEach(function(d){var n=lookup[(p.q+d[0])+','+(p.r+d[1])];if(n)p.nei.push(n.id);});
  });

  var seeds=[pick(prov)];
  while(seeds.length<N){
    var best=null,bestScore=-1;
    for(var i=0;i<prov.length;i++){
      var p=prov[i],md=1e9;
      for(var j=0;j<seeds.length;j++){
        var d=Math.hypot(p.x-seeds[j].x,p.y-seeds[j].y);
        if(d<md)md=d;
      }
      var sc=md+(p.nei.length<6?8:0)+rand(7,0);
      if(sc>bestScore){bestScore=sc;best=p;}
    }
    seeds.push(best);
  }

  prov.forEach(function(p){
    var bi=0,bd=1e9;
    for(var i=0;i<seeds.length;i++){
      var d=Math.hypot(p.x-seeds[i].x,p.y-seeds[i].y);
      if(d<bd){bd=d;bi=i;}
    }
    var ex=(p.x-W*.5)/(W*.48),ey=(p.y-H*.5)/(H*.46);
    var edge=ex*ex+ey*ey;
    if(edge>.78&&Math.random()<.24)p.o=-1;
    else p.o=bi;
  });
  seeds.forEach(function(s,i){s.o=i;s.capital=true;});

  var realms=[];
  for(var i=0;i<N;i++){
    var doctrine=doctrines[i%doctrines.length];
    realms.push({
      id:i,n:names[i],color:hue(i),alive:true,doctrine:doctrine,
      treasury:rand(380,190),debt:rand(38,0),tax:.18,tariff:.10,openness:rand(.86,.48),
      army:rand(52,24),manpower:rand(110,55),stability:rand(86,58),legitimacy:rand(88,55),
      corruption:rand(.28,.06),education:rand(1.2,.45),bureaucracy:rand(1.2,.55),
      tech:{prod:rand(1.12,.84),mil:rand(1.12,.86),admin:rand(1.12,.84)},
      aggression: doctrine==='militar'?rand(1.42,1.12):rand(1.02,.48),
      commerce: doctrine==='mercantil'?rand(1.45,1.14):rand(1.06,.52),
      industry: doctrine==='industrial'?rand(1.45,1.14):rand(1.06,.52),
      learning: doctrine==='tecnocrática'?rand(1.5,1.18):rand(1.04,.55),
      governance: doctrine==='administrativa'?rand(1.45,1.15):rand(1.04,.55),
      agriculture: doctrine==='agrária'?rand(1.45,1.15):rand(1.04,.55),
      caution: doctrine==='militar'?rand(.92,.65):rand(1.25,.72),
      focus:'consolidação',gdp:0,gdpPrev:0,growth:0,pop:0,income:0,expenses:0,
      tradeVolume:0,tradeBalance:0,marketAccess:.4,shortage:0,
      production:Array(7).fill(0),demand:Array(7).fill(0),balance:Array(7).fill(0),
      lastAction:'nenhuma',capital:seeds[i].id,defaults:0,prestige:rand(40,10)
    });
  }
  return {prov:prov,realms:realms};
}

function reset(){
  var w=makeWorld(),relations={};
  for(var i=0;i<N;i++)for(var j=i+1;j<N;j++)relations[kpair(i,j)]=Math.round(rand(45,-28));
  state={
    days:0,running:true,speed:1,layer:'political',prov:w.prov,realms:w.realms,
    relations:relations,tradePacts:new Set(),alliances:new Set(),wars:[],campaigns:[],
    events:[],prices:[1.0,.82,1.25,.76,.92,1.55,1.8],worldGdp:0,worldTrade:0,
    selected:null,player:null,battles:0,lastEco:-999,lastAI:-999,lastDip:-999,lastWar:-999,lastColonize:-999,lastPanelMs:0
  };
  seedDiplomacy();
  economyTick(true);
  log('econ','O continente inicia com <b>'+N+' economias soberanas</b> e cadeias produtivas distintas.');
  renderPanels();
}
function R(i){return state.realms[i];}
function P(i){return state.prov[i];}
function owned(i){return state.prov.filter(function(p){return p.o===i;});}
function relation(a,b){return a===b?100:(state.relations[kpair(a,b)]||0);}
function setRelation(a,b,v){if(a!==b)state.relations[kpair(a,b)]=clamp(v,-100,100);}
function atWar(a,b){return state.wars.find(function(w){return !w.ended&&((w.a===a&&w.b===b)||(w.a===b&&w.b===a));});}
function warsOf(i){return state.wars.filter(function(w){return !w.ended&&(w.a===i||w.b===i);});}
function allied(a,b){return state.alliances.has(kpair(a,b));}
function tradePact(a,b){return state.tradePacts.has(kpair(a,b));}
function neighbors(i){
  var s=new Set();
  owned(i).forEach(function(p){p.nei.forEach(function(n){var o=P(n).o;if(o>=0&&o!==i)s.add(o);});});
  return Array.from(s);
}
function borderProvs(a,b){
  return owned(a).filter(function(p){return p.nei.some(function(n){return P(n).o===b;});});
}
function avgInfra(i){
  var ps=owned(i);if(!ps.length)return 0;return ps.reduce(function(s,p){return s+p.infra;},0)/ps.length;
}
function workshops(i){return owned(i).reduce(function(s,p){return s+p.workshop;},0);}
function farms(i){return owned(i).reduce(function(s,p){return s+p.farm;},0);}
function mines(i){return owned(i).reduce(function(s,p){return s+p.extract;},0);}
function power(i){
  var r=R(i);if(!r||!r.alive)return 0;
  return r.army*r.tech.mil+owned(i).length*2.3+r.gdp*.035+r.treasury*.018-r.debt*.008+r.prestige*.1;
}
function strongestNeighbor(i){
  var ns=neighbors(i),best=null,bp=-1;
  ns.forEach(function(n){var p=power(n);if(p>bp){bp=p;best=n;}});
  return best;
}
function maxThreat(i){
  var ns=neighbors(i),t=0;
  ns.forEach(function(n){
    if(allied(i,n))return;
    var v=(power(n)/(power(i)+1))*(relation(i,n)<-20?1.22:1);
    if(v>t)t=v;
  });return t;
}
function log(type,text){
  state.events.unshift({day:state.days,type:type,text:text});
  if(state.events.length>220)state.events.length=220;
  renderFeed();
}
function dateText(){
  var d=new Date(1444,0,1);d.setDate(d.getDate()+Math.floor(state.days));
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).replace('.','');
}
function year(){return 1444+Math.floor(state.days/365);}

function seedDiplomacy(){
  for(var i=0;i<N;i++){
    var ns=neighbors(i);
    if(ns.length&&Math.random()<.55){
      var b=pick(ns);
      state.tradePacts.add(kpair(i,b));setRelation(i,b,relation(i,b)+12);
    }
  }
}

function rawProduction(r,p){
  var infra=1+p.infra*.075,tech=r.tech.prod,base=p.pop*.52*infra*tech;
  var q=0;
  if(p.res===0)q=base*p.fertility*(.65+p.farm*.17);
  else if(p.res===1)q=base*(.38+p.extract*.17);
  else if(p.res===2)q=base*(.30+p.extract*.16);
  else if(p.res===3)q=base*(.27+p.extract*.15);
  else if(p.res===4)q=base*(.34+p.extract*.16);
  return q;
}
function computeRealmBase(r){
  var ps=owned(r.id),prod=Array(7).fill(0),dem=Array(7).fill(0),pop=0,industryCap=0,infra=0;
  ps.forEach(function(p){
    pop+=p.pop;infra+=p.infra;
    prod[p.res]+=rawProduction(r,p);
    industryCap+=p.workshop*p.pop*.18*(1+p.infra*.06)*r.tech.prod;
  });
  var pactCount=0;
  state.tradePacts.forEach(function(k){if(k.split('-').map(Number).indexOf(r.id)>=0)pactCount++;});
  var warPenalty=warsOf(r.id).length*.12;
  var avgI=ps.length?infra/ps.length:0;
  r.marketAccess=clamp(.58+r.openness*.25+avgI*.025+pactCount*.025-warPenalty,0.35,1);
  prod[5]=industryCap*.62*(.58+r.marketAccess*.42);
  prod[6]=industryCap*.38*(.55+r.marketAccess*.45);

  dem[0]=pop*.43;
  dem[1]=pop*.045+industryCap*.09;
  dem[2]=pop*.034+industryCap*.15+r.army*.025;
  dem[3]=pop*.028;
  dem[4]=pop*.04+industryCap*.11;
  dem[5]=pop*.085*(.75+r.stability/200);
  dem[6]=pop*.042+industryCap*.12+avgI*.4;

  r.pop=pop;r.production=prod;r.demand=dem;
}

function economyTick(initial){
  state.realms.forEach(function(r){if(r.alive)computeRealmBase(r);});

  for(var g=0;g<7;g++){
    var supply=0,demand=0;
    state.realms.forEach(function(r){if(r.alive){supply+=r.production[g];demand+=r.demand[g];}});
    var ratio=demand/(supply+1);
    var target=clamp(.55+ratio*.72,.45,2.8);
    if(initial)state.prices[g]=target;
    else state.prices[g]=clamp(state.prices[g]*.84+target*.16+rand(.018,-.018),.42,3.0);
  }

  var worldGdp=0,worldTrade=0;
  state.realms.forEach(function(r){
    if(!r.alive)return;
    var ps=owned(r.id);if(!ps.length){collapseRealm(r.id);return;}
    var exportValue=0,importValue=0,shortageWeighted=0,prodValue=0;
    r.balance=Array(7).fill(0);
    for(var g=0;g<7;g++){
      var pr=r.production[g],de=r.demand[g],bal=pr-de;r.balance[g]=bal;
      prodValue+=pr*state.prices[g];
      if(bal>0)exportValue+=bal*state.prices[g]*r.marketAccess;
      else{
        var need=-bal,covered=need*r.marketAccess;
        importValue+=covered*state.prices[g];
        shortageWeighted+=(need-covered)/(de+1)*(g===0?2.2:1);
      }
    }
    r.shortage=clamp(shortageWeighted/7,0,1);
    r.tradeVolume=exportValue+importValue;
    r.tradeBalance=exportValue-importValue;
    var commerce=r.tradeVolume*(.08+.08*r.commerce);
    var adminEff=clamp(.58+r.bureaucracy*.13-r.corruption*.45,.35,1.2);
    var welfare=(1-r.shortage*.65)*(0.82+r.education*.04);
    var newGdp=(prodValue+commerce)*(0.78+adminEff*.22)*welfare;
    r.gdpPrev=r.gdp||newGdp;r.gdp=newGdp;r.growth=(r.gdp-r.gdpPrev)/(r.gdpPrev+1);

    var revenue=r.gdp*r.tax*.24*adminEff+importValue*r.tariff*.055;
    var armyCost=r.army*(.062+.018*r.tech.mil);
    var eduCost=r.pop*r.education*.0042;
    var adminCost=r.pop*r.bureaucracy*.0027;
    var infraCost=avgInfra(r.id)*ps.length*.085;
    var interest=r.debt*(.0045+r.defaults*.0018);
    var costs=armyCost+eduCost+adminCost+infraCost+interest;
    r.income=revenue;r.expenses=costs;
    r.treasury+=revenue-costs;
    if(r.treasury<0){r.debt+=-r.treasury;r.treasury=0;}
    if(r.treasury>120&&r.debt>0){
      var repay=Math.min(r.debt,(r.treasury-100)*.12);r.debt-=repay;r.treasury-=repay;
    }

    var growth=.0017+r.education*.00015+r.stability*.000008-r.shortage*.0035-warsOf(r.id).length*.0006;
    ps.forEach(function(p){
      p.pop=Math.max(2,p.pop*(1+growth));
      p.unrest=clamp(p.unrest+(r.shortage>.15?.55:-.22)+(r.tax>.28?.22:0)-(r.stability>65?.12:0),0,100);
      p.urban=clamp(p.urban+(p.workshop*.00022+p.infra*.00005),.02,.85);
    });
    r.manpower+=r.pop*.0025;
    r.stability=clamp(r.stability+(r.growth>0?.18:-.10)-r.shortage*.9-(r.debt>r.gdp*1.8?.35:0),12,96);
    r.corruption=clamp(r.corruption+.0015-r.bureaucracy*.001,0.02,.62);
    r.tech.prod+=r.education*.00020*(.7+r.learning*.3);
    r.tech.admin+=r.education*.00014;
    r.tech.mil+=r.education*.00009;

    if(r.debt>r.gdp*3.5&&Math.random()<.015){
      r.defaults++;r.debt*=.72;r.stability-=9;r.legitimacy-=6;
      log('crisis','<b>'+r.n+'</b> entrou em moratória parcial após uma crise de dívida.');
    }
    if(r.shortage>.34&&Math.random()<.025){
      r.stability-=4;
      log('crisis','Escassez de alimentos e bens básicos atingiu <b>'+r.n+'</b>.');
    }
    worldGdp+=r.gdp;worldTrade+=r.tradeVolume;
  });
  state.worldGdp=worldGdp;state.worldTrade=worldTrade;
}

function actionCost(r,kind){
  var mult=1+owned(r.id).length*.006;
  var base={farm:48,extract:52,workshop:76,infra:64,education:85,admin:72,army:62,fort:58}[kind]||50;
  return base*mult;
}
function bestProvince(r,kind){
  var ps=owned(r.id);if(!ps.length)return null;
  var scored=ps.map(function(p){
    var s=rand(3,0);
    if(kind==='farm')s+=p.fertility*9-p.farm*1.4+(p.res===0?5:0);
    if(kind==='extract')s+=state.prices[p.res]*3-p.extract*1.2+(p.res===2?2:0);
    if(kind==='workshop')s+=p.pop*.35+p.infra*2-p.workshop*1.7;
    if(kind==='infra')s+=p.workshop*2+p.pop*.22-p.infra*1.6;
    if(kind==='fort')s+=neighbors(r.id).some(function(n){return p.nei.some(function(x){return P(x).o===n;});})?8:0;
    return {p:p,s:s};
  }).sort(function(a,b){return b.s-a.s;});
  return scored[0].p;
}
function invest(r,kind,forced){
  if(!r.alive)return false;
  var cost=actionCost(r,kind);
  if(kind==='repay'){
    var amt=Math.min(90,r.debt,r.treasury-20);
    if(amt<=0)return false;r.treasury-=amt;r.debt-=amt;r.lastAction='reduziu a dívida';return true;
  }
  if(r.treasury<cost&&!forced)return false;
  if(r.treasury<cost)return false;
  r.treasury-=cost;
  var p;
  if(kind==='farm'){p=bestProvince(r,'farm');if(!p)return false;p.farm=clamp(p.farm+1,0,8);r.lastAction='expandiu agricultura';}
  else if(kind==='extract'){p=bestProvince(r,'extract');if(!p)return false;p.extract=clamp(p.extract+1,0,8);r.lastAction='expandiu extração';}
  else if(kind==='workshop'){p=bestProvince(r,'workshop');if(!p)return false;p.workshop=clamp(p.workshop+1,0,8);r.lastAction='abriu manufaturas';}
  else if(kind==='infra'){p=bestProvince(r,'infra');if(!p)return false;p.infra=clamp(p.infra+1,0,8);r.lastAction='construiu infraestrutura';}
  else if(kind==='education'){r.education=clamp(r.education+.16,.2,5);r.lastAction='investiu em educação';}
  else if(kind==='admin'){r.bureaucracy=clamp(r.bureaucracy+.15,.2,5);r.corruption=Math.max(.02,r.corruption-.018);r.lastAction='reformou a administração';}
  else if(kind==='army'){
    var n=Math.min(11,r.manpower);if(n<2)return false;r.army+=n;r.manpower-=n;r.lastAction='ampliou o exército';
  }
  else if(kind==='fort'){p=bestProvince(r,'fort');if(!p)return false;p.fort=clamp(p.fort+1,0,4);r.lastAction='fortificou a fronteira';}
  return true;
}

function averageTech(){
  var a=state.realms.filter(function(r){return r.alive;});if(!a.length)return 1;
  return a.reduce(function(s,r){return s+r.tech.prod+r.tech.admin+r.tech.mil;},0)/(a.length*3);
}
function actionScores(r){
  var threat=maxThreat(r.id),food=Math.max(0,-r.balance[0])/(r.demand[0]+1),techGap=Math.max(0,averageTech()-((r.tech.prod+r.tech.admin+r.tech.mil)/3));
  var debtRatio=r.debt/(r.gdp+1),infra=avgInfra(r.id),ws=workshops(r.id)/(owned(r.id).length+1);
  return [
    {k:'farm',s:22*r.agriculture+food*95+state.prices[0]*7},
    {k:'extract',s:20+state.prices[2]*8+state.prices[1]*4+state.prices[4]*3},
    {k:'workshop',s:24*r.industry+r.marketAccess*22+(state.prices[5]+state.prices[6])*6-ws*2},
    {k:'infra',s:20*r.commerce+r.industry*8+r.tradeVolume*.015+Math.max(0,4-infra)*8},
    {k:'education',s:21*r.learning+techGap*90+(r.treasury>220?12:0)},
    {k:'admin',s:18*r.governance+r.corruption*70+(r.tax>.22?8:0)},
    {k:'army',s:7*r.aggression+threat*18+(warsOf(r.id).length?34:0)},
    {k:'fort',s:threat*14+(relation(r.id,strongestNeighbor(r.id))<-20?8:0)},
    {k:'repay',s:debtRatio*55+(debtRatio>1?25:0)}
  ];
}
function updateFocus(r,scores){
  scores.sort(function(a,b){return b.s-a.s;});
  var map={farm:'agricultura',extract:'recursos',workshop:'industrialização',infra:'infraestrutura',education:'conhecimento',admin:'Estado',army:'segurança',fort:'defesa',repay:'finanças'};
  r.focus=map[scores[0].k]||'equilíbrio';
}
function aiTick(){
  state.realms.forEach(function(r){
    if(!r.alive||state.player===r.id)return;
    var dr=r.debt/(r.gdp+1);
    if(dr>1.3)r.tax=clamp(r.tax+.008,.10,.34);
    else if(r.stability<45&&r.tax>.14)r.tax-=.006;
    else if(r.treasury>350&&r.tax>.14)r.tax-=.002;

    if(r.doctrine==='mercantil')r.openness=clamp(r.openness+.01,.15,.98);
    if(r.debt>r.gdp*1.7)r.tariff=clamp(r.tariff+.008,.02,.30);
    if(r.tradeVolume>r.gdp*.6)r.tariff=clamp(r.tariff-.004,.02,.30);

    var scores=actionScores(r);updateFocus(r,scores);
    scores.sort(function(a,b){return b.s-a.s;});
    var acts=r.treasury>320?2:1;
    for(var n=0;n<acts;n++){
      for(var i=0;i<scores.length;i++){if(invest(r,scores[i].k,false)){if(['farm','extract','workshop','infra','education','admin'].indexOf(scores[i].k)>=0&&Math.random()<.22)log('econ','<b>'+r.n+'</b> '+r.lastAction+'.');break;}}
    }
  });
}

function complementary(a,b){
  var ra=R(a),rb=R(b),s=0;
  for(var g=0;g<7;g++){
    if(ra.balance[g]>0&&rb.balance[g]<0)s+=Math.min(ra.balance[g],-rb.balance[g])*state.prices[g];
    if(rb.balance[g]>0&&ra.balance[g]<0)s+=Math.min(rb.balance[g],-ra.balance[g])*state.prices[g];
  }
  return s;
}
function makeTrade(a,b,quiet){
  if(a===b||atWar(a,b)||tradePact(a,b)||!R(a).alive||!R(b).alive)return false;
  state.tradePacts.add(kpair(a,b));setRelation(a,b,relation(a,b)+9);
  if(!quiet)log('trade','<b>'+R(a).n+'</b> e <b>'+R(b).n+'</b> assinaram um tratado comercial.');
  return true;
}
function makeAlliance(a,b){
  if(a===b||atWar(a,b)||allied(a,b)||!R(a).alive||!R(b).alive)return false;
  state.alliances.add(kpair(a,b));setRelation(a,b,relation(a,b)+13);
  log('diplo','<b>'+R(a).n+'</b> e <b>'+R(b).n+'</b> formaram uma aliança defensiva.');
  return true;
}
function breakPacts(a,b){
  var k=kpair(a,b);state.tradePacts.delete(k);state.alliances.delete(k);
}
function diplomacyTick(){
  var alive=state.realms.filter(function(r){return r.alive;});
  for(var i=0;i<alive.length;i++)for(var j=i+1;j<alive.length;j++){
    var a=alive[i],b=alive[j],v=relation(a.id,b.id),d=rand(.8,-.8);
    if(tradePact(a.id,b.id))d+=.32;
    if(allied(a.id,b.id))d+=.55;
    if(atWar(a.id,b.id))d-=1.3;
    if(neighbors(a.id).indexOf(b.id)>=0)d-=.05;
    setRelation(a.id,b.id,v+d);
  }
  alive.forEach(function(a){
    if(state.player===a.id)return;
    var candidates=alive.filter(function(b){return b.id!==a.id&&!atWar(a.id,b.id);});
    candidates.sort(function(x,y){
      var sx=relation(a.id,x.id)+Math.log(1+complementary(a.id,x.id))*8+(neighbors(a.id).indexOf(x.id)>=0?8:0);
      var sy=relation(a.id,y.id)+Math.log(1+complementary(a.id,y.id))*8+(neighbors(a.id).indexOf(y.id)>=0?8:0);
      return sy-sx;
    });
    var b=candidates[0];if(!b)return;
    if(!tradePact(a.id,b.id)&&relation(a.id,b.id)>5&&Math.random()<.34*a.commerce)makeTrade(a.id,b.id,false);
    var threat=maxThreat(a.id);
    if(!allied(a.id,b.id)&&relation(a.id,b.id)>48&&Math.random()<.08*(1+threat)*a.governance)makeAlliance(a.id,b.id);
  });
}

function colonizeTick(){
  state.realms.forEach(function(r){
    if(!r.alive||state.player===r.id||r.treasury<85||warsOf(r.id).length)return;
    var opts=[];
    owned(r.id).forEach(function(p){p.nei.forEach(function(n){var q=P(n);if(q.o===-1&&opts.indexOf(q)<0)opts.push(q);});});
    if(!opts.length)return;
    var appetite=(r.doctrine==='agrária'||r.doctrine==='militar')?.25:.12;
    if(Math.random()>appetite)return;
    opts.sort(function(a,b){return (b.pop+b.fertility*8+b.res*1.2)-(a.pop+a.fertility*8+a.res*1.2);});
    var p=opts[0];p.o=r.id;r.treasury-=72;r.manpower=Math.max(0,r.manpower-4);r.lastAction='colonizou a fronteira';
    if(Math.random()<.25)log('diplo','<b>'+r.n+'</b> incorporou uma região de fronteira.');
  });
}

function warScore(a,b){
  var ra=R(a),rb=R(b);if(!ra.alive||!rb.alive||allied(a,b)||atWar(a,b))return -999;
  if(neighbors(a).indexOf(b)<0)return -999;
  if(warsOf(a).length||warsOf(b).length)return -999;
  var ratio=power(a)/(power(b)+1),rel=relation(a,b);
  var economic=0;
  for(var g=0;g<5;g++){
    if(ra.balance[g]<0&&rb.balance[g]>0)economic+=Math.min(-ra.balance[g],rb.balance[g])*state.prices[g]*.03;
  }
  var debtPenalty=ra.debt/(ra.gdp+1);
  var stabilityPenalty=ra.stability<50?18:0;
  var relFactor=rel<-55?25:rel<-25?14:rel<0?5:-14;
  var security=maxThreat(a)>1.25&&strongestNeighbor(a)===b?12:0;
  return (ratio-1)*34+relFactor+economic+security+ra.aggression*8-debtPenalty*12-stabilityPenalty;
}
function declareWar(a,b,goal){
  if(warScore(a,b)<-100||state.player!==a&&warScore(a,b)<8)return false;
  breakPacts(a,b);setRelation(a,b,-100);
  var g=goal||chooseWarGoal(a,b);
  state.wars.push({id:Date.now()+Math.random(),a:a,b:b,start:state.days,lastBattle:state.days,score:0,goal:g,captures:[],ended:false});
  log('war','⚔ <b>'+R(a).n+'</b> declarou guerra a <b>'+R(b).n+'</b> por '+goalLabel(g)+'.');
  return true;
}
function chooseWarGoal(a,b){
  var ra=R(a),rb=R(b),best=0,need=-Infinity;
  for(var g=0;g<5;g++){
    var s=(-ra.balance[g])*(rb.balance[g]>0?1:0)*state.prices[g];
    if(s>need){need=s;best=g;}
  }
  if(need>10)return {type:'resource',res:best};
  if(rb.gdp>ra.gdp*1.15)return {type:'reparations'};
  return {type:'border'};
}
function goalLabel(g){
  if(g.type==='resource')return 'acesso a '+goods[g.res].name.toLowerCase();
  if(g.type==='reparations')return 'reparações e influência';
  return 'retificação de fronteira';
}
function warTick(){
  state.realms.forEach(function(r){
    if(!r.alive||state.player===r.id||warsOf(r.id).length)return;
    var ns=neighbors(r.id),best=null,bs=14;
    ns.forEach(function(b){var s=warScore(r.id,b);if(s>bs){bs=s;best=b;}});
    if(best!==null&&Math.random()<clamp(.018+bs*.0016,.02,.12))declareWar(r.id,best);
  });

  state.wars.filter(function(w){return !w.ended;}).forEach(function(w){
    if(!R(w.a).alive||!R(w.b).alive){w.ended=true;return;}
    if(state.days-w.lastBattle>rand(55,30)){launchCampaign(w);w.lastBattle=state.days;}
    var age=state.days-w.start;
    if(age>260&&(Math.abs(w.score)>30||R(w.a).stability<35||R(w.b).stability<35)&&Math.random()<.24)peace(w);
    if(age>800&&Math.random()<.20)peace(w);
  });
}
function launchCampaign(w){
  var a=w.a,b=w.b;
  var att=power(a)*(1+rand(.14,-.12)),def=power(b)*(1+rand(.14,-.12));
  var attacker=att>def?a:b,defender=att>def?b:a;
  if(Math.random()<.32){var t=attacker;attacker=defender;defender=t;}
  var frontier=borderProvs(attacker,defender);if(!frontier.length)return;
  var targets=[];
  frontier.forEach(function(p){p.nei.forEach(function(n){var q=P(n);if(q.o===defender&&targets.indexOf(q)<0)targets.push(q);});});
  if(!targets.length)return;
  targets.sort(function(x,y){
    var sx=x.fort*3+x.workshop*2+x.infra+(w.goal.type==='resource'&&x.res===w.goal.res?12:0);
    var sy=y.fort*3+y.workshop*2+y.infra+(w.goal.type==='resource'&&y.res===w.goal.res?12:0);
    return sy-sx;
  });
  state.campaigns.push({war:w.id,a:attacker,d:defender,from:pick(frontier).id,to:targets[0].id,start:state.days,dur:rand(45,23)});
}
function resolveCampaign(c){
  var w=state.wars.find(function(x){return x.id===c.war;});if(!w||w.ended)return;
  var a=R(c.a),d=R(c.d),p=P(c.to);if(!a.alive||!d.alive||p.o!==c.d)return;
  var af=a.army*a.tech.mil*(.085+rand(.06,0))*(1-a.shortage*.3);
  var df=d.army*d.tech.mil*(.075+rand(.06,0))*(1+p.fort*.15)*(1+p.infra*.025);
  var total=af+df+1;
  var la=clamp(df/total*a.army*rand(.09,.045),.5,a.army*.18);
  var ld=clamp(af/total*d.army*rand(.10,.05),.5,d.army*.20);
  a.army=Math.max(0,a.army-la);d.army=Math.max(0,d.army-ld);
  a.manpower=Math.max(0,a.manpower-la*.22);d.manpower=Math.max(0,d.manpower-ld*.25);
  state.battles++;
  if(af*rand(1.15,.88)>df){
    var old=p.o;p.o=c.a;
    w.captures.push({pid:p.id,from:old,to:c.a});
    var swing=5+p.workshop*2+p.infra+(p.capital?12:0);
    w.score+=(w.a===c.a?1:-1)*swing;
    R(c.a).prestige+=1;R(c.d).stability-=1;
    if(p.capital){
      p.capital=false;var rep=owned(c.d).sort(function(x,y){return y.pop+y.workshop*3-(x.pop+x.workshop*3);})[0];
      if(rep){rep.capital=true;R(c.d).capital=rep.id;}
    }
    if(Math.random()<.16)log('battle','⚔ <b>'+a.n+'</b> ocupou uma província de <b>'+d.n+'</b>.');
    if(!owned(c.d).length)collapseRealm(c.d,c.a);
  }else{
    w.score+=(w.a===c.a?-1:1)*(3+p.fort);
    if(Math.random()<.10)log('battle','🛡 <b>'+d.n+'</b> conteve uma ofensiva de <b>'+a.n+'</b>.');
  }
}
function peace(w){
  if(w.ended)return;w.ended=true;
  state.campaigns=state.campaigns.filter(function(c){return c.war!==w.id;});
  var winner=w.score>0?w.a:w.b,loser=winner===w.a?w.b:w.a;
  var retain=0;
  if(Math.abs(w.score)>18)retain=1;if(Math.abs(w.score)>48)retain=2;
  var kept=0;
  for(var i=w.captures.length-1;i>=0;i--){
    var c=w.captures[i],p=P(c.pid);
    if(p.o===winner&&c.from===loser&&kept<retain){kept++;continue;}
    if(p.o===c.to)p.o=c.from;
  }
  if(R(winner)&&R(winner).alive&&R(loser)){
    if(w.goal.type==='reparations'){
      var pay=Math.min(R(loser).treasury,R(loser).gdp*.15);R(loser).treasury-=pay;R(winner).treasury+=pay;
    }
    if(w.goal.type==='resource')makeTrade(winner,loser,true);
    R(winner).prestige+=4;R(loser).stability-=2;
    log('war','☮ <b>'+R(winner).n+'</b> obteve paz favorável contra <b>'+R(loser).n+'</b>'+(kept?' e reteve '+kept+' província(s).':'.'));
  }
  setRelation(w.a,w.b,-48);
}
function collapseRealm(i,by){
  var r=R(i);if(!r||!r.alive)return;r.alive=false;r.army=0;
  state.tradePacts.forEach(function(k){if(k.split('-').map(Number).indexOf(i)>=0)state.tradePacts.delete(k);});
  state.alliances.forEach(function(k){if(k.split('-').map(Number).indexOf(i)>=0)state.alliances.delete(k);});
  state.wars.forEach(function(w){if(!w.ended&&(w.a===i||w.b===i))w.ended=true;});
  log('war','☠ <b>'+r.n+'</b> deixou de existir como Estado soberano'+(by!==undefined?' sob pressão de <b>'+R(by).n+'</b>.':'.'));
}
function updateCampaigns(){
  state.campaigns.forEach(function(c){if((state.days-c.start)>=c.dur){c.done=true;resolveCampaign(c);}});
  state.campaigns=state.campaigns.filter(function(c){return !c.done;});
}

function eventTick(){
  var alive=state.realms.filter(function(r){return r.alive;});if(!alive.length)return;
  var r=pick(alive),roll=Math.random();
  if(roll<.18&&r.growth>.01){r.treasury+=35;log('econ','Uma expansão comercial elevou as receitas de <b>'+r.n+'</b>.');}
  else if(roll<.34&&r.shortage>.12){r.stability-=5;log('crisis','Problemas de abastecimento provocaram protestos em <b>'+r.n+'</b>.');}
  else if(roll<.50){r.education+=.06;log('econ','Novas academias ampliaram a capacidade técnica de <b>'+r.n+'</b>.');}
  else if(roll<.66){r.corruption=clamp(r.corruption+.035,0,1);log('crisis','Um escândalo administrativo atingiu <b>'+r.n+'</b>.');}
  else if(roll<.82){r.openness=clamp(r.openness+.06,0,1);log('trade','Mercadores ampliaram a integração de <b>'+r.n+'</b> ao mercado continental.');}
  else{r.stability=clamp(r.stability+4,0,100);r.legitimacy=clamp(r.legitimacy+3,0,100);log('diplo','Uma reforma interna fortaleceu a legitimidade de <b>'+r.n+'</b>.');}
}

function update(dt){
  if(!state.running)return;
  state.days+=dt/1000*state.speed*3;
  updateCampaigns();
  if(state.days-state.lastEco>=30){state.lastEco=state.days;economyTick(false);if(Math.random()<.12)eventTick();}
  if(state.days-state.lastAI>=85){state.lastAI=state.days;aiTick();}
  if(state.days-state.lastDip>=100){state.lastDip=state.days;diplomacyTick();}
  if(state.days-state.lastColonize>=75){state.lastColonize=state.days;colonizeTick();}
  if(state.days-state.lastWar>=70){state.lastWar=state.days;warTick();}
}

function hexPath(p){
  ctx.beginPath();
  for(var i=0;i<6;i++){
    var a=Math.PI/3*i,x=p.x+HEX*Math.cos(a),y=p.y+HEX*Math.sin(a);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
}
function heat(v,min,max){
  var t=clamp((v-min)/(max-min),0,1),rr=Math.round(42+145*t),gg=Math.round(62+120*t),bb=Math.round(68-25*t);
  return 'rgb('+rr+','+gg+','+bb+')';
}
function relColor(v){return v>40?'#4d9d72':v<-40?'#ad5059':'#777e85';}
function draw(){
  ctx.clearRect(0,0,W,H);
  var gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#102b3b');gr.addColorStop(1,'#071923');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);

  var relBase=null;
  if(state.layer==='relations'){
    if(state.selected&&state.selected.kind==='realm')relBase=state.selected.id;
    else if(state.player!==null)relBase=state.player;
  }

  state.prov.forEach(function(p){
    hexPath(p);var fill='#25323a';
    if(p.o>=0){
      var r=R(p.o);
      if(state.layer==='political')fill=r.color;
      else if(state.layer==='development')fill=heat(p.farm+p.extract+p.workshop+p.infra,4,22);
      else if(state.layer==='infrastructure')fill=heat(p.infra,0,8);
      else if(state.layer==='wealth')fill=heat((r.gdp/(r.pop+1))*(.7+p.workshop*.08+p.infra*.03),.2,4.2);
      else if(state.layer==='relations'&&relBase!==null)fill=relColor(relation(relBase,p.o));
      else fill=r.color;
    }
    ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#101820';ctx.lineWidth=.75;ctx.stroke();
  });

  state.prov.forEach(function(p){
    if(p.o<0)return;
    p.nei.forEach(function(nid){
      var n=P(nid);if(n.o===p.o)return;
      var dx=n.x-p.x,dy=n.y-p.y,len=Math.hypot(dx,dy);if(!len)return;
      var mx=(p.x+n.x)/2,my=(p.y+n.y)/2,px=-dy/len*HEX*.52,py=dx/len*HEX*.52;
      ctx.strokeStyle='#061018';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(mx-px,my-py);ctx.lineTo(mx+px,my+py);ctx.stroke();
    });
  });

  if(state.layer==='relations'&&relBase!==null)drawPactLines(relBase);

  state.prov.forEach(function(p){
    if(p.capital&&p.o>=0&&R(p.o).alive){
      ctx.fillStyle='#fff1ae';ctx.font='13px Georgia';ctx.textAlign='center';ctx.fillText('★',p.x,p.y+4);
    }
  });

  state.campaigns.forEach(function(c){
    var a=P(c.from),b=P(c.to),t=clamp((state.days-c.start)/c.dur,0,1);
    var x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    ctx.strokeStyle=R(c.a).color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x,y);ctx.stroke();
    ctx.fillStyle='#071017';ctx.strokeStyle=R(c.a).color;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.stroke();
  });

  if(state.selected&&state.selected.kind==='province'){
    var sp=P(state.selected.id);hexPath(sp);ctx.strokeStyle='#fff6c8';ctx.lineWidth=3.5;ctx.stroke();
  }
  labels();
}
function drawPactLines(base){
  var cap=P(R(base).capital);if(!cap)return;
  state.realms.forEach(function(r){
    if(!r.alive||r.id===base)return;
    if(!tradePact(base,r.id)&&!allied(base,r.id))return;
    var c=P(r.capital);if(!c)return;
    ctx.save();ctx.setLineDash(allied(base,r.id)?[]:[4,5]);
    ctx.strokeStyle=allied(base,r.id)?'#e0c47688':'#79cba777';ctx.lineWidth=allied(base,r.id)?2:1.3;
    ctx.beginPath();ctx.moveTo(cap.x,cap.y);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.restore();
  });
}
function labels(){
  ctx.textAlign='center';ctx.textBaseline='middle';
  state.realms.forEach(function(r){
    if(!r.alive)return;var ps=owned(r.id);if(ps.length<3)return;
    var sx=0,sy=0;ps.forEach(function(p){sx+=p.x;sy+=p.y;});sx/=ps.length;sy/=ps.length;
    var fs=clamp(8+Math.sqrt(ps.length)*.65,9,14);
    ctx.font='700 '+fs+'px Georgia';ctx.lineWidth=3;ctx.strokeStyle='rgba(2,6,9,.78)';ctx.strokeText(r.n,sx,sy);ctx.fillStyle='#f4f0df';ctx.fillText(r.n,sx,sy);
  });
}
function pointHex(x,y,p){
  var dx=Math.abs(x-p.x),dy=Math.abs(y-p.y);
  return dx<=HEX&&dy<=DY/2&&Math.sqrt(3)*dx+dy<=Math.sqrt(3)*HEX;
}
function mousePos(e){
  var r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,rx:e.clientX-r.left,ry:e.clientY-r.top};
}
canvas.addEventListener('mousemove',function(e){
  var m=mousePos(e),p=null;
  for(var i=0;i<state.prov.length;i++){if(pointHex(m.x,m.y,state.prov[i])){p=state.prov[i];break;}}
  var tip=document.getElementById('tooltip');if(!p){tip.style.display='none';return;}
  tip.style.display='block';tip.style.left=Math.min(m.rx+14,canvas.clientWidth-190)+'px';tip.style.top=Math.max(4,m.ry-8)+'px';
  if(p.o<0)tip.innerHTML='<b>Fronteira não reclamada</b><span>'+goods[p.res].name+' · pop '+p.pop.toFixed(1)+'k</span>';
  else{
    var r=R(p.o);
    tip.innerHTML='<b>'+r.n+'</b><span>'+goods[p.res].name+' · pop '+p.pop.toFixed(1)+'k · fazendas '+p.farm+' · extração '+p.extract+' · oficinas '+p.workshop+' · infra '+p.infra+'</span>';
  }
});
canvas.addEventListener('mouseleave',function(){document.getElementById('tooltip').style.display='none';});
canvas.addEventListener('click',function(e){
  var m=mousePos(e),p=null;
  for(var i=0;i<state.prov.length;i++){if(pointHex(m.x,m.y,state.prov[i])){p=state.prov[i];break;}}
  if(!p)return;
  state.selected=p.o>=0?{kind:'realm',id:p.o}:{kind:'province',id:p.id};
  openTab('selected');renderSelected();
});

function openTab(id){
  document.querySelectorAll('.tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===id);});
  document.querySelectorAll('.tabpane').forEach(function(x){x.classList.toggle('active',x.id===id);});
}
document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){openTab(b.dataset.tab);});});
document.querySelectorAll('.layer').forEach(function(b){b.addEventListener('click',function(){
  state.layer=b.dataset.layer;document.querySelectorAll('.layer').forEach(function(x){x.classList.toggle('active',x===b);});
});});
document.querySelectorAll('.speed').forEach(function(b){b.addEventListener('click',function(){
  state.speed=Number(b.dataset.speed);document.querySelectorAll('.speed').forEach(function(x){x.classList.toggle('active',x===b);});
});});
document.getElementById('pauseBtn').onclick=function(){state.running=!state.running;this.textContent=state.running?'⏸':'▶';this.classList.toggle('active',state.running);};
document.getElementById('resetBtn').onclick=function(){reset();};

function renderFeed(){
  var el=document.getElementById('feed');if(!el||!state)return;
  el.innerHTML=state.events.slice(0,70).map(function(e){return '<div class="event '+e.type+'"><time>'+Math.floor(e.day)+'d</time>'+e.text+'</div>';}).join('');
}
function renderRanking(){
  var list=state.realms.slice().sort(function(a,b){if(a.alive!==b.alive)return a.alive?-1:1;return b.gdp-a.gdp;});
  document.getElementById('realmList').innerHTML=list.map(function(r){
    return '<div class="realmrow" data-rid="'+r.id+'" style="opacity:'+(r.alive?1:.35)+'">'+
      '<div class="rhead"><strong style="color:'+r.color+'">'+r.n+(state.player===r.id?'<span class="playerflag">VOCÊ</span>':'')+'</strong><span class="badge">'+r.doctrine+'</span></div>'+
      '<div class="subline"><span>PIB '+fmt(r.gdp)+'</span><span>'+owned(r.id).length+' prov.</span><span>'+((r.growth||0)*100).toFixed(1)+'%</span></div>'+
      '<div class="meters"><div class="meter"><i style="width:'+clamp(r.stability,0,100)+'%;background:#6fc18c"></i></div><div class="meter"><i style="width:'+clamp(r.debt/(r.gdp+1)*50,0,100)+'%;background:#e26f76"></i></div></div></div>';
  }).join('');
  document.querySelectorAll('.realmrow').forEach(function(x){x.onclick=function(){state.selected={kind:'realm',id:Number(x.dataset.rid)};openTab('selected');renderSelected();};});
}
function renderEconomy(){
  var alive=state.realms.filter(function(r){return r.alive;});
  var top=alive.slice().sort(function(a,b){return b.gdp-a.gdp;}).slice(0,10);
  var debt=alive.reduce(function(s,r){return s+r.debt;},0);
  var infra=alive.reduce(function(s,r){return s+avgInfra(r.id);},0)/(alive.length||1);
  var html='<div class="econhero"><strong>Economia continental</strong><small>produção, comércio e finanças mudam preços e decisões das IAs</small>'+
    '<div class="econgrid"><div class="econbox"><span>PIB mundial</span><b>'+fmt(state.worldGdp)+'</b></div><div class="econbox"><span>Comércio</span><b>'+fmt(state.worldTrade)+'</b></div>'+
    '<div class="econbox"><span>Dívida total</span><b>'+fmt(debt)+'</b></div><div class="econbox"><span>Infra média</span><b>'+infra.toFixed(1)+'</b></div></div></div><div class="sectorlist">';
  top.forEach(function(r){
    var w=state.worldGdp?clamp(r.gdp/state.worldGdp*500,4,100):4;
    html+='<div class="sector"><span>'+r.n+'</span><div class="sectorbar"><i style="width:'+w+'%;background:'+r.color+'"></i></div><b>'+fmt(r.gdp)+'</b></div>';
  });
  html+='</div>';
  document.getElementById('economyPanel').innerHTML=html;
}
function renderDiplo(){
  var wars=state.wars.filter(function(w){return !w.ended;});
  var html='<div class="matrix">';
  if(wars.length)wars.forEach(function(w){
    html+='<div class="pair"><div class="pairhead"><span>'+R(w.a).n+' ⚔ '+R(w.b).n+'</span><b class="relation neg">'+Math.round(w.score)+'</b></div><div class="tags"><span class="tag">'+goalLabel(w.goal).toUpperCase()+'</span></div></div>';
  });
  var all=[];
  state.alliances.forEach(function(k){var x=k.split('-').map(Number);if(R(x[0]).alive&&R(x[1]).alive)all.push(x);});
  all.slice(0,30).forEach(function(x){html+='<div class="pair"><div class="pairhead"><span>'+R(x[0]).n+' ↔ '+R(x[1]).n+'</span><b class="relation pos">aliança</b></div></div>';});
  if(!wars.length&&!all.length)html+='<div class="empty">Nenhuma guerra ou aliança relevante.</div>';
  html+='</div>';document.getElementById('diploMatrix').innerHTML=html;
}
function sectorLine(label,val,max){
  return '<div class="sector"><span>'+label+'</span><div class="sectorbar"><i style="width:'+clamp(val/max*100,2,100)+'%"></i></div><b>'+val.toFixed(1)+'</b></div>';
}
function renderSelected(){
  var el=document.getElementById('selectedInfo');if(!state.selected){el.innerHTML='<div class="empty">Clique em um país ou província.</div>';return;}
  if(state.selected.kind==='province'){
    var p=P(state.selected.id);
    el.innerHTML='<div class="inspect"><h2>Fronteira</h2><div class="owner">região não reclamada</div><div class="stats"><div class="stat"><span>População</span><b>'+p.pop.toFixed(1)+'k</b></div><div class="stat"><span>Recurso</span><b>'+goods[p.res].name+'</b></div></div></div>';return;
  }
  var r=R(state.selected.id),ps=owned(r.id),debtRatio=r.debt/(r.gdp+1),percap=r.gdp/(r.pop+1);
  var html='<div class="inspect"><h2 style="color:'+r.color+'">'+r.n+(state.player===r.id?'<span class="playerflag">VOCÊ</span>':'')+'</h2><div class="owner">'+r.doctrine+' · foco: '+r.focus+'</div>'+
    '<div class="stats"><div class="stat"><span>PIB</span><b>'+fmt(r.gdp)+'</b></div><div class="stat"><span>PIB per capita</span><b>'+percap.toFixed(2)+'</b></div>'+
    '<div class="stat"><span>Tesouro</span><b>'+fmt(r.treasury)+'</b></div><div class="stat"><span>Dívida / PIB</span><b>'+debtRatio.toFixed(2)+'×</b></div>'+
    '<div class="stat"><span>População</span><b>'+fmt(r.pop)+'k</b></div><div class="stat"><span>Estabilidade</span><b>'+Math.round(r.stability)+'</b></div>'+
    '<div class="stat"><span>Exército</span><b>'+Math.round(r.army)+'</b></div><div class="stat"><span>Acesso mercado</span><b>'+Math.round(r.marketAccess*100)+'%</b></div></div>'+
    '<div class="finance"><div class="minirow"><span>Receita mensal</span><b class="positive">+'+r.income.toFixed(1)+'</b></div><div class="minirow"><span>Despesas mensais</span><b class="negative">-'+r.expenses.toFixed(1)+'</b></div>'+
    '<div class="minirow"><span>Balança comercial</span><b class="'+(r.tradeBalance>=0?'positive':'negative')+'">'+r.tradeBalance.toFixed(1)+'</b></div><div class="minirow"><span>Impostos</span><b>'+Math.round(r.tax*100)+'%</b></div>'+
    '<div class="minirow"><span>Tarifa</span><b>'+Math.round(r.tariff*100)+'%</b></div><div class="minirow"><span>Última ação</span><b>'+r.lastAction+'</b></div></div>'+
    '<div class="sectorlist">'+sectorLine('Fazendas',farms(r.id),Math.max(20,ps.length*5))+sectorLine('Extração',mines(r.id),Math.max(20,ps.length*5))+sectorLine('Manufaturas',workshops(r.id),Math.max(12,ps.length*3))+sectorLine('Infraestrutura',avgInfra(r.id),8)+sectorLine('Educação',r.education,5)+sectorLine('Burocracia',r.bureaucracy,5)+'</div>';

  if(state.player===null&&r.alive)html+='<button class="decision wide" id="takeRealm">Assumir este país</button>';
  if(state.player===r.id&&r.alive)html+=playerControls(r);
  if(state.player!==null&&state.player!==r.id)html+='<div class="strategyline">Você está governando <b>'+R(state.player).n+'</b>. Selecione seu país no mapa ou ranking para acessar as decisões.</div>';
  html+='</div>';el.innerHTML=html;bindSelectedControls(r);
}
function playerControls(r){
  var ns=neighbors(r.id).filter(function(i){return R(i).alive;});
  var opts=ns.map(function(i){return '<option value="'+i+'">'+R(i).n+' · relação '+Math.round(relation(r.id,i))+'</option>';}).join('');
  return '<div class="strategyline"><b>Governo direto.</b> A IA estratégica deste país foi desligada; economia e guerras já existentes continuam simuladas.</div>'+
    '<div class="policygrid">'+
    '<button class="decision" data-act="farm">Agricultura · '+Math.round(actionCost(r,'farm'))+'</button>'+
    '<button class="decision" data-act="extract">Extração · '+Math.round(actionCost(r,'extract'))+'</button>'+
    '<button class="decision" data-act="workshop">Manufaturas · '+Math.round(actionCost(r,'workshop'))+'</button>'+
    '<button class="decision" data-act="infra">Infraestrutura · '+Math.round(actionCost(r,'infra'))+'</button>'+
    '<button class="decision" data-act="education">Educação · '+Math.round(actionCost(r,'education'))+'</button>'+
    '<button class="decision" data-act="admin">Burocracia · '+Math.round(actionCost(r,'admin'))+'</button>'+
    '<button class="decision" data-act="army">Recrutar · '+Math.round(actionCost(r,'army'))+'</button>'+
    '<button class="decision" data-act="fort">Fortificar · '+Math.round(actionCost(r,'fort'))+'</button>'+
    '<button class="decision" data-act="repay">Amortizar dívida</button>'+
    '<button class="decision" data-act="taxDown">− impostos</button>'+
    '<button class="decision" data-act="taxUp">+ impostos</button>'+
    '<button class="decision" data-act="open">Abrir comércio</button>'+
    '<button class="decision" data-act="protect">Protecionismo</button>'+
    '<button class="decision" data-act="observer">Voltar ao observador</button></div>'+
    (ns.length?'<div class="controlrow"><select id="dipTarget" class="controlSelect">'+opts+'</select></div><div class="policygrid">'+
    '<button class="decision" data-dip="trade">Propor comércio</button><button class="decision" data-dip="alliance">Propor aliança</button><button class="decision wide" data-dip="war">Declarar guerra</button></div>':'');
}
function bindSelectedControls(r){
  var take=document.getElementById('takeRealm');
  if(take)take.onclick=function(){state.player=r.id;state.selected={kind:'realm',id:r.id};document.getElementById('worldStatus').textContent='Você governa '+r.n+'; as outras '+(state.realms.filter(function(x){return x.alive;}).length-1)+' potências continuam autônomas';renderSelected();renderRanking();};
  document.querySelectorAll('[data-act]').forEach(function(b){b.onclick=function(){
    var a=b.dataset.act;
    if(a==='taxDown'){r.tax=clamp(r.tax-.02,.08,.38);r.lastAction='reduziu impostos';}
    else if(a==='taxUp'){r.tax=clamp(r.tax+.02,.08,.38);r.lastAction='aumentou impostos';}
    else if(a==='open'){r.openness=clamp(r.openness+.10,.1,1);r.tariff=clamp(r.tariff-.025,.01,.35);r.lastAction='abriu o comércio';}
    else if(a==='protect'){r.openness=clamp(r.openness-.08,.1,1);r.tariff=clamp(r.tariff+.03,.01,.35);r.lastAction='adotou protecionismo';}
    else if(a==='observer'){state.player=null;document.getElementById('worldStatus').textContent='56 economias autônomas competem por riqueza, influência e segurança';}
    else if(!invest(r,a,true)){log('crisis','<b>'+r.n+'</b> não possui recursos suficientes para essa decisão.');}
    economyTick(false);renderSelected();renderRanking();renderEconomy();
  };});
  document.querySelectorAll('[data-dip]').forEach(function(b){b.onclick=function(){
    var sel=document.getElementById('dipTarget');if(!sel)return;var t=Number(sel.value),act=b.dataset.dip;
    if(act==='trade'){
      if(relation(r.id,t)<-35)log('diplo','<b>'+R(t).n+'</b> rejeitou a proposta comercial de '+r.n+'.');
      else makeTrade(r.id,t,false);
    }else if(act==='alliance'){
      if(relation(r.id,t)>42&&!atWar(r.id,t))makeAlliance(r.id,t);else log('diplo','<b>'+R(t).n+'</b> recusou a proposta de aliança.');
    }else if(act==='war'){
      if(atWar(r.id,t))return;
      declareWar(r.id,t,chooseWarGoal(r.id,t));
    }
    renderSelected();renderDiplo();
  };});
}
function renderMarket(){
  document.getElementById('market').innerHTML=goods.map(function(g,i){
    var w=clamp(state.prices[i]/3*100,5,100);
    return '<div class="commodity"><span>'+g.s+' '+g.name+'</span><div class="spark"><i style="width:'+w+'%"></i></div><b>'+state.prices[i].toFixed(2)+'</b></div>';
  }).join('');
}
function renderLegend(){
  var text='<span><i style="background:#25323a"></i>fronteira livre</span><span>★ capital</span>';
  if(state.layer==='development')text+='<span>claro = mais desenvolvimento</span>';
  if(state.layer==='wealth')text+='<span>claro = maior riqueza por habitante</span>';
  if(state.layer==='infrastructure')text+='<span>claro = melhor infraestrutura</span>';
  if(state.layer==='relations')text+='<span>verde aliado · vermelho hostil</span>';
  document.getElementById('legend').innerHTML=text;
}
function renderPanels(){renderFeed();renderRanking();renderEconomy();renderDiplo();renderSelected();renderMarket();renderLegend();}
function updateTop(){
  document.getElementById('dateLabel').textContent=dateText();document.getElementById('eraLabel').textContent='Ano '+year();
  document.getElementById('kpiRealms').textContent=state.realms.filter(function(r){return r.alive;}).length;
  document.getElementById('kpiGdp').textContent=fmt(state.worldGdp);
  document.getElementById('kpiWars').textContent=state.wars.filter(function(w){return !w.ended;}).length;
  document.getElementById('kpiTrade').textContent=fmt(state.worldTrade);
  document.getElementById('simState').textContent=state.running?'RODANDO':'PAUSADO';
}
var last=performance.now();
function frame(now){
  var dt=Math.min(120,now-last);last=now;update(dt);draw();updateTop();
  if(now-state.lastPanelMs>850){state.lastPanelMs=now;renderRanking();renderEconomy();renderDiplo();renderMarket();renderLegend();if(state.selected)renderSelected();}
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
})();
