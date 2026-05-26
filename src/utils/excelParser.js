import * as XLSX from 'xlsx';

/**
 * Parses an Excel file (.xlsx, .xls) or CSV file and returns the data from the first sheet.
 * @param {File} file - The file object from a file input.
 * @returns {Promise<Array>} - Resolves to an array of row objects.
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array of objects
        // raw: false ensures cells formatted as dates/numbers are parsed as strings/floats appropriately
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length === 0) {
          resolve([]);
          return;
        }

        // Determine if the header has nested CSWC headings or is standard
        let headerRowIndex = 0;
        
        // Check if first row is a header title block (like "CSWC - Council of Samastha...")
        // If so, look at row 1 for the actual column headers
        const firstRowStr = String(json[0][0] || '').toUpperCase();
        if (firstRowStr.includes('COUNCIL') || firstRowStr.includes('SAMASTHA') || firstRowStr.includes('SAY') || firstRowStr.includes('ADMIN')) {
          if (json.length > 1) {
            headerRowIndex = 1;
          }
        }

        const headers = json[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = json.slice(headerRowIndex + 1);

        const parsedData = dataRows
          .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map(row => {
            const rowObj = {};
            headers.forEach((header, idx) => {
              if (header) {
                rowObj[header] = row[idx] !== undefined && row[idx] !== null ? row[idx] : '';
              }
            });
            // Add index-based fallback keys
            row.forEach((val, idx) => {
              rowObj[`__col_${idx}`] = val !== undefined && val !== null ? val : '';
            });
            return rowObj;
          });

        resolve(parsedData);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses previous SAY students file which contains multiple columns for subjects.
 * Columns: Name, UID, Contact Number, College, Zone, and multiple columns for subjects.
 * Returns a standardized list of student-subject registrations.
 * @param {File} file 
 */
export const parsePreviousSayExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (json.length === 0) {
          resolve([]);
          return;
        }

        // Find header row
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(json.length, 5); i++) {
          const rowKeys = json[i].map(x => String(x || '').toUpperCase());
          if (rowKeys.some(k => k.includes('UID') || k.includes('NAME') || k.includes('COLLEGE') || k.includes('CONTACT'))) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = json[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = json.slice(headerRowIndex + 1);

        const students = [];
        dataRows.forEach(row => {
          if (!row.some(cell => cell !== null && cell !== undefined && cell !== '')) return;

          const rowObj = {};
          headers.forEach((header, idx) => {
            if (header) {
              rowObj[header] = row[idx] !== undefined && row[idx] !== null ? row[idx] : '';
            }
          });

          // Identify standard fields
          const nameKey = Object.keys(rowObj).find(k => k.toUpperCase().includes('NAME') && !k.toUpperCase().includes('COLLEGE'));
          const uidKey = Object.keys(rowObj).find(k => k.toUpperCase().includes('UID') || k.toUpperCase().includes('REG'));
          const contactKey = Object.keys(rowObj).find(k => k.toUpperCase().includes('CONTACT') || k.toUpperCase().includes('PHONE') || k.toUpperCase().includes('MOBILE'));
          const collegeKey = Object.keys(rowObj).find(k => k.toUpperCase().includes('COLLEGE') || k.toUpperCase().includes('INSTITUT'));
          const zoneKey = Object.keys(rowObj).find(k => k.toUpperCase().includes('ZONE'));

          const name = nameKey ? rowObj[nameKey] : '';
          const uid = uidKey ? rowObj[uidKey] : '';
          const contact = contactKey ? rowObj[contactKey] : '';
          const college = collegeKey ? rowObj[collegeKey] : '';
          const zone = zoneKey ? rowObj[zoneKey] : '';

          if (!name && !uid) return;

          // Remaining columns might be subjects
          const subjects = [];
          headers.forEach((header, idx) => {
            if (
              header !== nameKey &&
              header !== uidKey &&
              header !== contactKey &&
              header !== collegeKey &&
              header !== zoneKey &&
              !header.toUpperCase().includes('#') &&
              !header.toUpperCase().includes('SL') &&
              !header.toUpperCase().includes('DISTRICT') &&
              !header.toUpperCase().includes('SEMESTER') &&
              !header.toUpperCase().includes('CLASS') &&
              row[idx] !== undefined &&
              row[idx] !== null &&
              String(row[idx]).trim() !== ''
            ) {
              // If the header itself is a subject or says "SUBJECT", or the cell has a subject name
              const val = String(row[idx]).trim();
              if (header.toUpperCase().includes('SUBJECT')) {
                const subList = val.split(/[\n,،]/).map(s => s.trim()).filter(Boolean);
                subjects.push(...subList);
              } else {
                // If header is a subject name and cell is ticked/marked (e.g. "YES", "1", or the subject name)
                if (val.toUpperCase() === 'YES' || val === '1' || val.toUpperCase() === 'TRUE' || val === '✓') {
                  subjects.push(header);
                } else if (val.length > 2 && !['NO', 'FALSE', '0'].includes(val.toUpperCase())) {
                  subjects.push(val);
                }
              }
            }
          });

          students.push({
            uid: String(uid).trim(),
            name: String(name).trim(),
            contact: String(contact).trim(),
            college: String(college).trim(),
            zone: String(zone).trim(),
            subjects: [...new Set(subjects)] // Unique subjects
          });
        });

        resolve(students);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
};
