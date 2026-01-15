import { SummaryData, MetricItem } from './types';

// --- Constants & Dictionaries ---

const IMPACT_WEIGHTS: Record<string, number> = {
    '추론': 1.2, 'Inference': 1.2,
    '중심생각': 1.2, 'Main Idea': 1.2,
    '작품이해': 1.2, 'Understanding': 1.2,
    '세부내용': 1.1, 'Details': 1.1,
    '어휘': 1.1, 'Vocabulary': 1.1,
    '구조': 1.0, 'Structure': 1.0,
    '비판': 1.2, 'Critique': 1.2, // Assuming high leverage
    '적용': 1.2, 'Application': 1.2,
    'default': 1.0
};

type DiagnosisContent = {
    cause: string[];
    prescription: {
        pre: string;
        during: string;
        post: string;
    };
};

const DIAGNOSIS_DB: Record<string, DiagnosisContent> = {
    '추론': {
        cause: [
            "지문의 명시적 정보에만 의존하여 행간의 숨겨진 의미를 파악하는 훈련이 부족합니다.",
            "선지의 근거를 본문에서 찾을 때, 단어 매칭에만 집중하는 경향이 있습니다.",
            "인물이나 필자의 의도를 파악하는 논리적 연결 고리를 놓치는 경우가 많습니다."
        ],
        prescription: {
            pre: "질문을 먼저 읽고, '무엇을 추론해야 하는지' 타겟팅하기",
            during: "접속사(그러나, 따라서)와 감정 형용사에 네모 표시하며 읽기",
            post: "정답의 근거가 되는 문장을 찾아 밑줄 긋고, 화살표로 연결해보기"
        }
    },
    '중심생각': {
        cause: [
            "글 전체의 흐름보다 세부적인 디테일에 과도하게 집착하는 경향이 있습니다.",
            "첫 문단과 마지막 문단에서 핵심 키워드를 추출하는 습관이 형성되지 않았습니다.",
            "반복되는 어휘가 주제와 직결된다는 점을 간과하는 경우가 있습니다."
        ],
        prescription: {
            pre: "제목과 첫 문단을 읽고 글의 제재(소재)를 먼저 파악하기",
            during: "각 문단의 중심 문장을 찾아 괄호 치기",
            post: "글 전체를 한 문장으로 요약하는 연습 하기"
        }
    },
    '세부내용': {
        cause: [
            "지문을 꼼꼼하게 읽지 않고 빠르게 훑어보는 습관이 있어 정보를 놓칩니다.",
            "선지와 본문의 내용을 일대일로 대응시키는 정교함이 부족합니다.",
            "부정어(아닌, 없는)나 한정어(모두, 만)를 놓쳐 실수가 발생합니다."
        ],
        prescription: {
            pre: "선지의 핵심 키워드를 먼저 체크하여 무엇을 찾아야 할지 인지하기",
            during: "키워드가 등장할 때마다 번호를 매기며 위치 확인하기",
            post: "오답 선지가 왜 틀렸는지 본문에서 찾아 X 표시 하기"
        }
    },
    '어휘': {
        cause: [
            "문맥적 의미보다 사전적 의미에만 의존하여 어휘를 파악하려 합니다.",
            "유의어와 반의어 관계에 대한 학습이 충분하지 않습니다.",
            "한자어에 대한 이해도가 낮아 개념어 파악에 어려움을 겪습니다."
        ],
        prescription: {
            pre: "모르는 단어가 나와도 당황하지 않고 문맥으로 유추하겠다는 마음먹기",
            during: "모르는 단어는 앞뒤 문장의 내용을 통해 긍정/부정 뉘앙스 파악하기",
            post: "틀린 어휘와 그 유의어/반의어를 정리하여 나만의 단어장 만들기"
        }
    },
    '구조': {
        cause: [
            "글의 전개 방식(비교, 대조, 예시 등)을 파악하는 구조적 독해력이 약합니다.",
            "문단 간의 유기적 관계를 파악하지 못하고 개별 문단만 따로 봅니다.",
            "글의 서론-본론-결론 구조를 예측하며 읽는 훈련이 필요합니다."
        ],
        prescription: {
            pre: "첫 문단을 읽고 글이 어떻게 전개될지 구조 예측해보기",
            during: "접속어(특히 역접, 인과)를 통해 글의 흐름이 바뀌는 지점 체크하기",
            post: "글의 구조도(마인드맵)를 간단하게 그려보기"
        }
    },
    // English Keys Mapping
    'Inference': {
        cause: [
            "You tend to rely solely on explicit information and miss implied meanings.",
            "Focusing too much on word-matching rather than understanding the context.",
            "Missing the logical link between the author's intent and the text."
        ],
        prescription: {
            pre: "Read the question first to identify what needs to be inferred.",
            during: "Mark conjunctions and emotional adjectives while reading.",
            post: "Underline the evidence in the text and draw arrows to the answer."
        }
    },
    'Vocabulary': {
        cause: [
            "Relying too much on dictionary definitions instead of contextual meaning.",
            "Insufficient understanding of synonyms and antonyms.",
            "Difficulty grasping conceptual terms due to lack of familiarity."
        ],
        prescription: {
            pre: "Prepare to infer meaning from context if you encounter unknown words.",
            during: "Determine positive/negative nuance from surrounding sentences.",
            post: "Create a personal vocabulary list with synonyms and antonyms."
        }
    },
    'Reading': { // General Reading Fallback
        cause: [
            "Lack of consistent reading strategy across different text types.",
            "Difficulty sustaining concentration throughout long passages."
        ],
        prescription: {
            pre: "Scan the title and questions to set a reading purpose.",
            during: "Summarize each paragraph mentally as you read.",
            post: "Review incorrect answers to identify pattern of errors."
        }
    }
};

const STRENGTH_STRATEGIES: Record<string, string> = {
    '추론': "추론 능력은 깊이 있는 독해의 핵심입니다. 이 강점을 활용해 '비판적 읽기'나 '고난도 보기 문제'에 도전하여 최상위권으로 도약하세요.",
    '중심생각': "글의 맥락을 파악하는 능력이 탁월합니다. 이를 바탕으로 세부적인 정보까지 꼼꼼하게 채워 넣는다면 빈틈없는 독해력을 완성할 수 있습니다.",
    '세부내용': "정보를 정확하게 파악하는 눈이 날카롭습니다. 이제는 나무보다 숲을 보는 연습(구조 파악)을 병행한다면 독해 속도와 정확도를 동시에 잡을 수 있습니다.",
    '어휘': "탄탄한 어휘력은 독해의 강력한 무기입니다. 풍부한 어휘력을 바탕으로 고급 지문(철학, 경제 등)에 도전하여 배경지식을 넓혀보세요.",
    '구조': "글의 구조를 파악하는 논리력이 뛰어납니다. 이 논리력을 바탕으로 추론 문제에서 정답의 근거를 논리적으로 도출하는 연습을 더해보세요.",
    'default': "현재의 강점을 바탕으로 자신감을 가지세요! 강점 영역에서 얻은 성취감을 약점 영역 극복의 에너지로 삼아 꾸준히 학습하는 것이 중요합니다."
};


// --- Interfaces ---

export interface InsightResult {
    diagnosis: {
        weakness: string;
        score: number;
        impact_factor: number; // 1.0, 1.1, 1.2
        trend: 'up' | 'down' | 'stable'; // Placeholder for now
    };
    causes: string[];
    prescription: {
        step1: string; // Pre
        step2: string; // During
        step3: string; // Post
    };
    strength: {
        area: string;
        strategy: string;
    };
}

// --- Logic Engine ---

export function generateInsight(data: SummaryData): InsightResult | null {
    if (!data || !data.by_q_type || data.by_q_type.length === 0) return null;

    // 1. Calculate Weakness Score with Impact Weights
    // Score = (100 - Accuracy) * Weight
    // We look at both 'by_q_type' and 'by_area' effectively? 
    // Usually 'Type' is more granular for diagnosis. Let's stick to 'by_q_type' for main diagnosis.

    let worstItem: MetricItem | null = null;
    let maxWeaknessScore = -1;

    // Combine types and areas for evaluation or just types? 
    // Request says "Type detailed diagnosis". Let's focus on types primarily, but if data is sparse, maybe area.
    // Let's iterate `by_q_type` primarily.

    // Filter out items with very few questions? Optional but good for stability. 
    // For now, take raw data.

    // Use for...of for better TS control flow analysis
    for (const item of data.by_q_type) {
        const typeName = item.q_type || item.name;
        const lookupName = Object.keys(IMPACT_WEIGHTS).find(k => k === typeName) || 'default';
        const weight = IMPACT_WEIGHTS[lookupName];
        const weaknessRaw = 100 - item.accuracy;
        const score = weaknessRaw * weight;

        if (score > maxWeaknessScore) {
            maxWeaknessScore = score;
            worstItem = item;
        }
    }

    if (!worstItem && data.by_area.length > 0) {
        for (const item of data.by_area) {
            const areaName = item.area || item.name;
            const lookupName = Object.keys(IMPACT_WEIGHTS).find(k => k === areaName) || 'default';
            const weight = IMPACT_WEIGHTS[lookupName];
            const score = (100 - item.accuracy) * weight;

            if (score > maxWeaknessScore) {
                maxWeaknessScore = score;
                worstItem = item;
            }
        }
    }

    if (!worstItem) return null;

    const worstName = worstItem.q_type || worstItem.area || 'Unknown';
    const lookupName = Object.keys(DIAGNOSIS_DB).find(k => k === worstName) || (Object.keys(DIAGNOSIS_DB).includes(worstName) ? worstName : 'Reading'); // Fallback to Reading/Gen

    const dbEntry = DIAGNOSIS_DB[lookupName] || DIAGNOSIS_DB['Reading'];
    // Randomize or Select all causes? Request says "Detail cause hypothesis". 
    // Let's return all causes as bullet points.


    // 2. Identify Strength
    // Simply highest accuracy with meaningful sample size (e.g. > 0 questions)
    // We check both Area and Type for strength to give broader compliment.
    let bestItem: MetricItem | null = null;
    let maxAccuracy = -1;

    const allItems = [...data.by_area, ...data.by_q_type];
    for (const item of allItems) {
        if (item.total > 0 && item.accuracy > maxAccuracy) {
            maxAccuracy = item.accuracy;
            bestItem = item;
        }
    }

    const strengthName = bestItem ? (bestItem.area || bestItem.q_type || bestItem.name) : 'General';
    // Clean up name (remove "Reading" / "Vocabulary" prefix if redundant?) - Keep as is.

    const strengthKey = Object.keys(STRENGTH_STRATEGIES).find(k => strengthName.includes(k)) || 'default';
    const strengthStrategy = STRENGTH_STRATEGIES[strengthKey];


    // 3. Construct Result
    return {
        diagnosis: {
            weakness: worstName,
            score: parseFloat(maxWeaknessScore.toFixed(1)),
            impact_factor: IMPACT_WEIGHTS[Object.keys(IMPACT_WEIGHTS).find(k => k === worstName) || 'default'],
            trend: 'stable' // Hardcoded for now, need historical data for trend
        },
        causes: dbEntry.cause,
        prescription: {
            step1: `[읽기 전] ${dbEntry.prescription.pre}`,
            step2: `[읽는 중] ${dbEntry.prescription.during}`,
            step3: `[문제 풀이] ${dbEntry.prescription.post}`
        },
        strength: {
            area: strengthName,
            strategy: strengthStrategy
        }
    };
}
