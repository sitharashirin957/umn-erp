import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getMessaging, getToken } from "firebase/messaging";
import VideoCall from './VideoCall';
import { QRCodeSVG } from 'qrcode.react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  LayoutDashboard, Users, Settings, Plus, Search, Briefcase, X, Printer, TrendingUp, Trash2, Phone, Mail, 
  ShieldCheck, HandCoins, ShoppingBag, CreditCard, Menu, Edit3, Receipt, Package, Truck, FileText, 
  Bell, DownloadCloud, AlertTriangle, Activity, BookOpen, Image as ImageIcon,
  Sun, Moon, ClipboardList, FilePlus, Lock, Calculator, Database, ShoppingCart, Info, Table, Wallet, SendToBack, ArrowRightCircle, BarChartHorizontal, Filter, FileSignature, Copy, Sparkles, MessageSquare, Mic, Volume2, VolumeX, Send
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment, setDoc } from 'firebase/firestore';

let firebaseConfig = {};
try { if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG) { firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG); } } catch (error) { console.error("Firebase config parsing error.", error); }
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'custom-erp-v1';

const APP_PIN = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_PIN) || '1234';
const ADMIN_PIN = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_PIN) || '9999';

const STANDARD_MATRIX = {
    "30 x 15": { "3": 20, "4": 25, "5": 35, "6": 40, "8": 45, "10": 50 }, "30 x 20 / A4": { "3": 30, "4": 35, "5": 40, "6": 50, "8": 60, "10": 75 },
    "A3": { "3": 40, "4": 45, "5": 55, "6": 60, "8": 70, "10": 100 }, "30 x 50": { "3": 45, "4": 50, "5": 65, "6": 75, "8": 90, "10": 125 },
    "35 x 50": { "3": 50, "4": 55, "5": 70, "6": 80, "8": 105, "10": 135 }, "40 x 50": { "3": 50, "4": 60, "5": 70, "6": 85, "8": 120, "10": 150 },
    "50 x 50": { "3": 65, "4": 75, "5": 85, "6": 100, "8": 140, "10": 175 }, "60 x 40": { "3": 65, "4": 75, "5": 85, "6": 100, "8": 140, "10": 175 },
    "50 x 70": { "3": 85, "4": 95, "5": 105, "6": 125, "8": 155, "10": 210 }, "70 x 100": { "3": 140, "4": 170, "5": 220, "6": 260, "8": 330, "10": 420 },
    "100 x 100": { "3": 200, "4": 240, "5": 300, "6": 350, "8": 450, "10": 600 }, "120 x 100": { "3": 230, "4": 280, "5": 380, "6": 450, "8": 550, "10": 700 },
    "100 x 200": { "3": 365, "4": 430, "5": 550, "6": 650, "8": 800, "10": 1100 }, "122 x 244": { "3": 520, "4": 620, "5": 800, "6": 950, "8": 1100, "10": 1300 }
};
const MATRIX_AREAS = [
    { label: "30 x 15", area: 450 }, { label: "30 x 20 / A4", area: 600 }, { label: "A3", area: 1260 }, { label: "30 x 50", area: 1500 },
    { label: "35 x 50", area: 1750 }, { label: "40 x 50", area: 2000 }, { label: "60 x 40", area: 2400 }, { label: "50 x 50", area: 2500 },
    { label: "50 x 70", area: 3500 }, { label: "70 x 100", area: 7000 }, { label: "100 x 100", area: 10000 }, { label: "120 x 100", area: 12000 },
    { label: "100 x 200", area: 20000 }, { label: "122 x 244", area: 29768 }
].sort((a, b) => a.area - b.area);

const safeSearch = (val, term) => String(val || '').toLowerCase().includes(String(term || '').toLowerCase());
const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(Number(num) || 0);
const generateID = (prefix, length) => `${prefix}-${String(length + 1).padStart(5, '0')}`;

const getBadgeStyle = (status) => {
  if (status === 'Paid' || status === 'Active' || status === 'Collected' || status === 'Converted') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 border';
  if (status === 'Partial' || status === 'Collection Follow up' || status?.includes('Follow Up')) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 border';
  if (status === 'Dropped') return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-600 border line-through';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 border';
};

const cleanObject = (obj) => {
  const cleaned = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !obj[key].toDate && !Array.isArray(obj[key])) cleaned[key] = cleanObject(obj[key]);
      else cleaned[key] = obj[key]; 
    }
  }
  return cleaned;
};

const COLORS = ['#10b981', '#3b82f6', '#94a3b8', '#f43f5e', '#eab308', '#8b5cf6', '#06b6d4'];
const AGING_COLORS = ['#38bdf8', '#fbbf24', '#34d399', '#a78bfa', '#fb923c', '#f43f5e'];

const triggerSystemPrint = (customFilename) => {
  const originalTitle = document.title;
  if (customFilename) document.title = customFilename;
  window.print();
  document.title = originalTitle;
};

const exportToExcel = async (data, filename) => {
  if (!data || !data.length) return;
  if (!window.XLSX) { await new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; script.onload = resolve; document.head.appendChild(script); }); }
  const cleanData = data.map(row => {
    const cleanRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === 'id' || key === 'items' || key === 'createdAt' || key === 'updatedAt' || key === 'rawDate') continue;
      const cleanKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      if (Array.isArray(value)) cleanRow[cleanKey] = `${value.length} items`;
      else if (value && typeof value === 'object' && value.seconds) cleanRow[cleanKey] = new Date(value.seconds * 1000).toLocaleDateString();
      else if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && key.toLowerCase().match(/amount|total|price|balance|rate|qty|debit|credit/))) cleanRow[cleanKey] = Number(value) || 0;
      else cleanRow[cleanKey] = String(value || '');
    }
    return cleanRow;
  });
  const ws = window.XLSX.utils.json_to_sheet(cleanData); const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, String(filename).toUpperCase().slice(0, 31));
  window.XLSX.writeFile(wb, `${String(filename).toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const CompanyLogo = ({ collapsed, settings }) => (
  <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} transition-all duration-300`}>
    {settings?.logo ? <img src={settings.logo} alt="Logo" className="w-10 h-10 rounded-2xl object-contain bg-white shadow-xl border border-slate-200 dark:border-slate-700 shrink-0" /> : <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#4f46e5] shadow-lg shadow-indigo-500/30 border border-indigo-400/20 shrink-0"><span className="relative text-white font-black text-xl tracking-tighter">C<span className="text-cyan-300">E</span></span></div>}
    {!collapsed && <div className="flex flex-col whitespace-nowrap overflow-hidden"><span className="text-xl font-black text-slate-900 dark:text-white tracking-widest leading-none truncate w-40">{settings?.companyName || 'MY ERP'}</span></div>}
  </div>
);

const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab, collapsed, setMobileMenu }) => (
  <button onClick={() => { setActiveTab(id); setMobileMenu(false); }} className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'space-x-4 px-4'} py-3.5 rounded-2xl transition-all duration-300 ${activeTab === id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-indigo-900/20 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`} title={collapsed ? String(label) : ""}>
    <Icon size={20} className={`shrink-0 ${activeTab === id ? 'text-white' : ''}`} />{!collapsed && <span className="font-bold text-xs uppercase tracking-wider">{String(label)}</span>}
  </button>
);

const KPICard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className={`p-6 rounded-[1.5rem] border ${bgClass} shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between`}>
    <div><p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{String(title)}</p><h3 className={`text-2xl font-black ${colorClass} tracking-tight`}>{String(value)}</h3></div>
    <div className={`p-4 rounded-full bg-white/50 dark:bg-black/20 ${colorClass}`}><Icon size={28} /></div>
  </div>
);

const getCRMWorkStatusStyle = (status) => {
  switch (status) {
    case 'Work Onboarded': return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 border';
    case 'Work Finished': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 border';
    case 'Price/Quotation Submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 border';
    case 'Delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 border';
    case 'Cold Lead': return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-500/30 border';
    case 'Quote Rejected': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30 border';
    case 'Waiting Approval': return 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 border-teal-200 dark:border-teal-500/30 border';
    case 'Canceled': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 border';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 border';
  }
};
const getCRMClientTypeStyle = (type) => {
  if (type === 'Agency') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
  if (type === 'Direct Client' || type === 'Brand/Company') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
};
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (<p key={index} className="text-sm font-black" style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value)}</p>))}
      </div>
    );
  }
  return null;
}

const generateZatcaTLV = (sellerName, vatNo, timestamp, total, vatTotal) => {
  const getTLVBuffer = (tag, value) => {
    const valueBytes = new TextEncoder().encode(value);
    const lengthByte = new Uint8Array([valueBytes.length]);
    const tagByte = new Uint8Array([tag]);
    const buffer = new Uint8Array(tagByte.length + lengthByte.length + valueBytes.length);
    buffer.set(tagByte, 0); buffer.set(lengthByte, tagByte.length); buffer.set(valueBytes, tagByte.length + lengthByte.length);
    return buffer;
  };
  const tlv1 = getTLVBuffer(1, sellerName);
  const tlv2 = getTLVBuffer(2, vatNo);
  const tlv3 = getTLVBuffer(3, timestamp);
  const tlv4 = getTLVBuffer(4, String(total));
  const tlv5 = getTLVBuffer(5, String(vatTotal));
  const totalLength = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  [tlv1, tlv2, tlv3, tlv4, tlv5].forEach(buf => { result.set(buf, offset); offset += buf.length; });
  let binary = '';
  const bytes = new Uint8Array(result);
  for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
};

const App = () => {
  const handleToggleTaskComplete = async (taskId, currentStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), {
        isCompleted: !currentStatus
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const [user, setUser] = useState(null);

  // 1. Session State
  const [activeUserSession, setActiveUserSession] = useState(() => { 
    if (typeof window !== 'undefined') { const stored = localStorage.getItem('erp_active_user'); return stored ? JSON.parse(stored) : null; } 
    return null; 
  });

  // 2. App Lock States
  const [isAppUnlocked, setIsAppUnlocked] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem('erp_unlocked') === 'true'; return false; });
  const [appPinInput, setAppPinInput] = useState(''); const [appPinError, setAppPinError] = useState(false);
  const [adminAuth, setAdminAuth] = useState({ isOpen: false, callback: null }); const [adminPinInput, setAdminPinInput] = useState(''); const [adminPinError, setAdminPinError] = useState(false);

  // 3. UI States
  const [isDarkMode, setIsDarkMode] = useState(() => { if (typeof window !== 'undefined') { const storedTheme = localStorage.getItem('erp_theme'); if (storedTheme) return storedTheme === 'dark'; if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true; } return false; });
  const [activeTab, setActiveTab] = useState('dashboard'); const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024); const [showOnlyDueSales, setShowOnlyDueSales] = useState(false); const [showOnlyDuePurchases, setShowOnlyDuePurchases] = useState(false);
  const [hideZeroAging, setHideZeroAging] = useState(true); const [searchTerm, setSearchTerm] = useState(''); const [isNotifOpen, setIsNotifOpen] = useState(false); const notifRef = useRef(null);
  const [voiceActionPrompt, setVoiceActionPrompt] = useState(null);
  const [viewReceiptModal, setViewReceiptModal] = useState({ isOpen: false, image: null });
  const [lockNotifications, setLockNotifications] = useState([]);

  // 4. Data States
  const [customers, setCustomers] = useState([]); 
  const [suppliers, setSuppliers] = useState([]); 
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]); 
  const [purchases, setPurchases] = useState([]); 
  const [quotations, setQuotations] = useState([]);
  const [collections, setCollections] = useState([]); 
  const [expenses, setExpenses] = useState([]); 
  const [salesmen, setSalesmen] = useState([]); 
  const [crms, setCrms] = useState([]);
  const [crmDropdownOpen, setCrmDropdownOpen] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMessages, setTeamMessages] = useState([]);
  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
  const [newTeamMessage, setNewTeamMessage] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [mentionSearch, setMentionSearch] = useState(null);
  const [unreadTeamCount, setUnreadTeamCount] = useState(0);

  // Estimator & Form States
  const [formError, setFormError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatorItems, setEstimatorItems] = useState([]); const [showEstimatorDB, setShowEstimatorDB] = useState(false); const [estimateCart, setEstimateCart] = useState([]);
  const [calcForm, setCalcForm] = useState({ category: '', itemId: '', desc: '', width: '', height: '', thickness: '', minutes: '', qty: 1, matrixSize: '', matrixThick: '', isCustomMatrix: false });
  const [manualEstimateTotal, setManualEstimateTotal] = useState(''); const [estimatorPushModal, setEstimatorPushModal] = useState({ isOpen: false, type: '', customerId: '' });
  const [settings, setSettings] = useState({ companyName: '', taxId: '', phone: '', email: '', address: '', logo: '', printLogo: '' });
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null }); const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, type: '', id: null, title: '' });
  const [printDoc, setPrintDoc] = useState({ isOpen: false, type: '', data: null }); const [formData, setFormData] = useState({}); const [invoiceItems, setInvoiceItems] = useState([]);
  const [dbError, setDbError] = useState(false); const collapsed = isDesktop && !isSidebarHovered;
  const [invoiceChoiceModal, setInvoiceChoiceModal] = useState({ isOpen: false, saleData: null, customerEntity: null });

  // 5. Call States & Sound Control (Professional)
  const [showCallChoiceModal, setShowCallChoiceModal] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomId, setCallRoomId] = useState('');
  const [incomingCallAlert, setIncomingCallAlert] = useState(null);

  const stopRingtone = () => {
    const ringtoneEl = document.getElementById('phone-ringtone');
    if (ringtoneEl) {
      ringtoneEl.pause();
      ringtoneEl.currentTime = 0;
    }
  };

  const playRingtone = () => {
    const ringtoneEl = document.getElementById('phone-ringtone');
    if (ringtoneEl) {
      ringtoneEl.currentTime = 0;
      ringtoneEl.play().catch(e => console.log("Audio play blocked:", e));
    }
  };

  const showLockNotification = (title, message) => {
    const id = Date.now();
    setLockNotifications((prev) => [{ id, title, message }, ...prev]); 
  };

  const removeNotification = (id) => {
    setLockNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 🌟 Firebase Real-time Data Sync
  useEffect(() => {
    if (!user || !isAppUnlocked) return;

    const unsubs = [
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), (snap) => {
        setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'suppliers'), (snap) => {
        setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), (snap) => {
        setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'purchases'), (snap) => {
        setPurchases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'quotations'), (snap) => {
        setQuotations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'collections'), (snap) => {
        setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), (snap) => {
        setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'salesmen'), (snap) => {
        setSalesmen(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'crms'), (snap) => {
        setCrms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), (snap) => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'estimator_items'), (snap) => {
        setEstimatorItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'team_chats'), (snap) => {
        setTeamMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'profile'), (snap) => {
        if (snap.exists()) setSettings(snap.data());
      }),
      // 🌟 Real-time Active Call Listener & Smart Auto-Mute
      onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'active_call'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const isTargetMe = !data.targetUserId || data.targetUserId === activeUserSession?.id || data.targetUserName === activeUserSession?.name;
          const isCallerMe = data.callerName === activeUserSession?.name;

          if (data && !isCallerMe && isTargetMe && !isInCall) {
            setIncomingCallAlert(data);
            playRingtone();
          } else if (!data || isInCall) {
            setIncomingCallAlert(null);
            stopRingtone();
          }
        } else {
          setIncomingCallAlert(null);
          stopRingtone();
        }
      })
    ];

    return () => { unsubs.forEach(unsub => unsub()); };
  }, [user, isAppUnlocked, activeUserSession, isInCall]);

  // Professional Call Starter
  const startVideoCall = async (mode = 'room', targetUser = null, callType = 'video') => {
    let roomId = "OXAD-TEAM-MEETING"; 
    const myName = activeUserSession?.name || 'User';

    if (mode === 'direct' && targetUser) {
      const otherName = targetUser.name || 'Member';
      roomId = `OXAD-CALL-${[myName, otherName].sort().join('-')}`;
    }

    const callData = {
      roomId: roomId,
      callerName: myName,
      callerId: activeUserSession?.id || 'admin',
      callType: callType,
      mode: mode,
      targetUserId: targetUser ? targetUser.id : null,
      targetUserName: targetUser ? targetUser.name : null,
      timestamp: Date.now()
    };

    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'active_call'), callData); } 
    catch(e) { console.error("Error setting call doc:", e); }

    stopRingtone(); 
    setCallRoomId(roomId);
    setIsInCall(true);
  };

  const handleEndCall = async () => {
    stopRingtone();
    setIsInCall(false);
    setIncomingCallAlert(null);
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'active_call')); } 
    catch(e) {}
  };

  const handleUserSelect = (selectedUser) => {
    setActiveUserSession(selectedUser);
    localStorage.setItem('erp_active_user', JSON.stringify(selectedUser));
  };

  const handleSwitchUser = () => {
    setActiveUserSession(null);
    localStorage.removeItem('erp_active_user');
  };

  // Auth, Tokens & Presence Setup
  const teamChatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const prevMsgCount = useRef(0);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', handleResize);
    const initAuth = async () => { try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } else { await signInAnonymously(auth); } } catch (err) { console.error("Auth error:", err); } };
    initAuth(); const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => { window.removeEventListener('resize', handleResize); unsubscribe(); };
  }, []);

  useEffect(() => { const root = window.document.documentElement; if (isDarkMode) { root.classList.add('dark'); localStorage.setItem('erp_theme', 'dark'); } else { root.classList.remove('dark'); localStorage.setItem('erp_theme', 'light'); } }, [isDarkMode]);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Auto Lock Inactivity Timer
  useEffect(() => {
    if (!isAppUnlocked || !isDesktop) return; 
    let timer; 
    const resetTimer = () => { 
      clearTimeout(timer); 
      timer = setTimeout(() => { 
        setIsAppUnlocked(false); 
        localStorage.removeItem('erp_unlocked'); 
      }, 60 * 60 * 1000); 
    }; 
    window.addEventListener('mousemove', resetTimer); 
    window.addEventListener('keypress', resetTimer); 
    window.addEventListener('click', resetTimer); 
    resetTimer(); 
    return () => { 
      window.removeEventListener('mousemove', resetTimer); 
      window.removeEventListener('keypress', resetTimer); 
      window.removeEventListener('click', resetTimer); 
      clearTimeout(timer); 
    };
  }, [isAppUnlocked, isDesktop]);

  const handleAppUnlock = (e) => { e.preventDefault(); if (appPinInput === APP_PIN) { setIsAppUnlocked(true); localStorage.setItem('erp_unlocked', 'true'); setAppPinError(false); } else { setAppPinError(true); setAppPinInput(''); } };
  const handleManualLock = () => { setIsAppUnlocked(false); setActiveUserSession(null); localStorage.removeItem('erp_unlocked'); localStorage.removeItem('erp_active_user'); setAppPinInput(''); };

  const requestAdminAuth = (callback) => { setAdminAuth({ isOpen: true, callback }); setAdminPinInput(''); setAdminPinError(false); };
  const handleAdminAuthSubmit = (e) => { e.preventDefault(); if (adminPinInput === ADMIN_PIN) { if (adminAuth.callback) adminAuth.callback(); setAdminAuth({ isOpen: false, callback: null }); } else { setAdminPinError(true); setAdminPinInput(''); } };
  const triggerDelete = (type, id, title) => { requestAdminAuth(() => { setConfirmDelete({ isOpen: true, type, id, title }); }); };

  // Analytics & Aggregations
  const analytics = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0); const totalPurchases = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
    const totalCollections = collections.reduce((acc, c) => acc + (Number(c.amount) || 0), 0); const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    return { totalSales, totalPurchases, totalCollections, totalExpenses, outstandingReceivables: totalSales - totalCollections, netProfit: totalSales - totalPurchases - totalExpenses };
  }, [sales, purchases, collections, expenses]);

  const dashboardAlerts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const alerts = [];

    sales.forEach(s => {
      const paid = collections.filter(c => c.ref === s.invoiceNo).reduce((a,b)=>a+Number(b.amount), 0);
      const pending = (Number(s.grandTotal) || 0) - paid;
      if (pending > 0 && s.date === today) {
        alerts.push({ id: s.id, type: 'payment', title: `Payment Due: ${s.customerName}`, desc: `SAR ${pending} pending for invoice ${s.invoiceNo}` });
      }
    });

    tasks.forEach(t => {
      if (t.dueDate === today && !t.isCompleted) {
        alerts.push({ id: t.id, type: 'task', title: `⚠️ Reminder: ${t.title}`, desc: 'This task is due today! Action required.' });
      }
    });

    return alerts;
  }, [sales, collections, tasks]);

  const monthlyTrends = useMemo(() => {
    const map = {};
    const process = (arr, key) => { arr.forEach(item => { if(!item.date) return; const d = new Date(item.date); const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; if(!map[sortKey]) map[sortKey] = { sortKey, name: d.toLocaleString('default', { month: 'long' }), sales: 0, purchases: 0 }; map[sortKey][key] += Number(item.grandTotal) || 0; }); };
    process(sales, 'sales'); process(purchases, 'purchases');
    return Object.values(map).sort((a,b) => a.sortKey.localeCompare(b.sortKey)).slice(-12);
  }, [sales, purchases]);

  const calculateAging = (invoices, payments) => {
    const bins = { 'No Due yet': 0, '0 - 30 Days': 0, '31 - 60 Days': 0, '61 - 90 Days': 0, '91 - 120 Days': 0, '120 +': 0 }; const today = new Date();
    invoices.forEach(inv => {
        const paid = payments.filter(p => p.ref === inv.invoiceNo || p.description === inv.invoiceNo).reduce((a,b)=>a+Number(b.amount), 0); const pending = Number(inv.grandTotal) - paid;
        if (pending > 0 && inv.date) {
            const diffDays = Math.floor((today - new Date(inv.date)) / (1000 * 60 * 60 * 24));
            if (diffDays <= 0) bins['No Due yet'] += pending; else if (diffDays <= 30) bins['0 - 30 Days'] += pending; else if (diffDays <= 60) bins['31 - 60 Days'] += pending; else if (diffDays <= 90) bins['61 - 90 Days'] += pending; else if (diffDays <= 120) bins['91 - 120 Days'] += pending; else bins['120 +'] += pending;
        }
    });
    return Object.keys(bins).map((key, index) => ({ name: key, amount: bins[key], color: AGING_COLORS[index] }));
  };

  const agingReceivables = useMemo(() => calculateAging(sales, collections), [sales, collections]);
  const agingPayables = useMemo(() => calculateAging(purchases, expenses), [purchases, expenses]);
  const topCustomersData = useMemo(() => { const map = {}; sales.forEach(s => { if(!map[s.customerName]) map[s.customerName] = 0; map[s.customerName] += Number(s.grandTotal); }); return Object.entries(map).map(([name, amount]) => ({ name: name || 'Unknown', amount })).sort((a,b) => b.amount - a.amount).slice(0, 5); }, [sales]);
  const topSuppliersData = useMemo(() => { const map = {}; purchases.forEach(p => { if(!map[p.supplierName]) map[p.supplierName] = 0; map[p.supplierName] += Number(p.grandTotal); }); return Object.entries(map).map(([name, amount]) => ({ name: name || 'Unknown', amount })).sort((a,b) => b.amount - a.amount).slice(0, 5); }, [purchases]);
  const vatData = useMemo(() => { const outputVat = sales.reduce((acc, s) => acc + (Number(s.taxTotal) || 0), 0); const inputVat = purchases.reduce((acc, p) => acc + (Number(p.taxTotal) || 0), 0); const payable = outputVat - inputVat; return [{ name: 'Input Vat', value: inputVat }, { name: 'Output Vat', value: outputVat }, { name: 'Vat Payable', value: payable > 0 ? payable : 0 }]; }, [sales, purchases]);
  const topProductsData = useMemo(() => { const map = {}; sales.forEach(s => { if(s.items) { s.items.forEach(item => { if(!map[item.name]) map[item.name] = 0; map[item.name] += Number(item.total); }); }}); return Object.entries(map).map(([name, value]) => ({ name: name || 'Unknown', value })).sort((a,b) => b.value - a.value).slice(0, 5); }, [sales]);

  const notifications = useMemo(() => {
    const notifs = [];
    products.forEach(p => { if (Number(p.stock) <= Number(p.minStock || 0)) { notifs.push({ id: `stk-${p.id}`, type: 'warning', icon: AlertTriangle, title: 'Low Stock Alert', desc: `${p.name} is running low (${p.stock} units left).` }); }});
    topCustomersData.forEach((c, idx) => { if (idx === 0 && c.amount > 0) { notifs.push({ id: `top-${idx}`, type: 'info', icon: TrendingUp, title: 'Top Performer', desc: `${c.name} is your top customer.` }); }});
    quotations.forEach(q => {
        if (q.status !== 'Converted' && q.status !== 'Dropped') {
            const diffDays = Math.floor((new Date() - new Date(q.date || (q.createdAt?.seconds ? q.createdAt.seconds * 1000 : new Date()))) / (1000 * 60 * 60 * 24));
            const salesman = salesmen.find(s=>s.id === q.salesmanId)?.name || 'Unknown Exec';
            if (diffDays >= 30 && q.status !== 'Follow Up (1 Month)') { notifs.push({ id: `q-30d-${q.id}`, type: 'warning', icon: AlertTriangle, title: 'Quote Follow-up: 1 Month', desc: `${q.quotationNo} for ${q.customerName}. Exec: ${salesman}` }); } 
            else if (diffDays >= 7 && diffDays < 30 && q.status !== 'Follow Up (1 Week)' && q.status !== 'Follow Up (1 Month)') { notifs.push({ id: `q-7d-${q.id}`, type: 'warning', icon: AlertTriangle, title: 'Quote Follow-up: 1 Week', desc: `${q.quotationNo} for ${q.customerName}. Exec: ${salesman}` }); } 
            else if (diffDays >= 2 && diffDays < 7 && q.status !== 'Follow Up (48 Hrs)' && q.status !== 'Follow Up (1 Week)' && q.status !== 'Follow Up (1 Month)') { notifs.push({ id: `q-2d-${q.id}`, type: 'warning', icon: AlertTriangle, title: 'Quote Follow-up: 48 Hours', desc: `${q.quotationNo} for ${q.customerName}. Exec: ${salesman}` }); }
        }
    });
    return notifs;
  }, [products, topCustomersData, quotations, salesmen]);

  const openModal = (type, data = null) => {
    const executeOpen = () => {
      setFormError(''); 
      setFormData(data ? { ...data } : { 
        name: '', phone: '', email: '', gst: '', openingBalance: '', category: '', stock: '', purchasePrice: '', sellingPrice: '', tax: '', minStock: '', amount: '', method: '', description: '', ref: '', rate: '', timeRate: '', calcType: 'Area', tiers: [], thicknessTiers: [], 
        title: '', dueDate: new Date().toISOString().split('T')[0]
      });
      if (['sale', 'purchase', 'crm', 'quotation'].includes(type)) { setInvoiceItems(data?.items || [{ productId: '', name: '', description: '', qty: 1, rate: 0, tax: 0, total: 0 }]); }
      setModalState({ isOpen: true, type, data });
    };
    if (data && type !== 'estimatorItem') { requestAdminAuth(executeOpen); } else { executeOpen(); }
  };
      
  const closeModal = () => { setModalState({ isOpen: false, type: null, data: null }); setFormData({}); setInvoiceItems([]); setFormError(''); setIsSubmitting(false); };

  const handleDuplicateItem = (type, item) => {
    const clonedItem = cleanObject({ ...item });
    delete clonedItem.id;
    delete clonedItem.invoiceNo;
    delete clonedItem.quotationNo;
    delete clonedItem.jobId;
    delete clonedItem.createdAt;
    clonedItem.date = new Date().toISOString().split('T')[0];
    if (type === 'crm') {
        clonedItem.workStatus = 'Work Onboarded';
        clonedItem.invoicingStatus = 'Not invoiced';
        clonedItem.collectionStatus = 'Pending';
    } else if (type === 'quotation') {
        clonedItem.status = 'Draft';
    }
    openModal(type, clonedItem);
  };

  const handlePushToInvoice = (crmItem) => {
    setActiveTab('sales'); openModal('sale', { customerId: crmItem.customerId || '', customerName: crmItem.customerName || '', partyName: crmItem.customerName || '', salesmanId: crmItem.salesmanId || '', linkedJobId: crmItem.id, date: new Date().toISOString().split('T')[0], items: crmItem.items && crmItem.items.length > 0 ? crmItem.items.map(i => ({...i, tax: 0})) : [{ productId: '', name: 'CUSTOM JOB', description: crmItem.description || '', qty: 1, rate: 0, tax: 0, total: 0 }] }); 
  };

  const handlePushQuoteTo = (quote, target) => {
    setActiveTab(target === 'sale' ? 'sales' : 'crm'); openModal(target, { customerId: quote.customerId, customerName: quote.customerName, partyName: quote.partyName, salesmanId: quote.salesmanId, items: quote.items ? quote.items.map(i => ({...i, tax: target === 'crm' ? 0 : i.tax})) : [], linkedQuoteId: quote.id, date: new Date().toISOString().split('T')[0] });
  };

  const handleEstimatorPushSubmit = (e) => {
      e.preventDefault(); const customer = customers.find(c => c.id === estimatorPushModal.customerId); if(!customer) return;
      const formattedItems = estimateCart.map((item) => ({ productId: '', name: `${item.name}`, description: `[${item.category}] ${item.specs}${item.desc ? `\nNote: ${item.desc}` : ''}`, qty: item.qty, rate: Number((item.totalPrice / item.qty).toFixed(2)), tax: 0, total: item.totalPrice }));
      setActiveTab(estimatorPushModal.type === 'crm' ? 'crm' : estimatorPushModal.type === 'invoice' ? 'sales' : 'quotations');
      openModal(estimatorPushModal.type === 'invoice' ? 'sale' : estimatorPushModal.type, { customerId: customer.id, customerName: customer.name, partyName: customer.name, date: new Date().toISOString().split('T')[0], items: formattedItems });
      setEstimatorPushModal({isOpen: false, type: '', customerId: ''});
  };

  const handleQuickPayment = (item, type, pendingAmount) => {
    if (type === 'sale') { setFormData({ customerId: item.customerId || '', customerName: item.customerName || '', partyName: item.customerName || '', ref: item.invoiceNo || '', amount: pendingAmount > 0 ? pendingAmount : 0, date: new Date().toISOString().split('T')[0] }); setModalState({ isOpen: true, type: 'collection', data: null }); } 
    else if (type === 'purchase') { setFormData({ supplierId: item.supplierId || '', supplierName: item.supplierName || '', partyName: item.supplierName || '', description: item.invoiceNo || '', amount: pendingAmount > 0 ? pendingAmount : 0, date: new Date().toISOString().split('T')[0] }); setModalState({ isOpen: true, type: 'expense', data: null }); }
  };

  const generateLedger = (type, entity, ledgerVariant = 'standard') => {
    let rows = []; let balance = Number(entity.openingBalance) || 0; let entityTypeTitle = type;
    if (type === 'customer') {
        rows.push({ date: '-', ref: 'OP-BAL', desc: 'Opening Balance', debit: balance > 0 ? balance : 0, credit: balance < 0 ? Math.abs(balance) : 0, balance, rawDate: new Date(0) });
        const s = sales.filter(x => x.customerId === entity.id).map(x => ({ date: x.date, ref: x.invoiceNo, desc: 'Sales Invoice', debit: Number(x.grandTotal), credit: 0, rawDate: new Date(x.date) }));
        const c = collections.filter(x => x.customerId === entity.id).map(x => ({ date: x.date, ref: x.ref || 'PAYMENT', desc: x.method || 'Collection Received', debit: 0, credit: Number(x.amount), rawDate: new Date(x.date) }));
        [...s, ...c].sort((a,b) => a.rawDate - b.rawDate).forEach(r => { balance = balance + r.debit - r.credit; rows.push({ ...r, balance }); });
    } else if (type === 'supplier') {
        rows.push({ date: '-', ref: 'OP-BAL', desc: 'Opening Balance', debit: balance < 0 ? Math.abs(balance) : 0, credit: balance > 0 ? balance : 0, balance, rawDate: new Date(0) });
        const p = purchases.filter(x => x.supplierId === entity.id).map(x => ({ date: x.date, ref: x.invoiceNo, desc: 'Purchase Order', debit: 0, credit: Number(x.grandTotal), rawDate: new Date(x.date) }));
        const e = expenses.filter(x => x.partyName === entity.name || x.supplierName === entity.name).map(x => ({ date: x.date, ref: x.ref || x.description || 'PAYMENT', desc: x.method || 'Payment Sent', debit: Number(x.amount), credit: 0, rawDate: new Date(x.date) }));
        [...p, ...e].sort((a,b) => a.rawDate - b.rawDate).forEach(r => { balance = balance - r.debit + r.credit; rows.push({ ...r, balance }); });
    } else if (type === 'salesman') {
        if (ledgerVariant === 'cash') {
            entityTypeTitle = 'Cash In Hand'; balance = 0; 
            const c = collections.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.ref || 'PAYMENT', desc: `Collected from ${x.customerName || '--'}`, debit: Number(x.amount), credit: 0, rawDate: new Date(x.date) }));
            const e = expenses.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.description || 'EXPENSE', desc: `Paid for ${x.partyName || x.description || '--'}`, debit: 0, credit: Number(x.amount), rawDate: new Date(x.date) }));
            [...c, ...e].sort((a,b) => a.rawDate - b.rawDate).forEach(r => { balance = balance + r.debit - r.credit; rows.push({ ...r, balance }); });
        } else {
            entityTypeTitle = 'Performance'; balance = 0;
            const s = sales.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.invoiceNo, desc: `Sale (${x.customerName})`, debit: Number(x.grandTotal), credit: 0, rawDate: new Date(x.date) }));
            const c = collections.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.ref || 'PAYMENT', desc: `Collection (${x.customerName})`, debit: 0, credit: Number(x.amount), rawDate: new Date(x.date) }));
            [...s, ...c].sort((a,b) => a.rawDate - b.rawDate).forEach(r => { balance = balance + r.debit - r.credit; rows.push({ ...r, balance }); });
        }
    }
    setModalState({ isOpen: true, type: 'ledger', data: { entity, entityType: entityTypeTitle, rows } });
  };

  const handleStatusChange = (id, field, value, collectionName = 'crms') => { requestAdminAuth(async () => { if(!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), { [field]: value }); } catch(e) { console.error("Error updating status", e); } }); };

  const handleWhatsAppShare = async (docType, data) => {
    const compName = settings?.companyName || 'Oxad BS Co.';
    
    const targetEntity = customers.find(c => c.id === data.customerId) || 
                         suppliers.find(s => s.id === data.supplierId) || 
                         customers.find(c => c.name === data.customerName || c.name === data.name) || 
                         suppliers.find(s => s.name === data.supplierName || s.name === data.name);

    let rawPhone = data.phone || data.entity?.phone || targetEntity?.phone || '';
    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('05')) {
      cleanPhone = '966' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      cleanPhone = '966' + cleanPhone;
    }

    const clientName = data.customerName || data.name || data.supplierName || data.entity?.name || 'Valued Client';
    let message = '';

    if (docType === 'sale') {
      const refNo = data.invoiceNo || 'INV';
      const totalAmt = formatCurrency(data.grandTotal || 0);
      message = `*${compName}* - *Tax Invoice*\n\nHello *${clientName}*,\nYour Tax Invoice *${refNo}* has been generated.\n\n*Total Amount:* ${totalAmt}\n*Date:* ${data.date || 'Today'}\n\nKindly review and settle the payment. Thank you!`;
    } else if (docType === 'quotation') {
      const refNo = data.quotationNo || 'QUOTE';
      const totalAmt = formatCurrency(data.grandTotal || 0);
      message = `*${compName}* - *Price Quotation*\n\nHello *${clientName}*,\nHere is your quotation *${refNo}*.\n\n*Quoted Amount:* ${totalAmt}\n*Date:* ${data.date || 'Today'}\n\nPlease let us know your feedback. Thank you!`;
    } else if (docType === 'collection') {
      const refNo = data.ref || 'RECEIPT';
      const paidAmt = formatCurrency(data.amount || 0);
      message = `*${compName}* - *Payment Receipt*\n\nHello *${clientName}*,\nWe have successfully received your payment of *${paidAmt}* (Ref: ${refNo}).\n\nThank you for your business!`;
    } else {
      const dueAmt = formatCurrency(data.totalDue || data.grandTotal || data.amount || 0);
      message = `*${compName}* - *Statement Reminder*\n\nHello *${clientName}*,\nThis is a gentle reminder regarding your balance of *${dueAmt}*.\n\nThank you!`;
    }

    if (navigator.canShare && navigator.share) {
      try {
        const element = document.getElementById('printable-area');
        if (element && window.html2pdf) {
          const pdfBlob = await window.html2pdf().from(element).outputPdf('blob');
          const file = new File([pdfBlob], `${docType.toUpperCase()}_${data.invoiceNo || data.quotationNo || 'DOC'}.pdf`, { type: 'application/pdf' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${compName} Document`,
              text: message,
              files: [file],
            });
            return;
          }
        }
      } catch (err) {
        console.log("Share API fallback to URL:", err);
      }
    }

    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  const handleEmailShare = (docType, data) => {
    const compName = 'Oxad BS Co.';
    const refNo = data.invoiceNo || data.quotationNo || 'DOC';
    const totalAmt = formatCurrency(data.grandTotal || data.totalPrice || 0);
    const clientName = data.customerName || data.supplierName || 'Valued Client';
    const email = data.email || data.entity?.email || '';

    const subject = `${compName} - ${docType.toUpperCase()} (${refNo})`;
    const body = `Hello ${clientName},\n\nPlease find the details regarding ${docType} (${refNo}).\nTotal Amount: ${totalAmt}\n\nThank you,\n${compName}`;

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handleBulkExcelImport = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.XLSX) { 
      await new Promise((resolve) => { 
        const script = document.createElement('script'); 
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; 
        script.onload = resolve; 
        document.head.appendChild(script); 
      }); 
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = window.XLSX.utils.sheet_to_json(worksheet);

        if (!jsonRows || jsonRows.length === 0) {
          alert("Excel file is empty or formatted incorrectly.");
          return;
        }

        const colMap = { 'customer': 'customers', 'supplier': 'suppliers', 'product': 'products', 'task': 'tasks' };
        const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', colMap[type]);
        const batch = writeBatch(db);
        let count = 0;

        jsonRows.forEach(row => {
          let payload = {};
          if (type === 'customer' || type === 'supplier') {
            payload = cleanObject({
              name: String(row.Name || row.name || ''),
              phone: String(row.Phone || row.phone || ''),
              email: String(row.Email || row.email || ''),
              gst: String(row.Gst || row.gst || row.Tax || ''),
              openingBalance: Number(row.OpeningBalance || row.openingBalance || 0),
              createdAt: serverTimestamp()
            });
          } else if (type === 'product') {
            payload = cleanObject({
              name: String(row.Name || row.name || ''),
              category: String(row.Category || row.category || 'General'),
              stock: Number(row.Stock || row.stock || 0),
              purchasePrice: Number(row.PurchasePrice || row.purchasePrice || 0),
              sellingPrice: Number(row.SellingPrice || row.sellingPrice || 0),
              tax: Number(row.Tax || row.tax || 0),
              minStock: Number(row.MinStock || row.minStock || 5),
              createdAt: serverTimestamp()
            });
          }

          if (payload.name) {
            const newDocRef = doc(collectionRef);
            batch.set(newDocRef, payload);
            count++;
          }
        });

        await batch.commit();
        alert(`Successfully imported ${count} ${type}s!`);
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to import excel file. Please check format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  const handleSave = async (e) => {
    e.preventDefault(); if (!user || isSubmitting) return; const { type, data } = modalState; const isEdit = !!data?.id;
    if (type === 'customer' || type === 'supplier') {
        const listToCheck = type === 'customer' ? customers : suppliers; const inputName = String(formData.name || '').trim().toLowerCase();
        if (listToCheck.find(item => String(item.name || '').trim().toLowerCase() === inputName && item.id !== data?.id)) { setFormError(`A ${type} with this name already exists. Please edit the existing one to avoid duplicates.`); return; }
    }
    setIsSubmitting(true); setFormError('');
    const colMap = { 'salesman': 'salesmen', 'customer': 'customers', 'supplier': 'suppliers', 'product': 'products', 'sale': 'sales', 'purchase': 'purchases', 'collection': 'collections', 'expense': 'expenses', 'crm': 'crms', 'estimatorItem': 'estimator_items', 'quotation': 'quotations', 'task': 'tasks' };
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', colMap[type]); 
    let payload = cleanObject({ ...formData, createdBy: activeUserSession?.name || 'System Admin' });

    try {
      if (['sale', 'purchase', 'crm', 'quotation'].includes(type)) {
        const subTotal = invoiceItems.reduce((acc, item) => acc + (Number(item.qty) * Number(item.rate)), 0);
        const taxTotal = invoiceItems.reduce((acc, item) => acc + ((Number(item.qty) * Number(item.rate) * Number(item.tax)) / 100), 0);
        const discount = Number(payload.discount) || 0;
        payload = cleanObject({ ...payload, items: invoiceItems, subTotal, taxTotal, grandTotal: subTotal + taxTotal - discount, date: payload.date || new Date().toISOString().split('T')[0] });

        if (!isEdit && (type === 'sale' || type === 'purchase')) payload.invoiceNo = generateID(type === 'sale' ? 'INV' : 'PUR', type === 'sale' ? sales.length : purchases.length);
        if (!isEdit && type === 'crm') { payload.jobId = generateID('JB', crms.length); payload.workStatus = 'Work Onboarded'; payload.invoicingStatus = 'Not invoiced'; payload.collectionStatus = 'Pending'; }
        if (!isEdit && type === 'quotation') { payload.quotationNo = generateID('QTE', quotations.length); payload.status = 'Draft'; }

        if (type === 'sale' || type === 'purchase') {
            const batch = writeBatch(db);
            invoiceItems.forEach(item => { if (item.productId) { batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'products', item.productId), { stock: increment(type === 'sale' ? -Number(item.qty) : Number(item.qty)) }); } });
            batch.set(isEdit ? doc(collectionRef, data.id) : doc(collectionRef), { ...payload, createdAt: isEdit ? data.createdAt : serverTimestamp() }, { merge: true });
            await batch.commit();
        } else {
            if (isEdit) { await updateDoc(doc(collectionRef, data.id), payload); } else { await addDoc(collectionRef, { ...payload, createdAt: serverTimestamp() }); }
        }
      } else {
        if (isEdit) { await updateDoc(doc(collectionRef, data.id), payload); } else { await addDoc(collectionRef, { ...payload, createdAt: serverTimestamp() }); }
      }
      closeModal();
    } catch (error) { console.error("Save error:", error); setFormError("Failed to save. Please try again."); } finally { setIsSubmitting(false); }
  };

  const handleSettingsSave = (e) => { e.preventDefault(); requestAdminAuth(async () => { if (!user) return; try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'profile'), cleanObject(settings), { merge: true }); setSettingsSuccess(true); setTimeout(() => setSettingsSuccess(false), 3000); } catch (err) { console.error(err); } }); };
  const handleImageUpload = (e, logoType) => { 
    const file = e.target.files[0]; 
    if (file) { 
      const reader = new FileReader(); 
      reader.onloadend = () => setSettings(prev => ({ ...prev, [logoType]: reader.result })); 
      reader.readAsDataURL(file); 
    } 
  };
  
  const executeDelete = async () => {
    if (!confirmDelete.id || !confirmDelete.type || !user) return;
    try {
      const colMap = { 'salesman': 'salesmen', 'customer': 'customers', 'supplier': 'suppliers', 'product': 'products', 'sale': 'sales', 'purchase': 'purchases', 'collection': 'collections', 'expense': 'expenses', 'crm': 'crms', 'estimatorItem': 'estimator_items', 'quotation': 'quotations', 'task': 'tasks' };
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colMap[confirmDelete.type], confirmDelete.id)); setConfirmDelete({ isOpen: false, type: '', id: null, title: '' });
    } catch (e) { console.error("Delete Error", e); }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceItems]; newItems[index][field] = value;
    if (field === 'productId') { const prod = products.find(p => p.id === value); if (prod) { newItems[index].name = prod.name; newItems[index].rate = (modalState.type === 'sale' || modalState.type === 'quotation') ? prod.sellingPrice : prod.purchasePrice; newItems[index].tax = prod.tax || 0; } }
    const qty = Number(newItems[index].qty) || 0; const rate = Number(newItems[index].rate) || 0; const tax = Number(newItems[index].tax) || 0;
    newItems[index].total = (qty * rate) + ((qty * rate * tax) / 100); setInvoiceItems(newItems);
  };

  const removeRow = (indexToRemove) => { setInvoiceItems(invoiceItems.filter((_, index) => index !== indexToRemove)); };
  const handleTierChange = (index, field, value) => { const newTiers = [...(formData.tiers || [])]; newTiers[index][field] = Number(value) || 0; setFormData({...formData, tiers: newTiers}); };
  const addTier = () => { setFormData({...formData, tiers: [...(formData.tiers || []), { minQty: 1, price: 0 }]}); };
  const removeTier = (index) => { const newTiers = [...(formData.tiers || [])]; newTiers.splice(index, 1); setFormData({...formData, tiers: newTiers}); };

  const calculateEstimateItemTotal = (itemDb, form) => {
    if(!itemDb) return { total: 0, specs: '' };
    const q = Number(form.qty) || 1;
    if(itemDb.calcType === 'Standard_Matrix') {
        const mThick = form.matrixThick; if (!mThick) return { total: 0, specs: 'Please Select Thickness' };
        if (form.isCustomMatrix) {
            const w = Number(form.width) || 0; const h = Number(form.height) || 0;
            if (w === 0 || h === 0) return { total: 0, specs: 'Enter Dimensions' };
            const customArea = w * h; let lower = MATRIX_AREAS[0]; let upper = MATRIX_AREAS[MATRIX_AREAS.length - 1]; let unitPrice = 0;
            if (customArea <= lower.area) { unitPrice = (customArea / lower.area) * STANDARD_MATRIX[lower.label][mThick]; } 
            else if (customArea >= upper.area) { unitPrice = (customArea / upper.area) * STANDARD_MATRIX[upper.label][mThick]; } 
            else {
                for (let i = 0; i < MATRIX_AREAS.length - 1; i++) { if (customArea >= MATRIX_AREAS[i].area && customArea <= MATRIX_AREAS[i+1].area) { lower = MATRIX_AREAS[i]; upper = MATRIX_AREAS[i+1]; break; } }
                const priceLow = STANDARD_MATRIX[lower.label][mThick]; const priceHigh = STANDARD_MATRIX[upper.label][mThick];
                unitPrice = priceLow + ((customArea - lower.area) / (upper.area - lower.area)) * (priceHigh - priceLow);
            }
            return { total: unitPrice * q, specs: `Custom Size ${w}x${h}cm (${mThick}mm)` };
        } else {
            const mSize = form.matrixSize;
            if(STANDARD_MATRIX[mSize] && STANDARD_MATRIX[mSize][mThick]) { return { total: STANDARD_MATRIX[mSize][mThick] * q, specs: `Standard ${mSize} (${mThick}mm)` }; }
            return { total: 0, specs: 'Select Standard Size' };
        }
    }
    if(itemDb.calcType === 'Fixed') return { total: (Number(itemDb.rate) || 0) * q, specs: `Fixed Unit` };
    if(itemDb.calcType === 'Time') return { total: (Number(form.minutes) || 0) * (Number(itemDb.rate) || 0) * q, specs: `${Number(form.minutes) || 0} Mins` };
    if(itemDb.calcType === 'Tiered') {
        let unitPrice = Number(itemDb.rate) || 0; 
        if (itemDb.tiers && itemDb.tiers.length > 0) { const matchedTier = [...itemDb.tiers].sort((a,b) => b.minQty - a.minQty).find(t => q >= t.minQty); if (matchedTier) unitPrice = matchedTier.price; }
        return { total: unitPrice * q, specs: `Tier Rate Applied: ${formatCurrency(unitPrice)}/ea` };
    }
    const w = Number(form.width) || 0; const h = Number(form.height) || 0; const sqm = (w * h) / 10000;
    if(itemDb.calcType === 'Area_Thickness' || itemDb.calcType === 'Sheet_Cut') {
        const selectedThick = Number(form.thickness); let materialRate = Number(itemDb.rate) || 0;
        if (itemDb.thicknessTiers && itemDb.thicknessTiers.length > 0) {
             const matchedTier = itemDb.thicknessTiers.find(t => Number(t.thickness) === selectedThick);
             if (matchedTier) { materialRate = sqm < 0.25 && matchedTier.smallAreaPrice ? Number(matchedTier.smallAreaPrice) : Number(matchedTier.price); }
        }
        const matCost = sqm * materialRate;
        if (itemDb.calcType === 'Sheet_Cut') { const unitTotal = matCost + ((Number(form.minutes) || 0) * (Number(itemDb.timeRate) || 0)); return { total: unitTotal * q, specs: `${w}x${h}cm (${sqm.toFixed(2)}sqm), ${selectedThick}mm, ${form.minutes || 0}mins` }; } 
        else { return { total: matCost * q, specs: `${w}x${h}cm (${sqm.toFixed(2)}sqm) x ${selectedThick}mm` }; }
    }
    return { total: sqm * (Number(itemDb.rate) || 0) * q, specs: `${w}x${h}cm (${sqm.toFixed(2)}sqm)` };
  };

  const selItemForCalc = useMemo(() => estimatorItems.find(i => i.id === calcForm.itemId), [estimatorItems, calcForm.itemId]);
  const autoResult = useMemo(() => calculateEstimateItemTotal(selItemForCalc, calcForm), [selItemForCalc, calcForm]);
  useEffect(() => { setManualEstimateTotal(autoResult.total > 0 ? autoResult.total : ''); }, [autoResult.total]);

  const handleAddEstimateToCart = (e) => {
      e.preventDefault(); if(!selItemForCalc) return;
      const finalPrice = manualEstimateTotal !== '' ? Number(manualEstimateTotal) : autoResult.total;
      if (finalPrice <= 0) return; 
      setEstimateCart([...estimateCart, { id: Date.now(), category: selItemForCalc.category, name: selItemForCalc.name, desc: calcForm.desc, specs: autoResult.specs, qty: calcForm.qty, rate: selItemForCalc.rate, totalPrice: finalPrice }]);
      setCalcForm({ category: calcForm.category, itemId: '', desc: '', width: '', height: '', thickness: '', minutes: '', qty: 1, matrixSize: '', matrixThick: '', isCustomMatrix: false });
      setManualEstimateTotal('');
  };

  const getTabDetails = (tabId) => {
    switch (tabId) {
      case 'dashboard': return { title: 'Business Overview', desc: 'Real-time Analytics & KPIs' };
      case 'crm': return { title: 'CRM & Job Tracker', desc: 'Manage Client Projects & Lifecycles' };
      case 'sales': return { title: 'Sales & Invoices', desc: 'Manage Billing & Receivables' };
      case 'quotations': return { title: 'Sales Quotations', desc: 'Manage Quotes & Follow-ups' };
      case 'purchases': return { title: 'Purchase Orders', desc: 'Manage Supplier Bills & Payables' };
      case 'collections': return { title: 'Payment Collections', desc: 'Track Received Payments' };
      case 'expenses': return { title: 'Business Expenses', desc: 'Track Outward Cashflow' };
      case 'customers': return { title: 'Customer Directory', desc: 'Manage Client Profiles & Balances' };
      case 'suppliers': return { title: 'Supplier Network', desc: 'Manage Vendor Profiles' };
      case 'customer_aging': return { title: 'Customer Aging', desc: 'Track Customer Dues by Days' };
      case 'supplier_aging': return { title: 'Supplier Aging', desc: 'Track Supplier Payables by Days' };
      case 'products': return { title: 'Inventory Management', desc: 'Manage Products & Stock Levels' };
      case 'salesmen': return { title: 'Sales Executives', desc: 'Manage Staff & Commissions' };
      case 'estimator': return { title: 'Price Estimator', desc: 'Custom Dimension Pricing Calculator' };
      case 'settings': return { title: 'System Settings', desc: 'Global Configuration & Profile' };
      case 'ai_reports': return { title: 'AI Business Insights', desc: 'Smart Analytics & Executive Summary' };
      default: return { title: 'Dashboard', desc: 'Overview' };
    }
  };

  const currentTabDetails = getTabDetails(activeTab);

  if (!isAppUnlocked) {
    return (
      <div className={`transition-colors duration-300 ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-[#0f172a] min-h-screen font-sans selection:bg-blue-500/30 flex items-center justify-center`}>
         <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center max-w-sm w-full mx-4 animate-fade-in-up">
             <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-500"><Lock size={32} /></div>
             <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2 text-center">App Locked</h2>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 text-center">Enter Global PIN to access</p>
             <form onSubmit={handleAppUnlock} className="w-full">
                 <input type="password" autoFocus required placeholder="• • • •" className={`w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-2 font-black text-center text-2xl text-slate-900 dark:text-white tracking-[1em] mb-4 focus:outline-none transition-colors ${appPinError ? 'border-rose-500/50 focus:border-rose-500' : 'border-transparent dark:border-slate-800 focus:border-blue-500'}`} value={appPinInput} onChange={e => setAppPinInput(e.target.value)} />
                 {appPinError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mb-4">Incorrect PIN</p>}
                 <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 transition-all">Unlock ERP</button>
             </form>
         </div>
      </div>
    );
  }

  if (isAppUnlocked && !activeUserSession) {
    return (
      <div className={`transition-colors duration-500 ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-[#0f172a] min-h-screen font-sans selection:bg-blue-500/30 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 dark:bg-blue-600/20 blur-[100px] rounded-full mix-blend-multiply animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/20 blur-[100px] rounded-full mix-blend-multiply animate-pulse delay-1000"></div>
        
        <div className="bg-white/70 dark:bg-[#1e293b]/70 backdrop-blur-2xl p-10 md:p-14 rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 flex flex-col items-center max-w-4xl w-full mx-4 z-10 animate-fade-in-up">
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Who is working today?</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Select your workspace profile to continue</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mt-4">
            <button onClick={() => handleUserSelect({ id: 'admin', name: 'System Admin', role: 'Director' })} className="group flex flex-col items-center p-6 bg-white dark:bg-slate-800/80 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 hover:border-indigo-400/50 transition-all duration-300">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-black dark:from-slate-600 dark:to-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-inner mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">System Admin</h3>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Director</p>
            </button>

            {salesmen.map(sm => (
              <button key={sm.id} onClick={() => handleUserSelect(sm)} className="group flex flex-col items-center p-6 bg-white dark:bg-slate-800/80 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 hover:border-blue-400/50 transition-all duration-300">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-inner mb-4 group-hover:scale-110 transition-transform">
                  {String(sm.name || 'U').charAt(0).toUpperCase()}
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate w-full text-center">{String(sm.name)}</h3>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">Executive</p>
              </button>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-3 text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm"><Sun size={20} className="hidden dark:block"/><Moon size={20} className="block dark:hidden"/></button>
            <button onClick={handleManualLock} className="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors flex items-center"><Lock size={14} className="mr-2"/> Lock App</button>
          </div>
        </div>
      </div>
    );
  }

  const renderTable = (headers, tableData, type, renderRow) => (
    <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50/50 dark:bg-[#0f172a]/50 text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 backdrop-blur-md">
            <tr>{headers.map((h, i) => <th key={`head-${i}`} className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">{String(h)}</th>)}<th className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 text-right no-print">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm font-bold text-slate-700 dark:text-slate-300">
            {tableData.length > 0 ? tableData.map(renderRow) : <tr><td colSpan={headers.length + 1} className="py-12 text-center text-slate-300 dark:text-slate-600 uppercase tracking-widest">No Records Found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`transition-colors duration-300 ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-[#0f172a] min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30`}>
      {/* Sound Elements */}
      <audio id="notification-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>
      <audio id="phone-ringtone" src="https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3" preload="auto" loop></audio>
      
      <div className="flex h-screen overflow-hidden">
        {dbError && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 no-print">
            <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl max-w-2xl w-full shadow-2xl animate-fade-in-up border-t-8 border-rose-500">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Database Access Denied</h2>
              <p className="mt-4 font-bold text-slate-600 dark:text-slate-400">Please check your Firebase Firestore Security Rules.</p>
              <button onClick={() => setDbError(false)} className="mt-6 py-4 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase text-xs">Dismiss</button>
            </div>
          </div>
        )}

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } 
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#334155' : '#cbd5e1'}; border-radius: 10px; } 
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
          .recharts-cartesian-axis-tick-value { font-weight: bold; font-size: 10px; fill: ${isDarkMode ? '#94a3b8' : '#64748b'}; }
          @media print {
            html, body { height: auto !important; overflow: visible !important; background: white !important; }
            body * { visibility: hidden; }
            .print-overlay { position: absolute !important; left: 0; top: 0; width: 100% !important; height: auto !important; background: white !important; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { position: relative !important; left: 0 !important; top: 0 !important; width: 100% !important; background-color: white !important; margin: 0 !important; padding: 10mm 15mm !important; }
            table { page-break-inside: auto; width: 100% !important; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 10mm; }
          }
        `}</style>

        <aside onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)} className={`fixed inset-y-0 left-0 bg-white dark:bg-[#1e293b] flex flex-col z-[100] transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 shadow-sm ${isMobileMenuOpen ? 'translate-x-0 w-72 p-6' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'lg:w-24 lg:p-4' : 'lg:w-72 lg:p-6'}`}>
          <div className="mb-10 mt-2 flex justify-between items-center"><CompanyLogo collapsed={collapsed} settings={settings} /><button className="lg:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}><X size={24}/></button></div>
          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            <p className={`text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-6 ${collapsed ? 'text-center' : 'px-4'}`}>Core Operations</p>
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="crm" icon={ClipboardList} label="CRM / Job Tracker" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="quotations" icon={FileSignature} label="Sales Quotations" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="sales" icon={Receipt} label="Sales Invoices" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="purchases" icon={ShoppingBag} label="Purchases" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <p className={`text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-8 ${collapsed ? 'text-center' : 'px-4'}`}>Finance Flow</p>
            <NavItem id="collections" icon={HandCoins} label="Collections" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="expenses" icon={CreditCard} label="Expenses" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="customer_aging" icon={BarChartHorizontal} label="Customer Aging" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="supplier_aging" icon={BarChartHorizontal} label="Supplier Aging" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="ai_reports" icon={Activity} label="AI Insights & Reports" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <p className={`text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-8 ${collapsed ? 'text-center' : 'px-4'}`}>Entities</p>
            <NavItem id="customers" icon={Users} label="Customers" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="suppliers" icon={Truck} label="Suppliers" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="products" icon={Package} label="Inventory" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="salesmen" icon={Briefcase} label="Sales Team" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"><NavItem id="estimator" icon={Calculator} label="Price Estimator" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} /></div>
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800"><NavItem id="settings" icon={Settings} label="Company Profile" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} /></div>
          </nav>
        </aside>

        <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 bg-slate-50 dark:bg-[#0f172a] ${isDesktop ? 'lg:pl-24' : ''}`}>
          <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 no-print">
            <div className="flex items-center space-x-4">
              <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24}/></button>
              <div className="hidden sm:flex flex-col ml-2 lg:ml-0">
                 <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{currentTabDetails.title}</h1>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{currentTabDetails.desc}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="hidden md:flex items-center bg-slate-50 dark:bg-[#0f172a] rounded-full px-4 py-2 w-80 border border-slate-200 dark:border-slate-700">
                <Search size={18} className="text-slate-400 mr-2" />
                <input type="text" placeholder="Global Entity Search..." className="bg-transparent border-none text-sm font-bold w-full focus:outline-none uppercase dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-[#0f172a] rounded-full border border-slate-100 dark:border-slate-800"><Sun size={20} className="hidden dark:block"/><Moon size={20} className="block dark:hidden"/></button>
              
              <div className="relative" ref={notifRef}>
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 text-slate-400 hover:text-blue-500">
                    <Bell size={22}/>{notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#1e293b] animate-pulse"></span>}
                  </button>
              </div>

              <div className="hidden sm:flex items-center bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700 p-1.5 pr-4 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-inner mr-3">
                  {activeUserSession?.name ? activeUserSession.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex flex-col mr-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Session</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight mt-0.5">{activeUserSession?.name || 'System Admin'}</span>
                </div>
                <button onClick={handleSwitchUser} className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Switch User">
                  <Users size={14} />
                </button>
              </div>

              <button onClick={handleManualLock} className="group relative h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-500/30 overflow-hidden transition-all hover:scale-95" title="Lock Application">
                   <Lock size={18} />
              </button>
            </div>
          </header>

          {voiceActionPrompt && (
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-fade-in-up no-print">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl"><Sparkles size={20} className="text-cyan-300 animate-spin"/></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Voice Assistant Action</p>
                  <p className="text-sm font-black uppercase tracking-wide">{voiceActionPrompt.label}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => { setActiveTab(voiceActionPrompt.tab); setVoiceActionPrompt(null); }}
                  className="px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all"
                >
                  Open {voiceActionPrompt.name} 🚀
                </button>
                <button onClick={() => setVoiceActionPrompt(null)} className="p-2 text-white/70 hover:text-white rounded-lg"><X size={18}/></button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative flex flex-col">
            {activeTab === 'dashboard' && (
              <div className="max-w-[100rem] mx-auto w-full space-y-8 animate-fade-in-up flex-1">

                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">System Reminders & Tasks</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage licenses, renewals & urgent alerts</p>
                  </div>
                  <button onClick={() => openModal('task')} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-95 transition-all flex items-center shrink-0">
                    <Plus size={14} className="mr-2"/> Add Reminder / License Date
                  </button>
                </div>

                {/* 👉 അലേർട്ട് ബാനർ */}
                {dashboardAlerts.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-[2rem] shadow-xl mb-8 animate-fade-in-up text-white no-print">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <AlertTriangle size={24} className="text-white animate-bounce" />
                      </div>
                      <div>
                        <h3 className="font-black uppercase tracking-widest text-sm">Today's Attention Required</h3>
                        <p className="text-[10px] font-bold opacity-90 uppercase">You have {dashboardAlerts.length} pending items needing action today.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {dashboardAlerts.map(alert => (
                        <div 
                          key={alert.id} 
                          onClick={() => {
                            if (alert.type === 'payment') {
                              const targetSale = sales.find(s => s.id === alert.id || s.invoiceNo === alert.desc.split(' ')[5]);
                              if (targetSale) {
                                const targetCustomer = customers.find(c => c.id === targetSale.customerId);
                                setInvoiceChoiceModal({ isOpen: true, saleData: targetSale, customerEntity: targetCustomer });
                              }
                            } else if (alert.type === 'task') {
                              const targetTask = tasks.find(t => t.id === alert.id);
                              if (targetTask) openModal('task', targetTask);
                            }
                          }}
                          className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm flex flex-col justify-between cursor-pointer hover:bg-white/20 transition-all"
                        >
                          <div>
                            <p className="font-black text-xs uppercase tracking-wide">{alert.title} 🔍</p>
                            <p className="text-[10px] font-bold opacity-80 mt-1 uppercase">{alert.desc}</p>
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>
                )}

                {/* 👉 Active Reminders & Tasks Table */}
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 mb-8 no-print">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Active Reminders & Tasks</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[9px] font-bold uppercase tracking-widest">
                      {(tasks || []).filter(t => !t.isCompleted).length} Pending
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Task / License Title</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {(tasks || []).length > 0 ? (
                          (tasks || []).map(task => (
                            <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="py-3 px-4">
                                <button 
                                  type="button"
                                  onClick={() => handleToggleTaskComplete && handleToggleTaskComplete(task.id, task.isCompleted)}
                                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all relative z-10 cursor-pointer ${
                                    task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-500'
                                  }`}
                                  title={task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                                >
                                  {task.isCompleted && '✓'}
                                </button>
                              </td>
                              <td className={`py-3 px-4 uppercase ${task.isCompleted ? 'line-through opacity-40' : 'font-black text-slate-900 dark:text-white'}`}>
                                {task.title}
                              </td>
                              <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{task.dueDate}</td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button 
                                  type="button"
                                  onClick={() => openModal('task', task)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all relative z-10 cursor-pointer"
                                  title="Edit Task"
                                >
                                  <Edit3 size={14}/>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => triggerDelete && triggerDelete('task', task.id, task.title)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all relative z-10 cursor-pointer"
                                  title="Delete Task"
                                >
                                  <Trash2 size={14}/>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-8 text-center text-slate-400 uppercase text-[10px] tracking-widest">No tasks added yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <KPICard title="Total Sales" value={formatCurrency(analytics.totalSales)} icon={Receipt} colorClass="text-[#10b981]" bgClass="bg-[#ecfdf5] dark:bg-[#10b981]/10 border-[#a7f3d0] dark:border-[#10b981]/20" />
                  <KPICard title="Total Purchase" value={formatCurrency(analytics.totalPurchases)} icon={ShoppingBag} colorClass="text-[#3b82f6]" bgClass="bg-[#eff6ff] dark:bg-[#3b82f6]/10 border-[#bfdbfe] dark:border-[#3b82f6]/20" />
                  <KPICard title="Total Receipt" value={formatCurrency(analytics.totalCollections)} icon={HandCoins} colorClass="text-[#f59e0b]" bgClass="bg-[#fffbeb] dark:bg-[#f59e0b]/10 border-[#fde68a] dark:border-[#f59e0b]/20" />
                  <KPICard title="Total Payment" value={formatCurrency(analytics.totalExpenses)} icon={CreditCard} colorClass="text-[#f43f5e]" bgClass="bg-[#fff1f2] dark:bg-[#f43f5e]/10 border-[#fecdd3] dark:border-[#f43f5e]/20" />
                  <KPICard title="Net Profit / Loss" value={analytics.netProfit < 0 ? `- ${formatCurrency(Math.abs(analytics.netProfit))}` : formatCurrency(analytics.netProfit)} icon={TrendingUp} colorClass={analytics.netProfit >= 0 ? "text-[#10b981]" : "text-[#f43f5e]"} bgClass={analytics.netProfit >= 0 ? "bg-[#ecfdf5] dark:bg-[#10b981]/10 border-[#a7f3d0]" : "bg-[#fff1f2] dark:bg-[#f43f5e]/10 border-[#fecdd3]"} />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button onClick={() => openModal('product')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Package size={16} className="mr-2"/> Create Product</button>
                  <button onClick={() => setActiveTab('products')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Activity size={16} className="mr-2"/> Update Rates</button>
                  <button onClick={() => openModal('customer')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Users size={16} className="mr-2"/> Create Customer</button>
                  <button onClick={() => openModal('supplier')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Truck size={16} className="mr-2"/> Create Supplier</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Outstanding Payable</h3>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingPayables} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-60} textAnchor="end" />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                          <Bar dataKey="amount" radius={[4,4,0,0]}>{agingPayables.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Outstanding Receivables</h3>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingReceivables} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-60} textAnchor="end" />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                          <Bar dataKey="amount" radius={[4,4,0,0]}>{agingReceivables.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Sales Analysis</h3>
                    <div className="flex items-center space-x-2 mb-4"><div className="w-8 h-4 bg-[#10b981] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Sales Amount</span></div>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={4} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Purchase Analysis</h3>
                    <div className="flex items-center space-x-2 mb-4"><div className="w-8 h-4 bg-[#991b1b] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Purchase Amount</span></div>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="purchases" stroke="#991b1b" strokeWidth={4} dot={{r: 4, fill: 'transparent', stroke: '#991b1b', strokeWidth: 2}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Top Selling Customers</h3>
                    <div className="flex items-center space-x-2 mb-4"><div className="w-8 h-4 bg-[#2dd4bf] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Top Selling Customers</span></div>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={topCustomersData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{fontSize: 9, fontWeight: 'bold'}} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                          <Bar dataKey="amount" fill="#2dd4bf" barSize={20} radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Top Suppliers</h3>
                    <div className="flex items-center space-x-2 mb-4"><div className="w-8 h-4 bg-[#2dd4bf] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Amount</span></div>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={topSuppliersData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{fontSize: 9, fontWeight: 'bold'}} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                          <Bar dataKey="amount" fill="#2dd4bf" barSize={20} radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Top Selling Products</h3>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={topProductsData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                            {topProductsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">VAT Analysis</h3>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={vatData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                            <Cell fill="#f43f5e" />
                            <Cell fill="#eab308" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Content for All Tabs */}
            {activeTab === 'sales' && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(sales, `Sales_Report`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal('sale')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center"><Plus size={16} className="mr-2"/> Generate Invoice</button>
                </div>
                {renderTable(['Date', 'Invoice No', 'Customer', 'Executive', 'Grand Total', 'Status'], sales, 'sale', (item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-black text-blue-600">{item.invoiceNo}</td>
                    <td className="px-6 py-4 uppercase font-bold">{item.customerName}</td>
                    <td className="px-6 py-4">{salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A'}</td>
                    <td className="px-6 py-4 font-black">{formatCurrency(item.grandTotal)}</td>
                    <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">Active</span></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setPrintDoc({ isOpen: true, type: 'sale', data: item })} className="p-2 text-slate-400 hover:text-blue-600"><Printer size={16}/></button>
                      <button onClick={() => openModal('sale', item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                      <button onClick={() => triggerDelete('sale', item.id, item.invoiceNo)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </div>
            )}
            
            {activeTab === 'purchases' && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(purchases, `Purchase_Report`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal('purchase')} className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center"><Plus size={16} className="mr-2"/> Generate Purchase</button>
                </div>
                {renderTable(['Date', 'Invoice No', 'Supplier', 'Executive', 'Grand Total', 'Status'], purchases, 'purchase', (item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-black text-blue-600">{item.invoiceNo}</td>
                    <td className="px-6 py-4 uppercase font-bold">{item.supplierName}</td>
                    <td className="px-6 py-4">{salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A'}</td>
                    <td className="px-6 py-4 font-black">{formatCurrency(item.grandTotal)}</td>
                    <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">Active</span></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setPrintDoc({ isOpen: true, type: 'purchase', data: item })} className="p-2 text-slate-400 hover:text-blue-600"><Printer size={16}/></button>
                      <button onClick={() => openModal('purchase', item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                      <button onClick={() => triggerDelete('purchase', item.id, item.invoiceNo)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </div>
            )}
          </div>

          {/* Active Call UI Layer (Auto-stops Ringtone) */}
          {isInCall && (
            <VideoCall 
              roomId={callRoomId} 
              userName={activeUserSession?.name || "Team Member"} 
              userId={activeUserSession?.id || Math.random().toString()} 
              onLeave={handleEndCall} 
            />
          )}
        </main>

        {/* 🔴 WhatsApp Style Incoming Call Notification Popup (Fixed Ring Mute) */}
        {incomingCallAlert && !isInCall && (
          <div className="fixed bottom-36 right-5 sm:right-8 z-[999999] bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/50 shadow-2xl rounded-3xl p-5 w-80 animate-bounce no-print">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black animate-pulse text-lg">
                📞
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">{incomingCallAlert.callType === 'audio' ? 'Incoming Audio Call' : 'Incoming Video Call'}</p>
                <h4 className="font-black text-sm text-white uppercase truncate w-48">{incomingCallAlert.callerName} is calling...</h4>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={async () => {
                  stopRingtone();
                  setIncomingCallAlert(null);
                  try {
                    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'active_call'));
                  } catch(e) {}
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                ❌ Reject
              </button>

              <button 
                onClick={() => {
                  stopRingtone();
                  setCallRoomId(incomingCallAlert.roomId);
                  setIsInCall(true);
                  setIncomingCallAlert(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 animate-pulse"
              >
                ✅ Join Call
              </button>
            </div>
          </div>
        )}

        {/* Floating Call Trigger Button */}
        <button 
          onClick={() => setShowCallChoiceModal(true)}
          className="fixed bottom-44 right-5 sm:bottom-48 sm:right-8 z-[99996] w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/40 hover:shadow-blue-500/60 cursor-pointer touch-manipulation group no-print"
          title="Start Team Video Call"
        >
          📹
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 animate-pulse shadow-md">
            ●
          </span>
        </button>

        {/* Modal: Call Mode Selection */}
        {showCallChoiceModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 no-print">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 text-center">Start Call</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Choose call mode & type</p>
              
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 mb-3">👥 Team Meeting (Common)</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowCallChoiceModal(false); startVideoCall('room', null, 'video'); }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer">📹 Video Call</button>
                    <button onClick={() => { setShowCallChoiceModal(false); startVideoCall('room', null, 'audio'); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer">📞 Audio Call</button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Direct 1-to-1 Call with Staff:</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {salesmen.map(staff => (
                      <div key={staff.id} className="p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 dark:text-white uppercase">{staff.name}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => { setShowCallChoiceModal(false); startVideoCall('direct', staff, 'video'); }} className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg transition-colors text-xs font-black cursor-pointer" title="Video Call">📹</button>
                          <button onClick={() => { setShowCallChoiceModal(false); startVideoCall('direct', staff, 'audio'); }} className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg transition-colors text-xs font-black cursor-pointer" title="Audio Call">📞</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setShowCallChoiceModal(false)} className="w-full py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors cursor-pointer">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
