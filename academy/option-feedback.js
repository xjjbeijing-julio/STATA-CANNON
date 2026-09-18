// Resolve by question identity and exact option text so shuffling cannot detach an explanation.
window.STATCANNON_FEEDBACK=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const bank=window.STATCANNON_OPTION_NOTES;
 const byText=new Map(Object.entries(bank).map(([id,q])=>[q.q,id]));
 function resolve(q){const id=q.qid||q.id;return bank[id]?.q===q.q?bank[id]:bank[byText.get(q.q)];}
 function reasons(q){const entry=resolve(q);return q.options.map(o=>entry?.choices[o]||'该选项解析尚未收录，请结合知识点核对。');}
 function chapter(q){const tid=q.topicId||(typeof q.topic==='string'?q.topic:q.topic?.id);const tree=KNOWLEDGE_TREE;const module=tree.find(m=>m.topics.some(t=>t.id===tid));const topic=module?.topics.find(t=>t.id===tid);const lessons=window.ACADEMY?.lessons.filter(l=>l.topic===tid)||[];return [module?.name,topic?.name,...lessons.map(l=>`第${l.id}学时 · ${l.title}`)].filter(Boolean).join(' / ');}
 function render(q,selected=null,{historical=false}={}){
  if(!q?.options)return '<p>请返回对应知识点查看题目。</p>';
  const notes=reasons(q),where=chapter(q);
  const picked=Number.isInteger(selected)&&selected>=0&&selected<q.options.length?selected:null;
  return `<section class="option-analysis" aria-label="每个选项的对错解释">${where?`<p class="analysis-chapter">所属学习章节：${esc(where)}</p>`:''}<h3>逐项解析 · 为什么对，为什么错</h3>${picked===null&&historical?'<p class="analysis-history">旧记录未保存当时所选选项；以下展示本题全部选项的解析。</p>':''}<ol class="analysis-list">${q.options.map((o,i)=>`<li class="analysis-item ${i===q.answer?'is-correct':'is-incorrect'} ${i===picked?'is-selected':''}"><div class="analysis-option"><strong>${String.fromCharCode(65+i)}. ${esc(o)}</strong><span class="analysis-status">${i===q.answer?'✓ 正确选项':'✕ 错误选项'}${i===picked?' · 你的选择':''}</span></div><p><b>${i===q.answer?'为什么对：':'为什么错：'}</b>${esc(notes[i])}</p></li>`).join('')}</ol></section>`;
 }
 return {render,reasons,chapter,resolve};
})();
