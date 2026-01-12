function doGet(e) {
    const params = e.parameter;
    const action = params.action;

    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'ping') {
        return output.setContent(JSON.stringify({ ok: true, action: 'ping', version: 'v2026-01-10-03' }));
    }

    if (action === 'wrong_list') {
        return getWrongList(params, output);
    }

    if (action === 'get_student_list') {
        return getStudentList(output);
    }

    if (action === 'get_analysis_data') {
        return getAnalysisData(params, output);
    }

    if (action === 'summary') {
        return getSummary(params, output);
    }

    return output.setContent(JSON.stringify({ error: 'Invalid action' }));
}

function doPost(e) {
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === 'save_wrong_list') {
            return saveWrongList(data, output);
        }

        return output.setContent(JSON.stringify({ error: 'Invalid action' }));
    } catch (err) {
        return output.setContent(JSON.stringify({ error: 'Error processing request', details: err.toString() }));
    }
}

function getSummary(params, output) {
    const studentId = params.student_id;
    const fromWeek = parseInt(params.from_week);
    const toWeek = parseInt(params.to_week);

    if (!studentId || isNaN(fromWeek) || isNaN(toWeek)) {
        return output.setContent(JSON.stringify({ error: 'Missing or invalid parameters' }));
    }

    // 1. Load Data
    const answerSheet = getSheet('ANSWER_LOG');
    const answerData = answerSheet.getDataRange().getValues();

    // QP: Question Params (Metadata)
    const qDbSheet = getSheet('QUESTION_DB');
    // Assume QP Headers: [Week, Session, Q_Slot, Type, Area, PassageGroup]
    // If not exists, we use empty
    let qMeta = {};
    if (qDbSheet.getLastRow() > 1) {
        const qData = qDbSheet.getDataRange().getValues();
        // Skip header
        for (let i = 1; i < qData.length; i++) {
            const row = qData[i];
            // Key: Week-Session-Slot (e.g., "1-1-R1")
            const key = `${row[0]}-${row[1]}-${row[2]}`;
            qMeta[key] = {
                type: row[3],
                area: row[4],
                passage: row[5]
            };
        }
    }

    let totalQuestions = 0; // This usually requires knowing how many questions student ATTEMPTED. 
    // For now, let's assume specific number per session or calc from logs if logged all attempts.
    // BUT, the prompt implies "total_questions" in the summary. 
    // If we only log WRONG answers, we can't know total attempted unless we know total potential questions in those weeks.
    // Let's approximate: (to - from + 1) * 5 (sessions) * 15 (questions) ??
    // OR just return 0 if unknown. 
    // Let's assume standard: 5 sessions/week * 20 questions/session = 100/week.

    // Aggregation buckets
    const byType = {};
    const byArea = {};
    const byPassage = {};
    const byWeek = {};
    const wrongList = [];

    let wrongCount = 0;

    // 2. Iterate Answer Log
    // Schema: 0: log, 1: date, 2: stu_id, 3: week, 4: session, 5: q_slot, 6: is_wrong
    for (let i = 1; i < answerData.length; i++) {
        const row = answerData[i];
        const rStu = row[2];
        const rWeek = parseInt(row[3]);
        const rSession = row[4];
        const rSlot = row[5];
        const isWrong = (row[6] === true || row[6] === 'true' || row[6] === 'TRUE');

        if (rStu === studentId && rWeek >= fromWeek && rWeek <= toWeek && isWrong) {
            wrongCount++;

            // Resolve Metadata
            const key = `${rWeek}-${rSession}-${rSlot}`;
            const meta = qMeta[key] || { type: 'Unknown', area: 'Unknown', passage: 'Unknown' };

            // Fallback from log if meta missing (optional, based on your previous code)
            // Log cols: 10: area, 11: q_type
            if (meta.type === 'Unknown' && row[11]) meta.type = row[11];
            if (meta.area === 'Unknown' && row[10]) meta.area = row[10];

            // Aggregates
            // Type
            byType[meta.type] = (byType[meta.type] || 0) + 1;
            // Area
            byArea[meta.area] = (byArea[meta.area] || 0) + 1;
            // Passage
            byPassage[meta.passage] = (byPassage[meta.passage] || 0) + 1;
            // Week
            byWeek[rWeek] = (byWeek[rWeek] || 0) + 1;

            wrongList.push({
                week: rWeek,
                session: rSession,
                q_slot: rSlot,
                q_type: meta.type,
                area: meta.area,
                passage_group: meta.passage
            });
        }
    }

    // Estimate total questions (fixed logic for now: 25 questions * 5 sessions * weeks)
    // Adjust this constant based on actual curriculum
    const QUESTIONS_PER_WEEK = 35; // Example
    totalQuestions = (toWeek - fromWeek + 1) * QUESTIONS_PER_WEEK;

    // Helper to format arrays
    const formatObj = (obj, keyName) => Object.entries(obj)
        .map(([k, v]) => ({ [keyName]: k, count: v }))
        .sort((a, b) => b.count - a.count);

    const summary = {
        student_id: studentId,
        total_questions: totalQuestions,
        wrong_count: wrongCount,
        wrong_rate: totalQuestions > 0 ? parseFloat((wrongCount / totalQuestions).toFixed(2)) : 0,
        by_q_type: formatObj(byType, 'q_type'),
        by_area: formatObj(byArea, 'area'),
        by_passage: formatObj(byPassage, 'passage_group'),
        by_week: Object.entries(byWeek).map(([k, v]) => ({ week: parseInt(k), count: v })).sort((a, b) => a.week - b.week),
        wrong_list: wrongList
    };

    return output.setContent(JSON.stringify(summary));
}

// ... (Rest of existing functions: getWrongList, getStudentList, getAnalysisData, saveWrongList, getSheet) ...

function getWrongList(params, output) {
    const sheet = getSheet('ANSWER_LOG');
    const data = sheet.getDataRange().getValues();

    const studentId = params.student_id;
    const week = params.week;
    const session = params.session;

    let wrongList = [];

    // Skip header
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[2] == studentId && row[3] == week && row[4] == session) {
            if (row[6] === true || row[6] === 'true' || row[6] === 'TRUE') {
                wrongList.push(row[5]);
            }
        }
    }

    return output.setContent(JSON.stringify({ wrong_list: wrongList }));
}

function getAnalysisData(params, output) {
    // Preserve existing logic or update as needed. 
    // The user asked for "range" update previously, but now we have "summary".
    // I will leave this separate for now as "summary" covers the dashboard needs.
    const sheet = getSheet('ANSWER_LOG');
    const data = sheet.getDataRange().getValues();

    const week = params.week;
    const session = params.session;
    const studentId = params.student_id;

    const stats = {};

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rWeek = row[3];
        const rSession = row[4];
        const rStudentId = row[2];
        const rIsWrong = (row[6] === true || row[6] === 'true' || row[6] === 'TRUE');
        const qSlot = row[5];

        if (rWeek == week && rSession == session) {
            if (studentId && rStudentId != studentId) continue;
            if (rIsWrong && qSlot) {
                if (!stats[qSlot]) {
                    stats[qSlot] = { slot: qSlot, count: 0, area: row[10] || '', type: row[11] || '' };
                }
                stats[qSlot].count++;
            }
        }
    }

    const result = Object.values(stats).sort((a, b) => b.count - a.count);

    return output.setContent(JSON.stringify({
        analysis: result,
        meta: { week: week, session: session, student_id: studentId }
    }));
}

function getStudentList(output) {
    const sheet = getSheet('STUDENT_DB');
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
        return output.setContent(JSON.stringify({ students: [] }));
    }

    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

    const students = data.map(row => ({
        name: row[0],
        id: row[1]
    })).filter(s => s.name && s.id);

    return output.setContent(JSON.stringify({ students: students }));
}

function saveWrongList(data, output) {
    const sheet = getSheet('ANSWER_LOG');
    const timestamp = new Date();
    const dateStr = Utilities.formatDate(timestamp, "GMT+9", "yyyy-MM-dd HH:mm:ss");
    const studentId = data.student_id;
    const week = data.week;
    const session = data.session;
    const wrongSlots = data.wrong_list || [];

    wrongSlots.forEach(slot => {
        const logId = 'LOG_' + timestamp.getTime() + '_' + Math.floor(Math.random() * 1000);
        let area = '';
        if (slot.startsWith('R')) area = 'Reading';
        if (slot.startsWith('V')) area = 'Vocabulary';

        sheet.appendRow([
            logId, dateStr, studentId, week, session, slot, true, '', '', '', area, '', '', ''
        ]);
    });

    return output.setContent(JSON.stringify({ success: true, count: wrongSlots.length }));
}

function getSheet(name) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        if (name === 'WrongAnswers') sheet.appendRow(['Timestamp', 'StudentID', 'Week', 'Session', 'Q_Slot', 'IsWrong']);
        if (name === 'STUDENT_DB') sheet.appendRow(['Name', 'ID']);
        if (name === 'ANSWER_LOG') sheet.appendRow(['log_id', 'date', 'student_id', 'week', 'session', 'q_slot', 'is_wrong', 'answer_value', 'question_id', 'passage_group', 'area', 'q_type', 'inweek', 'score']);
        if (name === 'QUESTION_DB') sheet.appendRow(['Week', 'Session', 'Q_Slot', 'Type', 'Area', 'PassageGroup']);
        // Added QUESTION_DB creation for metadata
    }
    return sheet;
}

