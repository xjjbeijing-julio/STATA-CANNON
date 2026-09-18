/* Canonical mapping to the supplied 119-slide V3 course. */
Object.assign(window.ACADEMY,{
  "version": "4.1.0",
  "lessons": [
    {
      "id": 1,
      "title": "AI时代的统计判断",
      "dataset": "D01",
      "topic": "t36",
      "skill": 0,
      "pages": "9—13",
      "question": "同一份高血压RCT数据，组间疗效和组内变化是否回答同一个问题？",
      "theory": "先确定研究目的、主要结局与比较，再选择方法。",
      "deliverable": "写明人群、比较组、12周主要结局及目标效应。",
      "minutes": 45
    },
    {
      "id": 2,
      "title": "研究问题与方法选择",
      "dataset": "D01",
      "topic": "t7",
      "skill": 0,
      "pages": "14—18",
      "question": "血压、并发症和死亡时间能使用同一种方法吗？",
      "theory": "设计、分析单位、结局类型、配对结构和假设共同决定方法。",
      "deliverable": "提交研究问题、数据结构与方法选择表。",
      "minutes": 45
    },
    {
      "id": 3,
      "title": "变量与数据字典",
      "dataset": "D05",
      "topic": "t2",
      "skill": 1,
      "pages": "19—23",
      "question": "Stage编码为1/2/3/4，就能当作等间距连续变量吗？",
      "theory": "编码不是变量含义；明确单位、类型、参照组和统计角色。",
      "deliverable": "补全数据字典，解释ID、Stage及结局编码。",
      "minutes": 45
    },
    {
      "id": 4,
      "title": "数据清洗与质量控制",
      "dataset": "D02",
      "topic": "t2",
      "skill": 1,
      "pages": "24—28",
      "question": "年龄555、身高1.72、重复ID应该如何处理？",
      "theory": "先回查来源与记录粒度，保留原始值和处理日志，不能猜填。",
      "deliverable": "提交重复、缺失、单位与日期逻辑审计。",
      "minutes": 45
    },
    {
      "id": 5,
      "title": "描述统计与分布",
      "dataset": "D03",
      "topic": "t3",
      "skill": 1,
      "pages": "30—34",
      "question": "少数极长住院记录如何影响平均住院天数？",
      "theory": "结合图形、分位数与研究目的选择描述指标；极端不等于错误。",
      "deliverable": "制作描述表，注明单位、分母及缺失数。",
      "minutes": 45
    },
    {
      "id": 6,
      "title": "P值、区间与效应量",
      "dataset": "D01",
      "topic": "t6",
      "skill": 2,
      "pages": "35—39",
      "question": "P值显著是否意味着降压幅度很大？",
      "theory": "同时报告差值、单位、95%CI与P值；非显著不能证明等效。",
      "deliverable": "写出效应方向、大小、不确定性和解释边界。",
      "minutes": 45
    },
    {
      "id": 7,
      "title": "独立与配对比较",
      "dataset": "D01",
      "topic": "t8",
      "skill": 2,
      "pages": "40—44",
      "question": "一组前后显著，另一组不显著，能证明两组疗效不同吗？",
      "theory": "疗效需直接比较组间差异。组内变化使用配对结构；主分析事先确定。",
      "deliverable": "比较组间效果及组内变化，区分两者的研究问题。",
      "minutes": 45
    },
    {
      "id": 8,
      "title": "ANOVA与多重比较",
      "dataset": "D04",
      "topic": "t10",
      "skill": 2,
      "pages": "45—50",
      "question": "三组总体显著，是否每两组都不同？",
      "theory": "预先确定比较族，检查异方差，区分总体检验与预设对比。",
      "deliverable": "报告各组变化、总体检验及经多重性处理的比较。",
      "minutes": 45
    },
    {
      "id": 9,
      "title": "分类资料、RR与OR",
      "dataset": "D05",
      "topic": "t9",
      "skill": 2,
      "pages": "51—55",
      "question": "两组并发症率应如何比较？OR与RR相同吗？",
      "theory": "先列事件数及分母，再判断检验条件，解释风险差、RR与OR。",
      "deliverable": "提交2×2表和手工核算，注明参照组。",
      "minutes": 45
    },
    {
      "id": 10,
      "title": "相关与线性回归",
      "dataset": "D03",
      "topic": "t13",
      "skill": 3,
      "pages": "56—60",
      "question": "BMI与HbA1c相关，能否直接解释为因果？",
      "theory": "先看散点图、关系形态和影响点；回归斜率有单位，相关系数无量纲。",
      "deliverable": "比较相关与调整回归，解释横断面研究边界。",
      "minutes": 45
    },
    {
      "id": 11,
      "title": "Logistic与混杂",
      "dataset": "D05",
      "topic": "t14",
      "skill": 3,
      "pages": "61—65",
      "question": "重症患者更常接受强化治疗，粗OR该如何解释？",
      "theory": "结合领域知识选调整集，在同一样本比较粗模型与调整模型；OR变化还受不可折叠性影响。",
      "deliverable": "交付编码、分析n、粗/调整OR、区间与混杂依据。",
      "minutes": 45
    },
    {
      "id": 12,
      "title": "生存分析与PH假设",
      "dataset": "D06",
      "topic": "t42",
      "skill": 4,
      "pages": "66—70",
      "question": "风险随时间变化，还能只报告一个恒定HR吗？",
      "theory": "结合KM、风险集、Schoenfeld残差与时间效应；PH检验不显著不能证明假设成立。",
      "deliverable": "解释删失，报告KM、Cox诊断及非PH下的局限。",
      "minutes": 45
    },
    {
      "id": 13,
      "title": "ROC与阈值验证",
      "dataset": "D07",
      "topic": "t43",
      "skill": 3,
      "pages": "72—76",
      "question": "测试集表现不理想，能重新选最佳阈值吗？",
      "theory": "在Train选阈值后锁定判阳规则，只在Test评估。AUC不能替代阈值性能。",
      "deliverable": "交付固定阈值、混淆矩阵、敏感度、特异度和AUC。",
      "minutes": 45
    },
    {
      "id": 14,
      "title": "AI代码与人工核验",
      "dataset": "D01",
      "topic": "t19",
      "skill": 5,
      "pages": "77—81",
      "question": "两个AI给出相同答案，就能放心使用吗？",
      "theory": "实际运行并核查输入、样本数、编码、模型、效应及诊断。",
      "deliverable": "从空白R会话重跑，记录一处错误及修正证据。",
      "minutes": 45
    },
    {
      "id": 15,
      "title": "统计图表与Results",
      "dataset": "D05",
      "topic": "t40",
      "skill": 5,
      "pages": "82—86",
      "question": "软件截图能否直接作为论文结果表？",
      "theory": "单位、分母、效应、区间及脚注要完整，正文与表图一致。",
      "deliverable": "提交一表一图及结果段，完成同伴互审。",
      "minutes": 45
    },
    {
      "id": 16,
      "title": "论文拆解与结业答辩",
      "dataset": "D07",
      "topic": "t41",
      "skill": 5,
      "pages": "87—90 / 112",
      "question": "用模拟数据练习论文方法，是否复现了原论文数值？",
      "theory": "模拟数据只能迁移分析流程。项目课前完成，答辩8分钟加追问4分钟。",
      "deliverable": "提交分析计划、代码、图表、解释和AI核验记录。",
      "minutes": 45
    }
  ],
  "datasets": [
    {
      "id": "D01",
      "title": "高血压随机试验",
      "n": 180,
      "traps": "与V3课件及原学生资源包一致",
      "variables": "Group, Age, Sex",
      "method": "两组比较 / 基线调整"
    },
    {
      "id": "D02",
      "title": "病历数据清洗",
      "n": 121,
      "traps": "与V3课件及原学生资源包一致",
      "variables": "Sex, Age, Height_cm",
      "method": "变量与质量审计"
    },
    {
      "id": "D03",
      "title": "糖尿病偏态与相关",
      "n": 320,
      "traps": "与V3课件及原学生资源包一致",
      "variables": "Age, Sex, BMI",
      "method": "描述统计 / 相关回归"
    },
    {
      "id": "D04",
      "title": "三组降压方案",
      "n": 240,
      "traps": "与V3课件及原学生资源包一致",
      "variables": "Group, Age, Sex",
      "method": "ANOVA / 多重比较"
    },
    {
      "id": "D05",
      "title": "临床结局与混杂",
      "n": 600,
      "traps": "与V3课件及原学生资源包一致",
      "variables": "Age, Sex, BMI",
      "method": "列联表 / Logistic"
    },
    {
      "id": "D06",
      "title": "肿瘤生存随访",
      "n": 520,
      "traps": "与V3课件及原学生资源包一致",
      "variables": "Age, Sex, Stage",
      "method": "KM / Cox / PH诊断"
    },
    {
      "id": "D07",
      "title": "诊断标志物验证",
      "n": 500,
      "traps": "与V3课件及原学生资源包一致",
      "variables": "Split, Disease, Age",
      "method": "ROC / 固定阈值验证"
    }
  ],
  "papers": [
    {
      "id": "v3-paper-1",
      "title": "RECOVERY — Dexamethasone in Hospitalized Patients with Covid-19",
      "journal": "New England Journal of Medicine, 2021",
      "doi": "10.1056/NEJMoa2021436",
      "url": "https://doi.org/10.1056/NEJMoa2021436",
      "design": "研究论文",
      "focus": "平台RCT、主要结局、亚组、死亡结局",
      "tasks": [
        "主要分析集？亚组为何预设？哪些亚组只能探索性解读？结果外推边界是什么？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-2",
      "title": "SELECT — Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes",
      "journal": "New England Journal of Medicine, 2023",
      "doi": "10.1056/NEJMoa2307563",
      "url": "https://doi.org/10.1056/NEJMoa2307563",
      "design": "研究论文",
      "focus": "复合终点、Kaplan–Meier、Cox HR、森林图",
      "tasks": [
        "复合终点如何定义？HR能解释什么？为什么还要95%CI？亚组森林图怎样避免误读？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-3",
      "title": "EMPACT-MI — Empagliflozin after Acute Myocardial Infarction",
      "journal": "New England Journal of Medicine, 2024",
      "doi": "10.1056/NEJMoa2314051",
      "url": "https://doi.org/10.1056/NEJMoa2314051",
      "design": "研究论文",
      "focus": "复合主要终点、KM/累积发生、次要结局",
      "tasks": [
        "复合终点与组成部分如何分别展示？次要结局如何避免“挑显著结果”？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-4",
      "title": "KEYNOTE-564 — Overall Survival with Adjuvant Pembrolizumab in Renal-Cell Carcinoma",
      "journal": "New England Journal of Medicine, 2024",
      "doi": "10.1056/NEJMoa2312695",
      "url": "https://doi.org/10.1056/NEJMoa2312695",
      "design": "研究论文",
      "focus": "KM、分层Cox、亚组森林图、ITT",
      "tasks": [
        "OS与DFS？分层Cox？HR与生存概率差异是否相同？亚组如何解读？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-5",
      "title": "SENOMAC — Omitting Axillary Dissection in Breast Cancer with Sentinel-Node Metastases",
      "journal": "New England Journal of Medicine, 2024",
      "doi": "10.1056/NEJMoa2313487",
      "url": "https://doi.org/10.1056/NEJMoa2313487",
      "design": "研究论文",
      "focus": "非劣效设计、PH假设、per-protocol与mITT",
      "tasks": [
        "非劣效界值？分析集为何关键？PH如何检查？敏感性分析有什么作用？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-6",
      "title": "NOAH-AFNET 6 — Anticoagulation with Edoxaban in Patients with Atrial High-Rate Episodes",
      "journal": "New England Journal of Medicine, 2023",
      "doi": "10.1056/NEJMoa2303062",
      "url": "https://doi.org/10.1056/NEJMoa2303062",
      "design": "研究论文",
      "focus": "cause-specific Cox、竞争风险、Aalen–Johansen",
      "tasks": [
        "何时不能只用普通KM？cause-specific HR是什么意思？未做多重性控制的次要终点如何表述？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-7",
      "title": "Early Warning Scores With and Without Artificial Intelligence",
      "journal": "JAMA Network Open, 2024",
      "doi": "10.1001/jamanetworkopen.2024.38986",
      "url": "https://doi.org/10.1001/jamanetworkopen.2024.38986",
      "design": "研究论文",
      "focus": "AUROC、敏感度、特异度、PPV/NPV、跨医院泛化",
      "tasks": [
        "AUROC高是否等于临床有用？固定阈值表现为什么重要？跨医院差异意味着什么？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-8",
      "title": "Prioritising primary care patients with unexpected weight loss for cancer investigation",
      "journal": "The BMJ, 2024;387:e080199",
      "doi": "10.1136/bmj-2024-080199",
      "url": "https://doi.org/10.1136/bmj-2024-080199",
      "design": "研究论文",
      "focus": "诊断准确度、Logistic回归、变量选择、缺失数据",
      "tasks": [
        "stepwise的优缺点？缺失indicator法可能有什么问题？结果如何转化为临床转诊阈值？",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-9",
      "title": "CONSORT 2025 statement",
      "journal": "The BMJ, 2025;389:e081123",
      "doi": "10.1136/bmj-2024-081123",
      "url": "https://doi.org/10.1136/bmj-2024-081123",
      "design": "报告规范",
      "focus": "检查D01/D04等RCT报告。",
      "tasks": [
        "按条目检查本组报告，注明原文位置及未报告项目。",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-10",
      "title": "TRIPOD+AI statement",
      "journal": "The BMJ, 2024;385:e078378",
      "doi": "10.1136/bmj-2023-078378",
      "url": "https://doi.org/10.1136/bmj-2023-078378",
      "design": "报告规范",
      "focus": "检查D07以及AI/预测模型报告。",
      "tasks": [
        "按条目检查本组报告，注明原文位置及未报告项目。",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    },
    {
      "id": "v3-paper-11",
      "title": "STROBE statement",
      "journal": "The BMJ, 2007;335:806",
      "doi": "10.1136/bmj.39335.541782.AD",
      "url": "https://doi.org/10.1136/bmj.39335.541782.AD",
      "design": "报告规范",
      "focus": "检查D05观察性研究的混杂、偏倚和结论边界。",
      "tasks": [
        "按条目检查本组报告，注明原文位置及未报告项目。",
        "标注Methods节名或表图编号，未找到的信息明确写“未报告”。"
      ],
      "answer": "核对原文证据与解释边界。模拟数据只练习同类方法，不复现原研究数值；报告条目齐全不代表设计无偏。"
    }
  ]
});
