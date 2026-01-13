const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'TOV 국어 .xlsx');
console.log(`Reading file: ${filePath}`);

const workbook = XLSX.readFile(filePath);
console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    // console.log('Range:', sheet['!ref']);

    // Convert to JSON to see headers and first few rows
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: true, defval: '' });

    if (data.length > 0) {
        console.log('Headers:', data[0]);
        console.log('First 5 rows:');
        for (let i = 1; i < Math.min(data.length, 6); i++) {
            console.log(data[i]);
        }

        // Check for "Week" or "주차" column details
        const headers = data[0].map(h => String(h).toLowerCase());
        const weekIdx = headers.findIndex(h => h.includes('week') || h.includes('주차'));

        if (weekIdx !== -1) {
            console.log(`\nWeek column found at index ${weekIdx}`);
            const distinctWeeks = new Set();
            for (let i = 1; i < data.length; i++) {
                const val = data[i][weekIdx];
                if (val !== undefined && val !== null && val !== '') {
                    distinctWeeks.add(val);
                }

                // Detailed check for Week 2
                if (val == 2 || val == '2') {
                    // Log the first 3 rows of Week 2
                    if (!distinctWeeks.has('logged_week_2')) {
                        console.log(`\n--- WEEK 2 DATA SAMPLE (${sheetName}) ---`);
                        console.log('Headers:', headers);
                        console.log('Row:', data[i]);
                        if (data[i + 1]) console.log('Row:', data[i + 1]);
                        if (data[i + 2]) console.log('Row:', data[i + 2]);
                        distinctWeeks.add('logged_week_2');
                    }
                }
            }
            console.log('Distinct Weeks found:', Array.from(distinctWeeks).filter(x => x !== 'logged_week_2'));
        } else {
            console.log('\nNO "Week" or "주차" column found!');
        }
    } else {
        console.log('Empty sheet');
    }
});
