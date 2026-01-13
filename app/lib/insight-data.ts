
export interface InsightContent {
    description: string;
    prescription: string;
}

export type InsightCategory = '독서' | '문학' | 'default';

export const INSIGHT_GUIDES: Record<string, Record<string, InsightContent>> = {
    '독서': {
        '중심 생각': {
            description: "중심 생각을 찾는 것은 글을 읽는 이유이자 독해의 기본입니다. 만약 중심 생각을 잘 찾아내지 못한다면 글을 읽는 데에 온전히 집중하지 못하고 있을 가능성이 높습니다.",
            prescription: "비문학 지문에서는 대체로 중심 생각을 직접 드러냅니다. 글의 맨 처음 또는 맨 마지막에 나오는 경우가 많습니다. 이 글이 어떤 이야기를 하는지 관심을 기울여서 읽도록 지도해야 합니다."
        },
        '세부내용': {
            description: "중심 생각을 찾기 위해서는 글을 능동적으로 읽어야 한다면 세부내용을 찾기 위해서는 글을 수동적으로 읽어야 합니다. 학생이 주관에만 매여 글을 읽게 하지 마시고, 글에서 주어진 내용을 그대로 읽도록 해야 합니다.",
            prescription: "문제를 먼저 읽고 찾아야 할 내용을 숙지한 다음 지문을 읽는 것도 세부내용을 잘 찾는 방법 중 하나입니다. 글에 제시된 정보 그 자체에 집중하여 '수동적 독해'를 연습하세요."
        },
        '구조알기': {
            description: "글의 구조를 묻는 문제는 독해 문제를 처음 접하는 학생들이 특히 어려워하는 문제 유형입니다.",
            prescription: "평소 글을 읽을 때, 글 전체의 중심내용뿐 아니라 단락마다 중심내용을 찾는 습관을 기르면 구조를 묻는 문제의 답을 잘 찾을 수 있습니다. 또한 글 전체가 어떤 흐름으로 전개되고 있는지 관심을 갖고 읽으세요."
        },
        '어휘·표현': {
            description: "글을 읽을 때, 문장 하나, 그리고 낱말 하나도 모르는 것 없이 꼼꼼히 읽는 버릇을 들이는 것이 중요합니다.",
            prescription: "학생이 모르는 어려운 낱말을 찾는 문제는 글 속에서 그 낱말을 따로 설명하는 부분을 찾는 요령만 있으면 의외로 쉽게 맞힐 수 있습니다."
        },
        '내용적용': {
            description: "내용 적용 문제는 무엇보다 문제가 요구하는 바를 정확히 읽어내는 것이 중요합니다. 또한 비슷비슷한 선택지에서 가장 가까운 표현을 찾아낼 줄도 알아야 합니다.",
            prescription: "정확한 답이 보이지 않을 때, 선택지끼리 비교하는 연습을 평소에 하면 도움이 될 수 있습니다."
        },
        '추론': {
            description: "추론 문제 또한 내용 적용 문제처럼 무엇보다 문제가 요구하는 바를 정확히 읽어낼 줄 알아야 합니다.",
            prescription: "추론 문제는 그 주제에 대해 잘 알고 있으면 푸는 데 아주 도움이 됩니다. 따라서 평소 배경지식을 많이 쌓아두면 추론 문제에 쉽게 접근할 수 있을 것입니다."
        },
        // Fallbacks or Aliases
        '사실적 독해': {
            description: "글에 제시된 정보를 있는 그대로 파악하는 능력이 필요합니다.",
            prescription: "주관적인 해석을 배제하고 글에 적힌 사실(Fact)을 정확히 찾아내는 연습이 필요합니다."
        },
        '비판적 독해': {
            description: "글쓴이의 관점이나 태도를 파악하고 그 타당성을 판단해야 합니다.",
            prescription: "글쓴이의 주장이 근거에 부합하는지 따져보며 읽는 비판적 사고 훈련이 필요합니다."
        }
    },
    '문학': {
        '중심 생각': {
            description: "문학 문제는 중심 생각뿐 아니라 모든 유형의 문제를 풀 때, 글쓴이의 생각이 무엇인지 계속 궁금해하면서 읽어야 합니다.",
            prescription: "독해 문제를 풀 때뿐 아니라 다른 문학 작품을 읽을 때, 끊임없이 주제와 제목에 대해 호기심을 갖는다면 보다 쉽게 작품을 파악할 수 있을 것입니다."
        },
        '요소': {
            description: "작품의 요소를 파악하는 문제는 그리 어려운 유형의 문제는 아닙니다. 만약 요소 유형의 문제를 많이 틀린다면 작품을 꼼꼼히 읽지 않기 때문입니다.",
            prescription: "작품 자체에 드러난 인물과 사건, 배경, 정서 등을 꼼꼼히 읽는 습관을 들이도록 해야 합니다."
        },
        '세부내용': {
            description: "문학 지문에서는 사건의 내용, 일어난 사실 간의 관계, 눈에 보이는 인물의 행동에 대해 묻습니다.",
            prescription: "작품이 그리고 있는 상황을 정확히 머릿속에 그리고 있다면 세부내용 또한 찾기 수월할 것입니다. 장면을 시각화하는 연습을 해보세요."
        },
        '어휘·표현': {
            description: "성격이나 마음의 상태를 표현하는 어휘를 많이 알고 있으면 이 유형의 문제를 푸는 데 유리합니다.",
            prescription: "인물의 심경을 담은 낱말을 찾거나 적절한 어휘를 고르는 연습을 하세요. 비슷한 말과 반대되는 말을 많이 공부해두는 것도 큰 도움이 됩니다."
        },
        '작품이해': {
            description: "작품을 미리 알고 그 주제와 내용을 이해하고 있다면 보다 쉽게 풀 수 있는 문제이지만, 처음 보는 작품을 읽고 풀면 쉽지 않을 수 있습니다.",
            prescription: "전에 읽었던 작품들 중 유사한 주제를 담고 있는 작품을 떠올리는 것이 문제 접근에 도움이 될 수 있습니다."
        },
        '추론·적용': {
            description: "문학의 추론 문제에서는 <보기>를 제시하고 <보기>의 내용과 지문의 유사점 등을 찾아내는 문제가 많습니다.",
            prescription: "지문의 주제나 내용을 하나로 정리할 줄 알아야 하고, 문제 속 <보기>의 주제를 단순하게 정리하여 서로 비교할 줄 알아야 합니다. 무엇보다 문제 출제의 의도를 파악하는 것이 중요합니다."
        },
        // Aliases
        '외적 준거': { // 보통 추론/적용과 유사
            description: "<보기>와 같은 외적 준거를 참고하여 작품을 감상해야 합니다.",
            prescription: "<보기>의 관점을 작품에 정확히 적용하여, 선지의 해석이 적절한지 판단하는 훈련이 필요합니다."
        }
    }
};

/**
 * Helper to find the best matching guide key
 */
export function getInsightContent(category: string, type: string): InsightContent {
    // Normalize category
    let mainCat = 'default';
    if (category.includes('독서') || category.includes('비문학') || category.includes('Reading')) mainCat = '독서';
    else if (category.includes('문학') || category.includes('Reading_Lit')) mainCat = '문학';

    if (mainCat === 'default') {
        // Fallback check against type name if category is ambigous
        // but for now, rely on passed category.
        // If unknown, default to Reading maybe? or generic.
        mainCat = '독서';
    }

    const dict = INSIGHT_GUIDES[mainCat] || INSIGHT_GUIDES['독서'];

    // Fuzzy match type
    const normalize = (s: string) => s.replace(/ /g, '').replace(/찾기/g, '').replace(/파악/g, '');
    const target = normalize(type);

    let bestKey = '';

    // 1. Exact match / Contains
    for (const key of Object.keys(dict)) {
        if (target.includes(normalize(key)) || normalize(key).includes(target)) {
            bestKey = key;
            break;
        }
    }

    // 2. Specific Mappings
    if (!bestKey) {
        if (mainCat === '독서') {
            if (target.includes('사실')) bestKey = '세부내용';
            if (target.includes('주제')) bestKey = '중심 생각';
            if (target.includes('전개')) bestKey = '구조알기';
        } else {
            if (target.includes('인물')) bestKey = '요소';
            if (target.includes('정서')) bestKey = '요소';
            if (target.includes('시점')) bestKey = '요소';
            if (target.includes('감상')) bestKey = '추론·적용';
        }
    }

    if (bestKey && dict[bestKey]) {
        return dict[bestKey];
    }

    // Default Fallback
    return {
        description: "이 유형은 정확한 독해력을 요구합니다.",
        prescription: "오답 노트를 통해 왜 틀렸는지 분석하고, 해당 유형의 문제를 집중적으로 풀어보는 것이 좋습니다."
    };
}
