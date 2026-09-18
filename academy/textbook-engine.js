/* Shared, deterministic textbook retrieval. No remote model or user API key. */
(function (scope) {
  'use strict';
  const normalize = s => String(s || '').normalize('NFKC').toLowerCase()
    .replace(/\\chi|χ|卡方|x\^\{?2\}?/g, '卡方').replace(/\\[a-z]+/g, ' ')
    .replace(/[\s$^_{}\\]+/g, '').replace(/log-rank/g, 'logrank');
  const stop = ['请问','请','根据教材','根据这本书','教材中','教材','解释一下','解释','一下','为什么','是什么','什么是','怎么','怎样','如何','可以','能不能','是否','有哪些','这个','那个','一下','的','了','吗','呢','我想知道','我想问','帮我','告诉我','有什么','区别'];
  const groups = [
    ['p值','pvalue','显著性','统计学意义','显著','假设检验'],
    ['t检验','ttest','t-test','两独立样本','两组均数','配对t'],
    ['配对','治疗前后','同一批','同一组','前后对比','前后比较'],
    ['标准误','标准误差','sem','抽样误差'],['标准差','sd','离散程度','变异程度'],
    ['置信区间','置信限','可信区间','confidenceinterval'],
    ['卡方','chisquare','四格表','列联表'],['fisher','确切概率','精确检验'],
    ['方差分析','anova','多组均数','三个组','三组均数'],
    ['非参数','秩和','wilcoxon','mannwhitney','kruskal','符号秩'],
    ['正态','高斯','normaldistribution'],['偏态','偏斜','中位数','median'],
    ['生存分析','生存时间','删失','截尾','失访','kaplan','km曲线'],
    ['cox','比例风险','hr','风险比'],['logistic','逻辑回归','二分类结局'],
    ['混杂','confounding','混杂因素'],['优势比','比值比','or'],['相对危险度','相对风险','rr'],
    ['相关','correlation','pearson','spearman'],['回归','regression'],
    ['样本量','样本含量','样本数','多少例','多少人'],['功效','检验效能','power','把握度'],
    ['随机化','随机分配','randomization'],['盲法','双盲','blinding'],
    ['病例对照','病例-对照'],['队列','cohort'],['横断面','现况调查'],
    ['meta','荟萃','系统评价','异质性','森林图'],['率','构成比','相对数'],
    ['非劣效','等效','优效'],['重复测量','重复测量设计'],['寿命表','期望寿命']
  ];
  const has = (value, term) => /^[a-z]{1,3}$/.test(term) ? new RegExp('(?:^|[^a-z])'+term+'(?:$|[^a-z])').test(value) : value.includes(term);
  // Short, source-anchored teaching explanations. These are curated explanations,
  // never represented as an LLM's free-form reasoning or a numerical calculator.
  const guides = [
    {id:'p', test:q=>/p值|p[><=]|显著性|统计学意义/.test(q)&&!/回归|卡方|相关/.test(q),
      facts:[['P值大于预设检验水准时，是“证据不足以拒绝零假设”，不能据此证明两组完全相同。教材例6-4用“尚不能认为两种药物的降压效果有差别”来表达这一结论。','ch06-L5052-217'],['判断还要结合效应的大小、置信区间和研究设计，不能只看P值。教材的结果报告同时给出了均数差和95%置信区间。','ch06-L5585-252']]},
    {id:'sd-se',test:q=>/标准误|标准差.*标准误|sd.*se/.test(q),
      facts:[['标准差（SD）描述个体观察值的离散程度；同类资料中，SD越大，个体差异越大。','ch02-L868-42'],['均数标准误（SE）反映样本均数的抽样误差。在教材的随机抽样框架下，用 SE = SD / √n 估计；增加样本量可以减小SE。它与描述个体差异的SD用途不同。','ch05-L3244-161']]},
    {id:'paired',test:q=>/配对|治疗前后|同一批|前后比较/.test(q)&&/t检验|均数|血压|区别|治疗前后/.test(q)&&!/方差分析|秩和|卡方|重复测量/.test(q),
      facts:[['配对设计先计算每一对观察值的差，再检验差值的总体均数是否为0；对子数才是这里的n。教材用15对孪生兄弟的出生体重作为例题。','ch06-L4932-209'],['使用配对t检验还要检查差值的分布。教材例6-2明确以差值服从正态分布作为分析依据；不能把成对数据当成两组互不相关的数据。','ch06-L4952-210'],['两独立样本t检验针对两组互相独立的资料，比较两个总体均数。先根据研究设计判断“是否配对”，再检查相应的分布和方差条件。','ch06-L5008-215']]},
    {id:'ci',test:q=>/置信区间|可信区间/.test(q)&&!/回归|or|hr|rr|生存|logistic|差值/.test(q),
      facts:[['95%置信区间描述的是构建区间的方法：反复抽样并按同一方法构建区间，长期平均约95%的区间包含真实总体参数。它不是说95%的个体观察值落在这个区间内。','ch05-L4621-186']]},
    {id:'cox',test:q=>/cox|比例风险/.test(q)&&!/样本量|计算|代码|推导/.test(q),
      facts:[['Cox比例风险模型的关键假定是：给定协变量后，所比较个体的风险函数之比不随时间改变，即PH（比例风险）假定。','ch19-L17407-936'],['在其他变量不变的情况下，某变量增加一个单位，对应的风险比为 exp(β)。解释时应同时说明变量的单位、参照水平及所调整的协变量。','ch19-L17407-936']]},
    {id:'chi',test:q=>/卡方|fisher|四格表|列联表/.test(q)&&/条件|小样本|不够|不足|多少|频数|40|5|适用|怎么|区别/.test(q),
      facts:[['这本教材对独立样本2×2列联表给出的条件是 n≥40、各理论频数T≥5；当n≥40且有1≤T<5时，介绍了连续性校正。这里的T是理论频数，不是观察频数。','ch08-L6770-321'],['教材在样本量n<40或理论频数T<1等情形下介绍Fisher确切概率法，并用例8-7演示。应先确认资料确实是独立样本四格表，再套用这里的判断。','ch08-L7061-343']]},
    {id:'or',test:q=>/logistic|逻辑回归|优势比|比值比/.test(q)&&/解释|意义|or|系数/.test(q)&&!/计算|代码|样本量/.test(q),
      facts:[['在logistic回归中，控制其他自变量后，自变量每增加1个单位，对应的优势比 OR = exp(β)。OR比较的是事件发生的“优势”（odds），不能直接把它读成事件发生概率的倍数。','ch18-L16540-872']]},
    {id:'sample',test:q=>/样本量|样本含量|多少例/.test(q)&&!/回归|病例|队列|非劣|等效|生存|logistic|cox/.test(q),
      facts:[['样本量没有适用于所有研究的单一公式。先说明研究设计、主要结局和拟比较的效应；对实验研究中的比较，教材归纳了四要素：目标差值、总体变异性、α和功效（1−β）。','ch14-L13503-645']],
      prompt:'可以继续补充：是两组均数、两组率，还是估计某个率？同时提供预期差值、标准差或发生率，以及拟用的检验水准和功效。'}
  ];
  function tokens(text) {
    const value = normalize(text), result = [];
    for (const run of value.match(/[\u3400-\u9fff]+|[a-z]+|[0-9]+(?:\.[0-9]+)?/g)||[]) {
      if (/^[\u3400-\u9fff]/.test(run)) {
        for (let i=0;i<run.length-1;i++) result.push(run.slice(i,i+2));
      } else if (run.length>1 || ['p','t','f','z'].includes(run)) result.push(run);
    }
    return result;
  }
  function queryInfo(question) {
    let value=normalize(question);
    for (const word of stop) value=value.replaceAll(word,'');
    const matched=groups.filter(g=>g.some(t=>has(value,normalize(t))));
    const expanded=new Set(tokens(value));
    matched.forEach(g=>g.forEach(t=>tokens(t).forEach(x=>expanded.add(x))));
    return {value, matched, original:[...new Set(tokens(value))], terms:[...expanded]};
  }
  function create(corpus) {
    const df=new Map();
    const docs=corpus.chunks.map(chunk=>{
      const counts=new Map(), title=normalize(chunk.section+' '+chunk.heading), value=normalize(chunk.text);
      const words=tokens(chunk.text);words.forEach(t=>counts.set(t,(counts.get(t)||0)+1));
      new Set([...words,...tokens(chunk.section+' '+chunk.heading)]).forEach(t=>df.set(t,(df.get(t)||0)+1));
      return {chunk,counts,title,value,length:Math.max(1,words.length)};
    });
    const average=docs.reduce((n,d)=>n+d.length,0)/docs.length;
    const byId=new Map(corpus.chunks.map(c=>[c.id,c]));
    function search(question,{chapterId='',limit=5,example=false,conditions=false}={}) {
      const info=queryInfo(question);
      if (!info.original.length) return [];
      const result=[];
      for (const d of docs) {
        if (chapterId && d.chunk.chapterId!==chapterId) continue;
        const q=normalize(question), topic=normalize(d.chunk.chapter+' '+d.chunk.section+' '+d.chunk.heading+' '+d.chunk.text);
        if (/cox|比例风险/.test(q) && !/cox|比例风险|ph假定/.test(topic)) continue;
        if (/logistic|逻辑回归/.test(q) && !/logistic/.test(topic)) continue;
        if (/pearson|spearman/.test(q)&&!/pearson|spearman|线性相关|秩相关/.test(topic))continue;
        let score=0;
        for (const t of info.terms) {
          const tf=d.counts.get(t)||0, idf=Math.log(1+(docs.length-(df.get(t)||0)+.5)/((df.get(t)||0)+.5));
          score+=idf*(tf*2.2/(tf+1.2*(.25+.75*d.length/average))+(d.title.includes(t)?2.3:0))*(info.original.includes(t)?1:.35);
        }
        const coverage=info.original.filter(t=>d.value.includes(t)||d.title.includes(t)).length/info.original.length;
        const conceptHits=info.matched.filter(g=>g.some(t=>has(d.value+d.title,normalize(t)))).length;
        const exact=info.value.length>2 && (d.value.includes(info.value)||d.title.includes(info.value));
        if (!exact && coverage<.28) continue;
        if (info.matched.length && !conceptHits) continue;
        score*=.35+coverage;
        score+=conceptHits*3+(exact?18:0);
        if (/p值|p[><=]|显著性/.test(q)&&d.chunk.chapterId==='ch06')score+=12;
        if (/标准误/.test(q)&&d.chunk.chapterId==='ch05'&&d.chunk.section.includes('抽样'))score+=20;
        if (/置信区间/.test(q)&&d.chunk.chapterId==='ch05')score+=12;
        if (/卡方/.test(q)&&/小|不足|不够|条件|注意/.test(q)&&d.chunk.chapterId==='ch08'&&/确切概率|专用公式/.test(d.chunk.heading))score+=18;
        if (example && /例\s*\d+-\d+/.test(d.chunk.text)) score+=14;
        if (conditions && /前提|条件|注意|适用/.test(d.chunk.text+d.chunk.heading)) score+=12;
        if (/思考|练习|计算机实验|中英文|SAS|小\s*结/.test(d.chunk.section)) score*=.65;
        if ((d.chunk.text.match(/\|/g)||[]).length>25) score*=.35;
        if (score>3) result.push({...d.chunk,score,coverage});
      }
      result.sort((a,b)=>b.score-a.score);
      // Diversify excerpts so one subheading cannot consume every evidence slot.
      const selected=[],counts=new Map();
      if(/pearson/.test(info.value)&&/spearman/.test(info.value)){
        for(const re of [/pearson|线性相关/,/spearman|秩相关/]){
          const c=result.find(c=>re.test(normalize(c.heading+' '+c.text))&&!selected.some(s=>s.id===c.id));if(c)selected.push(c);
        }
      }
      for(const c of result){if(selected.some(s=>s.id===c.id))continue;const key=c.chapterId+c.section+c.heading;if((counts.get(key)||0)>=2)continue;selected.push(c);counts.set(key,(counts.get(key)||0)+1);if(selected.length>=limit)break;}
      return selected;
    }
    function excerpt(chunk,question,{example=false,conditions=false}={}) {
      const info=queryInfo(question), raw=chunk.text;
      const sentences=raw.split(/(?<=[。！？；])\s*|\n\n/).map(s=>s.trim()).filter(s=>s.length>18 && s.length<1000 && (s.match(/\|/g)||[]).length<8);
      const score=s=>{
        const v=normalize(s);let n=info.original.filter(t=>v.includes(t)).length*2+info.matched.filter(g=>g.some(t=>has(v,normalize(t)))).length*3;
        if (/定义|称为|是指|表示|不能|不等于|应注意|前提/.test(s))n+=3;
        if(example&&/例\s*\d+-\d+/.test(s))n+=10;
        if(conditions&&/前提|条件|适用|注意/.test(s))n+=8;
        return n-Math.max(0,s.length-450)/150;
      };
      const best=sentences.map((text,i)=>({text,i,score:score(text)})).sort((a,b)=>b.score-a.score).slice(0,2).sort((a,b)=>a.i-b.i);
      return best.length?best.map(s=>s.text).join('\n\n'):raw.slice(0,600)+(raw.length>600?'…':'');
    }
    function answer(question,{chapterId='',context=null}={}) {
      question=String(question||'').trim();
      if (!question || question.length>800) return {status:'invalid',message:'请输入1–800字的统计学问题。',sources:[]};
      if (chapterId && !corpus.meta.chapters.some(c=>c.id===chapterId)) return {status:'invalid',message:'请选择有效的教材章节。',sources:[]};
      const followup=/^(再|那|它|这个|这种|上面|刚才|继续|用教材|举|有什么适用|有哪些适用|适用条件|通俗|能再|换个说法)/.test(question) && !queryInfo(question).matched.length;
      const example=/例子|举例|例题|案例/.test(question), conditions=/条件|前提|注意|适用/.test(question);
      if (followup && !context?.question) return {status:'clarify',message:'请先告诉我你想了解哪个统计概念，例如“配对t检验的适用条件”。',sources:[]};
      const resolved=followup?context.question:question;
      const unavailable=['随机森林','孟德尔随机化','chatgpt','大语言模型','深度学习','double machine learning','2026年','2025年','最新指南'];
      if(unavailable.some(term=>normalize(resolved).includes(normalize(term))&&!docs.some(d=>d.value.includes(normalize(term)))))return {status:'not_found',message:'上传的教材中没有找到对这个方法或新近信息的可靠说明，不能用相似词替代作答。请改问本书涵盖的统计学问题。',sources:[],context:null};
      const searchQuestion=resolved;
      const guide=example?null:guides.find(g=>g.test(normalize(resolved)) && g.facts.every(([,id])=>byId.has(id)&&(!chapterId||byId.get(id).chapterId===chapterId)));
      let found=search(searchQuestion,{chapterId,limit:5,example,conditions});
      if (guide) {
        const anchored=[...new Set(guide.facts.map(f=>f[1]))].map(id=>({...byId.get(id),score:100,coverage:1}));
        found=anchored;
      }
      if (!found.length || (found[0].coverage<.4 && !queryInfo(resolved).matched.length)) return {status:'not_found',message:'在当前范围内没有找到足够相关的教材依据。请换用统计学术语、补充研究设计，或切换到“全部章节”。',sources:[],context:null};
      const sources=found.slice(0,3).map((c,i)=>({...c,number:i+1,excerpt:excerpt(c,resolved,{example,conditions})}));
      return {status:'ok',mode:guide?'textbook-guided':'textbook-extractive',question,resolvedQuestion:resolved,followup,
        explanation:guide?.facts.map(([text,id])=>({text,sourceNumber:sources.find(s=>s.id===id).number}))||[],prompt:guide?.prompt||'',
        message:example?'以下是与当前问题相关的教材段落；例题编号以原文为准。':conditions?'关于适用条件与注意事项，教材中可以核对以下依据。':'根据上传的《卫生统计学》，以下段落可用于理解这个问题。',
        sources,context:{question:resolved,chapterId},suggestions:['有哪些适用条件和注意事项？','用教材例题说明一下'],
        scope:corpus.meta.scope};
    }
    return {meta:corpus.meta,search,answer,getPassage:id=>byId.get(id)};
  }
  scope.StatTextbook={create,normalize,queryInfo};
})(globalThis);
