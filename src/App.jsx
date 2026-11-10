import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Fuel, Truck, Edit, 
  ShieldAlert, CheckCircle2, AlertTriangle, Trash2
} from 'lucide-react';

// API Base URL - update process.env or fallback to localhost/Render URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fleet-card-backend.onrender.com/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Live API States
  const [vehicles, setVehicles] = useState([]);
  const [cards, setCards] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Fetch all initial data from backend API
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes, dRes, conRes, fRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`),
        fetch(`${API_BASE_URL}/credit-cards`),
        fetch(`${API_BASE_URL}/drivers`),
        fetch(`${API_BASE_URL}/contacts`),
        fetch(`${API_BASE_URL}/fuel-logs`),
        fetch(`${API_BASE_URL}/settlements`)
      ]);

      if (vRes.ok) setVehicles(await vRes.json());
      if (cRes.ok) setCards(await cRes.json());
      if (dRes.ok) setDrivers(await dRes.json());
      if (conRes.ok) setContacts(await conRes.json());
      if (fRes.ok) setFuelLogs(await fRes.json());
      if (sRes.ok) setSettlements(await sRes.json());
    } catch (err) {
      console.error('API Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Form States
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', rcExpiryDate: '', insuranceExpiryDate: '', fitnessExpiryDate: '', pollutionExpiryDate: '' });

  const [editingCardId, setEditingCardId] = useState(null);
  const [cardForm, setCardForm] = useState({ cardName: '', bankName: '', cardNumberLast4: '', creditLimit: '', statementDate: '', dueDate: '' });

  const [driverForm, setDriverForm] = useState({ name: '', phone: '' });
  const [contactForm, setContactForm] = useState({ name: '', phone: '' });

  const [fuelForm, setFuelForm] = useState({
    vehicleNumber: '', driverName: '', cardId: '', amount: '', liters: '', date: new Date().toISOString().split('T')[0]
  });
  const [editingFuelId, setEditingFuelId] = useState(null);
  const [kmDrivenInput, setKmDrivenInput] = useState('');

  // Fuel Filter States
  const [fuelFilterYear, setFuelFilterYear] = useState('ALL');
  const [fuelFilterMonth, setFuelFilterMonth] = useState('ALL');

  // Card Expenses Filter & State
  const [selectedCardForExpense, setSelectedCardForExpense] = useState('');
  const [cardFilterYear, setCardFilterYear] = useState(new Date().getFullYear().toString());
  const [cardFilterMonth, setCardFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [editPaidAmountInput, setEditPaidAmountInput] = useState('');
  const [isEditingPaidAmount, setIsEditingPaidAmount] = useState(false);

  // --------------------------------------------------------------------------
  // VEHICLE HANDLERS (API INTEGRATED)
  // --------------------------------------------------------------------------
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber) return;
    const payload = { ...vehicleForm, vehicleNumber: vehicleForm.vehicleNumber.toUpperCase() };

    try {
      if (editingVehicleId) {
        const res = await fetch(`${API_BASE_URL}/vehicles/${editingVehicleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setVehicles(vehicles.map(v => (v._id === editingVehicleId || v.id === editingVehicleId) ? updated : v));
        }
        setEditingVehicleId(null);
      } else {
        const res = await fetch(`${API_BASE_URL}/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setVehicles([created, ...vehicles]);
        }
      }
      setVehicleForm({ vehicleNumber: '', rcExpiryDate: '', insuranceExpiryDate: '', fitnessExpiryDate: '', pollutionExpiryDate: '' });
    } catch (err) {
      console.error('Save Vehicle Error:', err);
    }
  };

  const handleEditVehicle = (v) => {
    setEditingVehicleId(v._id || v.id);
    setVehicleForm({
      vehicleNumber: v.vehicleNumber || '',
      rcExpiryDate: v.rcExpiryDate || '',
      insuranceExpiryDate: v.insuranceExpiryDate || '',
      fitnessExpiryDate: v.fitnessExpiryDate || '',
      pollutionExpiryDate: v.pollutionExpiryDate || ''
    });
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVehicles(vehicles.filter(v => (v._id || v.id) !== id));
      }
    } catch (err) {
      console.error('Delete Vehicle Error:', err);
    }
  };

  // --------------------------------------------------------------------------
  // CREDIT CARD HANDLERS (API INTEGRATED - NO DELETE)
  // --------------------------------------------------------------------------
  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.cardName || !cardForm.creditLimit) return;

    const payload = {
      ...cardForm,
      creditLimit: parseFloat(cardForm.creditLimit),
      statementDate: parseInt(cardForm.statementDate),
      dueDate: parseInt(cardForm.dueDate)
    };

    try {
      if (editingCardId) {
        const res = await fetch(`${API_BASE_URL}/credit-cards/${editingCardId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setCards(cards.map(c => (c._id === editingCardId || c.id === editingCardId) ? updated : c));
        }
        setEditingCardId(null);
      } else {
        const res = await fetch(`${API_BASE_URL}/credit-cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setCards([created, ...cards]);
        }
      }
      setCardForm({ cardName: '', bankName: '', cardNumberLast4: '', creditLimit: '', statementDate: '', dueDate: '' });
    } catch (err) {
      console.error('Save Card Error:', err);
    }
  };

  const handleEditCard = (c) => {
    setEditingCardId(c._id || c.id);
    setCardForm({
      cardName: c.cardName || '',
      bankName: c.bankName || '',
      cardNumberLast4: c.cardNumberLast4 || '',
      creditLimit: c.creditLimit || '',
      statementDate: c.statementDate || '',
      dueDate: c.dueDate || ''
    });
  };

  // --------------------------------------------------------------------------
  // DRIVER & CONTACT HANDLERS (API INTEGRATED)
  // --------------------------------------------------------------------------
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!driverForm.name) return;
    try {
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverForm)
      });
      if (res.ok) {
        const created = await res.json();
        setDrivers([...drivers, created]);
        setDriverForm({ name: '', phone: '' });
      }
    } catch (err) {
      console.error('Save Driver Error:', err);
    }
  };

  const handleDeleteDriver = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/drivers/${id}`, { method: 'DELETE' });
      if (res.ok) setDrivers(drivers.filter(d => (d._id || d.id) !== id));
    } catch (err) {
      console.error('Delete Driver Error:', err);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name) return;
    try {
      const res = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        const created = await res.json();
        setContacts([...contacts, created]);
        setContactForm({ name: '', phone: '' });
      }
    } catch (err) {
      console.error('Save Contact Error:', err);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) setContacts(contacts.filter(c => (c._id || c.id) !== id));
    } catch (err) {
      console.error('Delete Contact Error:', err);
    }
  };

  // --------------------------------------------------------------------------
  // FUEL ENTRY & KM/MILEAGE HANDLERS (API INTEGRATED)
  // --------------------------------------------------------------------------
  const handleSaveFuel = async (e) => {
    e.preventDefault();
    if (!fuelForm.vehicleNumber || !fuelForm.amount || !fuelForm.liters) return;

    const cardObj = cards.find(c => (c._id || c.id) === fuelForm.cardId);
    const payload = {
      vehicleNumber: fuelForm.vehicleNumber,
      driverName: fuelForm.driverName,
      cardId: fuelForm.cardId || '',
      cardName: cardObj ? cardObj.cardName : 'Cash/Other',
      amount: parseFloat(fuelForm.amount),
      liters: parseFloat(fuelForm.liters),
      kmDriven: 0,
      mileage: '-',
      date: fuelForm.date
    };

    try {
      const res = await fetch(`${API_BASE_URL}/fuel-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setFuelLogs([created, ...fuelLogs]);
        setFuelForm({ vehicleNumber: '', driverName: '', cardId: '', amount: '', liters: '', date: new Date().toISOString().split('T')[0] });
      }
    } catch (err) {
      console.error('Save Fuel Error:', err);
    }
  };

  const handleSaveKmDriven = async (logId) => {
    const km = parseFloat(kmDrivenInput);
    if (isNaN(km) || km <= 0) return;

    const targetLog = fuelLogs.find(f => (f._id || f.id) === logId);
    if (!targetLog) return;

    const calculatedMileage = (km / targetLog.liters).toFixed(2);
    const updatedPayload = { ...targetLog, kmDriven: km, mileage: calculatedMileage };

    try {
      const res = await fetch(`${API_BASE_URL}/fuel-logs/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });
      if (res.ok) {
        const updated = await res.json();
        setFuelLogs(fuelLogs.map(f => (f._id || f.id) === logId ? updated : f));
        setEditingFuelId(null);
        setKmDrivenInput('');
      }
    } catch (err) {
      console.error('Update KM Error:', err);
    }
  };

  // Filtered Fuel Logs
  const filteredFuelLogs = fuelLogs.filter(log => {
    if (!log.date) return true;
    const logYear = log.date.split('-')[0];
    const logMonth = log.date.split('-')[1];
    const matchYear = fuelFilterYear === 'ALL' || logYear === fuelFilterYear;
    const matchMonth = fuelFilterMonth === 'ALL' || logMonth === fuelFilterMonth.padStart(2, '0');
    return matchYear && matchMonth;
  });

  // Document Expiry Alerts Helper
  const getDocExpiries = () => {
    const today = new Date();
    const alerts = [];
    vehicles.forEach(v => {
      const check = (dateStr, type) => {
        if (!dateStr) return;
        const exp = new Date(dateStr);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          alerts.push({ vehicle: v.vehicleNumber, type, diffDays, date: dateStr });
        }
      };
      check(v.rcExpiryDate, 'RC');
      check(v.insuranceExpiryDate, 'Bima (Insurance)');
      check(v.fitnessExpiryDate, 'Fitness');
      check(v.pollutionExpiryDate, 'Pollution (PUC)');
    });
    return alerts;
  };
  const docAlerts = getDocExpiries();

  // --------------------------------------------------------------------------
  // CARD EXPENSES CALCULATION & SETTLEMENTS (API INTEGRATED)
  // --------------------------------------------------------------------------
  const getCardExpenseSummary = () => {
    if (!selectedCardForExpense) return null;
    const cardObj = cards.find(c => (c._id || c.id) === selectedCardForExpense);
    if (!cardObj) return null;

    const monthYear = `${cardFilterYear}-${cardFilterMonth.padStart(2, '0')}`;
    const monthlyLogs = fuelLogs.filter(f => {
      if (f.cardId !== selectedCardForExpense || !f.date) return false;
      const [y, m] = f.date.split('-');
      return y === cardFilterYear && m === cardFilterMonth.padStart(2, '0');
    });

    const totalSpent = monthlyLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
    const currentSettlement = settlements.find(s => s.cardId === selectedCardForExpense && s.monthYear === monthYear);
    const paidAmount = currentSettlement ? currentSettlement.paidAmount : 0;
    const pendingAmount = Math.max(0, totalSpent - paidAmount);
    const isDone = totalSpent > 0 && pendingAmount === 0;

    return { cardObj, totalSpent, paidAmount, pendingAmount, isDone, monthYear, monthlyLogs };
  };

  const handleUpdatePaidAmount = async (monthYear) => {
    const val = parseFloat(editPaidAmountInput) || 0;
    try {
      const res = await fetch(`${API_BASE_URL}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: selectedCardForExpense,
          monthYear,
          paidAmount: val
        })
      });
      if (res.ok) {
        const savedSettlement = await res.json();
        setSettlements(prev => {
          const exists = prev.some(s => s.cardId === selectedCardForExpense && s.monthYear === monthYear);
          if (exists) {
            return prev.map(s => (s.cardId === selectedCardForExpense && s.monthYear === monthYear) ? savedSettlement : s);
          }
          return [...prev, savedSettlement];
        });
        setIsEditingPaidAmount(false);
      }
    } catch (err) {
      console.error('Update Settlement Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-800 p-5 rounded-2xl border border-slate-700 gap-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-lg">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Fleet Logistics & Card Management
                {loading && <span className="text-xs text-amber-400 font-normal animate-pulse">(Syncing with MongoDB...)</span>}
              </h1>
              <p className="text-xs text-slate-400">MongoDB Atlas Live Sync • Node.js Backend API</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'vehicles', label: 'Vehicles' },
              { id: 'cards', label: 'Credit Cards' },
              { id: 'fuel', label: 'Fuel Entry' },
              { id: 'cardExpenses', label: 'Card Expenses' },
              { id: 'drivers', label: 'Drivers' },
              { id: 'contacts', label: 'Phone Directory' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === tab.id ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Document Expiry Alert Banner */}
        {docAlerts.length > 0 && (
          <div className="bg-amber-950/70 border border-amber-800/80 p-4 rounded-xl flex items-center justify-between text-amber-200 text-sm">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span><strong>Alert:</strong> {docAlerts.length} vehicle document(s) expiring within 30 days!</span>
            </div>
            <button onClick={() => setActiveTab('vehicles')} className="text-xs underline font-semibold bg-amber-900/50 px-3 py-1 rounded">
              View Expiries
            </button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-semibold">Total Vehicles</p>
                <p className="text-2xl font-bold text-white mt-1">{vehicles.length}</p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-semibold">Credit Cards Registered</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{cards.length}</p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-semibold">Drivers Registered</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{drivers.length}</p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-semibold">Doc Expiry Alerts</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{docAlerts.length}</p>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Document Expiry Watchlist (RC, Bima, Fitness, PUC)
              </h3>
              {docAlerts.length === 0 ? (
                <p className="text-sm text-slate-400">All vehicle documents are healthy!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-xs text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Vehicle No</th>
                        <th className="p-3">Document</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {docAlerts.map((exp, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-amber-400">{exp.vehicle}</td>
                          <td className="p-3 font-medium">{exp.type}</td>
                          <td className="p-3">{exp.date}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                              {exp.diffDays < 0 ? `Expired` : `${exp.diffDays} days left`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VEHICLES TAB */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveVehicle} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white">
                {editingVehicleId ? 'Edit Vehicle Entry' : 'Add New Vehicle Entry'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Gaadi Number (e.g. RJ09-GB-1234)" value={vehicleForm.vehicleNumber} onChange={e => setVehicleForm({...vehicleForm, vehicleNumber: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white uppercase" required />
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">RC Expiry Date</label>
                  <input type="date" value={vehicleForm.rcExpiryDate} onChange={e => setVehicleForm({...vehicleForm, rcExpiryDate: e.target.value})} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Bima (Insurance) Expiry Date</label>
                  <input type="date" value={vehicleForm.insuranceExpiryDate} onChange={e => setVehicleForm({...vehicleForm, insuranceExpiryDate: e.target.value})} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Fitness Expiry Date</label>
                  <input type="date" value={vehicleForm.fitnessExpiryDate} onChange={e => setVehicleForm({...vehicleForm, fitnessExpiryDate: e.target.value})} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Pollution Expiry Date</label>
                  <input type="date" value={vehicleForm.pollutionExpiryDate} onChange={e => setVehicleForm({...vehicleForm, pollutionExpiryDate: e.target.value})} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs">
                  {editingVehicleId ? 'Update Vehicle' : 'Save Vehicle'}
                </button>
                {editingVehicleId && (
                  <button type="button" onClick={() => { setEditingVehicleId(null); setVehicleForm({ vehicleNumber: '', rcExpiryDate: '', insuranceExpiryDate: '', fitnessExpiryDate: '', pollutionExpiryDate: '' }); }} className="bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900 text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="p-4">Gaadi Number</th>
                    <th className="p-4">RC Expiry</th>
                    <th className="p-4">Bima Expiry</th>
                    <th className="p-4">Fitness Expiry</th>
                    <th className="p-4">Pollution Expiry</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {vehicles.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">No vehicles found. Add one above.</td></tr>
                  ) : (
                    vehicles.map(v => {
                      const id = v._id || v.id;
                      return (
                        <tr key={id}>
                          <td className="p-4 font-bold text-amber-400">{v.vehicleNumber}</td>
                          <td className="p-4 text-xs">{v.rcExpiryDate}</td>
                          <td className="p-4 text-xs">{v.insuranceExpiryDate}</td>
                          <td className="p-4 text-xs">{v.fitnessExpiryDate}</td>
                          <td className="p-4 text-xs">{v.pollutionExpiryDate}</td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button onClick={() => handleEditVehicle(v)} className="p-1.5 text-amber-400 hover:bg-slate-700 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteVehicle(id)} className="p-1.5 text-rose-400 hover:bg-slate-700 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CREDIT CARDS TAB (NO DELETE OPTION) */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveCard} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white">
                {editingCardId ? 'Edit Credit Card Details' : 'Add New Credit Card'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Card Ka Naam (e.g. PhonePe SBI Card)" value={cardForm.cardName} onChange={e => setCardForm({...cardForm, cardName: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="text" placeholder="Bank Ka Naam" value={cardForm.bankName} onChange={e => setCardForm({...cardForm, bankName: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="text" maxLength="4" placeholder="Last 4 Digits" value={cardForm.cardNumberLast4} onChange={e => setCardForm({...cardForm, cardNumberLast4: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="number" placeholder="Card Ki Limit (₹)" value={cardForm.creditLimit} onChange={e => setCardForm({...cardForm, creditLimit: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="number" min="1" max="31" placeholder="Statement Date (1-31)" value={cardForm.statementDate} onChange={e => setCardForm({...cardForm, statementDate: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="number" min="1" max="31" placeholder="Due Date (1-31)" value={cardForm.dueDate} onChange={e => setCardForm({...cardForm, dueDate: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs">
                  {editingCardId ? 'Update Card' : 'Save Credit Card'}
                </button>
                {editingCardId && (
                  <button type="button" onClick={() => { setEditingCardId(null); setCardForm({ cardName: '', bankName: '', cardNumberLast4: '', creditLimit: '', statementDate: '', dueDate: '' }); }} className="bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cards.map(card => {
                const id = card._id || card.id;
                return (
                  <div key={id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-amber-400 font-bold uppercase">{card.bankName}</p>
                        <h4 className="font-bold text-white text-base">{card.cardName}</h4>
                        <p className="text-xs font-mono text-slate-400 mt-1">•••• {card.cardNumberLast4}</p>
                      </div>
                      <button onClick={() => handleEditCard(card)} className="p-1.5 text-amber-400 hover:bg-slate-700 rounded" title="Edit Card">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-750 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Credit Limit:</span>
                        <span className="font-bold text-white">₹{parseFloat(card.creditLimit || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Statement Date:</span>
                        <span className="text-slate-200">{card.statementDate}th</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Due Date:</span>
                        <span className="text-amber-400 font-bold">{card.dueDate}th</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FUEL ENTRY TAB */}
        {activeTab === 'fuel' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveFuel} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" /> New Fuel Entry
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Select Truck / Gaadi</label>
                  <select value={fuelForm.vehicleNumber} onChange={e => setFuelForm({...fuelForm, vehicleNumber: e.target.value})} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required>
                    <option value="">-- Choose Truck --</option>
                    {vehicles.map(v => <option key={v._id || v.id} value={v.vehicleNumber}>{v.vehicleNumber}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Select Driver</label>
                  <select value={fuelForm.driverName} onChange={e => setFuelForm({...fuelForm, driverName: e.target.value})} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required>
                    <option value="">-- Choose Driver --</option>
                    {drivers.map(d => <option key={d._id || d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Select Payment Card</label>
                  <select value={fuelForm.cardId} onChange={e => setFuelForm({...fuelForm, cardId: e.target.value})} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                    <option value="">-- Cash / Other --</option>
                    {cards.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.cardName}</option>)}
                  </select>
                </div>

                <input type="number" placeholder="Fuel Amount (₹)" value={fuelForm.amount} onChange={e => setFuelForm({...fuelForm, amount: e.target.value})} className="text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="number" step="0.01" placeholder="Fuel Liters" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} className="text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="date" value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} className="text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
              </div>
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs">Save Fuel Entry</button>
            </form>

            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
              <h3 className="font-bold text-white text-sm">Fuel Logs & Mileage Record</h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 font-semibold">Filter:</span>
                <select value={fuelFilterMonth} onChange={e => setFuelFilterMonth(e.target.value)} className="text-xs p-2 bg-slate-900 border border-slate-700 rounded text-white">
                  <option value="ALL">All Months</option>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, idx) => (
                    <option key={m} value={m}>Month {idx + 1}</option>
                  ))}
                </select>
                <select value={fuelFilterYear} onChange={e => setFuelFilterYear(e.target.value)} className="text-xs p-2 bg-slate-900 border border-slate-700 rounded text-white">
                  <option value="ALL">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900 text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Truck No</th>
                    <th className="p-4">Driver</th>
                    <th className="p-4">Card Used</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Liters</th>
                    <th className="p-4">KM Driven</th>
                    <th className="p-4">Mileage (KM/L)</th>
                    <th className="p-4 text-center">Edit KM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredFuelLogs.length === 0 ? (
                    <tr><td colSpan="9" className="p-4 text-center text-slate-500">No fuel entries found.</td></tr>
                  ) : (
                    filteredFuelLogs.map(log => {
                      const id = log._id || log.id;
                      return (
                        <tr key={id}>
                          <td className="p-4 font-mono text-xs">{log.date}</td>
                          <td className="p-4 font-bold text-amber-400">{log.vehicleNumber}</td>
                          <td className="p-4">{log.driverName}</td>
                          <td className="p-4 text-xs"><span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">{log.cardName}</span></td>
                          <td className="p-4 font-bold text-white">₹{log.amount.toLocaleString('en-IN')}</td>
                          <td className="p-4">{log.liters} L</td>
                          <td className="p-4 font-mono">{log.kmDriven > 0 ? `${log.kmDriven} KM` : '-'}</td>
                          <td className="p-4 font-bold text-emerald-400">{log.mileage !== '-' ? `${log.mileage} KM/L` : '-'}</td>
                          <td className="p-4 text-center">
                            {editingFuelId === id ? (
                              <div className="flex items-center justify-center space-x-1">
                                <input type="number" placeholder="KM" value={kmDrivenInput} onChange={e => setKmDrivenInput(e.target.value)} className="w-20 text-xs p-1 bg-slate-900 border border-slate-600 rounded text-white" />
                                <button onClick={() => handleSaveKmDriven(id)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs">Save</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingFuelId(id); setKmDrivenInput(log.kmDriven || ''); }} className="p-1.5 text-amber-400 hover:bg-slate-700 rounded flex items-center justify-center gap-1 mx-auto text-xs">
                                <Edit className="w-3.5 h-3.5" /> Edit KM
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CREDIT CARD EXPENSES TAB */}
        {activeTab === 'cardExpenses' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white">Credit Card Monthly Expense & Settlement Tracker</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Select Credit Card</label>
                  <select value={selectedCardForExpense} onChange={e => setSelectedCardForExpense(e.target.value)} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                    <option value="">-- Choose Card --</option>
                    {cards.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.cardName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Select Month</label>
                  <select value={cardFilterMonth} onChange={e => setCardFilterMonth(e.target.value)} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, idx) => (
                      <option key={m} value={m}>Month {idx + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Select Year</label>
                  <select value={cardFilterYear} onChange={e => setCardFilterYear(e.target.value)} className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
            </div>

            {selectedCardForExpense && (() => {
              const summary = getCardExpenseSummary();
              if (!summary) return null;
              return (
                <div className="space-y-6">
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Card Total Limit</p>
                      <p className="text-xl font-bold text-white mt-1">₹{summary.cardObj.creditLimit.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Monthly Expense</p>
                      <p className="text-xl font-bold text-amber-400 mt-1">₹{summary.totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Paid Amount</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">₹{summary.paidAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Status</p>
                      <div className="mt-1">
                        {summary.isDone ? (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> DONE
                          </span>
                        ) : (
                          <span className="bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1 rounded text-xs font-bold w-fit block">
                            PENDING: ₹{summary.pendingAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-4 border-t border-slate-700 pt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Update amount paid for this month:</span>
                      {isEditingPaidAmount ? (
                        <div className="flex items-center space-x-2">
                          <input type="number" placeholder="Paid ₹" value={editPaidAmountInput} onChange={e => setEditPaidAmountInput(e.target.value)} className="text-xs p-1.5 bg-slate-900 border border-slate-600 rounded text-white" />
                          <button onClick={() => handleUpdatePaidAmount(summary.monthYear)} className="bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded text-xs">Save</button>
                          <button onClick={() => setIsEditingPaidAmount(false)} className="bg-slate-700 text-white px-2 py-1.5 rounded text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setIsEditingPaidAmount(true); setEditPaidAmountInput(summary.paidAmount); }} className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5" /> Edit Paid Amount
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-slate-900 border-b border-slate-700">
                      <h4 className="font-bold text-white text-xs uppercase">Card Fuel Logs for this month</h4>
                    </div>
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950 text-xs text-slate-400 uppercase">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Truck No</th>
                          <th className="p-3">Driver</th>
                          <th className="p-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {summary.monthlyLogs.length === 0 ? (
                          <tr><td colSpan="4" className="p-3 text-center text-slate-500">No expenses recorded for this month.</td></tr>
                        ) : (
                          summary.monthlyLogs.map(l => (
                            <tr key={l._id || l.id}>
                              <td className="p-3 font-mono text-xs">{l.date}</td>
                              <td className="p-3 font-bold text-amber-400">{l.vehicleNumber}</td>
                              <td className="p-3">{l.driverName}</td>
                              <td className="p-3 font-bold text-white">₹{l.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'drivers' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveDriver} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white">Add Driver Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Driver Name" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="text" placeholder="Driver Phone Number" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
              </div>
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs">Save Driver</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {drivers.map(d => {
                const id = d._id || d.id;
                return (
                  <div key={id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-sm">{d.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{d.phone}</p>
                    </div>
                    <button onClick={() => handleDeleteDriver(id)} className="text-rose-400 hover:bg-slate-700 p-1.5 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHONE DIRECTORY TAB */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveContact} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-white">Add Contact to Directory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Contact Name" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
                <input type="text" placeholder="Phone Number" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white" required />
              </div>
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs">Save Contact</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map(c => {
                const id = c._id || c.id;
                return (
                  <div key={id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{c.phone}</p>
                    </div>
                    <button onClick={() => handleDeleteContact(id)} className="text-rose-400 hover:bg-slate-700 p-1.5 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}