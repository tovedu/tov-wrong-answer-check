function doGet(e) {
    const params = e.parameter;
    const action = params.action;

    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'ping') {
        return output.setContent(JSON.stringify({ ok: true, action: 'ping', version: 'v2026-01-12-05-accuracy-check' }));
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
    const headers = data[0];

    const findIndex = (keys) => {
        for (let i = 0; i < headers.length; i++) {
            const h = String(headers[i]).toLowerCase().replace(/_/g, '').replace(/ /g, '');
            for (let k of keys) {
                if (h.includes(k)) return i;
            }
        }
        return -1;
    };

    const idxWeek = findIndex(['week', '주차']);
    let idxSession = findIndex(['session', '회차', '세션']);
    const idxInWeek = findIndex(['inweek', '주차내회차', 'relative']);

    if (idxInWeek > -1) idxSession = idxInWeek;

    const idxSlot = findIndex(['slot', '문항', '번호', 'q_number']);

    let questions = [];

    if (idxWeek < 0 || idxSession < 0 || idxSlot < 0) {
        return output.setContent(JSON.stringify({ error: 'Invalid headers' }));
    }

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[idxWeek] == week && row[idxSession] == session) {
            questions.push(row[idxSlot]);
        }
    }

    questions.sort((a, b) => {
        const typeA = a.charAt(0);
        const typeB = b.charAt(0);
        const numA = parseInt(a.substring(1));
        const numB = parseInt(b.substring(1));
        if (typeA !== typeB) return typeA.localeCompare(typeB);
        return numA - numB;
    });

    return output.setContent(JSON.stringify({ questions: questions }));
}

function getSummary(params, output) {
    const studentId = params.student_id;
    const fromWeek = parseInt(params.from_week);
    const toWeek = parseInt(params.to_week);

    if (!studentId || isNaN(fromWeek) || isNaN(toWeek)) {
        return output.setContent(JSON.stringify({ error: 'Missing parameters' }));
    }

    // Helper
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

    // 2. Load TEXT_DB (Passage Metadata)
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

    // 3. Load QUESTION_DB (Totals & Metadata)
    const qDbSheet = getSheet('QUESTION_DB');
    let qMeta = {};

    // Total Counts Containers
    let totalQuestions = 0;
    const totalByType = {};
    const totalByArea = {};
    const totalByPassage = {};
    const totalByWeek = {};

    if (qDbSheet.getLastRow() > 1) {
        const qRows = qDbSheet.getDataRange().getValues();
        const qHeaders = qRows[0];

        const idxWeek = findHeaderIndex(qHeaders, ['week', '주차']);
        let idxSession = findHeaderIndex(qHeaders, ['session', '회차', '세션']);
        const idxInWeek = findHeaderIndex(qHeaders, ['inweek', '주차내회차', 'relative']);
        if (idxInWeek > -1) idxSession = idxInWeek;

        const idxSlot = findHeaderIndex(qHeaders, ['slot', '문항', '번호']);
        const idxType = findHeaderIndex(qHeaders, ['type', '유형']);
        const idxArea = findHeaderIndex(qHeaders, ['area', '영역']);
        const idxPassage = findHeaderIndex(qHeaders, ['passage', '지문', 'group']);

        if (idxWeek > -1 && idxSession > -1 && idxSlot > -1) {
            for (let i = 1; i < qRows.length; i++) {
                const row = qRows[i];
                const w = parseInt(row[idxWeek]);
                const s = row[idxSession];
                const q = row[idxSlot];

                const key = `${w}-${s}-${q}`;

                const qType = idxType > -1 ? String(row[idxType]) : 'Unknown';
                const qArea = idxArea > -1 ? String(row[idxArea]) : 'Unknown';
                const pGroup = idxPassage > -1 ? String(row[idxPassage]) : '';
                const finalPassageType = textMeta[pGroup] || pGroup || 'Unknown';

                // Metadata Store
                qMeta[key] = {
                    type: qType,
                    area: qArea,
                    passage: finalPassageType,
                    raw_passage_group: pGroup
                };

                // Aggregation Logic (Calculate Denominators)
                if (!isNaN(w) && w >= fromWeek && w <= toWeek) {
                    totalQuestions++;

                    if (qType) totalByType[qType] = (totalByType[qType] || 0) + 1;
                    if (qArea) totalByArea[qArea] = (totalByArea[qArea] || 0) + 1;
                    if (pGroup) totalByPassage[pGroup] = (totalByPassage[pGroup] || 0) + 1; // Use raw group for passage accuracy

                    const wKey = `${w}주차`;
                    totalByWeek[wKey] = (totalByWeek[wKey] || 0) + 1;
                }
            }
        }
    }

    // 4. Iterate Answer Log (Wrong Counts)
    let wrongCount = 0;
    const wrongByType = {};
    const wrongByArea = {};
    const wrongByPassage = {};
    const wrongByWeek = {};
    const wrongList = [];

    for (let i = 1; i < answerData.length; i++) {
        const row = answerData[i];
        const rStu = row[2];
        const rWeek = parseInt(row[3]);
        const rSession = row[4];
        const rSlot = row[5];
        const isWrong = (row[6] === true || row[6] === 'true' || row[6] === 'TRUE');

        if (String(rStu) === String(studentId) && rWeek >= fromWeek && rWeek <= toWeek) {
            if (isWrong) {
                wrongCount++;

                const key = `${rWeek}-${rSession}-${rSlot}`;
                const meta = qMeta[key] || { type: 'Unknown', area: 'Unknown', raw_passage_group: 'Unknown', passage: 'Unknown' };

                const t = meta.type || 'Unknown';
                wrongByType[t] = (wrongByType[t] || 0) + 1;

                const a = meta.area || 'Unknown';
                wrongByArea[a] = (wrongByArea[a] || 0) + 1;

                const p = meta.raw_passage_group || 'Unknown'; // Use raw group here
                wrongByPassage[p] = (wrongByPassage[p] || 0) + 1;

                const wKey = `${rWeek}주차`;
                wrongByWeek[wKey] = (wrongByWeek[wKey] || 0) + 1;

                wrongList.push({
                    week: rWeek,
                    session: rSession,
                    slot: rSlot,
                    area: meta.area,
                    type: meta.type,
                    passage: meta.passage,
                    date: row[1] // Date column
                });
            }
        }
    }

    // 5. Calculate Accuracy
    const calcAccuracy = (total, wrong) => {
        if (!total || total === 0) return 0;
        return parseFloat(((1 - (wrong || 0) / total) * 100).toFixed(1));
    };

    // Helper to build list
    const buildList = (totals, wrongs, keyName) => {
        return Object.keys(totals).map(k => {
            const tot = totals[k];
            const wr = wrongs[k] || 0;
            return {
                [keyName]: k,
                total: tot,
                wrong: wr,
                accuracy: calcAccuracy(tot, wr)
            };
        }).sort((a, b) => b.accuracy - a.accuracy); // Sort by accuracy descending (best first) or ascending (weakest first)?
        // Usually for charts we want consistent order, but let's sort by counts or name. 
        // Let's sort by 'wrong count' descending to show weaknesses first in some contexts, 
        // BUT user asked for "Weakest 2". So let's sort by ACCURACT ASCENDING (lowest first).
    };

    const byType = buildList(totalByType, wrongByType, 'q_type').sort((a, b) => a.accuracy - b.accuracy);
    const byArea = buildList(totalByArea, wrongByArea, 'area');
    const byPassage = buildList(totalByPassage, wrongByPassage, 'passage_group');
    const byWeek = buildList(totalByWeek, wrongByWeek, 'week').sort((a, b) => parseInt(a.week.replace('주차', '')) - parseInt(b.week.replace('주차', '')));

    // Special: Reading vs Vocab (Area)
    const overallReading = byArea.find(x => x.area === '독해' || x.area === 'Reading') || { accuracy: 0 };
    const overallVocab = byArea.find(x => x.area === '어휘' || x.area === 'Vocabulary') || { accuracy: 0 };

    const summary = {
        student_id: studentId,
        total_questions: totalQuestions,
        total_wrong: wrongCount,
        overall: {
            accuracy: calcAccuracy(totalQuestions, wrongCount),
            reading_accuracy: overallReading.accuracy,
            vocab_accuracy: overallVocab.accuracy
        },
        by_q_type: byType, // Sorted by lowest accuracy first
        by_area: byArea,
        by_passage_group: byPassage,
        by_week: byWeek,
        wrong_list: wrongList
    };

    return output.setContent(JSON.stringify(summary));
}

function getWrongList(params, output) {
    // ... (unchanged helper reused if needed, but summary covers it)
    const sheet = getSheet('ANSWER_LOG');
    const data = sheet.getDataRange().getValues();
    const studentId = params.student_id;
    const week = params.week;
    const session = params.session;

    let wrongList = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[2] == studentId && row[3] == week && row[4] == session && (row[6] === true || row[6] === 'true')) {
            wrongList.push(row[5]);
        }
    }
    return output.setContent(JSON.stringify({ wrong_list: wrongList }));
}

function getAnalysisData(params, output) {
    // ... (simple legacy stub)
    return output.setContent(JSON.stringify({ note: "Use action=summary for full analysis" }));
}

function getStudentList(output) {
    const sheet = getSheet('STUDENT_DB');
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return output.setContent(JSON.stringify({ students: [] }));
    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const students = data.map(r => ({ name: r[0], id: r[1] })).filter(s => s.name && s.id);
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
        sheet.appendRow([logId, dateStr, studentId, week, session, slot, true, '', '', '', area]);
    });
    return output.setContent(JSON.stringify({ success: true, count: wrongSlots.length }));
}

function getSheet(name) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        if (name === 'ANSWER_LOG') sheet.appendRow(['log_id', 'date', 'student_id', 'week', 'session', 'q_slot', 'is_wrong', 'answer_value', 'question_id', 'passage_group', 'area', 'q_type']);
        if (name === 'QUESTION_DB') sheet.appendRow(['Week', 'Session', 'Q_Slot', 'Type', 'Area', 'PassageGroup', 'inweek']);
        if (name === 'STUDENT_DB') sheet.appendRow(['Name', 'ID']);
    }
    return sheet;
}
