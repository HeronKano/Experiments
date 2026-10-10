
'use strict';
const VERSION='0.1.0';
const KEY='brasil-em-disputa-v01';
const NAMES=['Coroa','Igreja / Intelectuais','Sertanistas','Produtores'];
const COLORS=['#dbb46e','#a4a3cf','#76baa0','#de9472'];
const ROLE_LABELS=[
 ['Coroa portuguesa','Ordens religiosas','Sertanistas','Senhores de engenho'],
 ['Administração colonial','Instituições religiosas','Milícias e sertanistas','Produtores açucareiros'],
 ['Coroa e Fisco','Redes religiosas e letradas','Bandeirantes e poder local','Mineradores'],
 ['Coroa e governo central','Intelectuais e imprensa','Elites provinciais','Proprietários e cafeicultores']
];
const ERAS=[
 {name:'Implantação colonial',years:'1530–1600',hint:'Sesmarias, missões, engenhos e primeiras disputas territoriais.'},
 {name:'Expansão da colônia',years:'1600–1690',hint:'Expansão produtiva, ocupação do interior e novas alianças.'},
 {name:'Ouro, reformas e crise',years:'1690–1808',hint:'Mineração, tributação, redes intelectuais e formação de força militar.'},
 {name:'Independência e Império',years:'1808–1889',hint:'Abertura dos portos, disputas constitucionais, províncias e Guerra do Paraguai.'}
];
const TILE_BASE=[
 {id:'norte',name:'Norte florestal',subtitle:'Fronteiras e missões',x:38,y:16,gold:1,sugar:1,forest:5,tension:1,claim:0},
 {id:'maranhao',name:'Maranhão',subtitle:'Costas e sertões',x:69,y:26,gold:0,sugar:2,forest:4,tension:1,claim:0},
 {id:'pernambuco',name:'Pernambuco',subtitle:'Engenhos e portos',x:83,y:45,gold:0,sugar:5,forest:2,tension:1,claim:0},
 {id:'bahia',name:'Bahia',subtitle:'Administração colonial',x:67,y:61,gold:1,sugar:4,forest:3,tension:1,claim:0},
 {id:'minas',name:'Minas e interior',subtitle:'Rotas e mineração',x:51,y:73,gold:6,sugar:1,forest:3,tension:1,claim:0},
 {id:'sul',name:'Sul e São Paulo',subtitle:'Fronteiras provinciais',x:40,y:87,gold:3,sugar:2,forest:4,tension:1,claim:0}
];
const DEBATES=[
 {title:'Forma de governo',hint:'Quem encarna a soberania política?',positions:[['Monarquia restauracionista',0],['Monarquia constitucional',3],['República representativa',2],['Constituinte popular',1]]},
 {title:'Organização territorial',hint:'Onde residem as competências políticas?',positions:[['Centralização régia',0],['Províncias autônomas',2],['Federalismo constitucional',2],['Centralismo legal',1]]},
 {title:'Trabalho e escravidão',hint:'Conflito sobre a ordem de trabalho em uma história alternativa.',positions:[['Manutenção do regime escravista',3],['Emancipação gradual',0],['Abolição imediata',1]]},
 {title:'Comércio externo',hint:'Proteção comercial ou abertura?',positions:[['Monopólios e exclusividades',0],['Protecionismo industrial',3],['Abertura comercial',3],['Regras de comércio deliberadas',1]]},
 {title:'Distribuição de terras',hint:'A estrutura fundiária permanece ou muda?',positions:[['Conservação das grandes propriedades',3],['Concessões condicionadas pela Coroa',0],['Autonomia agrária provincial',2],['Reforma e acesso ampliado à terra',1]]},
 {title:'Representação política',hint:'Quem participa da tomada de decisões?',positions:[['Poder pessoal do soberano',0],['Voto censitário',3],['Representação provincial',2],['Sufrágio ampliado',1]]},
 {title:'Religião e Estado',hint:'Qual o regime institucional das crenças?',positions:[['Religião oficial',0],['Pluralismo tutelado',3],['Autonomia das comunidades locais',2],['Estado laico',1]]},
 {title:'Forças armadas',hint:'Militares subordinados ou politicamente autônomos?',positions:[['Comando subordinado ao soberano',0],['Comando nacional com controle civil',1],['Milícias provinciais',2],['Forças atreladas a elites locais',3]]},
 {title:'Tributação',hint:'Quem cobra, quem paga e quem decide?',positions:[['Tributos centralizados',0],['Autonomia fiscal regional',2],['Privilégios tributários produtivos',3],['Tributação sujeita a representação',1]]},
 {title:'Educação e imprensa',hint:'Quem forma e circula ideias?',positions:[['Monopólio da educação oficial',0],['Patrocínio privado',3],['Redes regionais autônomas',2],['Ensino público e imprensa livre',1]]}
];
const GOALS=[
 ['Realizar concessão de terras','Estabelecer uma missão','Abrir rota de ocupação','Construir um engenho'],
 ['Instituir um monopólio','Fundar uma instituição de ensino','Fundar uma vila','Ampliar a produção açucareira'],
 ['Cobrar a Derrama','Rearticular redes de influência','Organizar uma bandeira','Explorar jazida mineral'],
 ['Abrir os portos','Publicar periódico','Mobilizar a Guarda Nacional','Modernizar lavouras']
];
const ACTIONS=[
 [
  [{id:'sesmaria',name:'Conceder sesmaria',icon:'scroll',desc:'Concede terra em uma região. +2 Dinheiro, +1 controle; +1 tensão local.'},{id:'monopolio',name:'Decretar monopólio',icon:'coins',desc:'+3 Dinheiro; reduz coesão social em 1.'},{id:'administrar',name:'Montar administração',icon:'landmark',desc:'−2 Dinheiro, +3 Influência e +1 legitimidade.'}],
  [{id:'missao',name:'Fundar missão',icon:'book',desc:'−1 Dinheiro, +3 Influência; +1 instituição regional.'},{id:'catequese',name:'Organizar catequese',icon:'sun',desc:'+2 Influência; +1 tensão se houver ocupação territorial.'},{id:'mediação',name:'Mediar conflitos',icon:'handshake',desc:'−1 Influência; −2 tensão local e +1 coesão social.'}],
  [{id:'rota',name:'Abrir expedição',icon:'compass',desc:'−1 Dinheiro, +2 controle; −1 floresta e +1 tensão local.'},{id:'milicia',name:'Organizar milícia',icon:'shield',desc:'−2 Dinheiro, +2 Influência e +1 força territorial.'},{id:'coercao',name:'Captura e coerção',icon:'alert',desc:'+3 Dinheiro e +1 controle; −2 coesão, +2 tensão. Resistência aumenta.'}],
  [{id:'engenho',name:'Construir engenho',icon:'factory',desc:'−1 Dinheiro; converte potencial açucareiro em +4 Dinheiro, +1 tensão.'},{id:'exportar',name:'Organizar exportação',icon:'ship',desc:'+3 Dinheiro se há açúcar disponível; caso contrário +1.'},{id:'investir',name:'Investir em infraestrutura',icon:'hammer',desc:'−2 Dinheiro; +1 Influência, +1 capacidade produtiva regional.'}]
 ],
 [
  [{id:'monopolio',name:'Reforçar monopólio',icon:'coins',desc:'+4 Dinheiro e +1 tensão local; −1 coesão.'},{id:'tributar',name:'Cobrar tributo',icon:'scroll',desc:'+3 Dinheiro; −1 legitimidade.'},{id:'administrar',name:'Consolidar governo',icon:'landmark',desc:'−2 Dinheiro, +3 Influência e +1 legitimidade.'}],
  [{id:'colegio',name:'Fundar colégio',icon:'book',desc:'−2 Dinheiro, +3 Influência, +1 instituição local.'},{id:'missao',name:'Ampliar missões',icon:'sun',desc:'−1 Dinheiro, +2 Influência, +1 instituição local.'},{id:'mediação',name:'Mediar conflitos',icon:'handshake',desc:'−1 Influência, −2 tensão local, +1 coesão.'}],
  [{id:'vila',name:'Fundar vila',icon:'home',desc:'−2 Dinheiro, +2 controle e +1 Influência.'},{id:'rota',name:'Expandir fronteira',icon:'compass',desc:'−1 floresta, +2 controle, +1 tensão.'},{id:'coercao',name:'Captura e coerção',icon:'alert',desc:'+3 Dinheiro e +1 controle; −2 coesão e +2 tensão.'}],
  [{id:'ampliar',name:'Ampliar engenhos',icon:'factory',desc:'−1 açúcar regional, +4 Dinheiro e +1 tensão.'},{id:'exportar',name:'Exportar produção',icon:'ship',desc:'+3 Dinheiro se há açúcar disponível.'},{id:'investir',name:'Construir infraestrutura',icon:'hammer',desc:'−2 Dinheiro, +1 Influência e +1 capacidade local.'}]
 ],
 [
  [{id:'derrama',name:'Impor a Derrama',icon:'coins',desc:'+5 Dinheiro; −2 legitimidade e −1 coesão social.'},{id:'licenca',name:'Conceder licença mercantil',icon:'scroll',desc:'+2 Dinheiro e +2 Influência.'},{id:'administrar',name:'Reorganizar a administração',icon:'landmark',desc:'−2 Dinheiro, +3 Influência e +1 legitimidade.'}],
  [{id:'redes',name:'Rearticular redes',icon:'book',desc:'−1 Dinheiro, +3 Influência. Resposta às reformas e expulsões.'},{id:'ideias',name:'Circular ideias',icon:'feather',desc:'−1 Dinheiro, +3 Influência; +1 mobilização social.'},{id:'mediação',name:'Articular conciliação',icon:'handshake',desc:'−1 Influência, +1 coesão e +1 legitimidade.'}],
  [{id:'bandeira',name:'Montar bandeira',icon:'compass',desc:'−2 Dinheiro, +2 controle territorial, +1 tensão.'},{id:'milicia',name:'Mobilizar forças locais',icon:'shield',desc:'−2 Dinheiro, +2 Influência; +1 força militar, +1 autonomia.'},{id:'coercao',name:'Captura e coerção',icon:'alert',desc:'+3 Dinheiro, −2 coesão e +2 tensão.'}],
  [{id:'ouro',name:'Explorar jazida de ouro',icon:'pickaxe',desc:'Extração intensa: +5 Dinheiro, −2 ouro permanente, +1 tensão.'},{id:'ouroleve',name:'Exploração moderada',icon:'pickaxe',desc:'+2 Dinheiro, −1 ouro permanente. Menor ganho imediato.'},{id:'capital',name:'Redirecionar capital',icon:'coins',desc:'−2 Dinheiro, +3 Influência, +1 infraestrutura local.'}]
 ],
 [
  [{id:'portos',name:'Abrir os portos',icon:'ship',desc:'+3 Influência, +1 coesão; −1 Dinheiro por perder exclusividade.'},{id:'constituicao',name:'Disputar a Constituição',icon:'scroll',desc:'−2 Dinheiro, +4 Influência, +1 legitimidade.'},{id:'administrar',name:'Reforçar o poder central',icon:'landmark',desc:'−2 Dinheiro, +3 Influência, +1 legitimidade.'}],
  [{id:'jornal',name:'Fundar periódico',icon:'feather',desc:'−1 Dinheiro, +3 Influência e +1 mobilização social.'},{id:'faculdade',name:'Fundar faculdade',icon:'book',desc:'−3 Dinheiro, +4 Influência e +1 instituição.'},{id:'assembleia',name:'Articular assembleia',icon:'handshake',desc:'−2 Dinheiro, +3 Influência, +1 legitimidade.'}],
  [{id:'guarda',name:'Mobilizar Guarda Nacional',icon:'shield',desc:'−2 Dinheiro, +2 Influência, +1 força militar, +1 autonomia.'},{id:'levante',name:'Articular levante provincial',icon:'flag',desc:'+3 Influência e +2 controle; −2 legitimidade, +2 tensão.'},{id:'provincia',name:'Negociar autonomia',icon:'compass',desc:'−1 Dinheiro, +3 Influência, +1 coesão.'}],
  [{id:'cafe',name:'Modernizar lavouras',icon:'factory',desc:'−2 Dinheiro, +4 Dinheiro, +1 infraestrutura local.'},{id:'credito',name:'Buscar crédito externo',icon:'coins',desc:'+4 Dinheiro, −1 Influência.'},{id:'aberdeen',name:'Disputar política do tráfico',icon:'scroll',desc:'−1 Dinheiro, +3 Influência e +1 tensão social.'}]
 ]
];
const POLE_INFO=[
 ['Monarquia restauracionista','Coroa'],['Democracia liberal / constituinte','Intelectuais'],['República federativa','Sertanistas'],['Monarquia constitucional oligárquica','Produtores']
];
let s=null;
let selectedAction='';
let toast='';
const $=id=>document.getElementById(id);
const minmax=(v,a,b)=>Math.max(a,Math.min(b,v));
const e=t=>String(t).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const f=(n)=>Number(n||0);
const currency=(v)=>Math.max(0,Math.floor(v));
const who=(idx)=>s.players[idx];
function log(msg){s.log.unshift({era:s.era,round:s.round,text:msg});s.log=s.log.slice(0,80)}
function flash(t){toast=t;let n=$('toast');if(n)n.textContent=toast;setTimeout(()=>{toast='';let n=$('toast');if(n)n.textContent=''},3200)}
function makeState(mode,human){
 return {version:VERSION,mode,human,era:0,round:1,turn:0,phase:'play',tile:3,
 players:NAMES.map((name,id)=>({id,money:6,influence:5,mandates:0,ideas:[],achievements:[],actions:[]})),
 tiles:TILE_BASE.map(t=>({...t,institutions:0,infrastructure:0,force:0})),
 social:7,legitimacy:6,mobilization:1,army:{force:0,prestige:0,autonomy:0},war:{done:false,idx:0,contributions:[],result:''},
 debates:{used:[],active:null,proposer:0,bidder:0,bids:[],wins:[0,0,0,0],results:[]},winner:null,
 log:[{era:0,round:1,text:'Começa a formação colonial. Quatro interesses disputam recursos e instituições.'}]
 };
}
function save(){localStorage.setItem(KEY,JSON.stringify(s))}
function load(){try{let obj=JSON.parse(localStorage.getItem(KEY));if(obj&&obj.version===VERSION&&obj.players&&obj.debates){s=obj;return true}}catch(_){}return false}
function add(pid,k,amount){who(pid)[k]=minmax(who(pid)[k]+amount,0,99)}
function world(k,amount){s[k]=minmax(s[k]+amount,0,10)}
function area(){return s.tiles[s.tile]}
function goal(pid,id){
 let target=[['sesmaria','missao','rota','engenho'],['monopolio','colegio','vila','ampliar'],['derrama','redes','bandeira','ouro'],['portos','jornal','guarda','cafe']][s.era][pid];
 if(target!==id||who(pid).achievements.includes(s.era))return;
 who(pid).achievements.push(s.era);add(pid,'mandates',1);add(pid,'influence',1);
 log(NAMES[pid]+' concluiu o objetivo da era: '+GOALS[s.era][pid]+'. +1 mandato para o endgame.');
}
function execute(pid,id,tileIndex,automated=false){
 if(s.phase!=='play'||pid!==s.turn)return false;
 if(id!=='reorganizar'&&id!=='acordo'&&id!=='exercito'&&id!=='controle'&&!ACTIONS[s.era][pid].some(a=>a.id===id))return false;
 let a=s.tiles[tileIndex];if(!a)return false;
 const P=who(pid); const cost=(money=0,influence=0)=>P.money>=money&&P.influence>=influence;
 const spend=(money=0,influence=0)=>{if(!cost(money,influence))return false;add(pid,'money',-money);add(pid,'influence',-influence);return true};
 const grant=(money=0,influence=0)=>{add(pid,'money',money);add(pid,'influence',influence)};
 let changed=true,detail='';
 switch(id){
 case 'sesmaria':grant(2,1);a.claim+=1;a.tension+=1;world('social',-1);detail='terra concedida, concentração e conflito ampliados';break;
 case 'monopolio':grant(s.era===1?4:3,0);a.tension+=1;world('social',-1);detail='receita imediata, coesão reduzida';break;
 case 'administrar':if(!spend(2))return false;grant(0,3);world('legitimacy',1);detail='administração consolidada';break;
 case 'tributar':grant(3);world('legitimacy',-1);a.tension+=1;detail='tributação amplia receita e resistência';break;
 case 'missao':if(!spend(1))return false;grant(0,s.era===1?2:3);a.institutions++;if(a.claim>0)a.tension++;detail='instituição religiosa criada';break;
 case 'catequese':grant(0,2);if(a.claim>0)a.tension++;detail='missão amplia sua influência';break;
 case 'mediação':if(!spend(0,1))return false;a.tension=Math.max(0,a.tension-2);world('social',1);detail='tensão local reduzida';break;
 case 'colegio':if(!spend(2))return false;grant(0,3);a.institutions++;detail='instituição educacional criada';break;
 case 'redes':if(!spend(1))return false;grant(0,3);detail='redes reorganizadas';break;
 case 'ideias':if(!spend(1))return false;grant(0,3);world('mobilization',1);detail='circulação política intensificada';break;
 case 'assembleia':if(!spend(2))return false;grant(0,3);world('legitimacy',1);detail='representação política ampliada';break;
 case 'jornal':if(!spend(1))return false;grant(0,3);world('mobilization',1);detail='imprensa articulada';break;
 case 'faculdade':if(!spend(3))return false;grant(0,4);a.institutions++;detail='instituição de ensino superior';break;
 case 'rota':if(!spend(1))return false;a.claim+=2;a.forest=Math.max(0,a.forest-1);a.tension++;grant(0,1);detail='expansão territorial e pressão ecológica';break;
 case 'milicia':if(!spend(2))return false;grant(0,2);a.force++;if(s.era>=2){s.army.force++;s.army.autonomy++}detail='mobilização de forças locais';break;
 case 'coercao':grant(3);a.claim++;a.tension+=2;world('social',-2);world('mobilization',1);detail='coerção aumentou resistência, tensão e instabilidade';break;
 case 'vila':if(!spend(2))return false;a.claim+=2;grant(0,1);detail='nova vila fortalece o poder regional';break;
 case 'bandeira':if(!spend(2))return false;a.claim+=2;a.tension++;grant(0,1);detail='expedição reorganizou ocupação interiorana';break;
 case 'guarda':if(!spend(2))return false;grant(0,2);s.army.force++;s.army.autonomy++;detail='milícia provincial fortalece o aparato armado';break;
 case 'levante':grant(0,3);a.claim+=2;a.tension+=2;world('legitimacy',-2);detail='levante ameaça governo e mobiliza forças provinciais';break;
 case 'provincia':if(!spend(1))return false;grant(0,3);world('social',1);detail='autonomia negociada';break;
 case 'engenho':if(a.sugar<1||!spend(1))return false;a.sugar--;grant(4);a.tension++;detail='produção açucareira gera capital e pressão social';break;
 case 'exportar':grant(a.sugar>0?3:1);detail='receitas de exportação';break;
 case 'investir':if(!spend(2))return false;grant(0,1);a.infrastructure++;detail='investimento produtivo';break;
 case 'ampliar':if(!spend(1))return false;if(a.sugar<1)return false;a.sugar--;grant(4);a.tension++;detail='engenho ampliado';break;
 case 'ouro':if(a.gold<2)return false;a.gold-=2;grant(5);a.tension++;world('social',-1);detail='reservas de ouro permanentemente reduzidas';break;
 case 'ouroleve':if(a.gold<1)return false;a.gold--;grant(2);detail='extração moderada preserva parte das reservas';break;
 case 'capital':if(!spend(2))return false;grant(0,3);a.infrastructure++;detail='capital convertido em capacidade e prestígio';break;
 case 'derrama':grant(5);world('legitimacy',-2);world('social',-1);a.tension+=2;detail='arrecadação amplia instabilidade';break;
 case 'licenca':grant(2,2);detail='licenças comerciais concedidas';break;
 case 'portos':grant(0,3);world('social',1);add(pid,'money',-1);detail='novas relações comerciais';break;
 case 'constituicao':if(!spend(2))return false;grant(0,4);world('legitimacy',1);detail='projeto constitucional articulado';break;
 case 'cafe':if(!spend(2))return false;grant(4);a.infrastructure++;detail='lavouras modernizadas';break;
 case 'credito':grant(4,-1);detail='crédito recebido, dependência política ampliada';break;
 case 'aberdeen':if(!spend(1))return false;grant(0,3);a.tension++;detail='pressão sobre políticas do tráfico';break;
 case 'exercito':if(s.era<2||!spend(3))return false;s.army.force+=2;s.army.autonomy++;grant(0,1);detail='Exército fortalecido, mas mais autônomo';break;
 case 'controle':if(s.era<2||!spend(2,1))return false;s.army.autonomy=Math.max(0,s.army.autonomy-2);world('legitimacy',1);detail='controle civil do Exército reforçado';break;
 case 'acordo':if(!spend(2))return false;grant(0,2);world('social',1);detail='articulação e compromisso institucional';break;
 case 'reorganizar':grant(2);detail='reorganização de recursos; recuperação de capacidade de ação';break;
 default:changed=false;
 }
 if(!changed)return false;
 a.tension=minmax(a.tension,0,9);a.claim=minmax(a.claim,0,9);
 P.actions.push({era:s.era,action:id,tile:a.id});
 const action=ACTIONS[s.era][pid].find(v=>v.id===id);
 log(NAMES[pid]+' — '+(action?action.name:id)+' em '+a.name+': '+detail+'.');
 goal(pid,id);
 selectedAction='';s.turn=(s.turn+1)%4;
 if(s.turn===0)onRoundEnd();
 save();render();
 if(s.mode==='solo')setTimeout(botCycle,280);
 return true;
}
function onRoundEnd(){
 if(s.social<=2){world('legitimacy',-1);let t=s.tiles.reduce((p,c)=>p.tension>=c.tension?p:c);t.tension=Math.max(0,t.tension-1);log('CRISE SOCIAL: resistência e mobilização dificultam a governabilidade. −1 legitimidade.')}
 if(s.era>=2&&s.army.autonomy>=6&&s.legitimacy<=2){
  s.phase='end';s.winner='intervention';log('CRISE INSTITUCIONAL: tutela militar interrompe o processo político. Derrota do projeto constitucional civil.');return;
 }
 s.round++;
 if(s.round<=3){
  if(s.era===2&&s.round===2) {world('legitimacy',-1);log('EVENTO HISTÓRICO — Reforma pombalina: expulsão dos jesuítas (1759), institucionalmente distinta da Igreja como um todo. Redes religiosas perdem espaço.');add(1,'influence',-1);}
  if(s.era===3&&s.round===2&&!s.war.done){s.phase='war';s.war.idx=0;log('Guerra do Paraguai: a campanha testa a força do Exército e a disposição das facções de financiá-lo.');}
  if(s.era>=2){s.army.force=Math.max(1,s.army.force);if(s.army.prestige>=3&&s.army.autonomy>=4)log('O Exército exige participação nas decisões de governo.');}
 }else{
  s.era++;s.round=1;
  if(s.era===2){s.army.force=2;s.army.autonomy=1;log('ERA III: surge uma instituição militar independente e não jogável, com força, prestígio e autonomia.');}
  if(s.era===4){s.phase='debates';log('ENCERRAMENTO: abre-se a disputa constitucional alternativa. Dez temas, posições e recursos acumulados.');}
  else log('TRANSIÇÃO DE ERA: '+ERAS[s.era].name+'. Reservas, tensões, instituições e riqueza anterior permanecem.');
 }
}
function botAction(pid){
 const t=s.tiles;
 let tile=pid===3?((s.era===2)?t.reduce((best,x,i)=>x.gold>t[best].gold?i:best,0):2):pid===2?4:pid===1?1:3;
 const preferred=[['sesmaria','missao','rota','engenho'],['monopolio','colegio','vila','ampliar'],['derrama','redes','bandeira','ouro'],['portos','jornal','guarda','cafe']][s.era][pid];
 let choices=[preferred,...ACTIONS[s.era][pid].map(a=>a.id),'acordo'];
 if(s.era>=2&&s.army.autonomy>=5)choices=['controle',...choices];
 for(let id of [...choices,'reorganizar']){if(execute(pid,id,tile,true))return}
 // Fallback for resource-strapped positions.
 add(pid,'money',1);log(NAMES[pid]+' reorganiza recursos para voltar a agir.');s.turn=(s.turn+1)%4;if(s.turn===0)onRoundEnd();save();render();
}
function botCycle(){
 if(!s||s.mode!=='solo')return;
 let safety=0;
 while(s.phase==='play'&&s.turn!==s.human&&safety++<5)botAction(s.turn);
 if(s.phase==='war'){while(s.war.idx<4&&s.war.idx!==s.human&&s.phase==='war')submitWar(Math.min(2,who(s.war.idx).money),true)}
 if(s.phase==='debates'){
  if(s.debates.active===null&&s.debates.used.length<10&&s.debates.proposer!==s.human){
   const id=DEBATES.findIndex((d,i)=>!s.debates.used.includes(i));
   if(id>=0)openDebate(id,true);
  }
  while(s.phase==='debates'&&s.debates.active!==null&&s.debates.bidder!==s.human&&s.debates.bidder<4){
    let idx=s.debates.bidder, debate=DEBATES[s.debates.active];
    let favorite=debate.positions.findIndex(opt=>opt[1]===idx);
    if(favorite<0){let min=Math.min(...debate.positions.map(p=>s.debates.wins[p[1]]));favorite=debate.positions.findIndex(p=>s.debates.wins[p[1]]===min);}
    placeBid(favorite,Math.min(2,who(idx).money),Math.min(2,who(idx).influence),Math.min(1,who(idx).mandates),true);
  }
 }
 render();
}
function submitWar(amount,auto=false){
 if(s.phase!=='war')return;
 let pid=s.war.idx;amount=minmax(currency(amount),0,Math.min(4,who(pid).money));
 add(pid,'money',-amount);s.war.contributions.push(amount);s.war.idx++;
 if(s.war.idx>=4){
  let total=s.war.contributions.reduce((a,b)=>a+b,0);
  let success=s.army.force+total>=10;
  s.war.done=true;s.war.result=success?'Vitória custosa':'Campanha militar malsucedida';
  if(success){s.army.force+=2;s.army.prestige+=3;s.army.autonomy+=2;world('legitimacy',1);}
  else{s.army.force=Math.max(1,s.army.force-1);s.army.prestige+=1;s.army.autonomy+=1;world('legitimacy',-2);world('social',-1);}
  s.phase='play';log('Guerra do Paraguai: '+s.war.result+'. Recursos mobilizados: '+total+'. Prestígio e autonomia militar foram alterados.');
 }
 save();render();if(s.mode==='solo')setTimeout(botCycle,200);
}
function openDebate(id,auto=false){
 if(s.phase!=='debates'||s.debates.active!==null||s.debates.used.includes(id))return;
 const proposer=s.debates.proposer;
 if(who(proposer).influence<1){ // Debt in representation: government must still put agenda to vote.
   add(proposer,'money',-2);log(NAMES[proposer]+' abre pauta sem influência; perde até 2 de Dinheiro em organização.');
 }else add(proposer,'influence',-1);
 s.debates.active=id;s.debates.bidder=0;s.debates.bids=[];
 log(NAMES[proposer]+' propõe: '+DEBATES[id].title+'. A abertura consumiu a ação de proposição e influência.');
 save();render();if(s.mode==='solo')setTimeout(botCycle,200);
}
function militaryVote(topic,position){
 if(s.army.prestige<2||s.army.autonomy<3)return 0;
 if(topic===7&&(position[0].includes('Comando subordinado')||position[0].includes('Comando nacional')))return 0;
 if(topic===7)return 2;
 if(topic===1&&position[0].includes('Centralização'))return 2;
 if(topic===0&&position[0].includes('Monarquia restauracionista'))return 1;
 return 0;
}
function placeBid(position,money,influence,mandates,auto=false){
 if(s.phase!=='debates'||s.debates.active===null)return;
 let pid=s.debates.bidder,P=who(pid),options=DEBATES[s.debates.active].positions;
 if(position<0||position>=options.length)return;
 money=currency(money);influence=currency(influence);mandates=currency(mandates);
 if(money>P.money||influence>P.influence||mandates>P.mandates)return;
 add(pid,'money',-money);add(pid,'influence',-influence);add(pid,'mandates',-mandates);
 s.debates.bids.push({pid,position,money,influence,mandates});
 s.debates.bidder++;
 if(s.debates.bidder===4)resolveDebate();
 save();render();if(s.mode==='solo')setTimeout(botCycle,180);
}
function resolveDebate(){
 let idx=s.debates.active,topic=DEBATES[idx],scores=topic.positions.map((pos,i)=>{
   let base=s.debates.bids.filter(b=>b.position===i).reduce((sum,b)=>sum+b.money+2*b.influence+3*b.mandates+Math.min(3,who(b.pid).ideas.filter(token=>token.pole===pos[1]).length),0);
   return base+militaryVote(idx,pos);
 });
 const highest=Math.max(...scores), winners=scores.map((n,i)=>n===highest?i:-1).filter(i=>i>=0);
 let chosen=winners.length===1?winners[0]:null;
 if(chosen!==null&&highest>0){
  let pole=topic.positions[chosen][1];s.debates.wins[pole]++;
  s.debates.bids.filter(b=>b.position===chosen&&(b.money+b.influence+b.mandates)>0).forEach(b=>{
   let token={debate:idx,pole};who(b.pid).ideas.push(token);
  });
  log('DEBATE — '+topic.title+': venceu "'+topic.positions[chosen][0]+'", polo '+POLE_INFO[pole][0]+'.');
 }else log('DEBATE — '+topic.title+': impasse. Nenhum polo avança.');
 s.debates.results.push({idx,chosen,scores,bids:s.debates.bids.slice(),highest});
 s.debates.used.push(idx);s.debates.active=null;s.debates.bids=[];s.debates.bidder=0;
 s.debates.proposer=(s.debates.proposer+1)%4;
 if(s.debates.used.length>=10){s.phase='end';s.winner='political';log('Todos os dez debates foram realizados. O Brasil alternativo está definido.');}
}
function header(){return '<header class="topbar"><div class="brand"><div class="brand-mark">BR</div><div><span class="overline">UM JOGO SOBRE PODER E HISTÓRIA</span><strong>BRASIL EM DISPUTA</strong></div></div><div class="topnav"><span class="version">PROTÓTIPO V'+VERSION+'</span><button class="plain" data-do="rules">Regras e premissas</button><button class="plain" data-do="feedback">Feedback</button><button class="plain" data-do="reset">Nova partida</button></div></header>'}
function startScreen(){
 return '<div class="intro"><div class="intro-copy"><span class="eyebrow">ESTRATÉGIA HISTÓRICA · QUATRO FACÇÕES</span><h1>Quem decide<br><em>o rumo de um país?</em></h1><p>Da colonização ao Império, quatro forças disputam poder sobre um Brasil que guarda as marcas de cada decisão. Conquiste objetivos nas eras e use seus recursos em dez debates para formar um país à sua maneira.</p><div class="intro-tags"><span>4 facções</span><span>4 eras</span><span>Territórios persistentes</span><span>10 debates</span><span>Exército autônomo</span></div><div class="start-panel"><h3>Iniciar sessão de teste</h3><p>Escolha como jogar. O modo solo é útil para avaliar a experiência sem reunir quatro pessoas.</p><div class="mode-row"><button class="mode selected" data-mode="solo">Solo contra 3 bots</button><button class="mode" data-mode="local">4 pessoas · mesmo dispositivo</button></div><label for="human">Qual facção você quer controlar?</label><select id="human"><option value="0">Coroa</option><option value="1">Igreja → Intelectuais</option><option value="2">Sertanistas</option><option value="3">Produtores</option></select><button class="primary wide" data-do="start">Começar partida <span>↗</span></button><button class="subtle wide" data-do="load">Retomar partida salva</button></div></div><div class="intro-side"><div class="stamp">1530 <span>—</span> 1889</div><div class="intro-orbit"><div class="orbit-caption">QUATRO VISÕES EM CONFLITO</div><div class="orbit-center">O FUTURO<br>DO BRASIL</div><div class="orbit-node n1">01 <b>Coroa</b><small>Instituições</small></div><div class="orbit-node n2">02 <b>Igreja</b><small>Ideias</small></div><div class="orbit-node n3">03 <b>Sertanistas</b><small>Território</small></div><div class="orbit-node n4">04 <b>Produtores</b><small>Capital</small></div></div><div class="intro-note">Protótipo exploratório, não uma reconstrução histórica determinística. Regras numéricas provisórias.</div></div></div>';
}
function stat(label,val,cls=''){return '<div class="stat '+cls+'"><span>'+label+'</span><b>'+val+'</b></div>'}
function playersPanel(){
 let curr=s.phase==='play'?s.turn:(s.phase==='war'?s.war.idx:(s.debates.active!==null?s.debates.bidder:s.debates.proposer));
 return '<section class="players-strip">'+s.players.map((p,i)=>'<div class="player-chip '+(i===curr?'active':'')+'" style="--player:'+COLORS[i]+'"><div class="chip-head"><span class="dot"></span><strong title="'+NAMES[i]+'">'+ROLE_LABELS[Math.min(s.era,3)][i]+'</strong>'+(s.mode==='solo'&&i!==s.human?'<small>BOT</small>':'')+'</div><div class="chip-stats"><span>◈ '+p.money+' dinheiro</span><span>✧ '+p.influence+' influência</span><span>◆ '+p.mandates+' mandatos</span><span>✦ '+p.ideas.length+' ideias</span></div><span class="chip-goal">'+(p.achievements.includes(s.era)?'✓ Objetivo cumprido — ':'Meta: ')+GOALS[Math.min(s.era,3)][i]+'</span></div>').join('')+'</section>';
}
function indicator(label,v,max,accent=''){return '<div class="indicator"><div class="ind-row"><span>'+label+'</span><strong>'+v+'/'+max+'</strong></div><div class="meter"><i style="width:'+minmax(100*v/max,0,100)+'%;background:'+accent+'"></i></div></div>'}
function tileCard(t,i){
 return '<button class="tile '+(i===s.tile?'chosen':'')+'" style="left:'+t.x+'%;top:'+t.y+'%;" data-do="tile" data-i="'+i+'" title="'+t.name+'"><span class="tile-pin"></span><span class="tile-name">'+t.name+'</span></button>';
}
function mapPanel(){
 let a=area();
 return '<section class="panel map-panel"><div class="panel-title"><div><span class="overline">01 / O TERRITÓRIO</span><h2>Mapa de influência</h2></div><span class="pill">6 regiões · abstratas</span></div><div class="map-stage"><div class="map-grid"></div><div class="map-shape"></div>'+s.tiles.map(tileCard).join('')+'<div class="map-compass">N <span>↑</span></div><div class="map-note">Ilustração esquemática, não é um mapa geográfico ou histórico.</div></div><div class="region-info"><div><div class="eyebrow">REGIÃO SELECIONADA</div><h3>'+a.name+'</h3><p>'+a.subtitle+'</p></div><div class="resource-grid">'+stat('Ouro restante',a.gold,'gold')+stat('Açúcar restante',a.sugar)+stat('Floresta',a.forest)+stat('Tensão local',a.tension,'red')+stat('Controle territorial',a.claim)+stat('Instituições',a.institutions)+'</div></div></section>';
}
function eraOverview(){
 let title=s.phase==='end'?'Desfecho da partida':s.phase==='debates'?'Assembleia dos rumos':s.phase==='war'?'Guerra do Paraguai':ERAS[s.era].name;
 let extra=s.phase==='play'?'<span class="round">Rodada '+s.round+' de 3</span>':('<span class="round">'+(s.phase==='debates'?s.debates.used.length+' de 10 debates':'Momento decisivo')+'</span>');
 return '<div class="era-header"><div><span class="eyebrow">LINHA DO TEMPO · '+(s.era+1)+' / 4</span><h1>'+title+'</h1><p>'+ERAS[Math.min(s.era,3)].years+' · '+ERAS[Math.min(s.era,3)].hint+'</p></div>'+extra+'</div><div class="era-track">'+ERAS.map((era,i)=>'<div class="era-node '+(i===s.era?'on':i<s.era?'done':'')+'"><span>0'+(i+1)+'</span><strong>'+era.name+'</strong></div>').join('')+'</div>';
}
function socialPanel(){
 return '<section class="panel"><div class="panel-title"><div><span class="overline">02 / LEGADOS PERSISTENTES</span><h2>Estado do Brasil</h2></div></div><div class="indicator-group">'+indicator('Coesão social',s.social,10,'#86b6a0')+indicator('Legitimidade do governo',s.legitimacy,10,'#c5b179')+indicator('Mobilização social',s.mobilization,10,'#ad95bb')+'</div><p class="small-muted">As consequências de ações, ocupação e coerção permanecem após a troca de era. Coesão baixa pode produzir crises políticas.</p>'+(s.era>=2?'<div class="army-block"><div class="army-top"><div><span class="overline">INSTITUIÇÃO NÃO JOGÁVEL</span><h3>Exército</h3></div><span class="pill warn">Autônomo</span></div><div class="army-grid">'+stat('Força',s.army.force)+stat('Prestígio',s.army.prestige)+stat('Autonomia',s.army.autonomy)+'</div><p class="small-muted">Se autonomia ≥ 6 e legitimidade ≤ 2, ocorre uma intervenção e a partida termina. Com prestígio, os militares influenciam debates.</p></div>':'<div class="army-upcoming">Exército independente entra em cena na Era III.</div>')+'</section>';
}
function turnPanel(){
 const pid=s.turn,P=who(pid),actions=ACTIONS[s.era][pid].concat([{id:'acordo',name:'Articular acordo',desc:'−2 Dinheiro, +2 Influência e +1 coesão social.'},{id:'reorganizar',name:'Reorganizar recursos',desc:'Recupera +2 Dinheiro; não avança objetivo da era.'}]);
 if(s.era>=2)actions.push({id:'exercito',name:'Financiar Exército',desc:'−3 Dinheiro; +2 força e +1 autonomia. Risco futuro.'},{id:'controle',name:'Defender controle civil',desc:'−2 Dinheiro, −1 Influência; −2 autonomia e +1 legitimidade.'});
 return '<section class="panel action-panel"><div class="panel-title"><div><span class="overline">03 / AÇÕES DE FACÇÃO</span><h2>Seu turno</h2></div><span class="turn-flag" style="--player:'+COLORS[pid]+'">'+ROLE_LABELS[s.era][pid]+'</span></div><p class="small-muted">Escolha uma região no mapa, depois uma ação. Cada facção realiza uma ação por rodada. Objetivo da era: <b>'+GOALS[s.era][pid]+'</b>.</p><div class="actions">'+actions.map(a=>'<button class="action '+(selectedAction===a.id?'picked':'')+'" data-do="choose" data-id="'+a.id+'"><strong>'+a.name+'</strong><span>'+a.desc+'</span></button>').join('')+'</div><div class="action-footer"><p><b>Ação selecionada:</b> '+(actions.find(a=>a.id===selectedAction)?.name||'Nenhuma')+' · <b>Região:</b> '+area().name+'</p><button class="primary" data-do="act" '+(!selectedAction?'disabled':'')+'>Executar ação →</button></div><p class="small-muted">A maioria dos custos e bônus foi criada para teste de equilíbrio. Se faltar recurso, outra ação deve ser escolhida.</p></section>';
}
function warPanel(){
 const pid=s.war.idx;
 return '<section class="panel feature-panel"><span class="overline">ACONTECIMENTO INSTITUCIONAL · ERA IV</span><h2>Guerra do Paraguai</h2><p>A força militar acumulada desde a Era III é testada. Cada facção decide quanto financiar. A guerra pode fortalecer o prestígio e a autonomia do Exército, mesmo em caso de vitória.</p><div class="war-stats">'+stat('Força atual',s.army.force)+stat('Recursos reunidos',s.war.contributions.reduce((a,b)=>a+b,0))+stat('Meta de força combinada',10)+'</div><div class="debate-player"><span class="dot" style="background:'+COLORS[pid]+'"></span> Vez de <b>'+NAMES[pid]+'</b> · Dinheiro disponível: '+who(pid).money+'</div><label>Financiamento militar (0 a 4 moedas)</label><input type="range" id="warRange" min="0" max="'+Math.min(4,who(pid).money)+'" value="0" oninput="document.getElementById(&quot;warAmount&quot;).textContent=this.value"><span class="range-caption">Contribuição: <b id="warAmount">0</b></span><button class="primary wide" data-do="war">Confirmar financiamento →</button><p class="small-muted">Regra experimental: vitória se Força + financiamento coletivo ≥ 10. Resultados e custos não são dados históricos.</p></section>';
}
function politicalScore(){
 let w=s.debates.wins;
 return '<div class="scores-grid">'+POLE_INFO.map((p,i)=>'<div class="score" style="--player:'+COLORS[i]+'"><span>'+p[0]+'</span><strong>'+w[i]+' <small>/ 4</small></strong></div>').join('')+'</div>';
}
function debateOverview(){
 const pid=s.debates.proposer;
 return '<section class="panel feature-panel"><span class="overline">FASE FINAL · ASSEMBLEIA ALTERNATIVA</span><h2>Os dez debates</h2><p>A facção proponente gasta sua ação de pauta e 1 de Influência. Depois, cada participante faz uma aposta não recuperável em Dinheiro, Influência e mandatos conquistados nas eras. Uma posição vencedora soma um ponto ao polo ideológico associado.</p>'+politicalScore()+'<div class="debate-player">Proponente: <b>'+NAMES[pid]+'</b> · Influência: '+who(pid).influence+'</div><h3>Escolha uma pauta ainda não debatida</h3><div class="debate-list">'+DEBATES.map((d,i)=>'<button class="debate-choice" data-do="propose" data-i="'+i+'" '+(s.debates.used.includes(i)?'disabled':'')+'><span>0'+(i+1)+'</span><strong>'+d.title+'</strong><small>'+(s.debates.used.includes(i)?'Encerrado':'Abrir debate ↗')+'</small></button>').join('')+'</div><p class="small-muted">Se uma facção ficar sem Influência, abrir pauta custa até 2 de Dinheiro (regra provisória para evitar bloqueio).</p></section>';
}
function debateVote(){
 let D=DEBATES[s.debates.active],pid=s.debates.bidder,p=who(pid);
 return '<section class="panel feature-panel"><span class="overline">VOTAÇÃO '+(s.debates.used.length+1)+' / 10</span><h2>'+D.title+'</h2><p>'+D.hint+'</p>'+politicalScore()+'<div class="debate-player"><span class="dot" style="background:'+COLORS[pid]+'"></span> Aposta de <b>'+NAMES[pid]+'</b> · '+p.money+' Dinheiro · '+p.influence+' Influência · '+p.mandates+' mandatos</div><div class="positions">'+D.positions.map((opt,i)=>'<label class="position"><input type="radio" name="position" value="'+i+'" '+(i===0?'checked':'')+'><span><strong>'+opt[0]+'</strong><small>Polo: '+POLE_INFO[opt[1]][0]+'</small></span></label>').join('')+'</div><div class="bid-grid">'+bidControl('Dinheiro','bidMoney',p.money,1)+bidControl('Influência','bidInfluence',p.influence,2)+bidControl('Mandatos de era','bidMandates',p.mandates,3)+'</div><div class="bid-total">Poder total desta aposta: <strong id="bidTotal">0</strong> <small>(moeda ×1 + influência ×2 + mandato ×3; Ideia Absorvida dá até +3 na sua posição)</small></div><button class="primary wide" data-do="bid">Comprometer recursos e passar →</button><p class="small-muted">As apostas dos demais ficam ocultas até a resolução. Quem perde não recebe recursos de volta. Votos de posições iguais são somados.</p></section>';
}
function bidControl(name,id,max,mult){return '<label class="bid-control"><span>'+name+' <b id="'+id+'Out">0</b> / '+max+'</span><input type="range" id="'+id+'" value="0" min="0" max="'+max+'" data-bid="1"></label>'}
function endPanel(){
 const wins=s.debates.wins,max=Math.max(...wins),top=wins.map((v,i)=>v===max?i:-1).filter(v=>v>=0);
 let intervention=s.winner==='intervention';
 return '<section class="panel feature-panel end-panel"><span class="overline">FIM DE PARTIDA</span><h2>'+(intervention?'Intervenção institucional':'O Brasil que vocês construíram')+'</h2><p>'+(intervention?'O Exército tornou-se suficientemente autônomo diante de uma crise de legitimidade para impedir a disputa constitucional. Esta é uma condição de derrota coletiva provisória.':'Os dez debates foram concluídos. Veja quantas propostas de cada orientação prevaleceram. Cada combinação de decisões forma um Brasil político diferente.')+'</p>'+politicalScore()+(intervention?'':'<div class="outcome"><h3>'+(top.length===1?'Polo predominante: '+POLE_INFO[top[0]][0]:'Empate entre projetos políticos')+'</h3><p>'+((max>=4)?'Ao menos um polo alcançou quatro aprovações.':'Nenhum polo chegou a quatro aprovações: regra de vitória a definir com o autor.')+'</p></div><div class="results">'+s.debates.results.map(r=>'<div><span>'+DEBATES[r.idx].title+'</span><strong>'+(r.chosen===null?'Impasse':DEBATES[r.idx].positions[r.chosen][0])+'</strong></div>').join('')+'</div>')+'<button class="primary" data-do="feedback">Enviar feedback de design →</button><button class="subtle" data-do="reset">Jogar novamente</button></section>';
}
function chronicle(){return '<section class="panel chronicle"><div class="panel-title"><div><span class="overline">04 / CRÔNICA</span><h2>Consequências & eventos</h2></div></div><div class="history">'+s.log.slice(0,12).map(l=>'<div class="history-row"><span>ERA '+(l.era+1)+' · R'+l.round+'</span><p>'+e(l.text)+'</p></div>').join('')+'</div><button class="subtle" data-do="report">Exportar partida (JSON) ↓</button></section>'}
function gameScreen(){
 return '<div class="app-shell">'+eraOverview()+playersPanel()+'<div class="game-grid"><div class="game-main">'+mapPanel()+chronicle()+'</div><div class="game-side">'+socialPanel()+(s.phase==='play'?turnPanel():s.phase==='war'?warPanel():s.phase==='debates'?(s.debates.active===null?debateOverview():debateVote()):endPanel())+'</div></div><footer>BRASIL EM DISPUTA · PROTÓTIPO DE DESIGN V'+VERSION+' · <a href="https://github.com/HeronKano/Experiments" target="_blank" rel="noopener">Código no GitHub ↗</a></footer></div>';
}
function modal(title,body){
 const overlay=document.createElement('div');overlay.className='modal-backdrop';overlay.id='modal';
 overlay.innerHTML='<div class="modal"><div class="modal-head"><h2>'+title+'</h2><button class="close" data-do="close">✕</button></div><div class="modal-content">'+body+'</div></div>';
 document.body.appendChild(overlay);
}
function feedbackModal(){
 modal('Feedback para o criador','<p>Este formulário é um instrumento de playtest. Descreva o que deve ser mantido ou alterado. Ao enviar, uma página de nova issue do GitHub será aberta com o texto preenchido; nada é enviado automaticamente.</p><label>O que funcionou?</label><textarea id="good" rows="3" placeholder="Momentos interessantes, escolhas difíceis, negociações..."></textarea><label>O que não funcionou?</label><textarea id="bad" rows="3" placeholder="Desequilíbrios, partes confusas, excesso de cliques..."></textarea><label>Mudanças prioritárias</label><textarea id="ideas" rows="4" placeholder="O que deveria mudar nas regras, eras, facções ou debates?"></textarea><label>Nota de diversão (1–5)</label><select id="rating"><option>1</option><option>2</option><option>3</option><option selected>4</option><option>5</option></select><button class="primary wide" data-do="sendFeedback">Abrir relato no GitHub ↗</button><button class="subtle wide" data-do="copyFeedback">Copiar relato para compartilhar</button>');
}
function feedbackText(){
 const good=$('good')?.value||'',bad=$('bad')?.value||'',ideas=$('ideas')?.value||'',rating=$('rating')?.value||'?';
 return 'Playtest Brasil em Disputa v'+VERSION+'\n\nNota: '+rating+'/5\nModo: '+(s?s.mode:'não iniciado')+'\nProgresso: '+(s?'era '+(s.era+1)+', rodada '+s.round+', fase '+s.phase:'não iniciado')+'\n\nO que funcionou:\n'+good+'\n\nO que não funcionou:\n'+bad+'\n\nMudanças prioritárias:\n'+ideas+'\n\nObservação: regras experimentais; feedback do autor é prioritário.';
}
function rulesModal(){
 modal('Regras, premissas e fontes','<div class="rule-intro"><b>Proposta do autor (preservada)</b><p>4 jogadores (Coroa, Igreja/Intelectuais, Sertanistas, Produtores); poderes e objetivos por era; consequências persistentes nos tiles; pontos de objetivos utilizados no endgame; Exército independente e não jogável a partir da Era III, teste na Guerra do Paraguai; dez debates com 2–4 propostas, apostas irreversíveis e polos políticos, onde quatro vitórias representam o objetivo declarado.</p></div><div class="rule-intro"><b>Mecânicas experimentais (para avaliar com o autor)</b><p>3 rodadas por era, 6 regiões esquemáticas, níveis de recursos, bônus numéricos, decisões determinísticas dos bots, vitória militar com soma ≥10, influência militar em determinadas votações, desempates ainda abertos e valores de licitação (Dinheiro ×1, Influência ×2, Mandato ×3). A instituição Igreja/Intelectuais e a evolução dos Sertanistas são abstrações e não equivalências históricas.</p></div><h3>Fluxo do protótipo</h3><p>1. Cada facção executa uma ação por rodada. 2. Objetivo cumprido dá um mandato para debater mais tarde. 3. Regiões acumulam mudanças. 4. Ao avançar a Era III, entra o Exército. 5. A Guerra do Paraguai acontece na Era IV. 6. A fase final executa dez debates. 7. Cada proposta aprovada conta para o polo associado, mesmo que outro jogador a tenha financiado.</p><h3>Notas de historicidade</h3><p>O marco de 1823–1824, a Guerra do Paraguai (1864–1870) e as sesmarias foram conferidos em acervos públicos. A ordem e os resultados políticos são deliberadamente contrafactuais; estatísticas do jogo não são estimativas históricas. A fórmula de vitória final e a data exata da assembleia são decisões pendentes.</p><div class="source-list"><a target="_blank" rel="noopener" href="https://www25.senado.leg.br/web/atividade/anais/constituintes">Senado Federal: Assembleia de 1823 e Constituição de 1824 ↗</a><a target="_blank" rel="noopener" href="https://memoria-spu.gestao.gov.br/publicacoes/sesmarias-e-posse-de-terras-politica-fundiaria-para-assegurar-a-colonizacao-brasileira-2/">Memória SPU: sesmarias e ocupação fundiária ↗</a><a target="_blank" rel="noopener" href="https://eblog.eb.mil.br/en/w/tuiuti-os-160-anos-da-batalha-dos-patronos-">Exército Brasileiro: Guerra da Tríplice Aliança ↗</a></div>');
}
function render(){
 $('root').innerHTML=header()+(s?gameScreen():startScreen())+'<div id="toast" class="toast">'+e(toast)+'</div>';
 if(s?.phase==='debates'&&s.debates.active!==null) document.querySelectorAll('[data-bid]').forEach(input=>input.addEventListener('input',updateBid));
}
function updateBid(){
 let money=f($('bidMoney')?.value),inf=f($('bidInfluence')?.value),mand=f($('bidMandates')?.value);
 ['Money','Influence','Mandates'].forEach(k=>{let el=$('bid'+k+'Out'),input=$('bid'+k);if(el&&input)el.textContent=input.value});
 if($('bidTotal'))$('bidTotal').textContent=money+2*inf+3*mand;
}
function reset(){
 if(!confirm('Iniciar uma nova partida? A sessão atual salva será substituída.'))return;
 localStorage.removeItem(KEY);s=null;selectedAction='';render();
}
function report(){
 if(!s)return;
 const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});
 let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='brasil-em-disputa-playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function handleClick(ev){
 let b=ev.target.closest('[data-do]');if(!b)return;
 let cmd=b.dataset.do,idx=Number(b.dataset.i);
 if(cmd==='rules')return rulesModal();
 if(cmd==='feedback')return feedbackModal();
 if(cmd==='close'){document.querySelector('#modal')?.remove();return}
 if(cmd==='reset')return reset();
 if(cmd==='report')return report();
 if(cmd==='tile'){s.tile=idx;save();render();return}
 if(cmd==='choose'){selectedAction=b.dataset.id;render();return}
 if(cmd==='start'){let mode=document.querySelector('.mode.selected')?.dataset.mode||'solo';s=makeState(mode,Number($('human')?.value||0));selectedAction='';save();render();if(mode==='solo')setTimeout(botCycle,200);return}
 if(cmd==='load'){if(load()){render();if(s.mode==='solo')setTimeout(botCycle,200)}else alert('Nenhuma partida salva nesta versão.');return}
 if(cmd==='act'){if(!selectedAction)return;if(!execute(s.turn,selectedAction,s.tile))flash('Ação indisponível: confira dinheiro, influência e recursos da região.');return}
 if(cmd==='war'){submitWar(f($('warRange')?.value));return}
 if(cmd==='propose'){openDebate(idx);return}
 if(cmd==='bid'){
   let opt=Number(document.querySelector('input[name="position"]:checked')?.value||0);
   placeBid(opt,f($('bidMoney')?.value),f($('bidInfluence')?.value),f($('bidMandates')?.value));return;
 }
 if(cmd==='sendFeedback'||cmd==='copyFeedback'){
   let message=feedbackText();
   if(cmd==='copyFeedback'){navigator.clipboard?.writeText(message).then(()=>alert('Relato copiado.')).catch(()=>alert('Não foi possível copiar.'));return}
   let url='https://github.com/HeronKano/Experiments/issues/new?title='+encodeURIComponent('Feedback de playtest — Brasil em Disputa')+'&body='+encodeURIComponent(message);
   window.open(url,'_blank','noopener');return;
 }
}
document.addEventListener('click',handleClick);
document.addEventListener('click',ev=>{
 const el=ev.target.closest('.mode');
 if(el){document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('selected',b===el));$('human').disabled=el.dataset.mode==='local'}
 if(ev.target.classList.contains('modal-backdrop'))ev.target.remove();
});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')document.querySelector('#modal')?.remove()});
render();
