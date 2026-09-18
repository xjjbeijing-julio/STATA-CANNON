/* Pure data helpers shared by the course UI and regression checks. */
window.ACADEMY_CORE = (() => {
 function parseCSV(text){
  const rows=[];let row=[],cell='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){const c=text[i];
   if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
   else if(c===','&&!quoted){row.push(cell);cell='';}
   else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';}
   else cell+=c;
  }
  if(quoted)throw Error('CSV引号未闭合');
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  if(!rows.length||rows.some(r=>r.length!==rows[0].length))throw Error('CSV列数不一致');
  return rows;
 }
 function validProgress(p){
  const map=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.values(x).every(v=>typeof v==='string');
  return !!(p&&p.version===4&&(!p.learnerId||/^[a-zA-Z0-9-]{8,80}$/.test(p.learnerId))&&Number.isFinite(p.xp)&&p.xp>=0&&Number.isFinite(p.streak)&&Number.isFinite(p.best)&&
   Array.isArray(p.attempts)&&p.attempts.length<=100000&&p.attempts.every(a=>a&&typeof a.id==='string'&&typeof a.text==='string'&&typeof a.correct==='boolean'&&Number.isInteger(a.skill)&&a.skill>=0&&a.skill<6)&&
   Array.isArray(p.completed)&&p.completed.every(x=>Number.isInteger(x)&&x>=1&&x<=16)&&new Set(p.completed).size===p.completed.length&&
   Array.isArray(p.awarded)&&p.awarded.every(x=>typeof x==='string')&&Array.isArray(p.diagnostics)&&p.diagnostics.every(x=>x&&Number.isFinite(x.correct)&&Number.isFinite(x.total)&&x.correct>=0&&x.correct<=x.total)&&map(p.notes)&&map(p.paperNotes)&&map(p.boss)&&(!p.lessonResults||(typeof p.lessonResults==='object'&&!Array.isArray(p.lessonResults)&&Object.values(p.lessonResults).every(x=>x&&Number.isInteger(x.correct)&&Number.isInteger(x.total)&&x.correct>=0&&x.total>0&&x.correct<=x.total))));
 }
 function shuffled(items){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
 function mergeReport(reports,record){
  if(!record.learnerId)return [...reports,record];
  const previous=reports.find(r=>r.learnerId===record.learnerId);
  if(previous&&Date.parse(previous.exportedAt)>Date.parse(record.exportedAt))return reports;
  return [...reports.filter(r=>r.learnerId!==record.learnerId),record];
 }
 return {parseCSV,validProgress,shuffled,mergeReport};
})();
