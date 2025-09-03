import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Calendar,
  Users,
  Plus,
  Download,
  Upload,
  Printer,
  Search,
  Filter,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  UserPlus,
  Edit2,
  Trash2,
  Star,
  Minus
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Login Component
const LoginScreen = ({ onLogin }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (accessCode.length !== 4) {
      setError('Code muss 4-stellig sein');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/login`, {
        access_code: accessCode
      });

      if (response.data.success) {
        onLogin(response.data.role, accessCode);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Fehler beim Login. Versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnly = () => {
    onLogin('viewer', null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Urlaubsplaner</h1>
          <p className="text-gray-600">Geben Sie Ihren Admin-Code ein oder nutzen Sie den Ansichtsmodus</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4-stelliger Code
            </label>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setAccessCode(value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••" 
              maxLength="4"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={accessCode.length !== 4 || isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Anmelden...' : 'Admin-Zugang'}
          </button>

          <button
            type="button"
            onClick={handleViewOnly}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Nur Ansehen (für Spieler)
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Kontaktieren Sie Ihren Administrator für einen Zugangs-Code
        </div>
      </div>
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const stars = [1, 2, 3, 4, 5];
  
  return (
    <div className="flex space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange(star)}
          className={`w-5 h-5 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`w-full h-full ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Skill Management Component
const SkillManager = ({ skills = [], onSkillsChange }) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRating, setNewSkillRating] = useState(3);

  // Ensure skills is always an array
  const safeSkills = Array.isArray(skills) ? skills : [];

  const addSkill = () => {
    console.log('addSkill called, newSkillName:', newSkillName);
    if (newSkillName.trim()) {
      const newSkill = {
        name: newSkillName.trim(),
        rating: newSkillRating
      };
      console.log('Adding new skill:', newSkill);
      console.log('Current skills:', safeSkills);
      const updatedSkills = [...safeSkills, newSkill];
      console.log('Updated skills:', updatedSkills);
      onSkillsChange(updatedSkills);
      setNewSkillName('');
      setNewSkillRating(3);
    } else {
      console.log('Skill name is empty');
    }
  };

  const removeSkill = (index) => {
    const updatedSkills = safeSkills.filter((_, i) => i !== index);
    onSkillsChange(updatedSkills);
  };

  const updateSkillRating = (index, rating) => {
    const updatedSkills = [...safeSkills];
    updatedSkills[index].rating = rating;
    onSkillsChange(updatedSkills);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Fähigkeiten & Skills
      </label>
      
      {/* Existing Skills */}
      {safeSkills.map((skill, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">{skill.name}</span>
            <StarRating 
              rating={skill.rating} 
              onRatingChange={(rating) => updateSkillRating(index, rating)}
            />
          </div>
          <button
            type="button"
            onClick={() => removeSkill(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add New Skill */}
      <div className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
        <input
          type="text"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          placeholder="Neue Fähigkeit..."
          className="flex-1 border-none outline-none text-sm"
          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
        />
        <StarRating 
          rating={newSkillRating} 
          onRatingChange={setNewSkillRating}
        />
        <button
          type="button"
          onClick={() => {
            console.log('Plus button clicked!');
            addSkill();
          }}
          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
          title="Fähigkeit hinzufügen"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Vacation Types Configuration
const VACATION_TYPES = {
  URLAUB: { label: 'Urlaub', color: 'bg-blue-500' },
  KRANKHEIT: { label: 'Krankheit', color: 'bg-red-500' },
  SONDERURLAUB: { label: 'Sonderurlaub', color: 'bg-green-500' },
  FORTBILDUNG: { label: 'Fortbildung', color: 'bg-purple-500' }
};

// Toolbar Component (Word-style)
const Toolbar = ({ 
  onNewVacation, 
  onNewEmployee,
  onExport, 
  onImport, 
  onPrint, 
  currentView, 
  onViewChange,
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  employees,
  settings,
  userRole,
  accessCode,
  onLogout
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-3">
      {/* Main Toolbar */}
      <div className="flex items-center space-x-1 mb-2">
        {/* File Group */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3 mr-3">
          <button
            onClick={onNewVacation}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Neuer Urlaub
          </button>
          <button
            onClick={onNewEmployee}
            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Mitarbeiter
          </button>
          <button
            onClick={onExport}
            className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Exportieren"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onImport}
            className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Importieren"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={onPrint}
            className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Drucken"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* View Group */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3 mr-3">
          <button
            onClick={() => onViewChange('month')}
            className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
              currentView === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Monat
          </button>
          <button
            onClick={() => onViewChange('year')}
            className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
              currentView === 'year' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Jahr
          </button>
          <button
            onClick={() => onViewChange('team')}
            className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
              currentView === 'team' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 mr-1" />
            Team
          </button>
          <div className="text-sm text-gray-600 ml-4">
            {userRole === 'admin' ? '🔐 Admin' : 
             userRole === 'manager' ? '👔 Manager' : 
             userRole === 'employee' ? '👤 Mitarbeiter' : 
             '👁️ Ansicht'}
          </div>
          <button
            onClick={onLogout}
            className="text-red-600 hover:text-red-800 flex items-center px-2 py-2 text-sm rounded transition-colors"
          >
            Abmelden
          </button>
        </div>

        {/* Search & Filter Group */}
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Mitarbeiter suchen..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={onToggleFilters}
            className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </button>
        </div>

        {/* Settings */}
        <button className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Breadcrumb/Status Bar */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>Urlaubsplaner • {format(new Date(), 'MMMM yyyy', { locale: de })}</span>
        <span>{employees.length} Mitarbeiter • Max. {settings.max_concurrent_calculated} gleichzeitig ({settings.max_concurrent_percentage}%)</span>
      </div>
    </div>
  );
};

// Calendar Navigation
const CalendarNavigation = ({ currentDate, onPrevious, onNext, view }) => {
  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: de });
      case 'year':
        return format(currentDate, 'yyyy', { locale: de });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: de });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <button
        onClick={onPrevious}
        className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-semibold text-gray-900 capitalize">
        {getTitle()}
      </h2>
      <button
        onClick={onNext}
        className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Employee Dialog Component
const EmployeeDialog = ({ isOpen, onClose, onSave, editingEmployee = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    skills: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        name: editingEmployee.name,
        email: editingEmployee.email,
        role: editingEmployee.role,
        skills: editingEmployee.skills || []
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'employee',
        skills: []
      });
    }
    setError('');
  }, [editingEmployee, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingEmployee) {
        await axios.put(`${API}/employees/${editingEmployee.id}`, formData);
      } else {
        await axios.post(`${API}/employees`, formData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Max Mustermann"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="max.mustermann@firma.de"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rolle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Mitarbeiter</option>
              <option value="admin">Administrator</option>
              <option value="leiharbeiter">Leiharbeiter</option>
            </select>
          </div>

          <SkillManager
            skills={formData.skills}
            onSkillsChange={(skills) => setFormData({ ...formData, skills })}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Speichern...' : (editingEmployee ? 'Aktualisieren' : 'Erstellen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Vacation Entry Dialog
const VacationDialog = ({ isOpen, onClose, onSave, employees, editingEntry = null }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    vacation_type: 'URLAUB',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        employee_id: editingEntry.employee_id,
        start_date: editingEntry.start_date,
        end_date: editingEntry.end_date,
        vacation_type: editingEntry.vacation_type,
        notes: editingEntry.notes || ''
      });
    } else {
      setFormData({
        employee_id: '',
        start_date: '',
        end_date: '',
        vacation_type: 'URLAUB',
        notes: ''
      });
    }
    setError('');
  }, [editingEntry, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingEntry) {
        await axios.put(`${API}/vacation-entries/${editingEntry.id}`, formData);
      } else {
        await axios.post(`${API}/vacation-entries`, formData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {editingEntry ? 'Urlaub bearbeiten' : 'Neuer Urlaub'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mitarbeiter
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Mitarbeiter auswählen</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bis
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Art
            </label>
            <select
              value={formData.vacation_type}
              onChange={(e) => setFormData({ ...formData, vacation_type: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(VACATION_TYPES).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optionale Notizen..."
              rows="3"
            />
          </div>

          <div className="flex justify-between pt-4">
            {editingEntry && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Urlaubseintrag wirklich löschen?')) {
                    try {
                      await axios.delete(`${API}/vacation-entries/${editingEntry.id}`);
                      onSave(); // Reload data
                      onClose();
                    } catch (err) {
                      alert('Fehler beim Löschen des Urlaubseintrags');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1 inline" />
                Löschen
              </button>
            )}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Speichern...' : (editingEntry ? 'Aktualisieren' : 'Erstellen')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Month Calendar View
const MonthCalendarView = ({ currentDate, vacationEntries, employees, onDateClick, onEntryClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getVacationsForDay = (day) => {
    const dayString = format(day, 'yyyy-MM-dd');
    
    return vacationEntries.filter(entry => {
      try {
        // Handle both string and Date formats
        const startDate = typeof entry.start_date === 'string' ? entry.start_date : format(new Date(entry.start_date), 'yyyy-MM-dd');
        const endDate = typeof entry.end_date === 'string' ? entry.end_date : format(new Date(entry.end_date), 'yyyy-MM-dd');
        
        return dayString >= startDate && dayString <= endDate;
      } catch (error) {
        console.error('Error processing vacation entry:', entry, error);
        return false;
      }
    });
  };

  const getDayClasses = (day) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isCurrentDay = isToday(day);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    
    let classes = "min-h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ";
    
    if (!isCurrentMonth) classes += "bg-gray-50 text-gray-400 ";
    if (isCurrentDay) classes += "bg-blue-50 border-blue-300 ";
    if (isWeekend && isCurrentMonth) classes += "bg-gray-100 ";
    
    return classes;
  };

  return (
    <div className="bg-white">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Body */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dayVacations = getVacationsForDay(day);
          
          return (
            <div
              key={day.toISOString()}
              className={getDayClasses(day)}
              onClick={() => onDateClick(day)}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium">
                  {format(day, 'd')}
                </span>
                {dayVacations.length > 0 && (
                  <span className="text-xs bg-blue-500 text-white rounded-full px-1 min-w-4 text-center">
                    {dayVacations.length}
                  </span>
                )}
              </div>
              
              <div className="mt-1 space-y-1">
                {dayVacations.slice(0, 3).map((vacation) => {
                  const vacationType = VACATION_TYPES[vacation.vacation_type];
                  return (
                    <div
                      key={vacation.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryClick(vacation);
                      }}
                      className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${vacationType.color} text-white`}
                      title={`${vacation.employee_name} - ${vacationType.label} (${vacation.vacation_code || 'N/A'})`}
                    >
                      <div className="font-medium">{vacation.employee_name}</div>
                      <div className="text-xs opacity-90">
                        #{vacation.vacation_code || 'N/A'} • {vacationType.label}
                      </div>
                    </div>
                  );
                })}
                {dayVacations.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayVacations.length - 3} weitere
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Year Calendar View
const YearCalendarView = ({ currentDate, vacationEntries, onMonthClick }) => {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const yearMonths = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const getVacationsForMonth = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    return vacationEntries.filter(entry => {
      const entryStart = new Date(entry.start_date);
      const entryEnd = new Date(entry.end_date);
      return (entryStart <= monthEnd && entryEnd >= monthStart);
    });
  };

  const getMonthVacationStats = (month) => {
    const monthVacations = getVacationsForMonth(month);
    const uniqueEmployees = [...new Set(monthVacations.map(v => v.employee_id))];
    
    const typeStats = {
      URLAUB: monthVacations.filter(v => v.vacation_type === 'URLAUB').length,
      KRANKHEIT: monthVacations.filter(v => v.vacation_type === 'KRANKHEIT').length,
      SONDERURLAUB: monthVacations.filter(v => v.vacation_type === 'SONDERURLAUB').length
    };

    return {
      totalEntries: monthVacations.length,
      uniqueEmployees: uniqueEmployees.length,
      typeStats
    };
  };

  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {yearMonths.map((month) => {
          const stats = getMonthVacationStats(month);
          
          return (
            <div
              key={month.toISOString()}
              onClick={() => onMonthClick(month)}
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="text-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {format(month, 'MMMM', { locale: de })}
                </h3>
                <p className="text-sm text-gray-500">
                  {format(month, 'yyyy')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Urlaubseinträge:</span>
                  <span className="font-medium">{stats.totalEntries}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Betroffene Mitarbeiter:</span>
                  <span className="font-medium">{stats.uniqueEmployees}</span>
                </div>

                {stats.totalEntries > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Aufschlüsselung:</div>
                    <div className="space-y-1">
                      {stats.typeStats.URLAUB > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                            <span className="text-xs">Urlaub</span>
                          </div>
                          <span className="text-xs font-medium">{stats.typeStats.URLAUB}</span>
                        </div>
                      )}
                      {stats.typeStats.KRANKHEIT > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                            <span className="text-xs">Krankheit</span>
                          </div>
                          <span className="text-xs font-medium">{stats.typeStats.KRANKHEIT}</span>
                        </div>
                      )}
                      {stats.typeStats.SONDERURLAUB > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                            <span className="text-xs">Sonderurlaub</span>
                          </div>
                          <span className="text-xs font-medium">{stats.typeStats.SONDERURLAUB}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {stats.totalEntries === 0 && (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-400">Keine Einträge</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Skills Edit Dialog Component
const SkillsEditDialog = ({ isOpen, onClose, employee, onSave }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee && isOpen) {
      console.log('Loading skills for employee:', employee.name, 'Skills:', employee.skills);
      setSkills(employee.skills || []);
      setError('');
    }
  }, [employee, isOpen]);

  const handleSave = async () => {
    if (!employee) return;
    
    setLoading(true);
    setError('');

    try {
      const updatedEmployee = {
        name: employee.name,
        email: employee.email || "",
        role: employee.role,
        skills: skills
      };
      
      console.log('Saving skills for employee:', employee.name, 'Skills:', skills);
      const response = await axios.put(`${API}/employees/${employee.id}`, updatedEmployee);
      console.log('Skills save response:', response.data);
      onSave();
      onClose();
    } catch (err) {
      console.error('Skills save error:', err);
      setError(err.response?.data?.detail || 'Fehler beim Speichern der Skills');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Skills bearbeiten - {employee.name}
            {employee.role === 'admin' && (
              <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                👑 Admin
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-4">
              {error}
            </div>
          )}

          <SkillManager
            skills={skills}
            onSkillsChange={setSkills}
          />

          <div className="flex justify-end space-x-2 pt-4 mt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Skills speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Management View
const TeamManagementView = ({ employees, onEditEmployee, onDeleteEmployee, onDataReload, onEditSkills, sickDaysData }) => {
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [skillFilter, setSkillFilter] = useState('all');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('table');

  // Get unique skills from all employees
  const allSkills = [...new Set(
    employees.flatMap(emp => (emp.skills || []).map(skill => skill.name))
  )].sort();

  // Filter and sort employees
  const filteredEmployees = employees
    .filter(emp => {
      if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
      if (skillFilter !== 'all' && !(emp.skills || []).some(skill => skill.name === skillFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      // ALWAYS prioritize admins first, regardless of other sorting
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      
      // Then apply secondary sorting
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role':
          // If both are admins or both are non-admins, sort by role
          return a.role.localeCompare(b.role);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'skills':
          return (b.skills || []).length - (a.skills || []).length;
        default:
          return 0;
      }
    });

  const handleSelectAll = (checked) => {
    setSelectedEmployees(checked ? filteredEmployees.map(emp => emp.id) : []);
  };

  const handleSelectEmployee = (employeeId, checked) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;
    
    const confirmed = window.confirm(
      `${selectedEmployees.length} Mitarbeiter wirklich löschen? Alle Urlaubseinträge werden ebenfalls gelöscht.`
    );
    
    if (confirmed) {
      for (const employeeId of selectedEmployees) {
        try {
          await axios.delete(`${API}/employees/${employeeId}`);
        } catch (err) {
          console.error('Fehler beim Löschen:', err);
        }
      }
      setSelectedEmployees([]);
      // Trigger reload (would need to be passed from parent)
      window.location.reload();
    }
  };

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('.team-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  };



  return (
    <div className="bg-white p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team-Verwaltung</h2>
        <p className="text-gray-600">
          Verwalten Sie Ihre Mitarbeiter und deren Informationen. 
          <span className="font-medium text-green-600 ml-2">
            ✓ Unbegrenzte Mitarbeiteranzahl
          </span>
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Aktuell: {employees.length} Mitarbeiter • Gefiltert: {filteredEmployees.length} • Max. gleichzeitig im Urlaub: {Math.max(1, Math.floor(employees.length * 0.3))} (30%)
          <span className="ml-3 text-purple-600 font-medium">👑 Admins werden automatisch zuerst angezeigt</span>
        </div>
      </div>

      {/* Smart Filter Bar */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Rolle:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Rollen</option>
              <option value="admin">Administrator</option>
              <option value="employee">Mitarbeiter</option>
              <option value="leiharbeiter">Leiharbeiter</option>
            </select>
          </div>

          {/* Skill Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Skill:</label>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sortieren:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name A-Z</option>
              <option value="role">Rolle</option>
              <option value="email">E-Mail</option>
              <option value="skills">Anzahl Skills</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Ansicht:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="table">Tabelle</option>
              <option value="cards">Karten</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedEmployees.length > 0 && (
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-gray-600">
                {selectedEmployees.length} ausgewählt
              </span>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Löschen
              </button>
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {(roleFilter !== 'all' || skillFilter !== 'all' || sortBy !== 'name') && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                setRoleFilter('all');
                setSkillFilter('all');
                setSortBy('name');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Alle Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Mitarbeiter vorhanden</h3>
          <p className="text-gray-500 mb-6">Fügen Sie Ihren ersten Mitarbeiter hinzu, um zu beginnen.</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Mitarbeiter gefunden</h3>
          <p className="text-gray-500 mb-6">Passen Sie Ihre Filter an, um Mitarbeiter zu finden.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="max-h-96 overflow-y-auto team-scroll-container smooth-scroll">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
            {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                selectedEmployees.includes(employee.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {employee.role === 'admin' && '👑 '}
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </div>
                  <button
                    onClick={() => onEditSkills(employee)}
                    className="text-blue-600 hover:text-blue-800 transition-colors mr-2"
                    title="Skills bearbeiten"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onEditEmployee(employee)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteEmployee(employee)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  employee.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : employee.role === 'leiharbeiter'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {employee.role === 'admin' ? 'Administrator' : employee.role === 'leiharbeiter' ? 'Leiharbeiter' : 'Mitarbeiter'}
                </span>
              </div>

              <div className="mb-3 space-y-1">
                <p className="text-sm text-gray-600">{employee.vacation_days_total} Urlaubstage</p>
                <p className="text-sm text-red-600">{sickDaysData[employee.id] || 0} Krankheitstage</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills:</h4>
                <div className="space-y-1">
                  {(employee.skills || []).slice(0, 2).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{skill.name}</span>
                      <StarRating rating={skill.rating} readonly={true} />
                    </div>
                  ))}
                  {(employee.skills || []).length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{(employee.skills || []).length - 2} weitere Skills
                    </div>
                  )}
                  {!(employee.skills || []).length && (
                    <span className="text-xs text-gray-400">Keine Skills</span>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
          
          {/* Cards Scroll Indicator */}
          {filteredEmployees.length > 6 && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                Scrollen für mehr Mitarbeiter
                <ChevronRight className="w-3 h-3 ml-1 rotate-90" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto team-scroll-container smooth-scroll">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    E-Mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    Rolle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    Urlaubstage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    Krankheitstage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className={selectedEmployees.includes(employee.id) ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.role === 'admin' && '👑 '}
                          {employee.name}
                        </div>
                        <div className="text-xs text-gray-500">Code: {employee.employee_code || 'N/A'}</div>
                      </div>
                      <button
                        onClick={() => onEditSkills(employee)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Skills bearbeiten"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : employee.role === 'leiharbeiter'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.role === 'admin' ? 'Administrator' : employee.role === 'leiharbeiter' ? 'Leiharbeiter' : 'Mitarbeiter'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.vacation_days_total} Tage
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {sickDaysData[employee.id] || 0} Tage
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {(employee.skills && employee.skills.length > 0) ? (
                        <>
                          {employee.skills.slice(0, 3).map((skill, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">{skill.name}</span>
                              <StarRating rating={skill.rating} readonly={true} />
                            </div>
                          ))}
                          {employee.skills.length > 3 && (
                            <div className="text-xs text-gray-400">
                              +{employee.skills.length - 3} weitere
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Keine Skills</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEditEmployee(employee)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(employee)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          {/* Scroll Indicator & Controls */}
          {filteredEmployees.length > 8 && (
            <div className="bg-gray-50 px-6 py-2 border-t">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  Zeige alle {filteredEmployees.length} Mitarbeiter (scrollbar rechts)
                </span>
                <button
                  onClick={scrollToTop}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Nach oben
                  <ChevronRight className="w-3 h-3 ml-1 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [employees, setEmployees] = useState([]);
  const [vacationEntries, setVacationEntries] = useState([]);
  const [showVacationDialog, setShowVacationDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    max_concurrent_percentage: 30,
    total_employees: 0,
    max_concurrent_calculated: 1
  });
  const [skillsEditEmployee, setSkillsEditEmployee] = useState(null);
  const [showSkillsDialog, setShowSkillsDialog] = useState(false);
  const [sickDaysData, setSickDaysData] = useState({});

  const handleLogin = (role, code) => {
    console.log('Handling login - Role:', role, 'Code:', code);
    
    setUserRole(role);
    setAccessCode(code);
    setIsAuthenticated(true);
    
    // Store in localStorage for persistence
    localStorage.setItem('userRole', role);
    if (code) {
      localStorage.setItem('accessCode', code);
    }
    
    console.log('Login completed and stored in localStorage');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    setAccessCode('');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessCode');
  };

  // Check for existing login on app start
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedCode = localStorage.getItem('accessCode');
    
    console.log('Checking existing login - Role:', savedRole, 'Code:', savedCode);
    
    if (savedRole) {
      setUserRole(savedRole);
      setAccessCode(savedCode || '');
      setIsAuthenticated(true);
      console.log('Restored authentication from localStorage');
    } else {
      console.log('No existing authentication found');
    }
  }, []);

  // Load initial data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Authentication successful, loading data...');
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Starting data load from API:', API);
      
      const [employeesRes, vacationRes, settingsRes] = await Promise.all([
        axios.get(`${API}/employees`),
        axios.get(`${API}/vacation-entries`),
        axios.get(`${API}/settings`)
      ]);
      
      console.log('✅ Employees loaded:', employeesRes.data.length);
      console.log('✅ Vacation entries loaded:', vacationRes.data.length);
      console.log('✅ Settings loaded:', settingsRes.data);
      
      // Debug: Log first few vacation entries
      if (vacationRes.data.length > 0) {
        console.log('Sample vacation entries:', vacationRes.data.slice(0, 3));
      }
      
      // Set the data
      setEmployees(employeesRes.data || []);
      setVacationEntries(vacationRes.data || []);
      setSettings(settingsRes.data || {});
      
      // Load sick days data after employees are loaded
      if (employeesRes.data?.length > 0) {
        console.log('Loading sick days data...');
        await loadSickDaysData(employeesRes.data);
      }
      
      console.log('🎉 All data loaded successfully!');
      
    } catch (err) {
      console.error('❌ Loading error details:', err);
      console.error('❌ Error response:', err.response);
      setError(`Fehler beim Laden der Daten: ${err.message}`);
      
      // Set empty arrays as fallback
      setEmployees([]);
      setVacationEntries([]);
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (currentView === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (currentView === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()));
    }
  };

  const handleNext = () => {
    if (currentView === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (currentView === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()));
    }
  };

  // Dialog handlers
  const handleNewVacation = () => {
    setEditingEntry(null);
    setShowVacationDialog(true);
  };

  const handleNewEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeDialog(true);
  };

  const handleEditVacation = (entry) => {
    setEditingEntry(entry);
    setShowVacationDialog(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEmployeeDialog(true);
  };

  const handleDeleteEmployee = async (employee) => {
    if (window.confirm(`Mitarbeiter "${employee.name}" wirklich löschen? Alle Urlaubseinträge werden ebenfalls gelöscht.`)) {
      try {
        await axios.delete(`${API}/employees/${employee.id}`);
        loadData();
      } catch (err) {
        alert('Fehler beim Löschen des Mitarbeiters');
      }
    }
  };

  const handleSaveVacation = () => {
    loadData(); // Reload data after save
  };

  const handleSaveEmployee = () => {
    loadData(); // Reload data after save
  };

  const handleSkillsSave = async () => {
    try {
      // Reload data after skills save
      await loadData();
      if (employees.length > 0) {
        await loadSickDaysData();
      }
    } catch (error) {
      console.error('Error reloading data:', error);
      // Fallback: reload the page
      window.location.reload();
    }
  };

  // Load sick days data for all employees
  const loadSickDaysData = async (employeesList = employees) => {
    try {
      console.log('Loading sick days for', employeesList.length, 'employees');
      const sickDaysPromises = employeesList.map(async (employee) => {
        try {
          const response = await axios.get(`${API}/analytics/employee-sick-days/${employee.id}?year=2025`);
          return { [employee.id]: response.data };
        } catch (error) {
          console.warn(`Failed to load sick days for ${employee.name}:`, error.message);
          return { [employee.id]: { sick_days: 0, entries: [] } };
        }
      });
      
      const sickDaysResults = await Promise.all(sickDaysPromises);
      const sickDaysMap = Object.assign({}, ...sickDaysResults);
      
      setSickDaysData(sickDaysMap);
      console.log('✅ Sick days data loaded for', Object.keys(sickDaysMap).length, 'employees');
    } catch (error) {
      console.error('❌ Error loading sick days data:', error);
      setSickDaysData({});
    }
  };

  // Load sick days when employees change
  useEffect(() => {
    if (employees.length > 0) {
      loadSickDaysData();
    }
  }, [employees]);

  // View handlers
  const handleMonthClick = (month) => {
    setCurrentDate(month);
    setCurrentView('month');
  };

  // Placeholder handlers
  const handleExport = () => {
    alert('Export-Funktion wird implementiert...');
  };

  const handleImport = () => {
    alert('Import-Funktion wird implementiert...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDateClick = (date) => {
    console.log('Date clicked:', date);
    // Could open a day view or quick add dialog
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Urlaubsplaner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          {/* Toolbar */}
          <Toolbar
            onNewVacation={handleNewVacation}
            onNewEmployee={handleNewEmployee}
            onExport={handleExport}
            onImport={handleImport}
            onPrint={handlePrint}
            currentView={currentView}
            onViewChange={setCurrentView}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            employees={employees}
            settings={settings}
            userRole={userRole}
            accessCode={accessCode}
            onLogout={handleLogout}
          />

          {/* Calendar Navigation */}
          <CalendarNavigation
            currentDate={currentDate}
            onPrevious={handlePrevious}
            onNext={handleNext}
            view={currentView}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {currentView === 'month' && (
              <MonthCalendarView
                currentDate={currentDate}
                vacationEntries={vacationEntries}
                employees={employees}
                onDateClick={handleDateClick}
                onEntryClick={handleEditVacation}
              />
            )}

            {currentView === 'year' && (
              <YearCalendarView
                currentDate={currentDate}
                vacationEntries={vacationEntries}
                onMonthClick={handleMonthClick}
              />
            )}

            {currentView === 'team' && (
              <TeamManagementView
                employees={employees}
                onEditEmployee={handleEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onDataReload={async () => {
                  await loadData();
                  if (employees.length > 0) {
                    await loadSickDaysData();
                  }
                }}
                onEditSkills={(employee) => {
                  setSkillsEditEmployee(employee);
                  setShowSkillsDialog(true);
                }}
                sickDaysData={sickDaysData}
              />
            )}
          </div>

          {/* Vacation Dialog */}
          <VacationDialog
            isOpen={showVacationDialog}
            onClose={() => setShowVacationDialog(false)}
            onSave={handleSaveVacation}
            employees={employees}
            editingEntry={editingEntry}
          />

          {/* Employee Dialog */}
          <EmployeeDialog
            isOpen={showEmployeeDialog}
            onClose={() => setShowEmployeeDialog(false)}
            onSave={handleSaveEmployee}
            editingEmployee={editingEmployee}
          />

          {/* Skills Edit Dialog */}
          <SkillsEditDialog
            isOpen={showSkillsDialog}
            onClose={() => {
              setShowSkillsDialog(false);
              setSkillsEditEmployee(null);
            }}
            employee={skillsEditEmployee}
            onSave={handleSkillsSave}
          />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;