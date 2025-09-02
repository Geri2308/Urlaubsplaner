import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
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
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Vacation Types
const VACATION_TYPES = {
  URLAUB: { label: 'Urlaub', color: 'bg-blue-500', textColor: 'text-blue-700' },
  KRANKHEIT: { label: 'Krankheit', color: 'bg-red-500', textColor: 'text-red-700' },
  SONDERURLAUB: { label: 'Sonderurlaub', color: 'bg-green-500', textColor: 'text-green-700' }
};

// Toolbar Component (Word-style)
const Toolbar = ({ 
  onNewVacation, 
  onExport, 
  onImport, 
  onPrint, 
  currentView, 
  onViewChange,
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters
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
        <span>20 Mitarbeiter • Max. 6 gleichzeitig (30%)</span>
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
              Notizen (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Zusätzliche Informationen..."
            />
          </div>

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
              {loading ? 'Speichern...' : (editingEntry ? 'Aktualisieren' : 'Erstellen')}
            </button>
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
    return vacationEntries.filter(entry => {
      const entryStart = new Date(entry.start_date);
      const entryEnd = new Date(entry.end_date);
      return day >= entryStart && day <= entryEnd;
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
                      title={`${vacation.employee_name} - ${vacationType.label}`}
                    >
                      {vacation.employee_name}
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

// Main App Component
function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [employees, setEmployees] = useState([]);
  const [vacationEntries, setVacationEntries] = useState([]);
  const [showVacationDialog, setShowVacationDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesRes, vacationRes] = await Promise.all([
        axios.get(`${API}/employees`),
        axios.get(`${API}/vacation-entries`)
      ]);
      setEmployees(employeesRes.data);
      setVacationEntries(vacationRes.data);
      setError('');
    } catch (err) {
      setError('Fehler beim Laden der Daten');
      console.error('Loading error:', err);
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

  const handleEditVacation = (entry) => {
    setEditingEntry(entry);
    setShowVacationDialog(true);
  };

  const handleSaveVacation = () => {
    loadData(); // Reload data after save
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
            onExport={handleExport}
            onImport={handleImport}
            onPrint={handlePrint}
            currentView={currentView}
            onViewChange={setCurrentView}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
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
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Jahresansicht wird implementiert...</p>
              </div>
            )}

            {currentView === 'team' && (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Teamansicht wird implementiert...</p>
              </div>
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
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;