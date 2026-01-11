function doGet(e) {
    const params = e.parameter;
    const action = params.action;

    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'wrong_list') {
        return getWrongList(params, output);
    }

    if (action === 'get_student_list') {
        return getStudentList(output);
    }

    if (action === 'get_analysis_data') {
        return getAnalysisData(params, output);
    }

    if (action === 'video_generation_log') {
        // Placeholder for future use or keeping existing structure if any
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

function getWrongList(params, output) {
    const sheet = getSheet('ANSWER_LOG'); // Updated to read from new log
    const data = sheet.getDataRange().getValues();

    const studentId = params.student_id;
    const week = params.week;
    const session = params.session;

    let wrongList = [];

    // Skip header
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Schema: 0: log, 1: date, 2: stu_id, 3: week, 4: session, 5: q_slot, 6: is_wrong
        if (row[2] == studentId && row[3] == week && row[4] == session) {
            // Check is_wrong (Col index 6)
            if (row[6] === true || row[6] === 'true' || row[6] === 'TRUE') {
                wrongList.push(row[5]); // q_slot
            }
        }
    }

    return output.setContent(JSON.stringify({ wrong_list: wrongList }));
}

function getAnalysisData(params, output) {
    // Schema based on user input:
    // 0: log_id, 1: date, 2: student_id, 3: week, 4: session, 5: q_slot
    // 6: is_wrong, 7: answer_value, 8: question_id, 9: passage_group, 10: area, 11: q_type, 12: inweek, 13: score

    const sheet = getSheet('ANSWER_LOG');
    const data = sheet.getDataRange().getValues();

    const week = params.week;
    const session = params.session;
    const studentId = params.student_id; // Optional filter

    // Skip header
    const stats = {};
    const studentsFound = new Set();

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rWeek = row[3];
        const rSession = row[4];
        const rStudentId = row[2];
        const rIsWrong = (row[6] === true || row[6] === 'true' || row[6] === 'TRUE');
        const qSlot = row[5];

        // Filter by Week/Session
        if (rWeek == week && rSession == session) {
            // Optional Student Filter
            if (studentId && rStudentId != studentId) continue;

            if (rIsWrong && qSlot) {
                if (!stats[qSlot]) {
                    stats[qSlot] = {
                        slot: qSlot,
                        count: 0,
                        area: row[10] || '',
                        type: row[11] || ''
                    };
                }
                stats[qSlot].count++;
            }
        }
    }

    // Convert to array and sort
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

    // Read A2:B
    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

    const students = data.map(row => ({
        name: row[0],
        id: row[1]
    })).filter(s => s.name && s.id); // Filter empty rows

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
        // Schema:
        // 0: log_id, 1: date, 2: student_id, 3: week, 4: session, 5: q_slot
        // 6: is_wrong, 7: answer_value, 8: question_id, 9: passage_group, 10: area, 11: q_type, 12: inweek, 13: score

        const logId = 'LOG_' + timestamp.getTime() + '_' + Math.floor(Math.random() * 1000);

        // Simple inference for metadata based on slot name (e.g., R1 -> Reading, V1 -> Vocab)
        let area = '';
        if (slot.startsWith('R')) area = 'Reading';
        if (slot.startsWith('V')) area = 'Vocabulary';

        sheet.appendRow([
            logId,          // log_id
            dateStr,        // date
            studentId,      // student_id
            week,           // week
            session,        // session
            slot,           // q_slot
            true,           // is_wrong
            '',             // answer_value (unknown)
            '',             // question_id
            '',             // passage_group
            area,           // area
            '',             // q_type
            '',             // inweek
            ''              // score
        ]);
    });

    return output.setContent(JSON.stringify({ success: true, count: wrongSlots.length }));
}

function getSheet(name) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        if (name === 'WrongAnswers') {
            sheet.appendRow(['Timestamp', 'StudentID', 'Week', 'Session', 'Q_Slot', 'IsWrong']);
        }
        if (name === 'STUDENT_DB') {
            sheet.appendRow(['Name', 'ID']);
        }
        if (name === 'ANSWER_LOG') {
            sheet.appendRow(['log_id', 'date', 'student_id', 'week', 'session', 'q_slot', 'is_wrong', 'answer_value', 'question_id', 'passage_group', 'area', 'q_type', 'inweek', 'score']);
        }
    }
    return sheet;
}

