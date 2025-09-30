export const BITS_BRANCHES: Record<string, Record<string, string[]>> = {
  'Pilani': {
    'B.E.': [
      'Chemical Engineering',
      'Civil Engineering',
      'Computer Science',
      'Electrical & Electronics Engineering',
      'Electronics & Communication Engineering',
      'Electronics & Instrumentation Engineering',
      'Mechanical Engineering',
      'Manufacturing Engineering',
    ],
    'M.Sc.': [
      'Biological Sciences',
      'Chemistry',
      'Economics',
      'Mathematics',
      'Physics',
    ],
  },
  'Goa': {
    'B.E.': [
      'Chemical Engineering',
      'Computer Science',
      'Electrical & Electronics Engineering',
      'Electronics & Communication Engineering',
      'Electronics & Instrumentation Engineering',
      'Mechanical Engineering',
      'Mathematics and Computing', // Unique to Goa/Hyd
    ],
    'M.Sc.': [
      'Biological Sciences',
      'Chemistry',
      'Economics',
      'Mathematics',
      'Physics',
    ],
  },
  'Hyderabad': {
    'B.E.': [
      'Chemical Engineering',
      'Civil Engineering',
      'Computer Science',
      'Electrical & Electronics Engineering',
      'Electronics & Communication Engineering',
      'Electronics & Instrumentation Engineering',
      'Mechanical Engineering',
      'Mathematics and Computing', // Unique to Goa/Hyd
    ],
    'M.Sc.': [
      'Biological Sciences',
      'Chemistry',
      'Economics',
      'Mathematics',
      'Physics',
    ],
  },
  'Dubai': {
    'B.E.': [
        'Biotechnology',
        'Chemical Engineering',
        'Civil Engineering',
        'Computer Science',
        'Electrical & Electronics Engineering',
        'Electronics & Communication Engineering',
        'Mechanical Engineering',
    ],
    'M.Sc.': [], // Dubai campus doesn't typically offer the M.Sc. dual degree path
  },
};

// Helper function to check if a branch is an M.Sc. degree for a given campus
export const isMscBranch = (branch: string, campus: string): boolean => {
    if (!campus || !branch || !BITS_BRANCHES[campus]) return false;
    return BITS_BRANCHES[campus]['M.Sc.'].includes(branch);
};