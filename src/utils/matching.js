/**
 * Cleans a school name string by converting to uppercase, replacing punctuation with spaces,
 * collapsing multiple spaces to a single space, and trimming.
 */
export const cleanSchoolName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.toUpperCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Finds a matching institution from the master list using fuzzy matching.
 * Returns the matched institution object, or null if no match is found.
 */
export const findMatchedInstitution = (schoolName, institutionsList) => {
  if (!schoolName || !institutionsList || institutionsList.length === 0) return null;
  
  const nameClean = cleanSchoolName(schoolName);
  if (!nameClean) return null;

  // 1. Exact match of cleaned name
  let match = institutionsList.find(inst => cleanSchoolName(inst.name) === nameClean);
  if (match) return match;

  // 2. Code match (e.g. check if name starts with or equals the code)
  match = institutionsList.find(inst => {
    if (!inst.code) return false;
    const code = inst.code.toUpperCase();
    return nameClean.startsWith(code + ' ') || nameClean === code;
  });
  if (match) return match;

  // 3. Substring inclusion check (sort by length descending to match longest possible school name first)
  const sortedInsts = [...institutionsList].sort((a, b) => cleanSchoolName(b.name).length - cleanSchoolName(a.name).length);
  match = sortedInsts.find(inst => {
    const instClean = cleanSchoolName(inst.name);
    return instClean && (nameClean.includes(instClean) || instClean.includes(nameClean));
  });
  if (match) return match;

  // 4. Word-level intersection matching (excluding common filler words)
  const stopwords = new Set([
    'WOMENS', 'WOMEN', 'COLLEGE', 'FOR', 'GIRLS', 'OF', 'ISLAMIC', 
    'ARTS', 'SCIENCE', 'SHE', 'CAMPUS', 'ACADEMY', 'INSTITUTE', 
    'COLLEGES', 'AND', 'COUNCIL', 'SAMASTHA', 'SCHOOL'
  ]);
  
  const nameWords = new Set(nameClean.split(' ').filter(w => !stopwords.has(w)));
  
  if (nameWords.size > 0) {
    let bestMatch = null;
    let maxOverlap = 0;
    
    institutionsList.forEach(inst => {
      const instClean = cleanSchoolName(inst.name);
      const instWords = new Set(instClean.split(' ').filter(w => !stopwords.has(w)));
      const overlap = [...nameWords].filter(w => instWords.has(w)).length;
      
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestMatch = inst;
      }
    });
    
    // If they share at least 2 meaningful words, consider it a match
    if (maxOverlap >= 2) {
      return bestMatch;
    }
  }

  return null;
};

/**
 * Generates a unique uppercase school code based on its name.
 */
export const generateSchoolCode = (schoolName, existingInstitutions) => {
  if (!schoolName) return 'COL';
  
  const cleanName = schoolName.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const words = cleanName.split(/\s+/).filter(Boolean);
  let baseCode = '';
  
  if (words.length > 1) {
    baseCode = words.map(w => w[0]).join('');
  } else if (words.length === 1) {
    baseCode = words[0].slice(0, 4);
  }
  
  if (!baseCode || baseCode.length < 2) {
    baseCode = 'COL';
  }
  
  // Guarantee uniqueness
  let finalCode = baseCode;
  let counter = 1;
  const existingCodes = new Set(existingInstitutions.map(i => i.code.toUpperCase()));
  
  while (existingCodes.has(finalCode)) {
    finalCode = `${baseCode}${counter}`;
    counter++;
  }
  
  return finalCode;
};

/**
 * Normalizes subject names to correct common typos, double Yaa, diacritics, and spaces.
 */
export const cleanSubjectName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/[\s\u00A0]+/g, ' ') // Normalize spaces (handles NBSP)
    .replace(/[\u064B-\u0652]/g, '') // Remove diacritics (harakat like Shadda, Fatha, etc.)
    .replace(/\u064A\u064A/g, '\u064A') // Fix double-Yaa typo (e.g. تفسيير -> تفسير)
    .replace(/\u06CC/g, '\u064A') // Normalize Persian Yaa to Arabic Yaa
    .replace(/\u0649/g, '\u064A'); // Normalize Alif Maksura to Yaa where appropriate for subject names
};
