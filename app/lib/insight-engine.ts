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
    '작품이해': {
        cause: [
            "인물의 심리나 성격을 파악할 때 직접적인 서술에만 의존하는 경향이 있습니다.",
            "작품의 시대적 배경이나 상황적 맥락을 고려하지 않고 현대적 관점에서만 해석하려 합니다.",
            "시적 화자나 서술자의 태도 변화를 민감하게 포착하지 못합니다."
        ],
        prescription: {
            pre: "제목과 작가를 확인하여 작품의 갈래와 시대적 배경 유추하기",
            during: "인물의 정서나 태도가 드러나는 시어/서술에 동그라미 표시하기",
            post: "작품의 주제와 핵심 갈등 구조를 한 문장으로 정리해보기"
        }
    },
    '비판': {
        cause: [
            "글쓴이의 관점을 정확히 파악하지 못하고 자신의 주관적 생각을 개입시켜 판단합니다.",
            "보기(관점)를 참고하여 지문을 감상해야 하는데, 지문의 내용만으로 문제를 해결하려 합니다.",
            "주장의 타당성을 평가할 때 논리적 근거보다 감정적 동조에 치우칠 때가 있습니다."
        ],
        prescription: {
            pre: "'보기'가 있는 경우, 보기를 먼저 읽고 비판의 준거(기준) 확립하기",
            during: "필자의 주장이나 태도가 드러난 문장에 별표(*) 표시하기",
            post: "선지의 판단 내용이 '지문'에 근거하는지 '보기'에 근거하는지 구별하기"
        }
    },
    '적용': {
        cause: [
            "지문의 원리를 구체적인 사례에 적용하는 전이 능력이 다소 부족합니다.",
            "사례(보기)의 핵심 특징을 지문의 개념과 일대일로 매칭시키는 훈련이 필요합니다.",
            "추상적인 개념을 구체적인 상황으로 치환하여 이해하는 데 어려움을 겪습니다."
        ],
        prescription: {
            pre: "문제의 발문을 통해 어떤 개념을 어디에 적용해야 하는지 확인하기",
            during: "지문의 핵심 원리나 공식을 간단한 도식으로 메모해두기",
            post: "사례와 지문의 공통점과 차이점을 표로 정리하여 비교하기"
        }
    },
    // Fallbacks
    'Reading': {
        cause: [
            "지문 갈래(인문, 사회, 과학 등)에 따른 유연한 읽기 전략이 부족합니다.",
            "긴 지문을 끝까지 읽어내려가는 호흡과 집중력이 다소 부족합니다.",
            "문제를 풀 때 지문으로 되돌아가는 횟수가 많아 시간이 부족합니다."
        ],
        prescription: {
            pre: "제목과 문제(발문)를 먼저 훑어보고 읽기 목적(무엇을 찾을지) 설정하기",
            during: "각 문단(또는 의미 단위)이 끝날 때마다 핵심 내용을 머릿속으로 요약하기",
            post: "틀린 문제는 해설지보다 먼저 지문에서 스스로 정답의 근거 찾아보기"
        }
    }
};

const STRENGTH_STRATEGIES: Record<string, string> = {
    '추론': "추론 능력은 깊이 있는 독해의 핵심입니다. 이 강점을 활용해 '비판적 읽기'나 '고난도 보기 문제'에 도전하여 최상위권으로 도약하세요.",
    '중심생각': "글의 맥락을 파악하는 능력이 탁월합니다. 이를 바탕으로 세부적인 정보까지 꼼꼼하게 채워 넣는다면 빈틈없는 독해력을 완성할 수 있습니다.",
    '세부내용': "정보를 정확하게 파악하는 눈이 날카롭습니다. 이제는 나무보다 숲을 보는 연습(구조 파악)을 병행한다면 독해 속도와 정확도를 동시에 잡을 수 있습니다.",
    '어휘': "탄탄한 어휘력은 독해의 강력한 무기입니다. 풍부한 어휘력을 바탕으로 고급 지문(철학, 경제 등)에 도전하여 배경지식을 넓혀보세요.",
    '구조': "글의 구조를 파악하는 논리력이 뛰어납니다. 이 논리력을 바탕으로 추론 문제에서 정답의 근거를 논리적으로 도출하는 연습을 더해보세요.",
    '작품이해': "문학적 감수성과 작품 분석력이 뛰어납니다. 다양한 낯선 작품들을 접해보며 감상 능력을 더욱 확장시킨다면 문학은 가장 든든한 효자 과목이 될 것입니다.",
    '비판': "비판적 사고력이 돋보입니다. 필자의 관점을 수용하는 것을 넘어 타당성을 검토하는 상위인지 능력을 십분 발휘해 보세요.",
    '적용': "배운 내용을 새로운 상황에 응용하는 유연한 사고를 가졌습니다. 고난도 융합 지문이나 <보기> 문제에서도 강한 자신감을 가져도 좋습니다.",
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
    // Normalize: Remove spaces for lookup (e.g., '작품 이해' -> '작품이해')
    const normalizedWorstName = worstName.replace(/\s+/g, '');

    // Find key in DIAGNOSIS_DB matching normalized name
    const lookupName = Object.keys(DIAGNOSIS_DB).find(k => k === normalizedWorstName) ||
        (Object.keys(DIAGNOSIS_DB).includes(normalizedWorstName) ? normalizedWorstName : 'Reading');

    const dbEntry = DIAGNOSIS_DB[lookupName] || DIAGNOSIS_DB['Reading'];


    // 2. Identify Strength
    // Simply highest accuracy with meaningful sample size (e.g. > 0 questions)
    // We check both Area and Type for strength to give broader compliment.
    // CRITICAL FIX: Strength cannot be the same as Weakness.
    let bestItem: MetricItem | null = null;
    let maxAccuracy = -1;

    const allItems = [...data.by_area, ...data.by_q_type];

    for (const item of allItems) {
        const itemName = item.q_type || item.area || item.name;

        // Skip if this item is the identified weakness
        if (itemName === worstName) continue;

        if (item.total > 0 && item.accuracy > maxAccuracy) {
            maxAccuracy = item.accuracy;
            bestItem = item;
        }
    }

    const strengthName = bestItem ? (bestItem.area || bestItem.q_type || bestItem.name) : '종합';
    // Normalize: Remove spaces
    const normalizedStrengthName = strengthName.replace(/\s+/g, '');

    const strengthKey = Object.keys(STRENGTH_STRATEGIES).find(k => normalizedStrengthName.includes(k)) || 'default';
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
