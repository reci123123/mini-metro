// Mini Metro skor sunucusu — bağımlılık yok (Node 18+). Başlat: node server.js
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,FILE=process.env.SCORES_FILE||path.join(__dirname,'scores.json');
const MAPS=['Londra','İstanbul','Bakü','Venedik','Nil Deltası','Adalar'];
let db={};try{db=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch(e){}
const save=()=>fs.writeFile(FILE,JSON.stringify(db),()=>{}),seen=new Map();
function ranked(m){const best={};for(const e of db[m]||[]){const k=e.n.toLowerCase();if(!best[k]||e.s>best[k].s)best[k]=e}return Object.values(best).sort((a,b)=>b.s-a.s)}
const send=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'});r.end(JSON.stringify(o))};
http.createServer((q,r)=>{
 const u=new URL(q.url,'http://x');
 if(q.method=='OPTIONS')return send(r,204,{});
 if(q.method=='GET'&&(u.pathname=='/'||u.pathname=='/index.html'))return fs.readFile(path.join(__dirname,'index.html'),(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(d)});
 if(q.method=='GET'&&u.pathname=='/api/top'){const m=u.searchParams.get('map');if(!MAPS.includes(m))return send(r,400,{error:'map'});return send(r,200,{top:ranked(m).slice(0,20)})}
 if(q.method=='POST'&&u.pathname=='/api/score'){let b='';q.on('data',c=>{b+=c;if(b.length>1024)q.destroy()});q.on('end',()=>{
  let d;try{d=JSON.parse(b)}catch(e){return send(r,400,{error:'json'})}
  const ip=(q.headers['x-forwarded-for']||q.socket.remoteAddress||'').split(',')[0].trim(),now=Date.now();
  if(now-(seen.get(ip)||0)<8000)return send(r,429,{error:'çok sık'});
  const m=d.map,s=Math.floor(+d.score),w=Math.floor(+d.week)||1,secs=Math.floor(+d.secs);
  const n=String(d.name||'').replace(/[<>&"'`\\]/g,'').trim().slice(0,16)||'Misafir';
  if(!MAPS.includes(m)||!(s>=0&&s<=200000)||!(secs>=0)||s>secs*1.6+10)return send(r,400,{error:'geçersiz skor'});
  const id=String(d.id||'').slice(0,24);if(id&&(db[m]||[]).some(e=>e.id===id))return send(r,200,{dup:1});seen.set(ip,now);(db[m]=db[m]||[]).push({n,s,w,t:now,id});
  db[m]=db[m].sort((a,b)=>b.s-a.s).slice(0,500);save();
  const all=ranked(m);send(r,200,{rank:all.findIndex(e=>e.n.toLowerCase()==n.toLowerCase())+1,top:all.slice(0,20)})});return}
 send(r,404,{error:'yok'})
}).listen(PORT,()=>console.log('http://localhost:'+PORT));
