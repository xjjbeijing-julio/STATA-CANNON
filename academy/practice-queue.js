// Session selection is separate from the bank; option permutations are never counted as questions.
(function(root){
  function mix(values,rng){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function select(pool,{history=[],recent=[],limit,rng=Math.random}={}){
    pool=[...new Map(pool.map(q=>[q.qid,q])).values()];
    const count=Math.min(pool.length,limit??Math.min(10,Math.max(4,Math.floor(pool.length/2))));
    const last=new Map();history.forEach(h=>last.set(h.qid,h));
    const served=new Set([...recent,...last.keys()]);
    const previous=new Set(recent.slice(-10));
    const selected=[],ids=new Set(),families=new Map(),topics=new Map();
    function take(candidates,n){
      candidates=mix(candidates.filter(q=>!ids.has(q.qid)),rng);
      while(n-- > 0&&candidates.length){
        candidates.sort((a,b)=>{
          const cost=q=>(families.get(q.family||q.qid)||0)*100+(topics.get(q.topicId)||0)*5;
          return cost(a)-cost(b);
        });
        const q=candidates.shift();selected.push(q);ids.add(q.qid);
        families.set(q.family||q.qid,(families.get(q.family||q.qid)||0)+1);
        topics.set(q.topicId,(topics.get(q.topicId)||0)+1);
      }
    }
    // Spaced wrong-answer review: avoid the immediately preceding round when alternatives exist.
    const due=pool.filter(q=>last.get(q.qid)?.correct===false&&!previous.has(q.qid));
    take(due,Math.floor(count*.2));
    take(pool.filter(q=>!served.has(q.qid)),count-selected.length);
    // Exhausted fresh pool: prefer questions outside the previous round, then fill without duplicates.
    const older=pool.filter(q=>!previous.has(q.qid));
    take(older,count-selected.length);
    take(pool,count-selected.length);
    return mix(selected,rng).map(q=>{
      if(!q.shuffleSafe)return {...q};
      const order=mix(q.options.map((_,i)=>i),rng);
      return {...q,options:order.map(i=>q.options[i]),answer:order.indexOf(q.answer)};
    });
  }
  root.STATCANNON_PRACTICE={select};
})(typeof window==='undefined'?globalThis:window);
