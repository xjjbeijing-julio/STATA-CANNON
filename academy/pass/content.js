(function(){'use strict';
const sources={
 sprint:{name:'SPRINT 原始研究（NEJM, 2015）',url:'https://www.nejm.org/doi/full/10.1056/NEJMoa1511939',fact:'真实研究比较了强化与标准血压控制策略。'},
 framingham:{name:'Framingham Heart Study · 官方研究背景',url:'https://www.framinghamheartstudy.org/fhs-about/history/epidemiological-background/',fact:'Framingham 是研究心血管危险因素的纵向队列。'},
 doll:{name:'Doll & Hill · Smoking and Carcinoma of the Lung（BMJ, 1950）',url:'https://www.bmj.com/content/2/4682/739',fact:'经典研究以病例对照思路考察吸烟与肺癌的关联。'},
 cobra:{name:'COBRA 原始研究（Lancet, 2016）',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5007415/',fact:'COBRA 是比较行为激活与认知行为治疗的非劣效试验。'},
 oviva:{name:'OVIVA 原始研究（NEJM, 2019）',url:'https://www.nejm.org/doi/abs/10.1056/NEJMoa1710926',fact:'OVIVA 是比较骨关节感染口服与静脉抗菌治疗的非劣效试验。'}
};
const common={alpha:.05,power:.8,ratio:1,dropout:.1,test:'superiority'};
const independent=['test','alpha','power','ratio'];
function make(id,title,design,outcome,scenario,kind,source,story,values,topic,extra={}){const p={...common,kind,...values};let fields=[...independent];if(kind==='mean')fields.push('delta','sdT','sdC');else if(kind==='cohort')fields.push('pC','rr');else if(kind==='casecontrol')fields.push('pC','or');else if(kind==='binary')fields.push('pT','pC');else fields.push('objective','m','months','muT','muC','sd','cov','rho','epsilon');if(p.test!=='superiority')fields.push('margin');if(p.test==='noninferiority')fields.push('direction');fields.push('dropout');return{id,title,design,outcome,scenario,kind,source,story,expected:p,fields,topic,...extra};}
const rmStory='研究团队借鉴血压控制研究的临床问题，设计一项新的、独立个体随机、两组平行优效性RCT。仅将治疗后的第3、4、5、6个月纳入本练习，基线不计为结局访视，也不作协变量校正。教学先验：试验组均值依次为136、132、129、126 mmHg；对照组为138、137、136、135 mmHg；各访视、两组的边际SD均为12 mmHg。按1:1分配，双侧Ⅰ类错误5%，把握度90%，预计20%参与者无法提供完整随访。该失访设定仅用于完整资料需求的简化膨胀。';
const rmValues={kind:'repeated',alpha:.05,power:.9,ratio:1,dropout:.2,m:4,months:[3,4,5,6],muT:[136,132,129,126],muC:[138,137,136,135],sd:[12,12,12,12],rho:.5,cov:'CS',epsilon:'na'};
const cases=[
 make('obs-mean','观察性：两组连续结局','observational','continuous','横断面 / 两独立组均值','mean','framingham','迁移任务：不安排干预，比较两组成年人本次体检的收缩压。独立组T预计均值130、组C为125 mmHg；两组个体SD均15 mmHg。等量招募，检验双侧差异，Ⅰ类错误5%，把握度80%，无效资料预计10%。计算未调整的均值差所需人数；本模块不处理混杂校正。',{delta:5,sdT:15,sdC:15},'t11'),
 make('obs-binary','观察性：两组二分类结局','observational','binary','横断面 / 两组比例','binary','framingham','迁移任务：比较独立暴露组T与非暴露组C在同一次筛查中的高血压比例，先验分别为30%和20%。两组人数相等，双侧Ⅰ类错误5%，把握度80%，预计10%问卷无效。这里比较患病比例，不是发病风险，也不是生存分析。',{pT:.3,pC:.2},'t12'),
 make('cohort','队列：固定随访风险与RR','observational','binary','前瞻性队列 / 固定时点风险','cohort','framingham','迁移任务：随访暴露与未暴露人群5年。未暴露组C的累计事件风险预计10%，预期暴露组T的风险比RR为1.8。计划每名暴露者招募2名未暴露者，双侧Ⅰ类错误5%，把握度80%，失访15%。假设能判定固定5年的二分类结局；并非Cox或人时发生率设计。',{pC:.1,rr:1.8,ratio:2,dropout:.15},'t5'),
 make('casecontrol','病例对照：暴露率与OR','observational','binary','非匹配病例对照 / 暴露比例','casecontrol','doll','迁移任务：招募肺癌病例T与独立非匹配对照C。假设对照中的暴露比例为30%，目标暴露优势比OR为2。每名病例配2名对照，双侧Ⅰ类错误5%，把握度80%，预计10%暴露信息不可用。注意：输入的是对照暴露率，不是一般人群肺癌发病率。本题不采用成对匹配。',{pC:.3,or:2,ratio:2},'t5'),
 make('sup-mean','RCT优效：两组均值差','rct','continuous','优效性 / 独立末次结局','mean','sprint','迁移任务：一项新的血压RCT以第6个月收缩压为主要结局。预计试验组T均值125、对照组C为130 mmHg，两组SD均12 mmHg。1:1随机，双侧Ⅰ类错误5%，把握度80%，失访10%。请按T−C的有符号差值填写，比较末次水平，不使用各组内前后检验。',{delta:-5,sdT:12,sdC:12},'t11'),
 make('sup-binary','RCT优效：两组事件比例','rct','binary','优效性 / 风险差','binary','sprint','迁移任务：另设一项固定12个月的二分类结局RCT，预计试验组T不良事件风险10%、对照组C为15%。按1:1分配，双侧Ⅰ类错误5%，把握度80%，失访10%。这是教学用固定时点风险比较，不复现SPRINT原研究的时间至事件主分析。',{pT:.1,pC:.15},'t12'),
 make('ni-mean','RCT非劣效：连续结局','rct','continuous','非劣效性 / 均值差','mean','cobra','迁移任务：比较新的简化心理干预T与标准干预C。PHQ-9越低越好，两组预期均值相等，SD均6分。方案预先论证可接受T最多劣于C 2分；1:1随机，单侧Ⅰ类错误2.5%，把握度90%，失访20%。界值属于教学假设，不能直接作为其他试验的临床界值。',{alpha:.025,power:.9,dropout:.2,test:'noninferiority',delta:0,sdT:6,sdC:6,margin:2,direction:'lower'},'t9'),
 make('ni-binary','RCT非劣效：二分类结局','rct','binary','非劣效性 / 风险差','binary','oviva','迁移任务：比较新的口服策略T与静脉策略C，主要结局为固定一年治疗失败（越低越好）。教学预期两组失败率均15%，预先论证可接受失败风险增加最多5个百分点。1:1随机，单侧Ⅰ类错误2.5%，把握度90%，预计10%失访。本题界值与假设不是OVIVA原样本量方案。',{alpha:.025,power:.9,test:'noninferiority',pT:.15,pC:.15,margin:.05,direction:'lower'},'t9'),
 make('eq-mean','RCT等效：连续结局','rct','continuous','等效性 / 双单侧检验','mean','cobra','研究问题迁移：原文为非劣效试验；本练习改为新的等效性问题，不能用原研究的“不劣”结论推断等效。比较两种心理干预，要求T−C严格位于−2至+2分，预期差0.5分、两组SD均6分。1:1随机，TOST每个单侧检验α为5%，目标联合功效80%，失访15%。',{test:'equivalence',delta:.5,sdT:6,sdC:6,margin:2,dropout:.15},'t9'),
 make('eq-binary','RCT等效：二分类结局','rct','binary','等效性 / 风险差TOST','binary','oviva','研究问题迁移：原文为非劣效试验；本练习另设两种治疗策略等效性研究。预期T、C失败风险均15%，需证明风险差处于−5至+5个百分点。1:1随机，TOST每个单侧α为5%，联合功效80%，预计10%失访。未显著不同不能替代这一等效检验。',{test:'equivalence',pT:.15,pC:.15,margin:.05},'t9'),
 make('rm-end','重复测量RCT：只问6个月','rct','repeated','末次访视对比','repeated','sprint',rmStory+' 本题主要估计目标：第6个月两组差异。尽管收集四次数据，不能直接用四次测量除样本量。假设同一受试者所有访视两两相关均0.5，使用完整资料、已知协方差的Wald规划近似。',{...rmValues,objective:'endpoint'},'t17'),
 make('rm-average','重复测量RCT：四次平均差异','rct','repeated','第3–6个月平均效应','repeated','sprint',rmStory+' 本题主要估计目标：第3、4、5、6个月均匀加权的平均组间差异。先验认为任意两次访视的相关均为0.5。最终计划以含组别、分类时间及交互的MMRM估计此预设对比；本练习按完整资料、已知协方差的Wald近似规划。',{...rmValues,objective:'average'},'t17'),
 make('rm-interaction','重复测量RCT：轨迹是否分离','rct','repeated','组别×时间交互','repeated','sprint',rmStory+' 本题主要估计目标：四次组间差异是否随时间改变，而非某次显著。相邻月份相关0.5，间隔加大时按幂次衰减。检验三个独立交互对比，采用完整资料、已知协方差的3自由度Wald卡方近似；ε不参与此检验。',{...rmValues,cov:'AR1',objective:'interaction'},'t17')
];
const fieldMeta={
 test:['检验目标','select','superiority:优效性 / 两组差异|noninferiority:非劣效性|equivalence:等效性（TOST）'],
 alpha:['显著性水平 α','number','0–1小数；按题目约定的单侧或双侧水平'],power:['把握度 Power','number','0–1小数'],ratio:['分配比 nC / nT','number','对照人数 ÷ 试验人数；病例对照为对照 ÷ 病例'],dropout:['失访 / 无效资料率','number','0–1小数'],delta:['预期均值差 Δ = T − C','number','带符号，与结局使用相同单位'],sdT:['试验 / 暴露组 SD','number','个体标准差，与结局同单位'],sdC:['对照组 SD','number','个体标准差，与结局同单位'],pT:['试验组事件概率 pT','number','0–1小数'],pC:['对照组概率 pC','number','病例对照设计填对照中的暴露率'],rr:['预期风险比 RR','number','暴露风险 ÷ 未暴露风险'],or:['预期优势比 OR','number','暴露优势比，不是风险比'],margin:['界值 M（正值）','number','均值差原单位 / 风险差小数'],direction:['结局方向','select','lower:越低越好（如失败率）|higher:越高越好（如治愈率）'],objective:['主要估计目标','select','endpoint:只比较第6个月|average:第3–6个月等权平均差异|interaction:组别×时间交互'],m:['治疗后测量次数 m','number','仅纳入本次计算的访视'],months:['访视月份','array','逗号分隔；按时间顺序'],muT:['试验组均值轨迹','array','每次访视一个均值，逗号分隔'],muC:['对照组均值轨迹','array','每次访视一个均值，逗号分隔'],sd:['各访视边际 SD','array','每次访视一个SD；本版两组共用'],cov:['协方差结构','select','CS:CS：任意访视相关相等|AR1:AR(1)：相关随间隔衰减'],rho:['测量间相关 ρ','number','CS为共同相关；AR(1)为相邻访视相关'],epsilon:['球形性 ε 的处理','select','na:Wald/MMRM规划：不使用ε|gg:单变量RM-ANOVA：需考虑ε']
};
const help={
 test:['根据研究目标选择差异、非劣效或等效。','先写原假设再选软件程序。','优效检验差异为零；非劣效排除不可接受的劣势；等效需同时通过两条边界。','把P>0.05当成等效；把非劣效界值当成预期差值。'],
 alpha:['输入题目约定的Ⅰ类错误概率小数。','双侧优效与单侧非劣效的临界值不同；本等效模块填写每个单侧α。','双侧优效使用z(1−α/2)；非劣效及TOST使用z(1−α)。TOST每侧0.05对应90%双侧区间。','把5填入应填0.05的框；把TOST的α再除以2。'],
 power:['输入检出预设真实效应的概率。','它是1−β，不是显著性水平，也不是样本观察到结果后的确定性。','固定效应和误差水平，提高目标功效通常需要更多参与者。','把β当Power；以已观察P值倒推“事后功效”。'],
 ratio:['输入nC/nT，病例对照时为对照数/病例数。','软件必须知道哪组作为分母。','给定方差下，均衡分配通常有效；资源或方差不同可改变最优比例。','将1:2随机误写成0.5；忘记病例对照的组定义。'],
 dropout:['输入不能贡献所需完整资料的人数比例。','需保证失访后仍有足够可分析人数。','逐组招募人数为ceil(n分析/(1−失访率))；不是n×(1+失访率)。','把每次访视缺失率当受试者完全失访率；认为简单膨胀已处理MNAR或MMRM缺失机制。'],
 delta:['输入T均值减C均值，保留符号与原单位。','预期差异决定信号大小；应来自临床重要性与可信先验。','独立两组差的方差为SD_T²/nT+SD_C²/nC。','将组内治疗前后变化当组间疗效；把标准化d当原始单位差；挑选夸大差值缩小N。'],
 sdT:['输入试验组个体结局的标准差。','标准差度量个体异质性，决定噪声大小。','SD不随样本量增加而自动缩小；SE≈SD/√n。','把SE当SD；未区分末次水平SD与变化量SD。'],
 sdC:['输入对照组个体结局的标准差。','两组可有不同SD；应与主要结局时点一致。','两独立组均值差的方差由两组方差共同贡献。','将置信区间宽度直接当SD；从不同时间尺度研究取值却不解释。'],
 pT:['输入固定随访时点的事件概率小数。','明确事件是失败还是成功，以及观察窗口。','二项比例的方差为p(1−p)/n。','把发生密度、HR或百分数15直接填为概率；更换事件定义却未改变方向。'],
 pC:['RCT/横断面填对照事件概率；队列填未暴露累计风险；病例对照填对照暴露概率。','不同抽样设计决定pC的含义。','非匹配病例对照由p病例=OR×p对照/(1−p对照+OR×p对照)换算。','把病例对照中的暴露率填成疾病发病率；把OR直接当RR。'],
 rr:['输入暴露与未暴露的固定时点风险之比。','队列可以估计风险；风险比不是风险差。','pT=RR×pC，转换后的概率必须小于1。本版按两风险比较规划。','将HR等同RR；不检查转换后的风险是否超过100%。'],
 or:['输入预设暴露优势比。','非匹配病例对照按疾病状态抽样，直接关注暴露优势差异。','OR=[pT/(1−pT)]/[pC/(1−pC)]，不能一般地写pT=OR×pC。','在常见结局条件下仍把OR解释为RR；将非匹配公式用于匹配设计。'],
 margin:['输入预先论证的正界值M。','界值代表临床可接受差异，必须独立于本次结果制定。','T−C为d，越低越好时非劣效要求d<M；等效要求−M<d<M，且两个单侧检验同时通过。','以预期疗效当界值；为缩小N任意放宽M；把5个百分点写成5。'],
 direction:['按结局意义选越低或越高越好。','同一个正风险差对失败率和治愈率含义相反。','越低越好：H0 d≥M；越高越好：H0 d≤−M。','更换T/C组或事件编码后仍沿用原检验方向。'],
 objective:['区分末次差异、等权平均差异、组别×时间交互。','三个问题对应三个不同对比，不可凭哪个N小选择。','末次c=(0,0,0,1)；平均c=(1/4,…,1/4)；交互检验d2−d1、d3−d1、d4−d1同时为零。','误以为只要采集四次就可把末次结局N除以4；把总体组别效应当轨迹交互。'],
 m:['输入纳入对比的治疗后访视次数。','同一受试者多次观测不是多名独立参与者。','增加访视可提高某些对比精度，但收益取决于协方差与效应轨迹。','把基线计为治疗后结局；把m×人数当独立样本量。'],
 months:['按顺序填写计划访视月份。','AR(1)的每步相关对应固定间隔。','本版AR(1)只支持等间隔访视；不等间隔需连续时间相关模型。','对3、4、6个月直接用相邻序号代替实际间隔。'],
 muT:['填写每个访视的试验组预期均值。','轨迹决定各时点效应以及交互信号。','不同访视预期值必须对应相同结局与单位；只填末次差异不能指定整条轨迹。','用治疗前后差填入水平轨迹；看结果后挑选显著月份。'],
 muC:['填写每个访视的对照组预期均值。','对照也可自然改善，疗效需要组间比较。','d_j=μT_j−μC_j；组间差恒定时可有平均效应而没有交互。','假设对照不变却无依据；只计算试验组自身下降。'],
 sd:['填写每次访视个体结局的边际SD。','边际SD和相关系数共同构成协方差矩阵Σ。','Σij=SDi×SDj×Rij。本版共享两组Σ；异方差访视使用CSH/ARH(1)式扩展。','把随机截距SD直接当边际SD；使用SE；把变化量SD与水平SD混用。'],
 cov:['根据先验相关规律选择CS或AR(1)。','远近访视相关是否一致决定结构选择。','CS各非对角相关为ρ；等间隔AR(1)为ρ^|i−j|。模型需满足正定性。','把结构按样本量最小选择；把AR(1)相邻相关用于所有访视对。'],
 rho:['填写同一受试者跨访视的相关系数。','它不是干预与结局的相关，也不是组内聚类ICC的通用替代。','CS要求ρ>−1/(m−1)；AR(1)要求|ρ|<1。正相关升高通常削弱平均化收益，但可提高某些时间差对比精度。','机械声称相关越高N越小；把基线与末次的相关替代全部相关。'],
 epsilon:['选择ε是否适用于当前计划的检验。','本版使用Wald/MMRM规划近似，不是单变量重复测量ANOVA。','球形性ε用于单变量RM-ANOVA的自由度修正；1/(m−1)≤ε≤1。MMRM依赖Σ设定及自由度方法，不应再乘一个ε。','给MMRM公式硬套1/ε；把CS、AR(1)和球形性当同义词。']
};
window.PassContent={cases,fieldMeta,help,sources,docs:[{name:'PASS 官方程序目录',url:'https://www.ncss.com/software/pass/pass-documentation/'},{name:'PASS：重复测量两均值（TAD与协方差）',url:'https://www.ncss.com/wp-content/themes/ncss/pdf/Procedures/PASS/Tests_for_Two_Means_in_a_Repeated_Measures_Design.pdf'},{name:'PASS：Repeated Measures Analysis（ANOVA）',url:'https://www.ncss.com/wp-content/themes/ncss/pdf/Procedures/PASS/Repeated_Measures_Analysis.pdf'},{name:'PASS：两比例非劣效性',url:'https://www.ncss.com/wp-content/themes/ncss/pdf/Procedures/PASS/Non-Inferiority_Tests_for_the_Difference_Between_Two_Proportions.pdf'}]};
})();
