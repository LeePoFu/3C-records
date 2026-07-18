const STORAGE_KEY="threeCushionTrainingLog_v1";
function loadHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch(e){return[]}}
function saveHistory(h){localStorage.setItem(STORAGE_KEY,JSON.stringify(h))}
function escapeHTML(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function nowFields(){const n=new Date(),p=x=>String(x).padStart(2,"0"),d=document.getElementById("gameDate"),t=document.getElementById("gameTime");if(d)d.value=`${n.getFullYear()}-${p(n.getMonth()+1)}-${p(n.getDate())}`;if(t)t.value=`${p(n.getHours())}:${p(n.getMinutes())}`}
function stats(scores){const f=(scores||[]).filter(x=>x.points!==""&&x.points!=null),totalPoints=f.reduce((s,x)=>s+Number(x.points),0),totalShots=f.length,avg=totalShots?totalPoints/totalShots:0,highRun=f.length?Math.max(...f.map(x=>Number(x.points))):0,zeroShots=f.filter(x=>Number(x.points)===0).length;return{totalPoints,totalShots,avg:Number(avg.toFixed(3)),highRun,zeroShots,zeroRate:totalShots?zeroShots/totalShots:0}}
function historyStats(h){const totalGames=h.length,totalPoints=h.reduce((s,g)=>s+Number(g.totalPoints||0),0),totalShots=h.reduce((s,g)=>s+Number(g.totalShots||0),0),recent10=h.slice(-10),rPoints=recent10.reduce((s,g)=>s+Number(g.totalPoints||0),0),rShots=recent10.reduce((s,g)=>s+Number(g.totalShots||0),0);return{totalGames,totalPoints,totalShots,avg:totalShots?totalPoints/totalShots:0,recent10Avg:rShots?rPoints/rShots:0,highRun:h.length?Math.max(...h.map(g=>Number(g.highRun||0))):0,targetCompletionRate:h.length?h.filter(g=>g.targetCompleted).length/h.length:0}}
function duration(sec){sec=Math.max(0,Math.floor(Number(sec)||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60,p=x=>String(x).padStart(2,"0");return h?`${p(h)}:${p(m)}:${p(s)}`:`${p(m)}:${p(s)}`}
function shotTimesFromGames(games){return(games||[]).flatMap(g=>(g.scores||[]).map(s=>Number(s.shotTimeSeconds)).filter(v=>Number.isFinite(v)&&v>=0))}
function median(values){if(!values.length)return 0;const a=[...values].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function shotTimingStats(games){const v=shotTimesFromGames(games);return{count:v.length,avg:v.length?v.reduce((a,b)=>a+b,0)/v.length:0,median:median(v),fastest:v.length?Math.min(...v):0,slowest:v.length?Math.max(...v):0}}
function getActivitySummary(g){const t=g.activityType||"",m=g.activityMeta||{};if(t==="獨自練球")return `${t}｜${m.practiceMode||""}`;if(t==="單打無賭注")return `${t}｜對手：${m.opponentName||""}`;if(t==="單打有賭注")return `${t}｜對手：${m.opponentName||""}｜賭注：${m.stakeAmount||""}`;if(t==="多人追分")return `${t}｜${(m.participants||[]).map(p=>`${p.order}.${p.name}`).join("、")}`;if(t==="正式比賽")return `${t}｜${m.competitionName||""}｜對手：${m.opponentName||""}`;return t}
function exportWorkbook(filename,sheets){const wb=XLSX.utils.book_new();sheets.forEach(s=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(s.data),s.name));XLSX.writeFile(wb,filename)}
function buildHistoryWorkbookData(h){
 const overview=[["局數","日期","時間","地點","活動類型","活動資訊","目標分數","總得分","杆數","AVG","High Run","完成時間","平均出杆時間","是否達標"]];
 h.forEach((g,i)=>{const ts=shotTimingStats([g]);overview.push([i+1,g.date||"",g.time||"",g.venue||"",g.activityType||"",getActivitySummary(g),g.targetScore||"",g.totalPoints||0,g.totalShots||0,Number(g.avg||0).toFixed(3),g.highRun||0,duration(g.durationSeconds||0),ts.count?ts.avg.toFixed(1):"",g.targetCompleted?"是":"否"])});
 const details=[["局數","輪次","得分","本次出杆時間（秒）","累積時間（秒）"]];
 h.forEach((g,i)=>(g.scores||[]).forEach(s=>details.push([i+1,s.inn,s.points,(s.inningTimeSeconds??s.shotTimeSeconds??""),s.elapsedSeconds??""])));
 const actions=[["局數","序號","操作","球員","間隔秒數","全局累積秒數","本杆分數","操作後分數"]];
 h.forEach((g,i)=>(g.actionTimingEvents||[]).forEach(a=>actions.push([i+1,a.sequence,a.actionType||"",a.playerName||a.completedPlayerName||"",a.intervalSeconds??"",a.elapsedSeconds??"",a.runPoints??"",a.pointsAfter??a.runPointsAfter??""])));
 return[{name:"歷史總覽",data:overview},{name:"逐杆明細",data:details},{name:"擊球時間紀錄",data:actions}]
}
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
function runAnalysis(games){
  const runs=(games||[]).flatMap(g=>(g.scores||[]).map(s=>Number(s.points)).filter(Number.isFinite));
  const total=runs.length;
  const positive=runs.filter(v=>v>0);
  const sum=runs.reduce((a,b)=>a+b,0);
  const zeroCount=runs.filter(v=>v===0).length;
  const twoPlus=runs.filter(v=>v>=2).length;
  const threePlus=runs.filter(v=>v>=3).length;
  const fourPlus=runs.filter(v=>v>=4).length;
  const distribution={"0":0,"1":0,"2":0,"3":0,"4+":0};
  runs.forEach(v=>{
    if(v>=4)distribution["4+"]++;
    else distribution[String(Math.max(0,v))]=(distribution[String(Math.max(0,v))]||0)+1;
  });
  const variance=total?runs.reduce((a,v)=>a+Math.pow(v-(sum/total),2),0)/total:0;
  return{
    totalRuns:total,
    runAvg:total?sum/total:0,
    scoringRunAvg:positive.length?positive.reduce((a,b)=>a+b,0)/positive.length:0,
    zeroRate:total?zeroCount/total:0,
    scoringRate:total?positive.length/total:0,
    twoPlusRate:total?twoPlus/total:0,
    threePlusRate:total?threePlus/total:0,
    fourPlusRate:total?fourPlus/total:0,
    consistencyIndex:total?1/(1+Math.sqrt(variance)):0,
    distribution,
    highRun:runs.length?Math.max(...runs):0
  };
}

function gameInputMode(activityType){
  return activityType==="獨自練球" ? "live" : "run-total";
}

function actionTimingEventsFromGames(games){
  return (games||[]).flatMap((game,gameIndex)=>
    (game.actionTimingEvents||[]).map(event=>({
      ...event,
      gameIndex:gameIndex+1,
      gameId:game.id||null,
      gameDate:game.date||"",
      activityType:game.activityType||"",
      inputMode:game.inputMode||"",
      intervalSeconds:Number(event.intervalSeconds)
    }))
  ).filter(event=>Number.isFinite(event.intervalSeconds)&&event.intervalSeconds>=0);
}

function standardDeviation(values){
  if(!values.length)return 0;
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  return Math.sqrt(values.reduce((sum,value)=>sum+Math.pow(value-mean,2),0)/values.length);
}

function percentile(values,p){
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  const index=(sorted.length-1)*p;
  const lower=Math.floor(index),upper=Math.ceil(index);
  if(lower===upper)return sorted[lower];
  return sorted[lower]+(sorted[upper]-sorted[lower])*(index-lower);
}

function isScoringAction(event){
  const type=String(event.actionType||"");
  return type.includes("得分+1")||type.includes("快速加分")||type==="快捷分數";
}

function isTurnEndingAction(event){
  const type=String(event.actionType||"");
  return type==="完成本杆"||type==="換對手"||type==="下一位";
}

function rhythmAnalysis(games){
  const events=actionTimingEventsFromGames(games);
  const times=events.map(event=>event.intervalSeconds);
  const scoringEvents=events.filter(isScoringAction);
  const turnEndingEvents=events.filter(isTurnEndingAction);
  const scoringTimes=scoringEvents.map(event=>event.intervalSeconds);
  const endingTimes=turnEndingEvents.map(event=>event.intervalSeconds);
  const avg=times.length?times.reduce((a,b)=>a+b,0)/times.length:0;
  const sd=standardDeviation(times);
  return{
    events,
    count:times.length,
    avg,
    median:percentile(times,.5),
    p25:percentile(times,.25),
    p75:percentile(times,.75),
    fastest:times.length?Math.min(...times):0,
    slowest:times.length?Math.max(...times):0,
    standardDeviation:sd,
    coefficientOfVariation:avg?sd/avg:0,
    rhythmConsistency:avg?1/(1+sd/avg):0,
    scoringCount:scoringTimes.length,
    scoringAvg:scoringTimes.length?scoringTimes.reduce((a,b)=>a+b,0)/scoringTimes.length:0,
    turnEndingCount:endingTimes.length,
    turnEndingAvg:endingTimes.length?endingTimes.reduce((a,b)=>a+b,0)/endingTimes.length:0
  };
}

function rhythmByActivity(games){
  const types=[...new Set((games||[]).map(game=>game.activityType).filter(Boolean))];
  return types.map(activityType=>{
    const analysis=rhythmAnalysis((games||[]).filter(game=>game.activityType===activityType));
    return{activityType,...analysis};
  }).filter(item=>item.count>0);
}
