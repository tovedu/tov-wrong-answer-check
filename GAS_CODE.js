function doGet(e) {
    const params = e.parameter;
    const action = params.action;

    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'ping') {
        return output.setContent(JSON.stringify({ ok: true, action: 'ping', version: 'v2026-01-12-02' }));
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

    if (action === 'getSessionBlueprint') {
        return getSessionBlueprint(params, output);
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

function getSessionBlueprint(params, output) {
    const week = parseInt(params.week);
    const session = params.session;

    if (!week || !session) return output.setContent(JSON.stringify({ error: 'Missing params' }));

    const sheet = getSheet('QUESTION_DB');
    const data = sheet.getDataRange().getValues();

    // Helper: Find column index
    function findHeaderIndex(headers, keywords) {
        for (let i = 0; i < headers.length; i++) {
            const h = String(headers[i]).toLowerCase().replace(/_/g, '').replace(/ /g, '');
            for (let k of keywords) {
                if (h.includes(k)) return i;
            }
        }
        return -1;
    }

    const headers = data[0];
    const idxWeek = findHeaderIndex(headers, ['week', '주차']);
    const idxSession = findHeaderIndex(headers, ['session', '회차', '세션']);
    const idxSlot = findHeaderIndex(headers, ['slot', '문항', '번호', 'q_number']);

    if (idxWeek === -1 || idxSession === -1 || idxSlot === -1) {
        return output.setContent(JSON.stringify({ error: 'Invalid QUESTION_DB headers' }));
    }

    let questions = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[idxWeek] == week && row[idxSession] == session) {
            questions.push(row[idxSlot]);
        }
    }

    // Sort conventionally: R1, R2... V1, V2...
    questions.sort((a, b) => {
        const aType = a.charAt(0);
        const bType = b.charAt(0);
        const aNum = parseInt(a.slice(1)) || 0;
        const bNum = parseInt(b.slice(1)) || 0;

        if (aType !== bType) return aType.localeCompare(bType);
        return aNum - bNum;
    });

    return output.setContent(JSON.stringify({ questions: questions }));
}

function getSummary(params, output) {
    const studentId = params.student_id;
    const fromWeek = parseInt(params.from_week);
    const toWeek = parseInt(params.to_week);

    if (!studentId || isNaN(fromWeek) || isNaN(toWeek)) {
        return output.setContent(JSON.stringify({ error: 'Missing or invalid parameters' }));
    }

    // Helper: Find column index by partial name match (case-insensitive)
    function findHeaderIndex(headers, keywords) {
        for (let i = 0; i < headers.length; i++) {
            const h = String(headers[i]).toLowerCase().replace(/_/g, '').replace(/ /g, '');
            for (let k of keywords) {
                if (h.includes(k)) return i;
            }
        }
        return -1;
    }

    // 1. Load Data
    const answerSheet = getSheet('ANSWER_LOG');
    const answerData = answerSheet.getDataRange().getValues();

    // 2. Load TEXT_DB (for Passage Type Info)
    let textMeta = {};
    const textSheet = getSheet('TEXT_DB');
    if (textSheet.getLastRow() > 1) {
        const tRows = textSheet.getDataRange().getValues();
        const tHeaders = tRows[0];
        const idxGroup = findHeaderIndex(tHeaders, ['passage_group', 'group', '지문그룹', '지문']);
        const idxType = findHeaderIndex(tHeaders, ['text_type', 'type', '텍스트유형', '유형', '갈래']);

        if (idxGroup > -1 && idxType > -1) {
            for (let i = 1; i < tRows.length; i++) {
                const grp = tRows[i][idxGroup];
                const typ = tRows[i][idxType];
                if (grp) textMeta[grp] = typ;
            }
        }
    }

    // 3. Load QUESTION_DB (Metadata)
    const qDbSheet = getSheet('QUESTION_DB');
    let qMeta = {};

    if (qDbSheet.getLastRow() > 1) {
        const qRows = qDbSheet.getDataRange().getValues();
        const qHeaders = qRows[0];

        const idxWeek = findHeaderIndex(qHeaders, ['week', '주차']);
        const idxSession = findHeaderIndex(qHeaders, ['session', '회차', '세션']);
        const idxSlot = findHeaderIndex(qHeaders, ['slot', '문항', '번호', 'q_number']);
        const idxType = findHeaderIndex(qHeaders, ['type', '유형', 'q_type']);
        const idxArea = findHeaderIndex(qHeaders, ['area', '영역']);
        const idxPassage = findHeaderIndex(qHeaders, ['passage', '지문', 'group']);

        if (idxWeek > -1 && idxSession > -1 && idxSlot > -1) {
            for (let i = 1; i < qRows.length; i++) {
                const row = qRows[i];
                const key = `${row[idxWeek]}-${row[idxSession]}-${row[idxSlot]}`;

                const qType = idxType > -1 ? row[idxType] : 'Unknown';
                const qArea = idxArea > -1 ? row[idxArea] : 'Unknown';
                const pGroup = idxPassage > -1 ? row[idxPassage] : '';

                const finalPassageType = textMeta[pGroup] || pGroup || 'Unknown';

                qMeta[key] = {
                    type: qType,
                    area: qArea,
                    passage: finalPassageType,
                    raw_passage_group: pGroup
                };
            }
        }
    }

    let totalQuestions = 0;
    let wrongCount = 0;

    const byType = {};
    const byArea = {};
    const byPassage = {};
    const byWeek = {};
    const wrongList = [];

    // 4. Iterate Answer Log
    for (let i = 1; i < answerData.length; i++) {
        const row = answerData[i];
        const rStu = row[2];
        const rWeek = parseInt(row[3]);
        const rSession = row[4];
        const rSlot = row[5];
        const isWrong = (row[6] === true || row[6] === 'true' || row[6] === 'TRUE');

        if (rStu === studentId && rWeek >= fromWeek && rWeek <= toWeek && isWrong) {
            wrongCount++;

            const key = `${rWeek}-${rSession}-${rSlot}`;
            let meta = qMeta[key];

            if (!meta) {
                meta = { type: 'Unknown', area: 'Unknown', passage: 'Unknown' };
                if (String(rSlot).startsWith('R')) meta.area = '독해';
                if (String(rSlot).startsWith('V')) meta.area = '어휘';
                if (row[10]) meta.area = row[10];
                if (row[11]) meta.type = row[11];
            }

            byType[meta.type] = (byType[meta.type] || 0) + 1;
            byArea[meta.area] = (byArea[meta.area] || 0) + 1;
            byPassage[meta.passage] = (byPassage[meta.passage] || 0) + 1;
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

    const QUESTIONS_PER_WEEK = 35;
    totalQuestions = (toWeek - fromWeek + 1) * QUESTIONS_PER_WEEK;

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

function getWrongList(params, output) {
    const sheet = getSheet('ANSWER_LOG');
    const data = sheet.getDataRange().getValues();

    const studentId = params.student_id;
    const week = params.week;
    const session = params.session;

    let wrongList = [];

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
        if (name === 'TEXT_DB') sheet.appendRow(['PassageGroup', 'TextType']);
    }
    return sheet;
}
