const STORAGE_KEY='threeCushionTrainingLog_v1';
function loadHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch(e){return[]}}
function saveHistory(h){localStorage.setItem(STORAGE_KEY,JSON.stringify(h))}
function stats(scores){const f=(scores||[]).filter(x=>x.points!==''&&x.points!=null),p=f.reduce((s,x)=>s+Number(x.points),0),n=f.length;return{totalPoints:p,totalShots:n,avg:n?p/n:0,highRun:f.length?Math.max(...f.map(x=>Number(x.points))):0,zeroShots:f.filter(x=>Number(x.points)===0).length,zeroRate:n?f.filter(x=>Number(x.points)===0).length/n:0}}
function duration(s){s=Math.max(0,Math.floor(Number(s)||0));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60,p=n=>String(n).padStart(2,'0');return h?`${p(h)}:${p(m)}:${p(x)}`:`${p(m)}:${p(x)}`}
function nowFields(){const n=new Date(),p=x=>String(x).padStart(2,'0');if(gameDate)gameDate.value=`${n.getFullYear()}-${p(n.getMonth()+1)}-${p(n.getDate())}`;if(gameTime)gameTime.value=`${p(n.getHours())}:${p(n.getMinutes())}`}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
