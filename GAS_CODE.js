function doGet(e) {
    const params = e.parameter;
    const action = params.action;

    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'wrong_list') {
        return getWrongList(params, output);
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
    const sheet = getSheet('WrongAnswers');
    const data = sheet.getDataRange().getValues();

    const studentId = params.student_id;
    const week = params.week;
    const session = params.session;

    let wrongList = [];

    // Basic filtering
    // Columns: Timestamp, StudentID, Week, Session, WrongSlots (Comma separated)
    // Wait, previous design was row per slot. Let's switch to row per submission for simpler "Exam Sheet" feeling?
    // User asked for "Student ID and Wrong details".
    // Let's stick to appending ONE row per submission with all wrong answers in one cell, 
    // OR multiple rows.
    // Multiple rows is better for data analysis. One row per submission is better for human readability if just checking status.
    // Let's do: Add multiple rows (one per wrong slot) to maintain granularity, BUT handle it in one batch request.

    // Actually, to make 'getWrongList' work with the new batch save, we need to read properly.
    // If we save as multiple rows, reading is same as before.

    // Let's stick to: One Row per Slot. But batch insert.

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1] == studentId && row[2] == week && row[3] == session) {
            // If we are just appending, we might duplicate.
            // But for now, let's just return what we find.
            // Ideally we should clear previous entries for this student/week/session before saving?
            // No, "history" is safer.
            if (row[5] === true || row[5] === 'true') {
                wrongList.push(row[4]);
            }
        }
    }

    return output.setContent(JSON.stringify({ wrong_list: wrongList }));
}

function saveWrongList(data, output) {
    const sheet = getSheet('WrongAnswers');

    const timestamp = new Date();
    const studentId = data.student_id;
    const week = data.week;
    const session = data.session;
    const wrongSlots = data.wrong_list || []; // Array of strings ['R1', 'V2']

    // Optional: Clear previous entries for this exact session to avoid duplicates?
    // Implementing "Delete old" is hard without unique IDs.
    // Let's just append. The "latest" can be considered current.

    // We will append multiple rows
    wrongSlots.forEach(slot => {
        sheet.appendRow([
            timestamp,
            studentId,
            week,
            session,
            slot,
            true // is_wrong
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
    }
    return sheet;
}
