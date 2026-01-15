export interface MetricItem {
    name: string;      // The label (e.g., "Inference", "Reading")
    total: number;
    wrong: number;
    accuracy: number;
    q_type?: string;   // For by_q_type
    area?: string;     // For by_area
    passage_group?: string; // For by_passage_group
    week?: string;     // For by_week
}

export interface WrongAnswer {
    week: number;
    session: string;
    slot: string;
    area: string;
    type: string;
    passage: string;
    date: string;
}

export interface SummaryData {
    student_id: string;
    total_questions: number;
    total_wrong: number;
    overall: {
        accuracy: number;
        reading_accuracy: number;
        vocab_accuracy: number;
    };
    by_q_type: MetricItem[];
    by_area: MetricItem[];
    by_passage_group: MetricItem[];
    by_week: MetricItem[];
    wrong_list: WrongAnswer[];
    comparison?: {
        literature: { total: number; wrong: number; accuracy: number; };
        non_literature: { total: number; wrong: number; accuracy: number; };
    };
}
