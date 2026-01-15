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

function normalizeBookId(id) {
    return String(id || '').toLowerCase().replace(/\s+/g, '');
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
            const rowBook = String(row[idxBook]);
            if (rowBook && normalizeBookId(rowBook) !== normalizeBookId(targetBook)) bookMatch = false;
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

    // Deduplicate questions
    questions = questions.filter(function (item, pos) {
        return questions.indexOf(item) == pos;
    });

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
    const idxLogWeek = findHeaderIndex(answerHeaders, ['week', '주차']);
    const idxLogSession = findHeaderIndex(answerHeaders, ['session', '회차', '세션']);
    const idxLogStudent = findHeaderIndex(answerHeaders, ['student_id', 'student']); // Removed generic 'id' to avoid matching 'log_id'
    const idxLogSlot = findHeaderIndex(answerHeaders, ['slot', 'q_slot', '문항', '번호']); // Should be 5 usually
    const idxLogWrong = findHeaderIndex(answerHeaders, ['is_wrong', 'wrong', '오답', '틀림']); // Should be 6 usually

    // 2. Load TEXT_DB (Passage Metadata)
    let textMeta = {};
    let textMetaBySession = {}; // Map by Book|Week|Session
    let textMetaFallback = {};  // Map by Week|Session (Ignore Book)

    const textSheet = getSheet('TEXT_DB');
    if (textSheet.getLastRow() > 1) {
        const tRows = textSheet.getDataRange().getValues();
        const tHeaders = tRows[0];
        const idxGroup = findHeaderIndex(tHeaders, ['passage_group', 'group', '지문그룹', '지문']);
        const idxType = findHeaderIndex(tHeaders, ['text_type', 'type', '텍스트유형', '유형', '갈래']);
        const idxTBook = findHeaderIndex(tHeaders, ['book_id', 'bookid', 'book', '교재', '책', '교재_id']);
        const idxTWeek = findHeaderIndex(tHeaders, ['week', '주차']);
        const idxTSession = findHeaderIndex(tHeaders, ['session', '회차', '세션']);

        if (idxType > -1) {
            const normalizeKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
            for (let i = 1; i < tRows.length; i++) {
                const grp = idxGroup > -1 ? String(tRows[i][idxGroup]).trim() : '';
                const typ = String(tRows[i][idxType]).trim();
                const bk = idxTBook > -1 ? String(tRows[i][idxTBook]) : '';

                // Optimization: Skip TEXT_DB rows for other books
                if (targetBook && bk && normalizeBookId(bk) !== normalizeBookId(targetBook)) continue;

                const wk = idxTWeek > -1 ? parseInt(String(tRows[i][idxTWeek]).replace(/[^0-9]/g, '')) : null;
                const sess = idxTSession > -1 ? parseInt(String(tRows[i][idxTSession]).replace(/[^0-9]/g, '')) : null;

                // 2-1. Existing Group-based Mapping
                if (grp) {
                    const normGroup = normalizeKey(grp);
                    const normBook = normalizeKey(bk);
                    if (bk) textMeta[`${normBook}|${normGroup}`] = typ;
                    if (!textMeta[normGroup]) textMeta[normGroup] = typ;
                    if (!textMeta[grp]) textMeta[grp] = typ;
                }

                // 2-2. New Week/Session-based Mapping
                if (bk && wk && sess) {
                    const sessKey = `${normalizeKey(bk)}|${wk}|${sess}`;
                    textMetaBySession[sessKey] = typ;

                    // Fallback Map: Store Candidates
                    const fbKey = `${wk}|${sess}`;
                    if (!textMetaFallback[fbKey]) {
                        textMetaFallback[fbKey] = [];
                    }
                    // Avoid duplicates in candidate list
                    const existingCand = textMetaFallback[fbKey].find(c => c.book === bk);
                    if (!existingCand) {
                        textMetaFallback[fbKey].push({ book: bk, type: typ });
                    }
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

    // CRITICAL: Literature vs Non-Literature comparison (Reading Only)
    const totalByTextCategory = { Lit: 0, NonLit: 0 };
    const classifyTextType = (t) => {
        if (!t || t === '-' || t === 'Unknown') return null;
        const s = String(t).replace(/\s+/g, '');
        // Literature Keywords
        const litKeys = ['소설', '시', '극', '수필', '문학', 'Literature', 'Poem', 'Novel', 'Essay', 'Drama'];
        // Non-Literature Keywords
        const nonLitKeys = ['인문', '사회', '과학', '기술', '예술', '독서', '비문학', '칼럼', '설명문', '논설문', 'Non-Literature', 'Reading', 'Art', 'Science', 'Humanities'];

        for (let k of litKeys) if (s.includes(k)) return 'Lit';
        for (let k of nonLitKeys) if (s.includes(k)) return 'NonLit';
        return 'NonLit'; // Default to NonLit if specific genre but not strictly Lit? Or 'Unknown'? safely Unknown if unsure. 
        // Actually user said "Text Genre missing -> Exclude". So let's be strict.
        return null;
    };

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

                // Parser Fallback
                const qIdMatch = String(row[0]).match(/W(\d+)-S(\d+)-([A-Z0-9]+)/);
                if (qIdMatch) {
                    if (!w) w = parseInt(qIdMatch[1]);
                    if (!s) s = parseInt(qIdMatch[2]);
                }

                let q = String(row[idxSlot]).trim();
                if (!q && qIdMatch && qIdMatch[3]) q = qIdMatch[3];

                if (!w || !s || !q) continue;
                if (targetBook && validBook && normalizeBookId(validBook) !== normalizeBookId(targetBook)) continue;

                // Optimization: Skip heavy processing for weeks outside the requested range
                if (w < fromWeek || w > toWeek) continue;

                const key = `${w}-${s}-${q}`;

                // Type/Area Mapping
                let qArea = 'Unknown';
                if (q.startsWith('R') || q.startsWith('독')) qArea = 'Reading';
                else if (q.startsWith('V') || q.startsWith('어')) qArea = 'Vocabulary';
                else if (idxArea > -1) { /* fallback */ }

                const qType = idxType > -1 ? String(row[idxType]).trim() : 'Unknown';
                const normalizeKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
                const pGroup = idxPassage > -1 ? String(row[idxPassage]).trim() : '';
                let finalPassageType = '-';

                if (pGroup) {
                    const normGroup = normalizeKey(pGroup);
                    const normBook = normalizeKey(validBook);
                    if (validBook && textMeta[`${normBook}|${normGroup}`]) {
                        finalPassageType = textMeta[`${normBook}|${normGroup}`];
                    } else if (textMeta[normGroup]) {
                        finalPassageType = textMeta[normGroup];
                    } else if (textMeta[pGroup]) {
                        finalPassageType = textMeta[pGroup];
                    }
                }

                // Fallback: If no passage group match, try Week/Session match
                if ((!finalPassageType || finalPassageType === '-') && w && s) {
                    const normBook = validBook ? normalizeKey(validBook) : '';

                    const tryMatch = (week, session) => {
                        // 1. Exact Book Match
                        if (normBook) {
                            const k = `${normBook}|${week}|${session}`;
                            if (textMetaBySession[k]) return textMetaBySession[k];
                        }

                        // 2. Fuzzy / Candidate Match
                        const fbKey = `${week}|${session}`;
                        const candidates = textMetaFallback[fbKey];

                        if (candidates && candidates.length > 0) {
                            if (candidates.length === 1) return candidates[0].type;

                            if (validBook) {
                                const targetTokens = validBook.toLowerCase().split(/[^a-z0-9]+/);
                                let bestScore = -1;
                                let bestType = null;

                                candidates.forEach(cand => {
                                    const candBook = cand.book.toLowerCase();
                                    const candTokens = candBook.split(/[^a-z0-9]+/);

                                    let score = 0;
                                    candTokens.forEach(ct => {
                                        if (targetTokens.includes(ct)) score += 1;
                                    });
                                    if (candBook.includes(validBook.toLowerCase()) ||
                                        validBook.toLowerCase().includes(candBook)) {
                                        score += 3;
                                    }

                                    if (score > bestScore) {
                                        bestScore = score;
                                        bestType = cand.type;
                                    }
                                });

                                if (bestType) return bestType;
                            }
                            return candidates[0].type;
                        }
                        return null;
                    };

                    // Try exact session match
                    let found = tryMatch(w, s);
                    if (found) finalPassageType = found;

                    // Try relative session match (if s > 5, map to 1-5)
                    else if (s > 5) {
                        const relativeS = s - (w - 1) * 5;
                        found = tryMatch(w, relativeS);
                        if (found) finalPassageType = found;
                    }
                    // Try global session match (if s <= 5, map to Global)
                    else if (s <= 5) {
                        const globalS = (w - 1) * 5 + s;
                        found = tryMatch(w, globalS);
                        if (found) finalPassageType = found;
                    }
                }

                const metaObj = {
                    type: qType,
                    area: qArea,
                    passage: finalPassageType,
                    raw_passage_group: pGroup
                };

                // Store with Raw/Local Session Key
                qMeta[key] = metaObj;

                // Fix for Week 2+ Data: Bridge Global Session (DB) to Relative Session (Log)
                if (s > 5) {
                    const relativeS = s - (w - 1) * 5;
                    if (relativeS >= 1 && relativeS <= 5) {
                        const relativeKey = `${w}-${relativeS}-${q}`;
                        if (!qMeta[relativeKey]) qMeta[relativeKey] = metaObj;
                    }
                }
                // Store with Calculated Global Session Key
                if (s <= 5 && w >= 1) {
                    const globalS = (w - 1) * 5 + s;
                    if (globalS !== s) qMeta[`${w}-${globalS}-${q}`] = metaObj;
                }

                // Aggregation
                if (!isNaN(w) && w >= fromWeek && w <= toWeek) {
                    totalQuestions++;
                    if (qType) totalByType[qType] = (totalByType[qType] || 0) + 1;
                    if (qArea) totalByArea[qArea] = (totalByArea[qArea] || 0) + 1;
                    if (pGroup) totalByPassage[pGroup] = (totalByPassage[pGroup] || 0) + 1;
                    const wKey = `${w}주차`;
                    totalByWeek[wKey] = (totalByWeek[wKey] || 0) + 1;

                    // Lit/NonLit Aggregation (Reading Only)
                    if (qArea === 'Reading') {
                        const cat = classifyTextType(finalPassageType);
                        if (cat) totalByTextCategory[cat] = (totalByTextCategory[cat] || 0) + 1;
                    }
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
    const wrongByTextCategory = { Lit: 0, NonLit: 0 }; // Lit/NonLit
    const wrongList = [];

    // Debug Stats
    const debug = {
        matched_rows: 0,
        skipped_by_book: 0,
        skipped_by_student: 0,
        skipped_by_week: 0,
        unmatched_data: []
    };

    if (idxLogStudent > -1 && idxLogWeek > -1 && idxLogSession > -1 && idxLogWrong > -1) {
        for (let i = 1; i < answerData.length; i++) {
            const row = answerData[i];
            const rStu = String(row[idxLogStudent]).trim();
            const rWeek = parseInt(String(row[idxLogWeek]).replace(/[^0-9]/g, ''));
            const rSession = String(row[idxLogSession]).replace(/[^0-9]/g, '');
            const rSlot = idxLogSlot > -1 ? String(row[idxLogSlot]).trim() : String(row[5]).trim(); // Fallback to 5
            const isWrong = (row[idxLogWrong] === true || row[idxLogWrong] === 'true' || row[idxLogWrong] === 'TRUE');

            // Book Filter Debugging
            if (targetBook && idxLogBook > -1) {
                const b = String(row[idxLogBook]);
                // Compare with loose matching
                if (b && normalizeBookId(b) !== normalizeBookId(targetBook)) {
                    debug.skipped_by_book++;
                    continue;
                }
            }

            // Robust Student ID Match
            const normalize = (s) => String(s).toLowerCase().replace(/ /g, '');

            if (normalize(rStu) !== normalize(studentId)) {
                if (normalize(rStu).includes(normalize(studentId))) {
                    // near match?
                }
                debug.skipped_by_student++;
                continue;
            }

            if (rWeek < fromWeek || rWeek > toWeek) {
                debug.skipped_by_week++;
                continue;
            }

            // If we reached here, it's a match!
            debug.matched_rows++;

            if (isWrong) {
                wrongCount++;

                const key = `${rWeek}-${rSession}-${rSlot}`;
                const meta = qMeta[key] || { type: 'Unknown', area: 'Unknown', raw_passage_group: 'Unknown', passage: 'Unknown' };

                if (meta.type === 'Unknown') {
                    debug.unmatched_data.push(key); // Log missing keys
                }

                const t = meta.type || 'Unknown';
                wrongByType[t] = (wrongByType[t] || 0) + 1;

                const a = meta.area || 'Unknown';
                wrongByArea[a] = (wrongByArea[a] || 0) + 1;

                const p = meta.raw_passage_group || 'Unknown';
                wrongByPassage[p] = (wrongByPassage[p] || 0) + 1;

                const wKey = `${rWeek}주차`;
                wrongByWeek[wKey] = (wrongByWeek[wKey] || 0) + 1;

                // Lit/NonLit Aggregation (Reading Only)
                if (meta.area === 'Reading') {
                    const cat = classifyTextType(meta.passage);
                    if (cat) wrongByTextCategory[cat] = (wrongByTextCategory[cat] || 0) + 1;
                }

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

    // Comparison Stats
    const litStats = {
        total: totalByTextCategory.Lit,
        wrong: wrongByTextCategory.Lit,
        accuracy: calcAccuracy(totalByTextCategory.Lit, wrongByTextCategory.Lit)
    };
    const nonLitStats = {
        total: totalByTextCategory.NonLit,
        wrong: wrongByTextCategory.NonLit,
        accuracy: calcAccuracy(totalByTextCategory.NonLit, wrongByTextCategory.NonLit)
    };

    // DEBUG: Capture one row's detailed check if it's the target student
    let debugSample = null;
    let debugStats = { totalRows: answerData.length, matchStudent: 0, matchBook: 0, matchWeek: 0, isWrong: 0, finalCount: wrongCount };

    // Re-run simple check for debug (or integrate into loop - easier to add separate debug block for safety or just return computed stats)
    // Actually, let's just return key indices found.

    // 6. Get Student Name (New Logic)
    const normalize = (s) => String(s).toLowerCase().replace(/ /g, '');
    let studentName = studentId; // Default fallback
    const studentSheet = getSheet('STUDENT_DB');
    if (studentSheet.getLastRow() > 1) {
        const sData = studentSheet.getDataRange().getValues();
        // Assuming Col A = Name, Col B = ID based on getStudentList
        // But getStudentList says: r[0] name, r[1] id.
        for (let i = 1; i < sData.length; i++) {
            const rName = String(sData[i][0]).trim();
            const rId = String(sData[i][1]).trim();
            if (normalize(rId) === normalize(studentId)) {
                studentName = rName;
                break;
            }
        }
    }

    const summary = {
        student_id: studentId,
        student_name: studentName, // Added field
        total_questions: totalQuestions,
        total_wrong: wrongCount,
        overall: {
            accuracy: calcAccuracy(totalQuestions, wrongCount),
            reading_accuracy: overallReading.accuracy,
            vocab_accuracy: overallVocab.accuracy
        },
        comparison: {
            literature: litStats,
            non_literature: nonLitStats
        },
        by_q_type: byType,
        by_area: byArea,
        by_passage_group: byPassage,
        by_week: byWeek,
        wrong_list: wrongList,
        debug: {
            req_book: targetBook,
            indices: {
                book: idxLogBook,
                student: idxLogStudent,
                week: idxLogWeek,
                isWrong: idxLogWrong, // Use actual index
                session: idxLogSession,
                slot: idxLogSlot
            },
            headers: answerData[0], // Assuming answerData[0] holds headers
            first_row_sample: answerData.length > 1 ? answerData[1] : [],
            internal_debug_stats: debug // The existing debug object
        }
    };

    return output.setContent(JSON.stringify(summary));
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

        const normalize = (s) => String(s).toLowerCase().replace(/ /g, '');
        let match = (normalize(row[2]) == normalize(studentId) && row[3] == week && row[4] == session);

        if (match && book && idxBook > -1) {
            match = (normalizeBookId(row[idxBook]) === normalizeBookId(book));
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
    const bookMap = {}; // id -> name

    // 1. Read from BOOK_DB (Master Data)
    const bSheet = getSheet('BOOK_DB');
    if (bSheet.getLastRow() > 1) {
        const data = bSheet.getDataRange().getValues();
        const headers = data[0];
        // User requested '교재_id' and '교재명' specifically, but we keep flexible matching
        const idxId = findHeaderIndex(headers, ['book_id', 'bookid', 'book', '교재', '책', '교재_id']);
        const idxName = findHeaderIndex(headers, ['book_name', 'name', '교재명', '이름']);

        if (idxId > -1) {
            for (let i = 1; i < data.length; i++) {
                const id = String(data[i][idxId]).trim();
                if (id) {
                    // Use found name, or fallback to ID if name column missing/empty
                    const name = (idxName > -1 && data[i][idxName]) ? String(data[i][idxName]).trim() : id;
                    bookMap[id] = name;
                }
            }
        }
    }

    // 2. Scan QUESTION_DB & ANSWER_LOG for any legacy/other IDs not in BOOK_DB
    // (This ensures we don't break if BOOK_DB is incomplete but data exists)
    const usedIds = new Set();

    // QUESTION_DB
    const qSheet = getSheet('QUESTION_DB');
    if (qSheet.getLastRow() > 1) {
        const data = qSheet.getDataRange().getValues();
        const idxBook = findHeaderIndex(data[0], ['book_id', 'bookid', 'book', '교재', '책', '교재_id']);
        if (idxBook > -1) {
            for (let i = 1; i < data.length; i++) {
                const val = String(data[i][idxBook]).trim();
                if (val) usedIds.add(val);
            }
        }
    }

    // ANSWER_LOG
    const aSheet = getSheet('ANSWER_LOG');
    if (aSheet.getLastRow() > 1) {
        const data = aSheet.getDataRange().getValues();
        const idxBook = findHeaderIndex(data[0], ['book_id', 'bookid', 'book', '교재', '책', '교재_id']);
        if (idxBook > -1) {
            for (let i = 1; i < data.length; i++) {
                const val = String(data[i][idxBook]).trim();
                if (val) usedIds.add(val);
            }
        }
    }

    // Merge: Add used IDs to map if missing
    usedIds.forEach(id => {
        if (!bookMap[id]) {
            bookMap[id] = id; // Fallback name is ID
        }
    });

    // 3. Transform to List
    // If map empty (no DB, no data), fallback default
    if (Object.keys(bookMap).length === 0) {
        bookMap["TOV-R1"] = "TOV-R1";
    }

    const books = Object.keys(bookMap).sort().map(id => ({
        id: id,
        name: bookMap[id]
    }));

    return output.setContent(JSON.stringify({ books: books }));
}
