import User from '../models/User.js';
import Company from '../models/Company.js';
import Question from '../models/Question.js';
import InterviewExperience from '../models/InterviewExperience.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalExperiences = await InterviewExperience.countDocuments();

    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        users: totalUsers,
        companies: totalCompanies,
        questions: totalQuestions,
        experiences: totalExperiences
      },
      recentUsers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

export const getAllCompaniesAdmin = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching companies' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting company' });
  }
};

export const getAllQuestionsAdmin = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching questions' });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting question' });
  }
};
