import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Calendar } from "./components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { CalendarIcon, Users, Clock, CheckCircle, XCircle, Calendar as CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "./lib/utils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main Dashboard Component
const Dashboard = ({ currentUser }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/${currentUser.id}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="text-lg">Lade Dashboard...</div>
    </div>;
  }

  const { vacation_balance, recent_requests, upcoming_vacations } = dashboardData || { vacation_balance: {}, recent_requests: [], upcoming_vacations: [] };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Willkommen, {currentUser.name}!</h1>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {currentUser.department}
        </Badge>
      </div>

      {/* Vacation Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Urlaubsübersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{vacation_balance.total_days}</div>
              <div className="text-sm text-gray-600">Gesamt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{vacation_balance.used_days}</div>
              <div className="text-sm text-gray-600">Genommen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{vacation_balance.remaining_days}</div>
              <div className="text-sm text-gray-600">Verbleibend</div>
            </div>
          </div>
          {vacation_balance.pending_requests > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-800">
                {vacation_balance.pending_requests} Antrag(e) warten auf Genehmigung
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Letzte Anträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_requests.length === 0 ? (
                <p className="text-gray-500">Keine Anträge vorhanden</p>
              ) : (
                recent_requests.map((request) => (
                  <div key={request.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {format(new Date(request.start_date), "dd.MM.yyyy", { locale: de })} - 
                        {format(new Date(request.end_date), "dd.MM.yyyy", { locale: de })}
                      </div>
                      <div className="text-sm text-gray-600">{request.vacation_type} • {request.days_requested} Tage</div>
                    </div>
                    <Badge 
                      variant={
                        request.status === 'approved' ? 'default' : 
                        request.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {request.status === 'approved' ? 'Genehmigt' : 
                       request.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Vacations */}
        <Card>
          <CardHeader>
            <CardTitle>Geplanter Urlaub</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcoming_vacations.length === 0 ? (
                <p className="text-gray-500">Kein geplanter Urlaub</p>
              ) : (
                upcoming_vacations.map((vacation) => (
                  <div key={vacation.id} className="flex justify-between items-center p-3 border rounded-lg bg-green-50">
                    <div>
                      <div className="font-medium">
                        {format(new Date(vacation.start_date), "dd.MM.yyyy", { locale: de })} - 
                        {format(new Date(vacation.end_date), "dd.MM.yyyy", { locale: de })}
                      </div>
                      <div className="text-sm text-gray-600">{vacation.vacation_type} • {vacation.days_requested} Tage</div>
                    </div>
                    <Badge variant="default">Genehmigt</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Vacation Request Form Component
const VacationRequestForm = ({ currentUser, onSuccess }) => {
  const [formData, setFormData] = useState({
    start_date: null,
    end_date: null,
    vacation_type: "",
    reason: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const requestData = {
        user_id: currentUser.id,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date.toISOString().split('T')[0],
        vacation_type: formData.vacation_type,
        reason: formData.reason
      };

      await axios.post(`${API}/vacation-requests`, requestData);
      alert("Urlaubsantrag erfolgreich eingereicht!");
      setFormData({ start_date: null, end_date: null, vacation_type: "", reason: "" });
      if (onSuccess) onSuccess();
    } catch (error) {
      alert("Fehler beim Einreichen des Antrags: " + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neuer Urlaubsantrag</CardTitle>
        <CardDescription>Reichen Sie Ihren Urlaubsantrag ein</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => setFormData({ ...formData, start_date: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="end_date">Enddatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => setFormData({ ...formData, end_date: date })}
                    disabled={(date) => date < formData.start_date || date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="vacation_type">Art des Urlaubs</Label>
            <Select value={formData.vacation_type} onValueChange={(value) => setFormData({ ...formData, vacation_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie die Art des Urlaubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urlaub">Urlaub</SelectItem>
                <SelectItem value="krankheit">Krankheit</SelectItem>
                <SelectItem value="fortbildung">Fortbildung</SelectItem>
                <SelectItem value="sonderurlaub">Sonderurlaub</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Grund/Bemerkung</Label>
            <Textarea
              id="reason"
              placeholder="Optionale Bemerkung..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!formData.start_date || !formData.end_date || !formData.vacation_type || submitting}
          >
            {submitting ? "Wird eingereicht..." : "Antrag einreichen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// My Requests Component
const MyRequests = ({ currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [currentUser]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API}/vacation-requests?user_id=${currentUser.id}`);
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId) => {
    if (window.confirm("Möchten Sie diesen Antrag wirklich löschen?")) {
      try {
        await axios.delete(`${API}/vacation-requests/${requestId}`);
        fetchRequests();
        alert("Antrag erfolgreich gelöscht!");
      } catch (error) {
        alert("Fehler beim Löschen: " + (error.response?.data?.detail || error.message));
      }
    }
  };

  if (loading) {
    return <div className="text-center">Lade Anträge...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Meine Anträge</h2>
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Keine Anträge vorhanden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {format(new Date(request.start_date), "dd.MM.yyyy", { locale: de })} - 
                        {format(new Date(request.end_date), "dd.MM.yyyy", { locale: de })}
                      </span>
                      <Badge 
                        variant={
                          request.status === 'approved' ? 'default' : 
                          request.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                      >
                        {request.status === 'approved' ? 'Genehmigt' : 
                         request.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {request.vacation_type} • {request.days_requested} Tage
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-600">Grund: {request.reason}</p>
                    )}
                    {request.manager_comment && (
                      <p className="text-sm text-blue-600">Manager-Kommentar: {request.manager_comment}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteRequest(request.id)}
                      >
                        Löschen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Main App Component
const Home = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
      if (response.data.length > 0) {
        setCurrentUser(response.data[0]); // Set first user as default
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const createDefaultUser = async () => {
    try {
      const userData = {
        name: "Max Mustermann",
        email: "max.mustermann@company.com",
        role: "employee",
        department: "IT",
        vacation_days_total: 30
      };
      
      const response = await axios.post(`${API}/users`, userData);
      setCurrentUser(response.data);
      fetchUsers();
      alert("Benutzer erfolgreich erstellt!");
    } catch (error) {
      alert("Fehler beim Erstellen des Benutzers: " + (error.response?.data?.detail || error.message));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Urlaubsplaner</CardTitle>
            <CardDescription className="text-center">
              Willkommen beim Urlaubsplaner System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center space-y-4">
                <p>Noch keine Benutzer vorhanden.</p>
                <Button onClick={createDefaultUser} className="w-full">
                  Demo-Benutzer erstellen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Label>Benutzer auswählen:</Label>
                <Select onValueChange={(userId) => {
                  const user = users.find(u => u.id === userId);
                  setCurrentUser(user);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Benutzer wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Urlaubsplaner</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={currentView === 'request' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('request')}
              >
                Antrag stellen
              </Button>
              <Button
                variant={currentView === 'my-requests' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('my-requests')}
              >
                Meine Anträge
              </Button>
              <div className="text-sm text-gray-600">
                {currentUser.name}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === 'dashboard' && <Dashboard currentUser={currentUser} />}
          {currentView === 'request' && (
            <VacationRequestForm 
              currentUser={currentUser} 
              onSuccess={() => setCurrentView('my-requests')}
            />
          )}
          {currentView === 'my-requests' && <MyRequests currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;