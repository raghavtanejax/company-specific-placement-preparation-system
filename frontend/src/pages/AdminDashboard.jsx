import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, FileCode2, MessagesSquare, Activity, Trash2, Edit, Shield, Check } from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [questionsList, setQuestionsList] = useState([]);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    try {
      setLoading(true);
      if (tab === 'overview' && !stats) {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } else if (tab === 'users') {
        const { data } = await api.get('/admin/users');
        setUsersList(data);
      } else if (tab === 'companies') {
        const { data } = await api.get('/admin/companies');
        setCompaniesList(data);
      } else if (tab === 'questions') {
        const { data } = await api.get('/admin/questions');
        setQuestionsList(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load ${tab} data`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsersList(usersList.filter(u => u._id !== id));
      if (stats) setStats({ ...stats, stats: { ...stats.stats, users: stats.stats.users - 1 }});
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/role`, { role: newRole });
      setUsersList(usersList.map(u => u._id === id ? data : u));
    } catch (err) {
      alert('Error updating user role');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      await api.delete(`/admin/companies/${id}`);
      setCompaniesList(companiesList.filter(c => c._id !== id));
      if (stats) setStats({ ...stats, stats: { ...stats.stats, companies: stats.stats.companies - 1 }});
    } catch (err) {
      alert('Error deleting company');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestionsList(questionsList.filter(q => q._id !== id));
      if (stats) setStats({ ...stats, stats: { ...stats.stats, questions: stats.stats.questions - 1 }});
    } catch (err) {
      alert('Error deleting question');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity size={18} /> },
    { id: 'users', label: 'Manage Users', icon: <Users size={18} /> },
    { id: 'companies', label: 'Manage Companies', icon: <Briefcase size={18} /> },
    { id: 'questions', label: 'Manage Questions', icon: <FileCode2 size={18} /> },
  ];

  if (error) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 sm:p-6"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Shield className="text-primary-500" />
            Admin Control Panel
          </h1>
          <p className="text-gray-400 mt-1">Fully control and manage the PrepAI platform.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-2 mb-8 pb-2 border-b border-dark-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-dark-800 text-primary-400 border-t border-l border-r border-dark-700' 
                : 'text-gray-400 hover:text-white hover:bg-dark-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && stats && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Users" value={stats.stats.users} icon={<Users className="w-8 h-8 text-blue-500" />} />
                    <StatCard title="Companies" value={stats.stats.companies} icon={<Briefcase className="w-8 h-8 text-purple-500" />} />
                    <StatCard title="Questions" value={stats.stats.questions} icon={<FileCode2 className="w-8 h-8 text-pink-500" />} />
                    <StatCard title="Experiences" value={stats.stats.experiences} icon={<MessagesSquare className="w-8 h-8 text-green-500" />} />
                  </div>

                  <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 overflow-hidden">
                    <h2 className="text-xl font-bold text-white mb-4">Recent Joins</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-dark-700 text-gray-400">
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentUsers.map((user) => (
                            <tr key={user._id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                              <td className="p-3 text-white">{user.name}</td>
                              <td className="p-3 text-gray-300">{user.email}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-3 text-gray-400">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 overflow-hidden">
                  <h2 className="text-xl font-bold text-white mb-4">Manage All Users</h2>
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="sticky top-0 bg-dark-800 z-10">
                        <tr className="border-b border-dark-700 text-gray-400">
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">XP</th>
                          <th className="p-3">Role</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((user) => (
                          <tr key={user._id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                            <td className="p-3 text-white font-medium">{user.name}</td>
                            <td className="p-3 text-gray-300">{user.email}</td>
                            <td className="p-3 text-yellow-500">{user.performance?.xp || 0}</td>
                            <td className="p-3">
                              <select 
                                value={user.role} 
                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                className="bg-dark-700 border border-dark-600 text-sm rounded px-2 py-1 outline-none text-white focus:border-primary-500"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDeleteUser(user._id)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COMPANIES TAB */}
              {activeTab === 'companies' && (
                <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 overflow-hidden">
                  <h2 className="text-xl font-bold text-white mb-4">Manage Companies</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {companiesList.map(company => (
                      <div key={company._id} className="bg-dark-700/50 border border-dark-600 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain rounded bg-white p-1" />
                          <div>
                            <h3 className="text-white font-semibold">{company.name}</h3>
                            <p className="text-xs text-gray-400">{company.difficulty} • {company.hiringPattern?.rounds?.length || 0} Rounds</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCompany(company._id)} className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-400/10">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTIONS TAB */}
              {activeTab === 'questions' && (
                <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 overflow-hidden">
                  <h2 className="text-xl font-bold text-white mb-4">Manage Questions</h2>
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="sticky top-0 bg-dark-800 z-10">
                        <tr className="border-b border-dark-700 text-gray-400">
                          <th className="p-3 w-1/2">Title</th>
                          <th className="p-3">Difficulty</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questionsList.map((question) => (
                          <tr key={question._id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                            <td className="p-3 text-white font-medium">{question.title}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                question.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                question.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {question.difficulty}
                              </span>
                            </td>
                            <td className="p-3 text-gray-300 uppercase text-sm">{question.type}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDeleteQuestion(question._id)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 flex items-center justify-between shadow-lg">
    <div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white">{value}</h3>
    </div>
    <div className="bg-dark-700/50 p-3 rounded-lg border border-dark-600">
      {icon}
    </div>
  </div>
);

export default AdminDashboard;
