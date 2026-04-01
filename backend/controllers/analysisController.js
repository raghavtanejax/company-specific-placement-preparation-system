// Simple keyword-based extraction algorithm
const SKILLS_DICTIONARY = [
  'java', 'python', 'javascript', 'c++', 'c#', 'ruby', 'go', 'rust',
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
  'mongodb', 'mysql', 'postgresql', 'sql', 'nosql', 'redis',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes',
  'dsa', 'data structures', 'algorithms', 'system design', 'machine learning', 'ai'
];

export const analyzeJobDescription = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    const text = jobDescription.toLowerCase();
    
    // Extract skills
    const extractedSkills = SKILLS_DICTIONARY.filter(skill => text.includes(skill));

    // Recommend topics based on extracted skills
    res.json({
      success: true,
      extractedSkills,
      message: 'Job description analyzed successfully.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
