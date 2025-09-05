import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, User, Activity, TrendingUp, Clock, LogOut, Menu, X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hardcoded symptoms and diseases data for prototype
const SYMPTOMS_DATABASE = [
  // Respiratory symptoms
  'sore throat', 'runny nose', 'stuffy nose', 'cough', 'sneezing', 'chest pain', 
  'shortness of breath', 'wheezing', 'phlegm production', 'loss of smell',
  
  // General symptoms
  'fever', 'headache', 'fatigue', 'muscle aches', 'chills', 'sweating',
  'weakness', 'dizziness', 'nausea', 'vomiting',
  
  // Digestive symptoms
  'stomach pain', 'diarrhea', 'constipation', 'loss of appetite', 'bloating',
  'heartburn', 'abdominal cramps',
  
  // Skin symptoms
  'rash', 'itching', 'swelling', 'hives', 'dry skin',
  
  // Neurological symptoms
  'confusion', 'memory problems', 'difficulty concentrating', 'mood changes',
  'sleep problems', 'restlessness'
];

const DISEASE_PREDICTIONS = {
  'common cold': {
    symptoms: ['sore throat', 'runny nose', 'stuffy nose', 'sneezing', 'mild headache', 'fatigue'],
    description: 'A viral upper respiratory tract infection'
  },
  'influenza (flu)': {
    symptoms: ['fever', 'headache', 'muscle aches', 'fatigue', 'cough', 'sore throat', 'chills'],
    description: 'A viral infection that attacks the respiratory system'
  },
  'covid-19': {
    symptoms: ['fever', 'cough', 'shortness of breath', 'loss of smell', 'fatigue', 'headache', 'sore throat'],
    description: 'Coronavirus disease caused by SARS-CoV-2'
  },
  'allergic rhinitis': {
    symptoms: ['runny nose', 'sneezing', 'itching', 'stuffy nose', 'watery eyes'],
    description: 'Allergic reaction causing inflammation of the nasal passages'
  },
  'gastroenteritis': {
    symptoms: ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'fever', 'headache'],
    description: 'Inflammation of the stomach and intestines'
  },
  'migraine': {
    symptoms: ['headache', 'nausea', 'sensitivity to light', 'dizziness', 'fatigue'],
    description: 'A neurological condition causing severe headaches'
  },
  'sinusitis': {
    symptoms: ['stuffy nose', 'sore throat', 'headache', 'facial pain', 'loss of smell', 'fatigue'],
    description: 'Inflammation of the sinuses'
  },
  'bronchitis': {
    symptoms: ['cough', 'phlegm production', 'chest pain', 'fatigue', 'shortness of breath'],
    description: 'Inflammation of the bronchial tubes'
  }
};

const calculateDiseaseMatch = (userSymptoms, diseaseSymptoms) => {
  if (!userSymptoms.length || !diseaseSymptoms.length) return 0;
  
  const matches = userSymptoms.filter(symptom => 
    diseaseSymptoms.some(diseaseSymptom => 
      diseaseSymptom.toLowerCase().includes(symptom.toLowerCase()) ||
      symptom.toLowerCase().includes(diseaseSymptom.toLowerCase())
    )
  );
  
  const baseMatch = (matches.length / diseaseSymptoms.length) * 100;
  const symptomCoverage = (matches.length / userSymptoms.length) * 100;
  
  return Math.round((baseMatch + symptomCoverage) / 2);
};

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSymptomSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const userSymptoms = symptoms.toLowerCase()
      .split(/[,;.\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const results = [];
    
    Object.entries(DISEASE_PREDICTIONS).forEach(([disease, data]) => {
      const matchPercentage = calculateDiseaseMatch(userSymptoms, data.symptoms);
      
      if (matchPercentage > 0) {
        results.push({
          disease,
          percentage: Math.max(matchPercentage, 5), // Minimum 5% for any match
          description: data.description,
          matchedSymptoms: userSymptoms.filter(symptom => 
            data.symptoms.some(diseaseSymptom => 
              diseaseSymptom.toLowerCase().includes(symptom.toLowerCase()) ||
              symptom.toLowerCase().includes(diseaseSymptom.toLowerCase())
            )
          )
        });
      }
    });
    
    // Sort by percentage and limit to top 5
    results.sort((a, b) => b.percentage - a.percentage);
    const topResults = results.slice(0, 5);
    
    // Normalize percentages to add up to 100%
    const totalPercentage = topResults.reduce((sum, result) => sum + result.percentage, 0);
    if (totalPercentage > 0) {
      topResults.forEach(result => {
        result.percentage = Math.round((result.percentage / totalPercentage) * 100);
      });
    }
    
    setPredictions(topResults);
    
    // Save to recent searches
    const newSearch = {
      symptoms: symptoms.trim(),
      timestamp: new Date().toISOString(),
      results: topResults.length
    };
    
    const updated = [newSearch, ...recentSearches.slice(0, 4)];
    setRecentSearches(updated);
    localStorage.setItem('recentSymptomSearches', JSON.stringify(updated));
    
    setIsAnalyzing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigateToProfile = () => {
    navigate('/profile');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access the Dashboard</h2>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Fixed Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
                <Activity className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MediCheck AI</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={navigateToProfile}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <User size={16} />
                <span className="hidden sm:inline">{user?.firstName || user?.name}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-20 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col h-full`}>
          <div className="flex flex-col h-full">
            {/* User Profile Section - Fixed at top */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    user?.isVerified ? 
                    'bg-green-100 text-green-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Recent Searches Section */}
            <div className="flex-1 min-h-0 p-6 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Clock size={16} className="mr-2" />
                Recent Searches
              </h4>
              
              {recentSearches.length > 0 ? (
                <div className="space-y-3">
                  {recentSearches.map((search, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {search.symptoms}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {search.results} results • {new Date(search.timestamp).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => setSymptoms(search.symptoms)}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        Use again
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent searches</p>
              )}
            </div>

            {/* Fixed Footer at bottom */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={navigateToProfile}
                className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors"
              >
                <User size={16} />
                <span>View Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Symptoms Checker</h1>
                <p className="text-lg text-gray-600">
                  Describe your symptoms and get potential disease predictions
                </p>
              </div>

              {/* Input Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your symptoms
                </label>
                <textarea
                  id="symptoms"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your symptoms separated by commas. For example: sore throat, runny nose, headache, fever..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                
                {/* Common Symptoms Suggestions */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Common symptoms:</p>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS_DATABASE.slice(0, 12).map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => {
                          if (!symptoms.includes(symptom)) {
                            setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom);
                          }
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={analyzeSymptoms}
                  disabled={!symptoms.trim() || isAnalyzing}
                  className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing symptoms...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Analyze Symptoms
                    </>
                  )}
                </button>
              </div>

              {/* Results Section */}
              {predictions.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Potential Conditions
                  </h2>
                  
                  <div className="space-y-4">
                    {predictions.map((prediction, index) => (
                      <div key={prediction.disease} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 capitalize">
                              {prediction.disease}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {prediction.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {prediction.percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              Match
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${prediction.percentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Matched Symptoms */}
                        {prediction.matchedSymptoms.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Matched symptoms:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {prediction.matchedSymptoms.map((symptom, idx) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Dashboard;