// Course search and AI extraction utilities

/**
 * Search for golf course information using web search
 * @param {string} courseName - Name of the golf course
 * @returns {Promise<Object>} Course information
 */
export const searchCourseInfo = async (courseName) => {
  try {
    // This would use a web search API or scraping service
    // For now, we'll return a structure that can be filled manually
    // In production, you'd integrate with Google Custom Search API or similar

    const searchQuery = `${courseName} golf course scorecard par stroke index`;

    // Placeholder for actual API call
    console.log(`Searching for: ${searchQuery}`);

    // Return format that the AI extraction expects
    return {
      query: searchQuery,
      courseName: courseName,
      needsManualInput: true,
      message: 'Course search requires API integration. Please enter details manually or provide a course URL.'
    };
  } catch (error) {
    console.error('Error searching course:', error);
    throw error;
  }
};

/**
 * Extract course information from a URL using AI
 * @param {string} url - URL containing course information
 * @returns {Promise<Object>} Extracted course data
 */
export const extractCourseFromUrl = async (url) => {
  try {
    // This would use the WebFetch tool or a scraping service with AI extraction
    // For MVP, we'll simulate the structure

    console.log(`Extracting course data from: ${url}`);

    // In production, this would:
    // 1. Fetch the webpage content
    // 2. Use AI to extract structured data (holes, pars, stroke indexes)
    // 3. Return formatted course data

    return {
      success: false,
      message: 'URL extraction requires backend integration',
      url: url
    };
  } catch (error) {
    console.error('Error extracting course from URL:', error);
    throw error;
  }
};

/**
 * Parse course data from text input (scorecard copy-paste)
 * Uses pattern matching to extract hole data
 * @param {string} text - Pasted scorecard text
 * @returns {Object} Parsed course data
 */
export const parseScorecardText = (text) => {
  const holes = [];
  // const lines = text.split('\n'); // Reserved for future line-by-line parsing

  // Try to find patterns like:
  // Hole 1: Par 4, SI 7
  // 1  4  7
  // Or table formats

  const holePattern = /(?:hole\s*)?(\d+)[:\s,]*(?:par\s*)?(\d+)[:\s,]*(?:si|stroke\s*index|s\.?i\.?)[:\s,]*(\d+)/gi;

  let match;
  while ((match = holePattern.exec(text)) !== null) {
    const [, holeNum, par, strokeIndex] = match;
    holes.push({
      number: parseInt(holeNum),
      par: parseInt(par),
      strokeIndex: parseInt(strokeIndex)
    });
  }

  // If no matches, try simpler format (just numbers in sequence)
  if (holes.length === 0) {
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length >= 54) { // 18 holes × 3 values minimum
      // Assume format: hole numbers, then pars, then stroke indexes
      for (let i = 0; i < 18; i++) {
        holes.push({
          number: i + 1,
          par: parseInt(numbers[18 + i]) || 4,
          strokeIndex: parseInt(numbers[36 + i]) || i + 1
        });
      }
    }
  }

  return {
    holes: holes.length === 18 ? holes : null,
    found: holes.length,
    success: holes.length === 18
  };
};

/**
 * Popular golf course templates
 */
export const COURSE_TEMPLATES = {
  'championship': {
    name: 'Championship Course',
    holes: [
      { number: 1, par: 4, strokeIndex: 7 },
      { number: 2, par: 4, strokeIndex: 3 },
      { number: 3, par: 3, strokeIndex: 17 },
      { number: 4, par: 5, strokeIndex: 1 },
      { number: 5, par: 4, strokeIndex: 13 },
      { number: 6, par: 4, strokeIndex: 9 },
      { number: 7, par: 3, strokeIndex: 15 },
      { number: 8, par: 4, strokeIndex: 5 },
      { number: 9, par: 5, strokeIndex: 11 },
      { number: 10, par: 4, strokeIndex: 10 },
      { number: 11, par: 3, strokeIndex: 18 },
      { number: 12, par: 4, strokeIndex: 6 },
      { number: 13, par: 5, strokeIndex: 2 },
      { number: 14, par: 4, strokeIndex: 14 },
      { number: 15, par: 4, strokeIndex: 8 },
      { number: 16, par: 3, strokeIndex: 16 },
      { number: 17, par: 5, strokeIndex: 4 },
      { number: 18, par: 4, strokeIndex: 12 }
    ]
  },
  'executive': {
    name: 'Executive Course (Par 60)',
    holes: [
      { number: 1, par: 3, strokeIndex: 9 },
      { number: 2, par: 3, strokeIndex: 5 },
      { number: 3, par: 3, strokeIndex: 15 },
      { number: 4, par: 4, strokeIndex: 1 },
      { number: 5, par: 3, strokeIndex: 13 },
      { number: 6, par: 4, strokeIndex: 7 },
      { number: 7, par: 3, strokeIndex: 17 },
      { number: 8, par: 3, strokeIndex: 11 },
      { number: 9, par: 4, strokeIndex: 3 },
      { number: 10, par: 3, strokeIndex: 10 },
      { number: 11, par: 3, strokeIndex: 18 },
      { number: 12, par: 4, strokeIndex: 6 },
      { number: 13, par: 3, strokeIndex: 14 },
      { number: 14, par: 4, strokeIndex: 2 },
      { number: 15, par: 3, strokeIndex: 16 },
      { number: 16, par: 3, strokeIndex: 12 },
      { number: 17, par: 4, strokeIndex: 4 },
      { number: 18, par: 3, strokeIndex: 8 }
    ]
  },
  'links': {
    name: 'Links Course',
    holes: [
      { number: 1, par: 4, strokeIndex: 11 },
      { number: 2, par: 4, strokeIndex: 5 },
      { number: 3, par: 4, strokeIndex: 15 },
      { number: 4, par: 3, strokeIndex: 17 },
      { number: 5, par: 5, strokeIndex: 3 },
      { number: 6, par: 4, strokeIndex: 7 },
      { number: 7, par: 4, strokeIndex: 13 },
      { number: 8, par: 3, strokeIndex: 9 },
      { number: 9, par: 4, strokeIndex: 1 },
      { number: 10, par: 5, strokeIndex: 6 },
      { number: 11, par: 4, strokeIndex: 14 },
      { number: 12, par: 4, strokeIndex: 10 },
      { number: 13, par: 4, strokeIndex: 18 },
      { number: 14, par: 5, strokeIndex: 2 },
      { number: 15, par: 4, strokeIndex: 12 },
      { number: 16, par: 3, strokeIndex: 16 },
      { number: 17, par: 4, strokeIndex: 4 },
      { number: 18, par: 4, strokeIndex: 8 }
    ]
  }
};
