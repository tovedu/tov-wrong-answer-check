function doGet(e) {
    const params = e.parameter;
    const action = params.action;

    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'ping') {
        return output.setContent(JSON.stringify({ ok: true, action: 'ping', version: 'v2026-01-13-final-fix' }));
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

    if (action === 'get_book_list') {
        return getBookList(output);
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

// --- Global Helpers ---

function findHeaderIndex(headers, keywords) {
    for (let i = 0; i < headers.length; i++) {
        const h = String(headers[i]).toLowerCase().replace(/_/g, '').replace(/ /g, '');
        for (let k of keywords) {
            if (h.includes(k)) return i;
        }
    }
    return -1;
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

// --- Main Functions ---

function getSessionBlueprint(params, output) {
    const targetWeek = parseInt(params.week);
    const targetSession = parseInt(params.session); // Can be integer or string depending on usage, but usually int
    const targetBook = params.book;

    if (!targetWeek || !targetSession) return output.setContent(JSON.stringify({ error: 'Missing params' }));

    const sheet = getSheet('QUESTION_DB');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Use global helper
    const idxWeek = findHeaderIndex(headers, ['week', '주차']);
    let idxSession = findHeaderIndex(headers, ['session', '회차', '세션']);
    const idxInWeek = findHeaderIndex(headers, ['inweek', '주차내회차', 'relative']);
    const idxSlot = findHeaderIndex(headers, ['slot', '문항', '번호', 'q_number']);
    const idxBook = findHeaderIndex(headers, ['book_id', 'bookid', 'book', '교재', '책']);

    if (idxWeek < 0 || idxSession < 0 || idxSlot < 0) {
        return output.setContent(JSON.stringify({ error: 'Invalid headers' }));
    }

    let questions = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const w = parseInt(String(row[idxWeek]).replace(/[^0-9]/g, ''));
        const s = parseInt(String(row[idxSession]).replace(/[^0-9]/g, '')); // Robust parsing

        // Check Book Match (if provided and column exists)
        let bookMatch = true;
        if (targetBook && idxBook > -1) {
            const rowBook = String(row[idxBook]).trim();
            if (rowBook && rowBook !== targetBook) bookMatch = false;
        }

        // Logic: Match if Week matches AND (Session matches OR InWeek matches)
        let sessionMatch = false;

        // Match logic from newer version
        if (w === targetWeek) {
            if (s === targetSession) sessionMatch = true; // Strict cumulative match
            else if (idxInWeek > -1 && targetSession <= 5) { // Fallback relative (1-5) match
                const inW = parseInt(row[idxInWeek]);
                if (inW === targetSession) sessionMatch = true;
            }
        }

        if (bookMatch && sessionMatch) {
            questions.push(row[idxSlot]);
        }
    }

    // Sort result
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
    const targetBook = params.book;

    if (!studentId || isNaN(fromWeek) || isNaN(toWeek)) {
        return output.setContent(JSON.stringify({ error: 'Missing parameters' }));
    }

    // 1. Load Data
    const answerSheet = getSheet('ANSWER_LOG');
    const answerData = answerSheet.getDataRange().getValues();
    const answerHeaders = answerData[0];
    const idxLogBook = findHeaderIndex(answerHeaders, ['book_id', 'bookid', 'book', '교재', '책', '교재_id']);
    const idxLogWeek = 3;
    const idxLogSession = 4;
    const idxLogStudent = 2;

    // 2. Load TEXT_DB (Passage Metadata)
    let textMeta = {};
    const textSheet = getSheet('TEXT_DB');
    if (textSheet.getLastRow() > 1) {
        const tRows = textSheet.getDataRange().getValues();
        const tHeaders = tRows[0];
        const idxGroup = findHeaderIndex(tHeaders, ['passage_group', 'group', '지문그룹', '지문']);
        const idxType = findHeaderIndex(tHeaders, ['text_type', 'type', '텍스트유형', '유형', '갈래']);
        const idxTBook = findHeaderIndex(tHeaders, ['book_id', 'bookid', 'book', '교재', '책', '교재_id']);

        if (idxGroup > -1 && idxType > -1) {
            for (let i = 1; i < tRows.length; i++) {
                const grp = String(tRows[i][idxGroup]).trim();
                const typ = String(tRows[i][idxType]).trim();
                const bk = idxTBook > -1 ? String(tRows[i][idxTBook]).trim() : '';

                if (grp) {
                    if (bk) {
                        textMeta[`${bk}|${grp}`] = typ;
                    }
                    if (!textMeta[grp]) textMeta[grp] = typ;
                }
            }
        }
    }

    // 3. Load QUESTION_DB (Totals & Metadata)
    const qDbSheet = getSheet('QUESTION_DB');
    let qMeta = {};

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
        const idxSlot = findHeaderIndex(qHeaders, ['slot', '문항', '번호']);
        const idxType = findHeaderIndex(qHeaders, ['type', '유형']);
        const idxArea = findHeaderIndex(qHeaders, ['area', '영역']);
        const idxPassage = findHeaderIndex(qHeaders, ['passage', '지문', 'group']);
        const idxBook = findHeaderIndex(qHeaders, ['book_id', 'bookid', 'book', '교재', '책', '교재_id']);

        if (idxWeek > -1 && idxSession > -1 && idxSlot > -1) {
            // Fill-down Cache
            let lastWeek = null;
            let lastSession = null;
            let lastBook = '';

            for (let i = 1; i < qRows.length; i++) {
                const row = qRows[i];

                // 1. Raw Values
                let rawW = row[idxWeek];
                let rawS = row[idxSession];
                let rawBook = idxBook > -1 ? String(row[idxBook]).trim() : '';

                // 2. Fill-Down Logic
                let w;
                if (rawW !== '' && rawW !== null) {
                    w = parseInt(String(rawW).replace(/[^0-9]/g, ''));
                    if (!isNaN(w)) lastWeek = w;
                } else {
                    w = lastWeek;
                }

                let s;
                if (rawS !== '' && rawS !== null) {
                    s = String(rawS).replace(/[^0-9]/g, ''); // Robust: "1회" -> "1"
                    if (s) lastSession = s;
                } else {
                    s = lastSession;
                }

                let validBook = rawBook;
                if (rawBook) {
                    lastBook = rawBook;
                } else {
                    validBook = lastBook;
                }

                const q = String(row[idxSlot]).trim();

                if (!w || !s || !q) continue;

                if (targetBook && validBook && validBook !== targetBook) continue;

                const key = `${w}-${s}-${q}`;

                // Type/Area Mapping
                let qArea = 'Unknown';
                if (q.startsWith('R') || q.startsWith('독')) qArea = 'Reading';
                else if (q.startsWith('V') || q.startsWith('어')) qArea = 'Vocabulary';
                else if (idxArea > -1) {
                    // Fallback if needed, but R/V is robust
                }

                // Type comes from Area column
                const qType = idxArea > -1 ? String(row[idxArea]).trim() : 'Unknown';

                const pGroup = idxPassage > -1 ? String(row[idxPassage]).trim() : '';
                let finalPassageType = 'Unknown';
                if (pGroup) {
                    if (validBook && textMeta[`${validBook}|${pGroup}`]) {
                        finalPassageType = textMeta[`${validBook}|${pGroup}`];
                    } else if (textMeta[pGroup]) {
                        finalPassageType = textMeta[pGroup];
                    } else {
                        finalPassageType = pGroup;
                    }
                }

                qMeta[key] = {
                    type: qType,
                    area: qArea,
                    passage: finalPassageType,
                    raw_passage_group: pGroup
                };

                // Aggregation
                if (!isNaN(w) && w >= fromWeek && w <= toWeek) {
                    totalQuestions++;

                    if (qType) totalByType[qType] = (totalByType[qType] || 0) + 1;
                    if (qArea) totalByArea[qArea] = (totalByArea[qArea] || 0) + 1;
                    if (pGroup) totalByPassage[pGroup] = (totalByPassage[pGroup] || 0) + 1;

                    const wKey = `${w}주차`;
                    totalByWeek[wKey] = (totalByWeek[wKey] || 0) + 1;
                }
            }
        }
    }

    // 4. Iterate Answer Log
    let wrongCount = 0;
    const wrongByType = {};
    const wrongByArea = {};
    const wrongByPassage = {};
    const wrongByWeek = {};
    const wrongList = [];

    for (let i = 1; i < answerData.length; i++) {
        const row = answerData[i];
        const rStu = String(row[idxLogStudent]).trim();
        const rWeek = parseInt(String(row[idxLogWeek]).replace(/[^0-9]/g, ''));
        const rSession = String(row[idxLogSession]).replace(/[^0-9]/g, ''); // Robust match
        const rSlot = String(row[5]).trim();
        const isWrong = (row[6] === true || row[6] === 'true' || row[6] === 'TRUE');

        if (targetBook && idxLogBook > -1) {
            const b = String(row[idxLogBook]).trim();
            if (b && b !== targetBook) continue;
        }

        if (String(rStu) === String(studentId) && rWeek >= fromWeek && rWeek <= toWeek) {
            if (isWrong) {
                wrongCount++;

                const key = `${rWeek}-${rSession}-${rSlot}`;
                const meta = qMeta[key] || { type: 'Unknown', area: 'Unknown', raw_passage_group: 'Unknown', passage: 'Unknown' };

                const t = meta.type || 'Unknown';
                wrongByType[t] = (wrongByType[t] || 0) + 1;

                const a = meta.area || 'Unknown';
                wrongByArea[a] = (wrongByArea[a] || 0) + 1;

                const p = meta.raw_passage_group || 'Unknown';
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
                    date: row[1]
                });
            }
        }
    }

    // 5. Accuracy & Build Lists
    const calcAccuracy = (total, wrong) => {
        if (!total || total === 0) return 0;
        return parseFloat(((1 - (wrong || 0) / total) * 100).toFixed(1));
    };

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
        }).sort((a, b) => b.accuracy - a.accuracy);
    };

    const byType = buildList(totalByType, wrongByType, 'q_type').sort((a, b) => a.accuracy - b.accuracy);
    const byArea = buildList(totalByArea, wrongByArea, 'area');
    const byPassage = buildList(totalByPassage, wrongByPassage, 'passage_group');
    const byWeek = buildList(totalByWeek, wrongByWeek, 'week').sort((a, b) => parseInt(a.week.replace('주차', '')) - parseInt(b.week.replace('주차', '')));

    const overallReading = byArea.find(x => x.area === '독해' || x.area === 'Reading') || { accuracy: 0 };
    const overallVocab = byArea.find(x => x.area === '어휘' || x.area === 'Vocabulary') || { accuracy: 0 };

    return output.setContent(JSON.stringify({
        student_id: studentId,
        total_questions: totalQuestions,
        total_wrong: wrongCount,
        overall: {
            accuracy: calcAccuracy(totalQuestions, wrongCount),
            reading_accuracy: overallReading.accuracy,
            vocab_accuracy: overallVocab.accuracy
        },
        by_q_type: byType,
        by_area: byArea,
        by_passage_group: byPassage,
        by_week: byWeek,
        wrong_list: wrongList
    }));
}

function getWrongList(params, output) {
    const sheet = getSheet('ANSWER_LOG');
    const data = sheet.getDataRange().getValues();
    const studentId = params.student_id;
    const week = params.week;
    const session = params.session;
    const book = params.book;

    const headers = data[0];
    const idxBook = findHeaderIndex(headers, ['book_id', 'bookid', 'book', '교재', '책']);

    let wrongList = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let match = (row[2] == studentId && row[3] == week && row[4] == session);

        if (match && book && idxBook > -1) {
            match = (row[idxBook] === book);
        }

        if (match && (row[6] === true || row[6] === 'true')) {
            wrongList.push(row[5]);
        }
    }
    return output.setContent(JSON.stringify({ wrong_list: wrongList }));
}

function saveWrongList(data, output) {
    const studentId = data.student_id;
    const week = data.week;
    const session = data.session;
    const wrongSlots = data.wrong_list || [];
    const book = data.book || '';

    if (!studentId || !week || !session) {
        return output.setContent(JSON.stringify({ error: 'Missing required parameters' }));
    }

    const sheet = getSheet('ANSWER_LOG');
    const headers = sheet.getDataRange().getValues()[0];
    let idxBook = findHeaderIndex(headers, ['book_id', 'bookid', 'book', '교재', '책']);

    const timestamp = new Date();
    const dateStr = Utilities.formatDate(timestamp, "Asia/Seoul", "yyyy-MM-dd");

    wrongSlots.forEach(slot => {
        const logId = 'LOG_' + timestamp.getTime() + '_' + Math.floor(Math.random() * 1000);
        let area = '';
        if (slot.startsWith('R')) area = 'Reading';
        if (slot.startsWith('V')) area = 'Vocabulary';

        let rowData = new Array(headers.length).fill('');

        const setCol = (keys, val) => {
            const idx = findHeaderIndex(headers, keys);
            if (idx > -1) rowData[idx] = val;
        };

        setCol(['log_id', 'id'], logId);
        setCol(['date', '일자'], dateStr);
        setCol(['student', '학생'], studentId);
        setCol(['week', '주차'], week);
        setCol(['session', '회차'], session);
        setCol(['slot', '문항'], slot);
        setCol(['wrong', '오답'], true);
        setCol(['area', '영역'], area);
        setCol(['book', '교재'], book);

        sheet.appendRow(rowData);
    });
    return output.setContent(JSON.stringify({ success: true, count: wrongSlots.length }));
}

function getAnalysisData(params, output) {
    return output.setContent(JSON.stringify({ note: "Use action=summary for full analysis" }));
}

function getStudentList(output) {
    const sheet = getSheet('STUDENT_DB');
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return output.setContent(JSON.stringify({ students: [] }));
    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const students = data.map(r => ({ name: String(r[0]).trim(), id: String(r[1]).trim() })).filter(s => s.name && s.id);
    return output.setContent(JSON.stringify({ students: students }));
}

function getBookList(output) {
    const sheet = getSheet('QUESTION_DB');
    if (sheet.getLastRow() <= 1) {
        return output.setContent(JSON.stringify({ books: ["TOV-R1"] }));
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idxBook = findHeaderIndex(headers, ['book_id', 'bookid', 'book', '교재', '책']);

    if (idxBook === -1) {
        return output.setContent(JSON.stringify({ books: ["TOV-R1", "TOV-R2", "TOV-R3"] }));
    }

    const bookSet = new Set();
    for (let i = 1; i < data.length; i++) {
        const val = String(data[i][idxBook]).trim();
        if (val) bookSet.add(val);
    }

    const books = Array.from(bookSet).sort();
    if (books.length === 0) books.push("TOV-R1");

    return output.setContent(JSON.stringify({ books: books }));
}
