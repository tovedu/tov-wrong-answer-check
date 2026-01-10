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

    // Skip header
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Col 1: StudentID (index 1), Col 2: Week (index 2), Col 3: Session (index 3)
        // Col 4: Q_Slot (index 4), Col 5: IsWrong (index 5)
        if (row[1] == studentId && row[2] == week && row[3] == session) {
            if (row[5] === true || row[5] === 'true') {
                wrongList.push(row[4]);
            }
        }
    }

    return output.setContent(JSON.stringify({ wrong_list: wrongList }));
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
    const sheet = getSheet('WrongAnswers');

    const timestamp = new Date();
    const studentId = data.student_id;
    const week = data.week;
    const session = data.session;
    const wrongSlots = data.wrong_list || [];

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
        if (name === 'STUDENT_DB') {
            sheet.appendRow(['Name', 'ID']);
        }
    }
    return sheet;
}

