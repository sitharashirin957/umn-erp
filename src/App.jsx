/* STREAMING_CHUNK:Imports and Firebase Setup... */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, ReceiptText, Users, Settings, Plus, Search, 
  Briefcase, X, Printer, TrendingUp, Trash2, Phone, Mail, 
  ShieldCheck, HandCoins, ShoppingBag, CreditCard, Menu, 
  Edit3, Receipt, Package, Truck, FileText, PieChart as PieChartIcon, 
  Bell, DownloadCloud, AlertTriangle, UsersRound, Activity, BookOpen, Image as ImageIcon,
  Sun, Moon, ClipboardList, TrendingDown, FilePlus, Lock, Unlock, Calculator, Database, ShoppingCart, Info, Table, Wallet
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment, setDoc } from 'firebase/firestore';

let firebaseConfig;
try {
  firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
} catch (error) {
  console.error("Firebase config parsing error. Check Vercel Environment Variables.", error);
  firebaseConfig = {}; 
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'custom-erp-v1';

// --- SECURITY PINS ---
const APP_PIN = import.meta.env.VITE_APP_PIN || '1234';
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '9999';

// --- HARDCODED ACRYLIC MATRIX CHART ---
const STANDARD_MATRIX = {
    "30 x 15": { "3": 20, "4": 25, "5": 35, "6": 40, "8": 45, "10": 50 },
    "30 x 20 / A4": { "3": 30, "4": 35, "5": 40, "6": 50, "8": 60, "10": 75 },
    "A3": { "3": 40, "4": 45, "5": 55, "6": 60, "8": 70, "10": 100 },
    "30 x 50": { "3": 45, "4": 50, "5": 65, "6": 75, "8": 90, "10": 125 },
    "35 x 50": { "3": 50, "4": 55, "5": 70, "6": 80, "8": 105, "10": 135 },
    "40 x 50": { "3": 50, "4": 60, "5": 70, "6": 85, "8": 120, "10": 150 },
    "50 x 50": { "3": 65, "4": 75, "5": 85, "6": 100, "8": 140, "10": 175 },
    "60 x 40": { "3": 65, "4": 75, "5": 85, "6": 100, "8": 140, "10": 175 },
    "50 x 70": { "3": 85, "4": 95, "5": 105, "6": 125, "8": 155, "10": 210 },
    "70 x 100": { "3": 140, "4": 170, "5": 220, "6": 260, "8": 330, "10": 420 },
    "100 x 100": { "3": 200, "4": 240, "5": 300, "6": 350, "8": 450, "10": 600 },
    "120 x 100": { "3": 230, "4": 280, "5": 380, "6": 450, "8": 550, "10": 700 },
    "100 x 200": { "3": 365, "4": 430, "5": 550, "6": 650, "8": 800, "10": 1100 },
    "122 x 244": { "3": 520, "4": 620, "5": 800, "6": 950, "8": 1100, "10": 1300 }
};

const MATRIX_AREAS = [
    { label: "30 x 15", area: 450 },
    { label: "30 x 20 / A4", area: 600 },
    { label: "A3", area: 1260 },
    { label: "30 x 50", area: 1500 },
    { label: "35 x 50", area: 1750 },
    { label: "40 x 50", area: 2000 },
    { label: "60 x 40", area: 2400 },
    { label: "50 x 50", area: 2500 },
    { label: "50 x 70", area: 3500 },
    { label: "70 x 100", area: 7000 },
    { label: "100 x 100", area: 10000 },
    { label: "120 x 100", area: 12000 },
    { label: "100 x 200", area: 20000 },
    { label: "122 x 244", area: 29768 }
].sort((a, b) => a.area - b.area);

const safeSearch = (val, term) => String(val || '').toLowerCase().includes(String(term || '').toLowerCase());
const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(Number(num) || 0);
const generateID = (prefix, length) => `${prefix}-${String(length + 1).padStart(5, '0')}`;

const getBadgeStyle = (status) => {
  if (status === 'Paid' || status === 'Active' || status === 'Collected') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 border';
  if (status === 'Partial' || status === 'Collection Follow up') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 border';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 border';
};

const cleanObject = (obj) => {
  const cleaned = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !obj[key].toDate && !Array.isArray(obj[key])) {
        cleaned[key] = cleanObject(obj[key]);
      } else {
        cleaned[key] = obj[key]; // Preserve Arrays like tiers and Dates
      }
    }
  }
  return cleaned;
};

// --- CHART COLORS ---
const COLORS = ['#10b981', '#3b82f6', '#94a3b8', '#f43f5e', '#eab308', '#8b5cf6', '#06b6d4'];
const AGING_COLORS = ['#38bdf8', '#fbbf24', '#34d399', '#a78bfa', '#fb923c', '#f43f5e'];

const triggerSystemPrint = async (customFilename) => {
  const element = document.getElementById('printable-area');
  if (!element) return;
  
  if (!window.html2pdf) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  const opt = {
    margin:       0,
    filename:     customFilename ? `${customFilename}.pdf` : `Document_${new Date().getTime()}.pdf`,
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const noPrintElements = element.querySelectorAll('.no-print');
  noPrintElements.forEach(el => el.style.display = 'none');
  await window.html2pdf().set(opt).from(element).save();
  noPrintElements.forEach(el => el.style.display = '');
};

const exportToExcel = async (data, filename) => {
  if (!data || !data.length) return;
  if (!window.XLSX) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
  const cleanData = data.map(row => {
    const cleanRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === 'id' || key === 'items' || key === 'createdAt' || key === 'updatedAt' || key === 'rawDate') continue;
      const cleanKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      if (Array.isArray(value)) {
         cleanRow[cleanKey] = `${value.length} items`;
      } else if (value && typeof value === 'object' && value.seconds) {
         cleanRow[cleanKey] = new Date(value.seconds * 1000).toLocaleDateString();
      } else if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && key.toLowerCase().match(/amount|total|price|balance|rate|qty|debit|credit/))) {
         cleanRow[cleanKey] = Number(value) || 0;
      } else {
         cleanRow[cleanKey] = String(value || '');
      }
    }
    return cleanRow;
  });
  const ws = window.XLSX.utils.json_to_sheet(cleanData);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, String(filename).toUpperCase().slice(0, 31));
  window.XLSX.writeFile(wb, `${String(filename).toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const CompanyLogo = ({ collapsed, settings }) => (
  <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} transition-all duration-300`}>
    {settings?.logo ? (
      <img src={settings.logo} alt="Logo" className="w-10 h-10 rounded-2xl object-contain bg-white shadow-xl shadow-blue-900/10 dark:shadow-none border border-slate-200 dark:border-slate-700 shrink-0" />
    ) : (
      <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#4f46e5] shadow-lg shadow-indigo-500/30 border border-indigo-400/20 shrink-0">
        <span className="relative text-white font-black text-xl tracking-tighter">C<span className="text-cyan-300">E</span></span>
      </div>
    )}
    {!collapsed && (
      <div className="flex flex-col whitespace-nowrap overflow-hidden">
        <span className="text-xl font-black text-slate-900 dark:text-white tracking-widest leading-none truncate w-40">{settings?.companyName || 'MY ERP'}</span>
      </div>
    )}
  </div>
);

const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab, collapsed, setMobileMenu }) => (
  <button 
    onClick={() => { setActiveTab(id); setMobileMenu(false); }} 
    className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'space-x-4 px-4'} py-3.5 rounded-2xl transition-all duration-300 ${activeTab === id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-indigo-900/20 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
    title={collapsed ? String(label) : ""}
  >
    <Icon size={20} className={`shrink-0 ${activeTab === id ? 'text-white' : ''}`} />
    {!collapsed && <span className="font-bold text-xs uppercase tracking-wider">{String(label)}</span>}
  </button>
);

const KPICard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className={`p-6 rounded-[1.5rem] border ${bgClass} shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between`}>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{String(title)}</p>
      <h3 className={`text-2xl font-black ${colorClass} tracking-tight`}>{String(value)}</h3>
    </div>
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
  if (type === 'Direct Client') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
  if (type === 'Brand/Company') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-black" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const App = () => {
  const [user, setUser] = useState(null);
  
  // --- App Global Lock State ---
  const [isAppUnlocked, setIsAppUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('erp_unlocked') === 'true';
    }
    return false;
  });
  const [appPinInput, setAppPinInput] = useState('');
  const [appPinError, setAppPinError] = useState(false);

  // --- Admin Action Lock State ---
  const [adminAuth, setAdminAuth] = useState({ isOpen: false, callback: null });
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);

  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('erp_theme');
      if (storedTheme) return storedTheme === 'dark';
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    }
    return false; 
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [crms, setCrms] = useState([]);
  
  // --- FORM ERROR & SUBMISSION STATES ---
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ESTIMATOR STATES ---
  const [estimatorItems, setEstimatorItems] = useState([]); 
  const [showEstimatorDB, setShowEstimatorDB] = useState(false);
  const [estimateCart, setEstimateCart] = useState([]);
  const [calcForm, setCalcForm] = useState({ 
    category: '', itemId: '', desc: '', width: '', height: '', thickness: '', minutes: '', qty: 1,
    matrixSize: '', matrixThick: '', isCustomMatrix: false
  });

  const [settings, setSettings] = useState({ companyName: '', taxId: '', phone: '', email: '', address: '', logo: '' });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, type: '', id: null, title: '' });
  const [printDoc, setPrintDoc] = useState({ isOpen: false, type: '', data: null });
  
  const [formData, setFormData] = useState({});
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [dbError, setDbError] = useState(false);
  const collapsed = isDesktop && !isSidebarHovered;

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
        else { await signInAnonymously(auth); }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => { window.removeEventListener('resize', handleResize); unsubscribe(); };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('erp_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('erp_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (notifRef.current && !notifRef.current.contains(event.target)) { setIsNotifOpen(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (settings?.logo) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logo;
    }
  }, [settings?.logo]);

  useEffect(() => {
    if (!isAppUnlocked) return;
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsAppUnlocked(false);
        sessionStorage.removeItem('erp_unlocked');
      }, 60 * 60 * 1000); // 1 hour
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
  }, [isAppUnlocked]);

  useEffect(() => {
    if (!user || !isAppUnlocked) return; 
    const collectionsMap = {
      customers: setCustomers, suppliers: setSuppliers, products: setProducts,
      sales: setSales, purchases: setPurchases, collections: setCollections, 
      expenses: setExpenses, salesmen: setSalesmen, crms: setCrms,
      estimator_items: setEstimatorItems
    };

    const unsubscribers = Object.entries(collectionsMap).map(([colName, setter]) => 
      onSnapshot(
        collection(db, 'artifacts', appId, 'public', 'data', colName), 
        (snap) => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setter(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        },
        (error) => { console.error(`Error syncing ${colName}:`, error); if (error.code === 'permission-denied') setDbError(true); }
      )
    );
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'profile'), (snap) => {
        if (snap.exists()) setSettings(snap.data());
    });
    return () => { unsubscribers.forEach(unsub => unsub()); unsubSettings(); };
  }, [user, isAppUnlocked]);

  const handleAppUnlock = (e) => {
    e.preventDefault();
    if (appPinInput === APP_PIN) {
      setIsAppUnlocked(true);
      sessionStorage.setItem('erp_unlocked', 'true');
      setAppPinError(false);
    } else {
      setAppPinError(true);
      setAppPinInput('');
    }
  };

  const handleManualLock = () => {
    setIsAppUnlocked(false);
    sessionStorage.removeItem('erp_unlocked');
    setAppPinInput(''); 
  };

  const requestAdminAuth = (callback) => {
    setAdminAuth({ isOpen: true, callback });
    setAdminPinInput('');
    setAdminPinError(false);
  };

  const handleAdminAuthSubmit = (e) => {
    e.preventDefault();
    if (adminPinInput === ADMIN_PIN) {
      if (adminAuth.callback) adminAuth.callback();
      setAdminAuth({ isOpen: false, callback: null });
    } else {
      setAdminPinError(true);
      setAdminPinInput('');
    }
  };

  const triggerDelete = (type, id, title) => {
    requestAdminAuth(() => {
      setConfirmDelete({ isOpen: true, type, id, title });
    });
  };

  const analytics = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
    const totalCollections = collections.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const outstandingReceivables = totalSales - totalCollections;
    const netProfit = totalSales - totalPurchases - totalExpenses;
    return { totalSales, totalPurchases, totalCollections, totalExpenses, outstandingReceivables, netProfit };
  }, [sales, purchases, collections, expenses]);

  const monthlyTrends = useMemo(() => {
    const map = {};
    const process = (arr, key) => {
      arr.forEach(item => {
        if(!item.date) return;
        const d = new Date(item.date);
        const monthName = d.toLocaleString('default', { month: 'long' });
        const year = d.getFullYear();
        const sortKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if(!map[sortKey]) map[sortKey] = { sortKey, name: monthName, sales: 0, purchases: 0 };
        map[sortKey][key] += Number(item.grandTotal) || 0;
      });
    };
    process(sales, 'sales');
    process(purchases, 'purchases');
    return Object.values(map).sort((a,b) => a.sortKey.localeCompare(b.sortKey)).slice(-12);
  }, [sales, purchases]);

  const calculateAging = (invoices, payments, type) => {
    const bins = { 'No Due yet': 0, '0 - 30 Days': 0, '31 - 60 Days': 0, '61 - 90 Days': 0, '91 - 120 Days': 0, '120 +': 0 };
    const today = new Date();
    
    invoices.forEach(inv => {
        const paid = payments.filter(p => p.ref === inv.invoiceNo || p.description === inv.invoiceNo).reduce((a,b)=>a+Number(b.amount), 0);
        const pending = Number(inv.grandTotal) - paid;
        
        if (pending > 0 && inv.date) {
            const invDate = new Date(inv.date);
            const diffDays = Math.floor((today - invDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 0) bins['No Due yet'] += pending;
            else if (diffDays <= 30) bins['0 - 30 Days'] += pending;
            else if (diffDays <= 60) bins['31 - 60 Days'] += pending;
            else if (diffDays <= 90) bins['61 - 90 Days'] += pending;
            else if (diffDays <= 120) bins['91 - 120 Days'] += pending;
            else bins['120 +'] += pending;
        }
    });
    return Object.keys(bins).map((key, index) => ({ name: key, amount: bins[key], color: AGING_COLORS[index] }));
  };

  const agingReceivables = useMemo(() => calculateAging(sales, collections, 'rec'), [sales, collections]);
  const agingPayables = useMemo(() => calculateAging(purchases, expenses, 'pay'), [purchases, expenses]);

  const topCustomersData = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      if(!map[s.customerName]) map[s.customerName] = 0;
      map[s.customerName] += Number(s.grandTotal);
    });
    return Object.entries(map).map(([name, amount]) => ({ name: name || 'Unknown', amount })).sort((a,b) => b.amount - a.amount).slice(0, 5);
  }, [sales]);

  const topSuppliersData = useMemo(() => {
    const map = {};
    purchases.forEach(p => {
      if(!map[p.supplierName]) map[p.supplierName] = 0;
      map[p.supplierName] += Number(p.grandTotal);
    });
    return Object.entries(map).map(([name, amount]) => ({ name: name || 'Unknown', amount })).sort((a,b) => b.amount - a.amount).slice(0, 5);
  }, [purchases]);

  const vatData = useMemo(() => {
    const outputVat = sales.reduce((acc, s) => acc + (Number(s.taxTotal) || 0), 0);
    const inputVat = purchases.reduce((acc, p) => acc + (Number(p.taxTotal) || 0), 0);
    const payable = outputVat - inputVat;
    return [
      { name: 'Input Vat', value: inputVat },
      { name: 'Output Vat', value: outputVat },
      { name: 'Vat Payable', value: payable > 0 ? payable : 0 }
    ];
  }, [sales, purchases]);

  const topProductsData = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      if(s.items) {
        s.items.forEach(item => {
          if(!map[item.name]) map[item.name] = 0;
          map[item.name] += Number(item.total);
        });
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name: name || 'Unknown', value })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [sales]);

  const notifications = useMemo(() => {
    const notifs = [];
    products.forEach(p => {
        if (Number(p.stock) <= Number(p.minStock || 0)) {
            notifs.push({ id: `stk-${p.id}`, type: 'warning', icon: AlertTriangle, title: 'Low Stock Alert', desc: `${p.name} is running low (${p.stock} units left).` });
        }
    });
    topCustomersData.forEach((c, idx) => {
        if (idx === 0 && c.amount > 0) {
             notifs.push({ id: `top-${idx}`, type: 'info', icon: TrendingUp, title: 'Top Performer', desc: `${c.name} is your top customer.` });
        }
    });
    return notifs;
  }, [products, topCustomersData]);

  const openModal = (type, data = null) => {
    const executeOpen = () => {
      setFormError('');
      setFormData(data ? { ...data } : { 
        name: '', phone: '', email: '', gst: '', openingBalance: '', category: '', stock: '', 
        purchasePrice: '', sellingPrice: '', tax: '', minStock: '', amount: '', method: '', 
        description: '', ref: '', rate: '', timeRate: '', calcType: 'Area', tiers: [], thicknessTiers: []
      });
      if (type === 'sale' || type === 'purchase') {
        setInvoiceItems(data?.items || [{ productId: '', name: '', description: '', qty: 1, rate: 0, tax: 0, total: 0 }]);
      }
      setModalState({ isOpen: true, type, data });
    };

    if (data && type !== 'estimatorItem') {
      requestAdminAuth(executeOpen);
    } else {
      executeOpen();
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
    setFormData({});
    setInvoiceItems([]);
    setFormError('');
    setIsSubmitting(false);
  };

  const handlePushToInvoice = (crmItem) => {
    setActiveTab('sales');
    const preFilledData = {
      customerId: crmItem.customerId || '',
      customerName: crmItem.customerName || '',
      partyName: crmItem.customerName || '',
      salesmanId: crmItem.salesmanId || '',
      linkedJobId: crmItem.id, 
      date: new Date().toISOString().split('T')[0],
      items: [{
        productId: '',
        name: 'CUSTOM JOB',
        description: crmItem.description || '', 
        qty: 1,
        rate: 0,
        tax: 0,
        total: 0
      }]
    };
    openModal('sale', preFilledData); 
  };

  const handleQuickPayment = (item, type, pendingAmount) => {
    if (type === 'sale') {
      setFormData({
        customerId: item.customerId || '', customerName: item.customerName || '', partyName: item.customerName || '',
        ref: item.invoiceNo || '', amount: pendingAmount > 0 ? pendingAmount : 0, date: new Date().toISOString().split('T')[0]
      });
      setModalState({ isOpen: true, type: 'collection', data: null });
    } else if (type === 'purchase') {
      setFormData({
        supplierId: item.supplierId || '', supplierName: item.supplierName || '', partyName: item.supplierName || '',
        description: item.invoiceNo || '', amount: pendingAmount > 0 ? pendingAmount : 0, date: new Date().toISOString().split('T')[0]
      });
      setModalState({ isOpen: true, type: 'expense', data: null });
    }
  };

  // UPDATED: Now supports both Performance Ledger and Cash In Hand Ledger
  const generateLedger = (type, entity, ledgerVariant = 'standard') => {
    let rows = [];
    let balance = Number(entity.openingBalance) || 0;
    let entityTypeTitle = type;
    
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
            entityTypeTitle = 'Cash In Hand';
            balance = 0; // Cash starts at 0 unless specified
            const c = collections.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.ref || 'PAYMENT', desc: `Collected from ${x.customerName || '--'}`, debit: Number(x.amount), credit: 0, rawDate: new Date(x.date) }));
            const e = expenses.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.description || 'EXPENSE', desc: `Paid for ${x.partyName || x.description || '--'}`, debit: 0, credit: Number(x.amount), rawDate: new Date(x.date) }));
            [...c, ...e].sort((a,b) => a.rawDate - b.rawDate).forEach(r => { balance = balance + r.debit - r.credit; rows.push({ ...r, balance }); });
        } else {
            entityTypeTitle = 'Performance';
            balance = 0;
            const s = sales.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.invoiceNo, desc: `Sale (${x.customerName})`, debit: Number(x.grandTotal), credit: 0, rawDate: new Date(x.date) }));
            const c = collections.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.ref || 'PAYMENT', desc: `Collection (${x.customerName})`, debit: 0, credit: Number(x.amount), rawDate: new Date(x.date) }));
            [...s, ...c].sort((a,b) => a.rawDate - b.rawDate).forEach(r => { balance = balance + r.debit - r.credit; rows.push({ ...r, balance }); });
        }
    }

    setModalState({ isOpen: true, type: 'ledger', data: { entity, entityType: entityTypeTitle, rows } });
  };

  const handleCRMStatusChange = (id, field, value) => {
    requestAdminAuth(async () => {
        if(!user) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crms', id), { [field]: value });
        } catch(e) { console.error("Error updating CRM status", e); }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    const { type, data } = modalState;
    const isEdit = !!data?.id;

    // --- DUPLICATE PREVENTION LOGIC ---
    if (type === 'customer' || type === 'supplier') {
        const listToCheck = type === 'customer' ? customers : suppliers;
        const inputName = String(formData.name || '').trim().toLowerCase();
        const duplicate = listToCheck.find(item => String(item.name || '').trim().toLowerCase() === inputName && item.id !== data?.id);
        
        if (duplicate) {
            setFormError(`A ${type} with this name already exists. Please edit the existing one to avoid duplicates.`);
            return;
        }
    }

    setIsSubmitting(true);
    setFormError('');

    const colMap = { 'salesman': 'salesmen', 'customer': 'customers', 'supplier': 'suppliers', 'product': 'products', 'sale': 'sales', 'purchase': 'purchases', 'collection': 'collections', 'expense': 'expenses', 'crm': 'crms', 'estimatorItem': 'estimator_items' };
    const colName = colMap[type];
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', colName);
    
    let payload = cleanObject({ ...formData });

    try {
      if (type === 'sale' || type === 'purchase') {
        const subTotal = invoiceItems.reduce((acc, item) => acc + (Number(item.qty) * Number(item.rate)), 0);
        const taxTotal = invoiceItems.reduce((acc, item) => acc + ((Number(item.qty) * Number(item.rate) * Number(item.tax)) / 100), 0);
        const discount = Number(payload.discount) || 0;
        const grandTotal = subTotal + taxTotal - discount;

        payload = cleanObject({
          ...payload, items: invoiceItems, subTotal, taxTotal, grandTotal,
          date: payload.date || new Date().toISOString().split('T')[0],
        });

        if (!isEdit) {
          payload.invoiceNo = generateID(type === 'sale' ? 'INV' : 'PUR', type === 'sale' ? sales.length : purchases.length);
        }

        const batch = writeBatch(db);
        invoiceItems.forEach(item => {
          if (item.productId) {
            const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', item.productId);
            const qtyChange = type === 'sale' ? -Number(item.qty) : Number(item.qty);
            batch.update(prodRef, { stock: increment(qtyChange) });
          }
        });
        
        const docRef = isEdit ? doc(collectionRef, data.id) : doc(collectionRef);
        batch.set(docRef, { ...payload, createdAt: isEdit ? data.createdAt : serverTimestamp() }, { merge: true });
        await batch.commit();

      } else if (type === 'crm') {
         if (!isEdit) {
             payload.jobId = generateID('JB', crms.length);
             payload.workStatus = 'Work Onboarded';
             payload.invoicingStatus = 'Not invoiced';
             payload.collectionStatus = 'Pending';
         }
         if (isEdit) { await updateDoc(doc(collectionRef, data.id), payload); } 
         else { await addDoc(collectionRef, { ...payload, createdAt: serverTimestamp() }); }
      } else {
        if (isEdit) { await updateDoc(doc(collectionRef, data.id), payload); } 
        else { await addDoc(collectionRef, { ...payload, createdAt: serverTimestamp() }); }
      }
      closeModal();
    } catch (error) { 
        console.error("Save error:", error); 
        setFormError("Failed to save. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSettingsSave = (e) => {
    e.preventDefault();
    requestAdminAuth(async () => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'profile'), cleanObject(settings), { merge: true });
            setSettingsSuccess(true);
            setTimeout(() => setSettingsSuccess(false), 3000);
        } catch (err) { console.error(err); }
    });
  };

  const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSettings({ ...settings, logo: reader.result });
          reader.readAsDataURL(file);
      }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id || !confirmDelete.type || !user) return;
    try {
      const colMap = { 'salesman': 'salesmen', 'customer': 'customers', 'supplier': 'suppliers', 'product': 'products', 'sale': 'sales', 'purchase': 'purchases', 'collection': 'collections', 'expense': 'expenses', 'crm': 'crms', 'estimatorItem': 'estimator_items' };
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colMap[confirmDelete.type], confirmDelete.id));
      setConfirmDelete({ isOpen: false, type: '', id: null, title: '' });
    } catch (e) { console.error("Delete Error", e); }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceItems];
    newItems[index][field] = value;
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].name = prod.name;
        newItems[index].rate = modalState.type === 'sale' ? prod.sellingPrice : prod.purchasePrice;
        newItems[index].tax = prod.tax || 0;
      }
    }
    const qty = Number(newItems[index].qty) || 0;
    const rate = Number(newItems[index].rate) || 0;
    const tax = Number(newItems[index].tax) || 0;
    newItems[index].total = (qty * rate) + ((qty * rate * tax) / 100);
    setInvoiceItems(newItems);
  };

  const removeRow = (indexToRemove) => {
    setInvoiceItems(invoiceItems.filter((_, index) => index !== indexToRemove));
  };

  const handleTierChange = (index, field, value) => {
      const newTiers = [...(formData.tiers || [])];
      newTiers[index][field] = Number(value) || 0;
      setFormData({...formData, tiers: newTiers});
  };
  const addTier = () => {
      setFormData({...formData, tiers: [...(formData.tiers || []), { minQty: 1, price: 0 }]});
  };
  const removeTier = (index) => {
      const newTiers = [...(formData.tiers || [])];
      newTiers.splice(index, 1);
      setFormData({...formData, tiers: newTiers});
  };

  const calculateEstimateItemTotal = (itemDb, form) => {
    if(!itemDb) return { total: 0, specs: '' };
    const q = Number(form.qty) || 1;
    
    if(itemDb.calcType === 'Standard_Matrix') {
        const mThick = form.matrixThick;
        if (!mThick) return { total: 0, specs: 'Please Select Thickness' };

        if (form.isCustomMatrix) {
            const w = Number(form.width) || 0;
            const h = Number(form.height) || 0;
            if (w === 0 || h === 0) return { total: 0, specs: 'Enter Dimensions' };
            const customArea = w * h; 
            
            let lower = MATRIX_AREAS[0];
            let upper = MATRIX_AREAS[MATRIX_AREAS.length - 1];
            let unitPrice = 0;

            if (customArea <= lower.area) {
                unitPrice = (customArea / lower.area) * STANDARD_MATRIX[lower.label][mThick];
            } else if (customArea >= upper.area) {
                unitPrice = (customArea / upper.area) * STANDARD_MATRIX[upper.label][mThick];
            } else {
                for (let i = 0; i < MATRIX_AREAS.length - 1; i++) {
                    if (customArea >= MATRIX_AREAS[i].area && customArea <= MATRIX_AREAS[i+1].area) {
                        lower = MATRIX_AREAS[i];
                        upper = MATRIX_AREAS[i+1];
                        break;
                    }
                }
                const priceLow = STANDARD_MATRIX[lower.label][mThick];
                const priceHigh = STANDARD_MATRIX[upper.label][mThick];
                unitPrice = priceLow + ((customArea - lower.area) / (upper.area - lower.area)) * (priceHigh - priceLow);
            }

            return { total: unitPrice * q, specs: `Custom Size ${w}x${h}cm (${mThick}mm)` };

        } else {
            const mSize = form.matrixSize;
            if(STANDARD_MATRIX[mSize] && STANDARD_MATRIX[mSize][mThick]) {
                 const price = STANDARD_MATRIX[mSize][mThick];
                 return { total: price * q, specs: `Standard ${mSize} (${mThick}mm)` };
            }
            return { total: 0, specs: 'Select Standard Size' };
        }
    }

    if(itemDb.calcType === 'Fixed') {
        const rate = Number(itemDb.rate) || 0;
        return { total: rate * q, specs: `Fixed Unit` };
    }

    if(itemDb.calcType === 'Time') {
        const rate = Number(itemDb.rate) || 0;
        const mins = Number(form.minutes) || 0;
        return { total: mins * rate * q, specs: `${mins} Mins` };
    }

    if(itemDb.calcType === 'Tiered') {
        let unitPrice = Number(itemDb.rate) || 0; 
        if (itemDb.tiers && itemDb.tiers.length > 0) {
            const sortedTiers = [...itemDb.tiers].sort((a,b) => b.minQty - a.minQty);
            const matchedTier = sortedTiers.find(t => q >= t.minQty);
            if (matchedTier) unitPrice = matchedTier.price;
        }
        return { total: unitPrice * q, specs: `Tier Rate Applied: ${formatCurrency(unitPrice)}/ea` };
    }
    
    const w = Number(form.width) || 0;
    const h = Number(form.height) || 0;
    const sqm = (w * h) / 10000;
    
    if(itemDb.calcType === 'Area_Thickness' || itemDb.calcType === 'Sheet_Cut') {
        const selectedThick = Number(form.thickness);
        let materialRate = Number(itemDb.rate) || 0;
        
        if (itemDb.thicknessTiers && itemDb.thicknessTiers.length > 0) {
             const matchedTier = itemDb.thicknessTiers.find(t => Number(t.thickness) === selectedThick);
             if (matchedTier) materialRate = Number(matchedTier.price);
        }

        const matCost = sqm * materialRate;
        
        if (itemDb.calcType === 'Sheet_Cut') {
            const timeRate = Number(itemDb.timeRate) || 0;
            const timeCost = (Number(form.minutes) || 0) * timeRate;
            const unitTotal = matCost + timeCost;
            return { total: unitTotal * q, specs: `${w}x${h}cm (${sqm.toFixed(2)}sqm), ${selectedThick}mm, ${form.minutes || 0}mins` };
        } else {
            return { total: matCost * q, specs: `${w}x${h}cm (${sqm.toFixed(2)}sqm) x ${selectedThick}mm` };
        }
    }
    
    const rate = Number(itemDb.rate) || 0;
    return { total: sqm * rate * q, specs: `${w}x${h}cm (${sqm.toFixed(2)}sqm)` };
  };

  const handleAddEstimateToCart = (e) => {
      e.preventDefault();
      const itemDb = estimatorItems.find(i => i.id === calcForm.itemId);
      if(!itemDb) return;
      
      const { total, specs } = calculateEstimateItemTotal(itemDb, calcForm);
      if (total === 0) return; 
      
      const cartItem = {
          id: Date.now(),
          category: itemDb.category,
          name: itemDb.name,
          desc: calcForm.desc,
          specs: specs,
          qty: calcForm.qty,
          rate: itemDb.rate,
          totalPrice: total
      };
      
      setEstimateCart([...estimateCart, cartItem]);
      setCalcForm({ category: calcForm.category, itemId: '', desc: '', width: '', height: '', thickness: '', minutes: '', qty: 1, matrixSize: '', matrixThick: '', isCustomMatrix: false });
  };


  const getTabDetails = (tabId) => {
    switch (tabId) {
      case 'dashboard': return { title: 'Business Overview', desc: 'Real-time Analytics & KPIs' };
      case 'crm': return { title: 'CRM & Job Tracker', desc: 'Manage Client Projects & Lifecycles' };
      case 'sales': return { title: 'Sales & Invoices', desc: 'Manage Billing & Receivables' };
      case 'purchases': return { title: 'Purchase Orders', desc: 'Manage Supplier Bills & Payables' };
      case 'collections': return { title: 'Payment Collections', desc: 'Track Received Payments' };
      case 'expenses': return { title: 'Business Expenses', desc: 'Track Outward Cashflow' };
      case 'customers': return { title: 'Customer Directory', desc: 'Manage Client Profiles & Balances' };
      case 'suppliers': return { title: 'Supplier Network', desc: 'Manage Vendor Profiles' };
      case 'products': return { title: 'Inventory Management', desc: 'Manage Products & Stock Levels' };
      case 'salesmen': return { title: 'Sales Executives', desc: 'Manage Staff & Commissions' };
      case 'estimator': return { title: 'Price Estimator', desc: 'Custom Dimension Pricing Calculator' };
      case 'settings': return { title: 'System Settings', desc: 'Global Configuration & Profile' };
      default: return { title: 'Dashboard', desc: 'Overview' };
    }
  };

  const currentTabDetails = getTabDetails(activeTab);

  if (!isAppUnlocked) {
    return (
      <div className={`transition-colors duration-300 ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-[#0f172a] min-h-screen font-sans selection:bg-blue-500/30 flex items-center justify-center`}>
         <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center max-w-sm w-full mx-4 animate-fade-in-up">
             <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-500">
                 <Lock size={32} />
             </div>
             <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2 text-center">App Locked</h2>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 text-center">Enter Global PIN to access</p>
             <form onSubmit={handleAppUnlock} className="w-full">
                 <input 
                     type="password" 
                     autoFocus
                     required
                     placeholder="• • • •" 
                     className={`w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-2 font-black text-center text-2xl text-slate-900 dark:text-white tracking-[1em] mb-4 focus:outline-none transition-colors ${appPinError ? 'border-rose-500/50 focus:border-rose-500' : 'border-transparent dark:border-slate-800 focus:border-blue-500'}`}
                     value={appPinInput}
                     onChange={e => setAppPinInput(e.target.value)}
                 />
                 {appPinError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mb-4">Incorrect PIN</p>}
                 <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 transition-all">
                     Unlock ERP
                 </button>
             </form>
         </div>
      </div>
    );
  }

  const renderTable = (headers, tableData, type, renderRow) => (
    <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50/50 dark:bg-[#0f172a]/50 text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 backdrop-blur-md">
            <tr>
              {headers.map((h, i) => <th key={`head-${i}`} className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">{String(h)}</th>)}
              <th className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 text-right no-print">Actions</th>
            </tr>
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
        `}</style>

        {/* --- Sidebar Navigation --- */}
        <aside 
          onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}
          className={`fixed inset-y-0 left-0 bg-white dark:bg-[#1e293b] flex flex-col z-[100] transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 shadow-sm
            ${isMobileMenuOpen ? 'translate-x-0 w-72 p-6' : '-translate-x-full lg:translate-x-0'}
            ${collapsed ? 'lg:w-24 lg:p-4' : 'lg:w-72 lg:p-6'}
          `}
        >
          <div className="mb-10 mt-2 flex justify-between items-center">
            <CompanyLogo collapsed={collapsed} settings={settings} />
            <button className="lg:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}><X size={24}/></button>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            <p className={`text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-6 ${collapsed ? 'text-center' : 'px-4'}`}>Core Operations</p>
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="crm" icon={ClipboardList} label="CRM / Job Tracker" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="sales" icon={Receipt} label="Sales Invoices" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="purchases" icon={ShoppingBag} label="Purchases" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            
            <p className={`text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-8 ${collapsed ? 'text-center' : 'px-4'}`}>Finance Flow</p>
            <NavItem id="collections" icon={HandCoins} label="Collections" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="expenses" icon={CreditCard} label="Expenses" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            
            <p className={`text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-8 ${collapsed ? 'text-center' : 'px-4'}`}>Entities</p>
            <NavItem id="customers" icon={Users} label="Customers" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="suppliers" icon={Truck} label="Suppliers" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="products" icon={Package} label="Inventory" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            <NavItem id="salesmen" icon={Briefcase} label="Sales Team" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
               <NavItem id="estimator" icon={Calculator} label="Price Estimator" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
               <NavItem id="settings" icon={Settings} label="Company Profile" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            </div>
          </nav>
        </aside>

        {/* --- Main Content Area --- */}
        <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isDesktop ? 'lg:pl-24' : ''}`}>
          
          <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 no-print">
            <div className="flex items-center space-x-4">
              <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24}/></button>
              
              <div className="hidden sm:flex flex-col ml-2 lg:ml-0">
                 <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                    {currentTabDetails.title}
                 </h1>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {currentTabDetails.desc}
                 </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="hidden md:flex items-center bg-slate-50 dark:bg-[#0f172a] rounded-full px-4 py-2 w-80 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 ring-blue-100 dark:ring-blue-900/30 transition-all">
                <Search size={18} className="text-slate-400 mr-2" />
                <input type="text" placeholder="Global Entity Search..." className="bg-transparent border-none text-sm font-bold w-full focus:outline-none uppercase dark:text-white dark:placeholder-slate-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              
              <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors bg-slate-50 dark:bg-[#0f172a] rounded-full border border-slate-100 dark:border-slate-800">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="relative" ref={notifRef}>
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <Bell size={22}/>
                    {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#1e293b] animate-pulse"></span>}
                  </button>
                  {isNotifOpen && (
                      <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fade-in-up">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                              <span className="font-black text-xs uppercase text-slate-800 dark:text-white">Notifications</span>
                              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 py-1 px-2 rounded-full text-[9px] font-bold">{notifications.length} New</span>
                          </div>
                          <div className="max-h-80 overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (
                                 <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">All Caught Up!</div>
                              ) : (
                                 notifications.map((n, i) => (
                                     <div key={i} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex gap-4">
                                         <div className={`mt-1 p-2 rounded-full h-fit shrink-0 ${n.type === 'warning' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}><n.icon size={14}/></div>
                                         <div>
                                             <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{n.title}</p>
                                             <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase leading-relaxed">{n.desc}</p>
                                         </div>
                                     </div>
                                 ))
                              )}
                          </div>
                      </div>
                  )}
              </div>

              <button 
                onClick={handleManualLock}
                className="group relative h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30 overflow-hidden transition-all hover:scale-95"
                title="Lock Application"
              >
                 <span className="absolute transition-all duration-300 group-hover:scale-0 group-hover:opacity-0">
                    {settings?.companyName ? settings.companyName.charAt(0).toUpperCase() : 'C'}
                 </span>
                 <Lock size={18} className="absolute scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative flex flex-col">
            
            {/* --- DASHBOARD VIEW --- */}
            {activeTab === 'dashboard' && (
              <div className="max-w-[100rem] mx-auto w-full space-y-8 animate-fade-in-up flex-1">
                
                {/* KPI ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard title="Total Sales" value={formatCurrency(analytics.totalSales)} icon={Receipt} colorClass="text-[#10b981]" bgClass="bg-[#ecfdf5] dark:bg-[#10b981]/10 border-[#a7f3d0] dark:border-[#10b981]/20" />
                  <KPICard title="Total Purchase" value={formatCurrency(analytics.totalPurchases)} icon={ShoppingBag} colorClass="text-[#3b82f6]" bgClass="bg-[#eff6ff] dark:bg-[#3b82f6]/10 border-[#bfdbfe] dark:border-[#3b82f6]/20" />
                  <KPICard title="Total Receipt" value={formatCurrency(analytics.totalCollections)} icon={HandCoins} colorClass="text-[#f59e0b]" bgClass="bg-[#fffbeb] dark:bg-[#f59e0b]/10 border-[#fde68a] dark:border-[#f59e0b]/20" />
                  <KPICard title="Total Payment" value={formatCurrency(analytics.totalExpenses)} icon={CreditCard} colorClass="text-[#f43f5e]" bgClass="bg-[#fff1f2] dark:bg-[#f43f5e]/10 border-[#fecdd3] dark:border-[#f43f5e]/20" />
                </div>

                {/* QUICK ACTIONS ROW */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button onClick={() => openModal('product')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Package size={16} className="mr-2"/> Create Product</button>
                  <button onClick={() => setActiveTab('products')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Activity size={16} className="mr-2"/> Update Rates</button>
                  <button onClick={() => openModal('customer')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Users size={16} className="mr-2"/> Create Customer</button>
                  <button onClick={() => openModal('supplier')} className="py-4 border-2 border-[#10b981] text-[#10b981] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center bg-white dark:bg-[#1e293b]"><Truck size={16} className="mr-2"/> Create Supplier</button>
                </div>

                {/* AGING CHARTS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Outstanding Payable</h3>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingPayables} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-60} textAnchor="end" />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                          <Bar dataKey="amount" radius={[4,4,0,0]}>
                            {agingPayables.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
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
                          <Bar dataKey="amount" radius={[4,4,0,0]}>
                            {agingReceivables.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* TRENDS (LINE CHARTS) ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Sales Analysis</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-4 bg-[#10b981] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Sales Amount</span>
                    </div>
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
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-4 bg-[#991b1b] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Purchase Amount</span>
                    </div>
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

                {/* TOP ENTITIES (HORIZONTAL BARS) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6">Top Selling Customers</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-4 bg-[#2dd4bf] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Top Selling Customers</span>
                    </div>
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
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-4 bg-[#2dd4bf] rounded-sm"></div><span className="text-xs font-bold dark:text-slate-300">Amount</span>
                    </div>
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

                {/* DONUT CHARTS (PRODUCTS & VAT) */}
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
                            <Cell fill="#f43f5e" /> {/* Input VAT */}
                            <Cell fill="#eab308" /> {/* Output VAT */}
                            <Cell fill="#ef4444" /> {/* Payable */}
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

            {/* --- PRICE ESTIMATOR VIEW --- */}
            {activeTab === 'estimator' && (
              <div className="max-w-[100rem] mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                
                {/* TOOLBAR */}
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex space-x-3">
                     <button 
                        onClick={() => requestAdminAuth(() => setShowEstimatorDB(!showEstimatorDB))} 
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center transition-colors border ${showEstimatorDB ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50' : 'bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'}`}
                     >
                        <Database size={16} className="mr-2"/> {showEstimatorDB ? 'Close Database' : 'Manage Items Database'}
                     </button>
                  </div>
                  <div className="flex space-x-3">
                      {estimateCart.length > 0 && (
                          <>
                             <button onClick={() => setEstimateCart([])} className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">Clear All</button>
                             <button onClick={() => setPrintDoc({ isOpen: true, type: 'estimate', data: { items: estimateCart, grandTotal: estimateCart.reduce((a,b)=>a+b.totalPrice, 0), date: new Date().toISOString().split('T')[0] } })} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Printer size={16} className="mr-2"/> Print Estimate</button>
                          </>
                      )}
                  </div>
                </div>

                {/* MAIN ESTIMATOR GRID */}
                {showEstimatorDB ? (
                    /* DATABASE MANAGEMENT VIEW */
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/30">
                            <div>
                                <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-tight">Estimator Database</h3>
                                <p className="text-xs font-bold text-indigo-500/70 uppercase tracking-widest mt-1">Add base rates and calculation formulas</p>
                            </div>
                            <button onClick={() => openModal('estimatorItem')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:scale-95 transition-all flex items-center"><Plus size={16} className="mr-2"/> Add New Item</button>
                        </div>
                        {renderTable(
                            ['Category', 'Item Name', 'Calculation Method', 'Base Rate'],
                            estimatorItems.filter(i => safeSearch(i.name, searchTerm) || safeSearch(i.category, searchTerm)),
                            'estimatorItem',
                            (item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-xs uppercase text-slate-500 dark:text-slate-400">{String(item.category || '')}</td>
                                    <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.name || '')}</td>
                                    <td className="px-6 py-4 font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                            {item.calcType === 'Standard_Matrix' ? 'Standard Size Matrix' : String(item.calcType || 'Area')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400 tracking-wider">
                                        {item.calcType === 'Standard_Matrix' ? <span className="text-indigo-500 text-[10px] uppercase">Auto Chart</span> :
                                         item.calcType === 'Tiered' ? 'Tiered Pricing' : 
                                         (item.calcType === 'Area_Thickness' || item.calcType === 'Sheet_Cut') && item.thicknessTiers?.length > 0 ? 'Thickness Based' : 
                                         formatCurrency(item.rate)}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                        <button onClick={() => openModal('estimatorItem', item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"><Edit3 size={16}/></button>
                                        <button onClick={() => triggerDelete('estimatorItem', item.id, String(item.name))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            )
                        )}
                    </div>
                ) : (
                    /* CALCULATOR & CART VIEW */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in-up">
                        
                        {/* CALCULATOR PANEL (Left 4 cols) */}
                        <div className="lg:col-span-5 bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
                                <Calculator size={120} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Price Estimator</h3>
                            
                            <form onSubmit={handleAddEstimateToCart} className="space-y-5 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Select Category *</label>
                                    <select 
                                        required
                                        className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20"
                                        value={calcForm.category}
                                        onChange={(e) => setCalcForm({...calcForm, category: e.target.value, itemId: ''})}
                                    >
                                        <option value="">Choose Category...</option>
                                        {[...new Set(estimatorItems.map(i => i.category))].map(cat => (
                                            <option key={cat} value={cat}>{String(cat)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Select Item Type *</label>
                                    <select 
                                        required
                                        className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20"
                                        value={calcForm.itemId}
                                        onChange={(e) => setCalcForm({...calcForm, itemId: e.target.value})}
                                        disabled={!calcForm.category}
                                    >
                                        <option value="">Choose Item...</option>
                                        {estimatorItems.filter(i => i.category === calcForm.category).map(item => (
                                            <option key={item.id} value={item.id}>{String(item.name)} {item.calcType !== 'Tiered' && item.calcType !== 'Standard_Matrix' && (!item.thicknessTiers || item.thicknessTiers.length === 0) && `(SAR ${item.rate})`}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* DYNAMIC FIELDS BASED ON CALC TYPE */}
                                {(() => {
                                    const selItem = estimatorItems.find(i => i.id === calcForm.itemId);
                                    if(!selItem) return null;

                                    return (
                                        <div className="space-y-5 pt-2">
                                            
                                            {/* Standard Matrix Input Group */}
                                            {selItem.calcType === 'Standard_Matrix' && (
                                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <label className="text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-400 tracking-widest flex items-center">
                                                            <Table size={14} className="mr-2"/> Matrix Chart Sizing
                                                        </label>
                                                        <label className="flex items-center cursor-pointer space-x-2">
                                                            <input 
                                                                type="checkbox" 
                                                                className="w-4 h-4 text-indigo-600 rounded bg-white dark:bg-slate-800 border-indigo-300 focus:ring-indigo-500"
                                                                checked={calcForm.isCustomMatrix || false}
                                                                onChange={(e) => setCalcForm({...calcForm, isCustomMatrix: e.target.checked, matrixSize: '', width: '', height: ''})}
                                                            />
                                                            <span className="text-[9px] font-bold uppercase text-slate-500">Use Custom Dimensions</span>
                                                        </label>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {calcForm.isCustomMatrix ? (
                                                            <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase text-slate-500">Width (CM) *</label>
                                                                    <input type="number" required placeholder="0" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-indigo-100 dark:border-indigo-800/50 font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-indigo-500/20 shadow-sm" value={calcForm.width} onChange={e => setCalcForm({...calcForm, width: e.target.value})} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase text-slate-500">Height (CM) *</label>
                                                                    <input type="number" required placeholder="0" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-indigo-100 dark:border-indigo-800/50 font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-indigo-500/20 shadow-sm" value={calcForm.height} onChange={e => setCalcForm({...calcForm, height: e.target.value})} />
                                                                </div>
                                                                <p className="col-span-2 text-[9px] font-bold text-indigo-400 text-center leading-tight">Prices are proportionally calculated based on standard chart limits.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase text-slate-500">Select Standard Size *</label>
                                                                <select required className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-indigo-100 dark:border-indigo-800/50 font-black text-slate-900 dark:text-white uppercase focus:ring-2 ring-indigo-500/20 shadow-sm" value={calcForm.matrixSize} onChange={e => setCalcForm({...calcForm, matrixSize: e.target.value})}>
                                                                    <option value="">Select Size...</option>
                                                                    {Object.keys(STANDARD_MATRIX).map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="space-y-1 pt-2 border-t border-indigo-100 dark:border-indigo-800/30">
                                                            <label className="text-[9px] font-bold uppercase text-slate-500">Select Thickness (mm) *</label>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {[3, 4, 5, 6, 8, 10].map(t => (
                                                                    <button 
                                                                        type="button" 
                                                                        key={t}
                                                                        onClick={() => setCalcForm({...calcForm, matrixThick: String(t)})}
                                                                        className={`flex-1 py-2 px-3 rounded-lg font-black text-xs transition-all border ${calcForm.matrixThick === String(t) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30 scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                                                    >
                                                                        {t}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {/* Hidden input to ensure required validation passes */}
                                                            <input type="text" className="h-0 w-0 opacity-0 p-0 m-0 absolute -z-10" required value={calcForm.matrixThick || ''} onChange={()=>{}} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tiered Info Alert */}
                                            {selItem.calcType === 'Tiered' && (
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex gap-3 text-indigo-800 dark:text-indigo-300 mb-4">
                                                    <Info size={18} className="shrink-0"/>
                                                    <div className="text-xs">
                                                        <p className="font-black uppercase tracking-widest mb-1">Tiered Pricing Active</p>
                                                        <p className="font-bold opacity-80">The unit price will automatically decrease based on the quantity you enter.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Area Based Inputs */}
                                            {(selItem.calcType === 'Area' || selItem.calcType === 'Area_Thickness' || selItem.calcType === 'Sheet_Cut') && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Width (CM) *</label>
                                                        <input type="number" required placeholder="0" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.width} onChange={e => setCalcForm({...calcForm, width: e.target.value})} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Height (CM) *</label>
                                                        <input type="number" required placeholder="0" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.height} onChange={e => setCalcForm({...calcForm, height: e.target.value})} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Thickness Input with Smart Dropdown */}
                                            {(selItem.calcType === 'Area_Thickness' || selItem.calcType === 'Sheet_Cut') && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Thickness (MM) *</label>
                                                    {selItem.thicknessTiers && selItem.thicknessTiers.length > 0 ? (
                                                        <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.thickness} onChange={e => setCalcForm({...calcForm, thickness: e.target.value})}>
                                                            <option value="">Select Thickness...</option>
                                                            {selItem.thicknessTiers.map(t => (
                                                                <option key={t.thickness} value={t.thickness}>{t.thickness} mm (SAR {t.price}/sqm)</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input type="number" required placeholder="e.g., 3" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.thickness} onChange={e => setCalcForm({...calcForm, thickness: e.target.value})} />
                                                    )}
                                                </div>
                                            )}

                                            {/* Time Based Input */}
                                            {(selItem.calcType === 'Time' || selItem.calcType === 'Sheet_Cut') && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Minutes Required *</label>
                                                    <input type="number" required placeholder="e.g., 15" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.minutes} onChange={e => setCalcForm({...calcForm, minutes: e.target.value})} />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Quantity *</label>
                                                <input type="number" min="1" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.qty} onChange={e => setCalcForm({...calcForm, qty: e.target.value})} />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Remarks / Description</label>
                                                <input type="text" placeholder="Add custom notes..." className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-xs text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={calcForm.desc} onChange={e => setCalcForm({...calcForm, desc: e.target.value})} />
                                            </div>

                                            {/* LIVE CALCULATION RESULT */}
                                            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700">
                                                <div className="p-4 bg-slate-900 dark:bg-black rounded-2xl mt-4 flex justify-between items-center shadow-inner">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Estimate</span>
                                                    <span className="text-2xl font-black text-emerald-400">{formatCurrency(calculateEstimateItemTotal(selItem, calcForm).total)}</span>
                                                </div>
                                            </div>

                                            <button type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:scale-95 transition-all">
                                                Add to Estimate List
                                            </button>
                                        </div>
                                    );
                                })()}
                            </form>
                        </div>

                        {/* ESTIMATE CART (Right 8 cols) */}
                        <div className="lg:col-span-7 bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-6 bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-100 dark:border-slate-800 flex items-center">
                                <ShoppingCart size={20} className="text-slate-400 mr-3"/>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Estimate Preview</h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {estimateCart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 space-y-4 py-20">
                                        <ClipboardList size={48} className="opacity-50"/>
                                        <p className="text-xs font-black uppercase tracking-widest">No items added yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {estimateCart.map((item) => (
                                            <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group flex items-center justify-between">
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                                                    </div>
                                                    <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase">{item.name}</h4>
                                                    {item.desc && <p className="text-xs font-bold text-slate-500 mt-0.5">{item.desc}</p>}
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specs: {item.specs} | Qty: <span className="text-slate-700 dark:text-slate-300">{item.qty}</span></p>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="font-black text-lg text-slate-900 dark:text-slate-100">{formatCurrency(item.totalPrice)}</span>
                                                    {item.rate && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rate Used: SAR {item.rate}</span>}
                                                    <button onClick={() => setEstimateCart(estimateCart.filter(i => i.id !== item.id))} className="mt-2 p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all" title="Remove Item"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-900 dark:bg-black text-white flex justify-between items-center mt-auto">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Grand Total Estimate</span>
                                <span className="text-3xl font-black text-emerald-400">{formatCurrency(estimateCart.reduce((a,b)=>a+b.totalPrice, 0))}</span>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )}

            {/* --- CRM VIEW --- */}
            {activeTab === 'crm' && (
              <div className="max-w-[100rem] mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex space-x-3">
                      <button onClick={() => exportToExcel(crms, `CRM_JOBS_${new Date().toISOString().split('T')[0]}`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export</button>
                  </div>
                  <button onClick={() => openModal('crm')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Plus size={16} className="mr-2"/> Add New Job</button>
                </div>
                
                <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                      <thead className="bg-[#4a5568] text-[10px] uppercase tracking-widest font-black text-white">
                        <tr>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Job ID</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Date</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Client Name</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 w-1/4">Work Description</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Client Type</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Exec</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-center">Work Status</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-center">Invoicing</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-center">Collection</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right no-print">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {crms.filter(c => safeSearch(c.jobId, searchTerm) || safeSearch(c.customerName, searchTerm) || safeSearch(c.description, searchTerm) || safeSearch(c.workStatus, searchTerm) || safeSearch(c.invoicingStatus, searchTerm) || safeSearch(c.collectionStatus, searchTerm) || safeSearch(c.clientType, searchTerm)).map((item) => {
                          
                          const linkedSale = sales.find(s => s.linkedJobId === item.id);
                          const relatedColls = linkedSale ? collections.filter(c => c.ref === linkedSale.invoiceNo).reduce((a,b)=>a+Number(b.amount),0) : 0;
                          const pendingAmount = linkedSale ? Number(linkedSale.grandTotal) - relatedColls : 0;
                          
                          let displayInvStatus = item.invoicingStatus || 'Not invoiced';
                          let displayCollStatus = item.collectionStatus || 'Pending';
                          let invBadgeColor = 'bg-gray-100 text-gray-700';
                          let collBadgeColor = 'bg-gray-100 text-gray-700';
                          let isSmartLinked = false;

                          if (linkedSale) {
                              isSmartLinked = true;
                              displayInvStatus = 'TAX Invoice Created';
                              invBadgeColor = 'bg-emerald-600 text-white';
                              
                              if (pendingAmount <= 0) {
                                  displayCollStatus = 'Collected';
                                  collBadgeColor = 'bg-emerald-600 text-white';
                              } else if (relatedColls > 0) {
                                  displayCollStatus = 'Partial / Follow Up';
                                  collBadgeColor = 'bg-amber-500 text-white';
                              } else {
                                  displayCollStatus = 'Pending Payment';
                                  collBadgeColor = 'bg-rose-500 text-white';
                              }
                          } else {
                              if(displayInvStatus === 'Not invoiced' || displayInvStatus === 'Not Invoiced') invBadgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
                              else if(displayInvStatus === 'Sample without payment' || displayInvStatus === 'Sample with...') invBadgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                              else if(displayInvStatus === 'Without Invoice') invBadgeColor = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                              else if(displayInvStatus === 'Proforma Invoice created and sent') invBadgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
                              else if(displayInvStatus === 'TAX Invoice Sent to Client') invBadgeColor = 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
                              else invBadgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

                              if(displayCollStatus === 'Collected') collBadgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                              else if(displayCollStatus === 'Collection Follow up') collBadgeColor = 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
                          }

                          return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-4 py-3 uppercase tracking-wider">{item.jobId}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.date}</td>
                            <td className="px-4 py-3 uppercase">{item.customerName}</td>
                            <td className="px-4 py-3 uppercase truncate max-w-xs" title={item.description}>{item.description}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-widest ${getCRMClientTypeStyle(item.clientType)}`}>
                                    {item.clientType || 'Direct Client'}
                                </span>
                            </td>
                            <td className="px-4 py-3 uppercase">{salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A'}</td>
                            
                            <td className="px-4 py-3 text-center">
                                <select 
                                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center ${getCRMWorkStatusStyle(item.workStatus)}`}
                                    value={item.workStatus || 'Work Onboarded'}
                                    onChange={(e) => handleCRMStatusChange(item.id, 'workStatus', e.target.value)}
                                >
                                    <option value="Price/Quotation Submitted">Price/Quotation Submitted</option>
                                    <option value="Work Onboarded">Work Onboarded</option>
                                    <option value="Work Finished">Work Finished</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cold Lead">Cold Lead</option>
                                    <option value="Quote Rejected">Quote Rejected</option>
                                    <option value="Quote Revised">Quote Revised</option>
                                    <option value="Waiting Approval">Waiting Approval</option>
                                    <option value="Canceled">Canceled</option>
                                </select>
                            </td>

                            <td className="px-4 py-3 text-center">
                                {isSmartLinked ? (
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${invBadgeColor}`} title={`Auto-linked to Sale: ${linkedSale?.invoiceNo}`}>
                                        {displayInvStatus} 🔗
                                    </span>
                                ) : (
                                    <select 
                                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center border-none ${invBadgeColor}`}
                                        value={displayInvStatus}
                                        onChange={(e) => handleCRMStatusChange(item.id, 'invoicingStatus', e.target.value)}
                                    >
                                        <option value="Not invoiced">Not invoiced</option>
                                        <option value="TAX Invoice Created">TAX Invoice Created</option>
                                        <option value="TAX Invoice Sent to Client">TAX Invoice Sent to Client</option>
                                        <option value="Without Invoice">Without Invoice</option>
                                        <option value="Proforma Invoice created and sent">Proforma Invoice created and sent</option>
                                        <option value="Sample without payment">Sample without payment</option>
                                    </select>
                                )}
                            </td>

                            <td className="px-4 py-3 text-center">
                                {isSmartLinked ? (
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${collBadgeColor}`}>
                                        {displayCollStatus}
                                    </span>
                                ) : (
                                    <select 
                                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center border-none ${collBadgeColor}`}
                                        value={displayCollStatus}
                                        onChange={(e) => handleCRMStatusChange(item.id, 'collectionStatus', e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Collection Follow up">Collection Follow up</option>
                                        <option value="Collected">Collected</option>
                                    </select>
                                )}
                            </td>
                            
                            <td className="px-4 py-3 text-right space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end no-print">
                              {/* --- PUSH TO INVOICE BUTTON --- */}
                              {!isSmartLinked && (
                                <button onClick={() => handlePushToInvoice(item)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg" title="Push to Sales Invoice"><FilePlus size={14}/></button>
                              )}
                              <button onClick={() => openModal('crm', item)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Edit Full Job"><Edit3 size={14}/></button>
                              <button onClick={() => triggerDelete('crm', item.id, String(item.jobId))} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        )})}
                        {crms.length === 0 && <tr><td colSpan="10" className="py-12 text-center text-slate-300 dark:text-slate-600 uppercase tracking-widest">No Jobs Tracked Yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- SETTINGS VIEW --- */}
            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                   <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">Company Profile Setup</h2>
                   {settingsSuccess && <div className="mb-6 p-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-center border border-emerald-200 dark:border-emerald-500/30">Settings successfully updated!</div>}
                   
                   <form onSubmit={handleSettingsSave} className="space-y-6">
                      <div className="flex items-center space-x-8 mb-8">
                          <div className="relative group cursor-pointer">
                              <div className="w-32 h-32 rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] overflow-hidden">
                                  {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" /> : <ImageIcon size={32} className="text-slate-400 dark:text-slate-500 mb-2"/>}
                              </div>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded-3xl text-white font-bold text-xs pointer-events-none">Change Logo</div>
                          </div>
                          <div>
                              <h3 className="font-black text-slate-800 dark:text-white uppercase">Brand Identity</h3>
                              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Upload a high-res JPG or PNG for your invoices.</p>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Registered Company Name *</label><input required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={settings.companyName || ''} onChange={e => setSettings({...settings, companyName: e.target.value})} /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Tax / GST / VAT ID</label><input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20 uppercase" value={settings.taxId || ''} onChange={e => setSettings({...settings, taxId: e.target.value})} /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Official Phone Number</label><input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Support / Billing Email</label><input type="email" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})} /></div>
                          <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Headquarters Address</label><input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
                      </div>
                      
                      <div className="pt-8 flex justify-end">
                          <button type="submit" className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 transition-all">Save Global Settings</button>
                      </div>
                   </form>
                </div>
              </div>
            )}

            {/* --- LIST VIEWS --- */}
            {(activeTab === 'customers' || activeTab === 'suppliers') && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'customers' ? customers : suppliers, activeTab)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Plus size={16} className="mr-2"/> Add {activeTab.slice(0, -1)}</button>
                </div>
                
                {renderTable(
                  ['Entity Name', 'Contact Info', 'Tax / GST', 'Opening Bal.', 'Status'],
                  (activeTab === 'customers' ? customers : suppliers).filter(c => safeSearch(c.name, searchTerm) || safeSearch(c.phone, searchTerm) || safeSearch(c.email, searchTerm) || safeSearch(c.gst, searchTerm)),
                  activeTab,
                  (item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.name || '')}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        <div><Phone size={12} className="inline mr-2 opacity-70"/>{String(item.phone || 'N/A')}</div>
                        <div className="mt-1"><Mail size={12} className="inline mr-2 opacity-70"/>{String(item.email || 'N/A')}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-700 dark:text-slate-300">{String(item.gst || 'UNREGISTERED')}</td>
                      <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(item.openingBalance)}</td>
                      <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30">Active</span></td>
                      <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <button onClick={() => generateLedger(activeTab.slice(0, -1), item)} className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="View Ledger"><BookOpen size={16}/></button>
                        <button onClick={() => openModal(activeTab.slice(0, -1), item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"><Edit3 size={16}/></button>
                        <button onClick={() => triggerDelete(activeTab.slice(0, -1), item.id, String(item.name))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(products, 'products')} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal('product')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center hover:scale-95 transition-all shadow-lg shadow-blue-500/30"><Plus size={16} className="mr-2"/> Add Product</button>
                </div>
                {renderTable(
                  ['Product Name', 'Category', 'Stock Lvl', 'Cost Price', 'Selling Price'],
                  products.filter(p => safeSearch(p.name, searchTerm) || safeSearch(p.category, searchTerm) || safeSearch(p.sellingPrice, searchTerm) || safeSearch(p.purchasePrice, searchTerm)),
                  'product',
                  (item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.name || '')}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-500 dark:text-slate-400">{String(item.category || 'General')}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${Number(item.stock) <= Number(item.minStock) ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'}`}>{String(item.stock || 0)} Units</span></td>
                      <td className="px-6 py-4 font-black text-slate-500 dark:text-slate-400">{formatCurrency(item.purchasePrice)}</td>
                      <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(item.sellingPrice)}</td>
                      <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal('product', item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"><Edit3 size={16}/></button>
                        <button onClick={() => triggerDelete('product', item.id, String(item.name))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                )}
              </div>
            )}

            {(activeTab === 'sales' || activeTab === 'purchases') && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'sales' ? sales : purchases, `${settings?.companyName || 'MY'}_${activeTab.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className={`px-8 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center hover:scale-95 transition-all ${activeTab === 'sales' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30' : 'bg-gradient-to-r from-slate-700 to-slate-900 shadow-slate-900/30'}`}><Plus size={16} className="mr-2"/> Generate {activeTab.slice(0, -1)}</button>
                </div>
                
                {renderTable(
                  ['Date', 'Invoice No', activeTab === 'sales' ? 'Customer' : 'Supplier', 'Executive', 'Grand Total', 'Status'],
                  (activeTab === 'sales' ? sales : purchases).filter(i => safeSearch(i.invoiceNo, searchTerm) || safeSearch(i.customerName, searchTerm) || safeSearch(i.supplierName, searchTerm) || safeSearch(i.date, searchTerm) || safeSearch(i.grandTotal, searchTerm) || safeSearch(salesmen.find(s=>s.id === i.salesmanId)?.name, searchTerm)),
                  activeTab.slice(0, -1),
                  (item) => {
                    const relatedExps = activeTab === 'purchases' ? expenses.filter(e => (e.description === item.invoiceNo || e.ref === item.invoiceNo)).reduce((a,b)=>a+Number(b.amount),0) : 0;
                    const relatedColls = activeTab === 'sales' ? collections.filter(c => c.ref === item.invoiceNo).reduce((a,b)=>a+Number(b.amount),0) : 0;
                    const paidAmount = activeTab === 'sales' ? relatedColls : relatedExps;
                    const pendingAmount = Number(item.grandTotal) - paidAmount;
                    const status = pendingAmount <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid');

                    return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{String(item.date || '')}</td>
                      <td className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider flex items-center">
                          {String(item.invoiceNo || '')}
                          {item.linkedJobId && <ClipboardList size={14} className="ml-2 text-indigo-400" title="Linked to CRM Job"/>}
                      </td>
                      <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.customerName || item.supplierName || '')}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-400 dark:text-slate-500">{String(salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A')}</td>
                      <td className={`px-6 py-4 font-black ${activeTab === 'sales' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>{formatCurrency(item.grandTotal)}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getBadgeStyle(status)}`}>{status}</span></td>
                      <td className="px-6 py-4 text-right space-x-2 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        {pendingAmount > 0 && (
                          <button onClick={() => handleQuickPayment(item, activeTab.slice(0, -1), pendingAmount)} className="p-2 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg shrink-0" title={`Settle Pending: ${formatCurrency(pendingAmount)}`}><HandCoins size={16}/></button>
                        )}

                        <button onClick={() => setPrintDoc({ isOpen: true, type: activeTab.slice(0, -1), data: item })} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0" title="Download PDF"><Printer size={16}/></button>
                        <button onClick={() => openModal(activeTab.slice(0, -1), item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg shrink-0"><Edit3 size={16}/></button>
                        <button onClick={() => triggerDelete(activeTab.slice(0, -1), item.id, String(item.invoiceNo))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg shrink-0"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )}
                )}
              </div>
            )}

            {(activeTab === 'collections' || activeTab === 'expenses') && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'collections' ? collections : expenses, activeTab)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className={`px-8 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center hover:scale-95 transition-all ${activeTab === 'collections' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30' : 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/30'}`}><Plus size={16} className="mr-2"/> Record {activeTab.slice(0, -1)}</button>
                </div>
                
                {renderTable(
                  ['Date', 'Ref / Invoice Link', activeTab === 'collections' ? 'Customer' : 'Description', 'Executive', 'Amount', 'Method'],
                  (activeTab === 'collections' ? collections : expenses).filter(i => safeSearch(i.ref, searchTerm) || safeSearch(i.customerName, searchTerm) || safeSearch(i.description, searchTerm) || safeSearch(i.method, searchTerm) || safeSearch(i.amount, searchTerm) || safeSearch(i.date, searchTerm)),
                  activeTab.slice(0, -1),
                  (item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{String(item.date || (item.createdAt?.toDate ? item.createdAt.toDate().toISOString().split('T')[0] : ''))}</td>
                      <td className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase">{String(item.ref || item.category || 'N/A')}</td>
                      <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.customerName || item.description || '--')}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-400 dark:text-slate-500">{String(salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A')}</td>
                      <td className={`px-6 py-4 font-black ${activeTab === 'collections' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-500 dark:text-slate-400">{String(item.method || 'Cash')}</td>
                      <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity no-print flex justify-end items-center">
                        <button onClick={() => setPrintDoc({ isOpen: true, type: activeTab.slice(0, -1), data: item })} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-lg" title="Print"><Printer size={16}/></button>
                        
                        {/* --- NEW EDIT BUTTON FOR VOUCHERS --- */}
                        <button onClick={() => openModal(activeTab.slice(0, -1), item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg" title={`Edit ${activeTab.slice(0, -1)}`}><Edit3 size={16}/></button>
                        
                        <button onClick={() => triggerDelete(activeTab.slice(0, -1), item.id, formatCurrency(item.amount))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                )}
              </div>
            )}

            {activeTab === 'salesmen' && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(salesmen, 'salesmen')} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal('salesman')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Plus size={16} className="mr-2"/> Register Staff</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {salesmen.filter(s => safeSearch(s.name, searchTerm) || safeSearch(s.phone, searchTerm) || safeSearch(s.email, searchTerm)).map(sm => (
                    <div key={sm.id} className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl dark:shadow-none transition-all relative overflow-hidden group">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-500/20">{String(sm.name || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{String(sm.name || '')}</h3>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"><Phone size={10} className="inline mr-1"/>{String(sm.phone || 'N/A')}</p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        
                        {/* --- NEW CASH IN HAND LEDGER BUTTON --- */}
                        <button onClick={() => generateLedger('salesman', sm, 'cash')} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-emerald-500 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors" title="View Cash In Hand Balance"><HandCoins size={16}/></button>

                        <button onClick={() => generateLedger('salesman', sm, 'performance')} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-indigo-500 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors" title="View Sales Performance Ledger"><BookOpen size={16}/></button>
                        
                        <button onClick={() => openModal('salesman', sm)} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"><Edit3 size={16}/></button>
                        <button onClick={() => triggerDelete('salesman', sm.id, String(sm.name))} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-rose-500 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-16 pb-8 flex flex-col items-center justify-center space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-500 no-print group">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent group-hover:w-48 transition-all duration-700"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-400 dark:to-blue-500 drop-shadow-sm hover:scale-110 transition-transform duration-500 cursor-default">
                    © UMNABEEL 2026
                </p>
            </div>

          </div>
        </main>

        {/* --- ADMIN AUTH MODAL --- */}
        {adminAuth.isOpen && (
            <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all">
                <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck size={28} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Admin Action</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Authorization required</p>
                        <form onSubmit={handleAdminAuthSubmit} className="w-full">
                            <input 
                                type="password" 
                                autoFocus
                                required
                                placeholder="PIN" 
                                className={`w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-2 font-black text-center text-xl text-slate-900 dark:text-white tracking-[0.5em] mb-4 focus:outline-none transition-colors ${adminPinError ? 'border-rose-500/50 focus:border-rose-500' : 'border-transparent dark:border-slate-800 focus:border-blue-500'}`}
                                value={adminPinInput}
                                onChange={e => setAdminPinInput(e.target.value)}
                            />
                            {adminPinError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mb-4">Incorrect Admin PIN</p>}
                            <div className="flex space-x-3">
                                <button type="button" onClick={() => setAdminAuth({ isOpen: false, callback: null })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/30 hover:scale-95 transition-all">Verify</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODALS & PRINTS --- */}
        {modalState.isOpen && modalState.type !== 'ledger' && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto no-print transition-all">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative my-8 border border-slate-200 dark:border-slate-800">
              <div className="sticky top-0 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center rounded-t-[2.5rem] z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">
                  {modalState.type === 'estimatorItem' ? (modalState.data?.id ? 'Edit Estimate Item' : 'New Estimate Item') : 
                   modalState.data?.id ? `Edit ${String(modalState.type)}` : `New ${String(modalState.type)}`}
                </h2>
                <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar relative">
                
                {/* FORM ERROR ALERT */}
                {formError && (
                    <div className="p-4 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-200 dark:border-rose-500/30 flex items-center">
                        <AlertTriangle size={16} className="mr-2 shrink-0"/> {formError}
                    </div>
                )}

                {/* MODAL: PRICE ESTIMATOR ITEMS */}
                {modalState.type === 'estimatorItem' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Category (e.g., Sticker, Acrylic) *</label>
                        <input required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Specific Item Name *</label>
                        <input required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Calculation Method *</label>
                        <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.calcType || 'Area'} onChange={e => setFormData({...formData, calcType: e.target.value})}>
                            <option value="Area">Area Based (Width x Height)</option>
                            <option value="Area_Thickness">Area + Thickness (W x H x Thickness)</option>
                            <option value="Sheet_Cut">Sheet & Cut (W x H x Thickness + Time)</option>
                            <option value="Time">Time Based (Minutes x Rate)</option>
                            <option value="Fixed">Fixed / Unit Based (Qty x Rate)</option>
                            <option value="Tiered">Quantity Tiered (E.g. Books, Cards)</option>
                            <option value="Standard_Matrix">Standard Size Matrix (Acrylic Chart)</option>
                        </select>
                    </div>

                    {formData.calcType === 'Tiered' ? (
                        <div className="md:col-span-2 bg-slate-50 dark:bg-[#0f172a] p-6 rounded-2xl">
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-4 block">Pricing Tiers (Price automatically drops based on quantity)</label>
                            <div className="space-y-3">
                                {formData.tiers?.map((tier, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Min Qty</span>
                                            <input type="number" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.minQty} onChange={(e) => handleTierChange(idx, 'minQty', e.target.value)} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Unit Price (SAR)</span>
                                            <input type="number" step="any" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.price} onChange={(e) => handleTierChange(idx, 'price', e.target.value)} />
                                        </div>
                                        <button type="button" onClick={() => removeTier(idx)} className="mt-4 p-3 text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addTier} className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-200 transition-colors">+ Add Tier Level</button>
                        </div>
                    ) : formData.calcType === 'Standard_Matrix' ? (
                        <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl flex items-center space-x-4 border border-indigo-100 dark:border-indigo-800">
                            <Table size={24} className="text-indigo-500 shrink-0"/>
                            <div>
                                <p className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Standard Matrix Applied</p>
                                <p className="text-[10px] font-bold text-indigo-500/80 mt-1">This item will automatically use the predefined Acrylic prices from the standard sizes chart. Custom inputs will be interpolated.</p>
                            </div>
                        </div>
                    ) : formData.calcType === 'Area_Thickness' || formData.calcType === 'Sheet_Cut' ? (
                        <>
                            <div className="md:col-span-2 bg-slate-50 dark:bg-[#0f172a] p-6 rounded-2xl">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-4 block">Thickness Pricing Tiers (Per Sq.Mtr)</label>
                                <div className="space-y-3">
                                    {formData.thicknessTiers?.map((tier, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Thickness (mm)</span>
                                                <input type="number" step="any" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.thickness} onChange={(e) => {
                                                    const newTiers = [...(formData.thicknessTiers || [])];
                                                    newTiers[idx].thickness = Number(e.target.value) || 0;
                                                    setFormData({...formData, thicknessTiers: newTiers});
                                                }} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Price per Sq.Mtr (SAR)</span>
                                                <input type="number" step="any" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.price} onChange={(e) => {
                                                    const newTiers = [...(formData.thicknessTiers || [])];
                                                    newTiers[idx].price = Number(e.target.value) || 0;
                                                    setFormData({...formData, thicknessTiers: newTiers});
                                                }} />
                                            </div>
                                            <button type="button" onClick={() => {
                                                const newTiers = [...(formData.thicknessTiers || [])];
                                                newTiers.splice(idx, 1);
                                                setFormData({...formData, thicknessTiers: newTiers});
                                            }} className="mt-4 p-3 text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => setFormData({...formData, thicknessTiers: [...(formData.thicknessTiers || []), { thickness: 0, price: 0 }]})} className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-200 transition-colors">+ Add Thickness Rate</button>
                            </div>
                            {formData.calcType === 'Sheet_Cut' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Cut Rate per Minute *</label>
                                    <input type="number" required step="any" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.timeRate || ''} onChange={e => setFormData({...formData, timeRate: e.target.value})} />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Base Rate (SAR) *</label>
                            <input type="number" required step="any" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.rate || ''} onChange={e => setFormData({...formData, rate: e.target.value})} />
                        </div>
                    )}
                  </div>
                )}

                {/* MODAL: SALE/PURCHASE/EXPENSE/COLLECTION/CRM */}
                {['sale', 'purchase', 'expense', 'collection', 'crm'].includes(modalState.type) && (
                  <div className="p-6 bg-slate-50 dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 mb-6 shadow-inner dark:shadow-none">
                     <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">Select Entity / Customer *</label>
                     <select required className="w-full p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-slate-800 dark:text-white uppercase focus:ring-2 ring-blue-500/20 shadow-sm" 
                             value={formData.customerId || formData.supplierId || formData.partyName || ''} 
                             onChange={e => {
                               if(modalState.type === 'sale' || modalState.type === 'collection' || modalState.type === 'crm') {
                                 const entity = customers.find(c => c.id === e.target.value);
                                 if(entity) setFormData({...formData, customerId: entity.id, customerName: entity.name, partyName: entity.name});
                               } else if (modalState.type === 'purchase') {
                                 const entity = suppliers.find(s => s.id === e.target.value);
                                 if(entity) setFormData({...formData, supplierId: entity.id, supplierName: entity.name, partyName: entity.name});
                               } else {
                                 setFormData({...formData, partyName: e.target.value});
                               }
                             }}>
                       <option value="">Choose Existing Entity...</option>
                       {(['sale', 'collection', 'crm'].includes(modalState.type) ? customers : suppliers).map(c => <option key={c.id} value={c.id}>{String(c.name)}</option>)}
                     </select>

                     {modalState.type === 'sale' && formData.customerId && (
                         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Smart Link to CRM Job (Optional)</label>
                            <select className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white uppercase text-xs focus:ring-2 ring-indigo-500/20" 
                                    value={formData.linkedJobId || ''} 
                                    onChange={e => setFormData({...formData, linkedJobId: e.target.value})}>
                                <option value="">No Link (Independent Invoice)</option>
                                {crms.filter(c => c.customerId === formData.customerId).map(job => (
                                    <option key={job.id} value={job.id}>{job.jobId} - {job.description.slice(0,40)}...</option>
                                ))}
                            </select>
                         </div>
                     )}
                  </div>
                )}

                {modalState.type === 'crm' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Date *</label><input type="date" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.date || new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Client Type *</label>
                      <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-800 dark:text-white uppercase" value={formData.clientType || 'Direct Client'} onChange={e => setFormData({...formData, clientType: e.target.value})}>
                        <option value="Direct Client">Direct Client</option>
                        <option value="Agency">Agency</option>
                      </select>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Sales Executive *</label>
                      <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-800 dark:text-white uppercase" value={formData.salesmanId || ''} onChange={e => setFormData({...formData, salesmanId: e.target.value})}>
                        <option value="">Select Exec...</option>{salesmen.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Work Description (Detailed) *</label><textarea required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20 min-h-[100px]" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                  </div>
                )}

                {(modalState.type === 'customer' || modalState.type === 'supplier' || modalState.type === 'salesman') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Full Name *</label><input required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Phone</label><input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Email</label><input type="email" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                    {(modalState.type === 'customer' || modalState.type === 'supplier') && (
                      <>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">GST/Tax ID</label><input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20 uppercase" value={formData.gst || ''} onChange={e => setFormData({...formData, gst: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Opening Balance</label><input type="number" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.openingBalance || ''} onChange={e => setFormData({...formData, openingBalance: e.target.value})} /></div>
                      </>
                    )}
                  </div>
                )}

                {modalState.type === 'product' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Product Name *</label><input required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Category</label><input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20 uppercase" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Current Stock *</label><input type="number" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Cost Price (Purchase) *</label><input type="number" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.purchasePrice || ''} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Selling Price *</label><input type="number" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.sellingPrice || ''} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Tax (%)</label><input type="number" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.tax || ''} onChange={e => setFormData({...formData, tax: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Minimum Stock Alert</label><input type="number" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.minStock || ''} onChange={e => setFormData({...formData, minStock: e.target.value})} /></div>
                  </div>
                )}

                {['collection', 'expense'].includes(modalState.type) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Amount (SAR) *</label><input type="number" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-xl text-slate-800 dark:text-white" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Date *</label><input type="date" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-500 dark:text-slate-300 uppercase" value={formData.date || new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Sales Executive *</label>
                      <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-800 dark:text-white uppercase" value={formData.salesmanId || ''} onChange={e => setFormData({...formData, salesmanId: e.target.value})}>
                        <option value="">Select Staff...</option>{salesmen.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
                      </select>
                    </div>
                    {modalState.type === 'collection' && (
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Method</label>
                        <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-800 dark:text-white uppercase" value={formData.method || ''} onChange={e => setFormData({...formData, method: e.target.value})}><option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Card</option></select>
                      </div>
                    )}
                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Ref / Linked Invoice Notes</label><input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase" value={formData.ref || formData.description || ''} onChange={e => setFormData({...formData, [modalState.type === 'collection' ? 'ref' : 'description']: e.target.value})} /></div>
                  </div>
                )}

                {['sale', 'purchase'].includes(modalState.type) && (
                  <div className="space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Sales Executive *</label>
                      <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase" value={formData.salesmanId || ''} onChange={e => setFormData({...formData, salesmanId: e.target.value})}>
                        <option value="">Select Staff...</option>{salesmen.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
                      </select>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 mb-4">Item Details</h3>
                      
                      {/* TABLE HEADER FOR ITEM DETAILS */}
                      <div className="hidden md:flex gap-3 px-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <div className="w-[30%]">Product</div>
                         <div className="flex-1">Description (Optional)</div>
                         <div className="w-20 text-center">Qty</div>
                         <div className="w-28 text-right">Rate</div>
                         <div className="w-32 text-right">Total</div>
                         <div className="w-10"></div>
                      </div>

                      <div className="space-y-3 mt-3">
                        {invoiceItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center p-3 md:p-0 bg-white dark:bg-[#1e293b] md:bg-transparent rounded-xl md:rounded-none border border-slate-200 dark:border-slate-700 md:border-none">
                            <select required className="w-full md:w-[30%] p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white uppercase text-xs" value={item.productId || ''} onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}>
                              <option value="">Select Product...</option>{products.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}
                            </select>
                            
                            {/* CUSTOM DESCRIPTION FIELD */}
                            <input type="text" placeholder="Custom Description" className="w-full md:flex-1 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400" value={item.description || ''} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} />
                            
                            <div className="flex gap-3 w-full md:w-auto">
                              <input type="number" placeholder="Qty" required className="flex-1 md:w-20 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-center text-xs" value={item.qty || ''} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} />
                              <input type="number" placeholder="Rate" required className="flex-1 md:w-28 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-right text-xs" value={item.rate || ''} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} />
                            </div>
                            
                            <div className="w-full md:w-32 p-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-black text-right text-xs text-slate-800 dark:text-slate-200 border border-transparent dark:border-slate-700">{formatCurrency(item.total)}</div>
                            
                            {/* DELETE ROW BUTTON */}
                            <button type="button" onClick={() => removeRow(idx)} className="w-full md:w-10 p-3 flex justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors shrink-0" title="Remove Item">
                               <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setInvoiceItems([...invoiceItems, { productId: '', name: '', description: '', qty: 1, rate: 0, tax: 0, total: 0 }])} className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg mt-2 transition-colors"><Plus size={14} className="mr-1"/> Add Row</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-4">
                  <button type="button" onClick={closeModal} disabled={isSubmitting} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Saving...' : `Save ${String(modalState.type)}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {modalState.isOpen && modalState.type === 'ledger' && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto no-print">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative my-8 border border-slate-200 dark:border-slate-800">
              <div className="sticky top-0 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center rounded-t-[2.5rem] z-10">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">{modalState.data?.entity?.name}</h2>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{modalState.data?.entityType} Ledger / Statement</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => exportToExcel(modalState.data?.rows, `Ledger_${modalState.data?.entity?.name}`)} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Export Excel"><DownloadCloud size={18}/></button>
                    <button onClick={() => setPrintDoc({ isOpen: true, type: 'ledger', data: modalState.data })} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors" title="Print Ledger"><Printer size={18}/></button>
                    <button onClick={closeModal} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"><X size={18}/></button>
                </div>
              </div>
              <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-[#0f172a] text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                          <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Reference</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Debit (SAR)</th><th className="px-6 py-4 text-right">Credit (SAR)</th><th className="px-6 py-4 text-right">Balance</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                          {modalState.data?.rows?.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{r.date}</td>
                                  <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-black">{r.ref}</td>
                                  <td className="px-6 py-4">{r.desc}</td>
                                  <td className="px-6 py-4 text-right text-rose-500 dark:text-rose-400">{r.debit > 0 ? formatCurrency(r.debit) : '-'}</td>
                                  <td className="px-6 py-4 text-right text-emerald-500 dark:text-emerald-400">{r.credit > 0 ? formatCurrency(r.credit) : '-'}</td>
                                  <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(r.balance)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </div>
          </div>
        )}

        {printDoc.isOpen && (
          <div className="fixed inset-0 bg-slate-900/98 dark:bg-black/98 backdrop-blur-xl z-[500] overflow-y-auto print-overlay">
            <div className="max-w-4xl mx-auto flex justify-between items-center my-8 px-4 no-print">
              <div className="flex items-center space-x-4 text-white">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><FileText size={24}/></div>
                <div><h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Document Engine</h2><p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">Ready for PDF Download</p></div>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => {
                  const refNo = printDoc.data?.invoiceNo || printDoc.data?.ref || printDoc.data?.entity?.name || 'DOC';
                  triggerSystemPrint(`${settings?.companyName || 'MY'}_${String(printDoc.type).toUpperCase()}_${refNo}`);
                }} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 flex items-center transition-all"><DownloadCloud size={18} className="mr-2"/> Generate PDF</button>
                <button onClick={() => setPrintDoc({ isOpen: false, type: '', data: null })} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"><X size={20}/></button>
              </div>
            </div>

            <div id="printable-area" className="max-w-[210mm] mx-auto bg-white min-h-[297mm] p-[15mm] shadow-2xl relative font-sans text-slate-900 mb-20 print:shadow-none" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                <div className="w-64 text-slate-900">
                    {settings?.logo ? <img src={settings.logo} className="w-16 h-16 object-contain mb-2 rounded-xl" alt="Logo"/> : <div className="text-3xl font-black tracking-tighter mb-2 text-slate-900">C<span className="text-blue-500">E</span></div>}
                    <h2 className="font-black text-lg uppercase tracking-tight text-slate-900">{settings?.companyName || 'My Custom ERP'}</h2>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-1">
                    {printDoc.type === 'sale' ? 'INVOICE' : 
                     printDoc.type === 'purchase' ? 'PURCHASE ORDER' : 
                     printDoc.type === 'collection' ? 'PAYMENT RECEIPT' : 
                     printDoc.type === 'estimate' ? 'PRICE ESTIMATE' : 
                     printDoc.type === 'ledger' ? 'STATEMENT OF ACCOUNT' : 'EXPENSE VOUCHER'}
                  </h1>
                  {printDoc.type !== 'estimate' && (
                      <p className="text-lg font-black text-blue-600">
                        {String(printDoc.data?.invoiceNo || printDoc.data?.id?.slice(0, 8) || printDoc.data?.entity?.name || '')}
                      </p>
                  )}
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Date: {String(printDoc.data?.date || (printDoc.data?.createdAt?.toDate ? printDoc.data.createdAt.toDate().toISOString().split('T')[0] : ''))}
                  </p>
                </div>
              </div>

              {printDoc.type !== 'estimate' && (
                  <div className="grid grid-cols-2 gap-12 mb-12">
                    <div className="border-l-4 border-blue-600 pl-4">
                      <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Issued By</h2>
                      <p className="font-black text-sm uppercase text-slate-900">{settings?.companyName || 'My Custom ERP'}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">Tax ID: {settings?.taxId || '310294817200003'}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{settings?.email || 'info@erp.com'} | {settings?.phone || '+966 50 000 0000'}</p>
                      {settings?.address && <p className="text-xs font-bold text-slate-500 mt-1">{settings.address}</p>}
                    </div>
                    <div className="border-l-4 border-slate-900 pl-4">
                      <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                        {printDoc.type === 'sale' ? 'Billed To Customer' : 
                         printDoc.type === 'purchase' ? 'Supplier Details' : 
                         printDoc.type === 'ledger' ? `${printDoc.data?.entityType} Details` :
                         printDoc.type === 'collection' ? 'Received From' : 'Expense Account'}
                      </h2>
                      <p className="font-black text-sm uppercase text-slate-900">
                        {String(printDoc.data?.customerName || printDoc.data?.supplierName || printDoc.data?.category || printDoc.data?.description || printDoc.data?.entity?.name || '')}
                      </p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                        Contact: {String(printDoc.data?.entity?.phone || '--')}
                      </p>
                    </div>
                  </div>
              )}

              {printDoc.type === 'ledger' ? (
                  <table className="w-full text-left border-collapse mb-12">
                    <thead className="bg-slate-50 border-y-2 border-slate-900">
                      <tr><th className="py-4 px-2 text-[10px] font-black uppercase text-slate-600">Date</th><th className="py-4 px-2 text-[10px] font-black uppercase text-slate-600">Ref</th><th className="py-4 px-2 text-[10px] font-black uppercase text-slate-600">Description</th><th className="py-4 px-2 text-[10px] font-black uppercase text-slate-600 text-right">Debit</th><th className="py-4 px-2 text-[10px] font-black uppercase text-slate-600 text-right">Credit</th><th className="py-4 px-2 text-[10px] font-black uppercase text-slate-600 text-right">Balance</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold uppercase text-slate-800">
                      {printDoc.data?.rows?.map((r, idx) => (
                        <tr key={idx}><td className="py-3 px-2">{r.date}</td><td className="py-3 px-2 text-blue-600">{r.ref}</td><td className="py-3 px-2">{r.desc}</td><td className="py-3 px-2 text-right">{r.debit > 0 ? formatCurrency(r.debit) : '-'}</td><td className="py-3 px-2 text-right">{r.credit > 0 ? formatCurrency(r.credit) : '-'}</td><td className="py-3 px-2 text-right font-black">{formatCurrency(r.balance)}</td></tr>
                      ))}
                    </tbody>
                  </table>
              ) : 
              
              printDoc.type === 'estimate' ? (
                 <>
                  <table className="w-full text-left border-collapse mb-12">
                    <thead className="bg-slate-50 border-y-2 border-slate-900">
                      <tr>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">S.No</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Description / Spec</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Qty</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Unit Total</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-bold uppercase text-slate-900">
                      {printDoc.data?.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-5 px-2 text-slate-400">{idx + 1}</td>
                          <td className="py-5 px-2 text-slate-900">
                            <div><span className="text-blue-600">[{item.category}]</span> {item.name}</div>
                            <div className="text-xs text-slate-500 mt-1 font-bold">{item.specs}</div>
                            {item.desc && <div className="text-[10px] text-slate-400 mt-1 font-normal normal-case">{item.desc}</div>}
                          </td>
                          <td className="py-5 px-2 text-center text-slate-700">{item.qty}</td>
                          <td className="py-5 px-2 text-right text-slate-700">{formatCurrency(item.totalPrice / item.qty)}</td>
                          <td className="py-5 px-2 text-right text-slate-900">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end mb-16">
                    <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="border-t-2 border-slate-900 pt-4 flex justify-between text-xl font-black text-slate-900 uppercase"><span>Est. Total</span><span className="text-blue-600">{formatCurrency(printDoc.data?.grandTotal)}</span></div>
                    </div>
                  </div>
                 </>
              ) :

              ['sale', 'purchase'].includes(printDoc.type) ? (
                <>
                  <table className="w-full text-left border-collapse mb-12">
                    <thead className="bg-slate-50 border-y-2 border-slate-900">
                      <tr>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">S.No</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Product Description</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Qty</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Unit Rate</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Tax %</th>
                        <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-bold uppercase text-slate-900">
                      {printDoc.data?.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-5 px-2 text-slate-400">{idx + 1}</td>
                          <td className="py-5 px-2 text-slate-900">
                            <div>{String(item.name || '')}</div>
                            {item.description && <div className="text-xs text-slate-500 mt-1 font-normal normal-case">{item.description}</div>}
                          </td>
                          <td className="py-5 px-2 text-center text-slate-700">{String(item.qty || 0)}</td>
                          <td className="py-5 px-2 text-right text-slate-700">{formatCurrency(item.rate)}</td>
                          <td className="py-5 px-2 text-center text-slate-500">{String(item.tax || 0)}%</td>
                          <td className="py-5 px-2 text-right text-slate-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end mb-16">
                    <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest"><span>Subtotal</span><span>{formatCurrency(printDoc.data?.subTotal)}</span></div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest"><span>Total Tax</span><span>{formatCurrency(printDoc.data?.taxTotal)}</span></div>
                      {Number(printDoc.data?.discount) > 0 && <div className="flex justify-between text-xs font-bold text-rose-500 uppercase tracking-widest"><span>Discount</span><span>-{formatCurrency(printDoc.data?.discount)}</span></div>}
                      <div className="border-t-2 border-slate-900 pt-4 flex justify-between text-xl font-black text-slate-900 uppercase"><span>Grand Total</span><span className="text-blue-600">{formatCurrency(printDoc.data?.grandTotal)}</span></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 mb-12">
                      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-6">
                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Method</p>
                              <p className="text-lg font-black text-slate-800 uppercase">{String(printDoc.data?.method || 'N/A')}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount</p>
                              <p className="text-3xl font-black text-blue-600">{formatCurrency(printDoc.data?.amount)}</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Executive / Handled By</p>
                              <p className="font-bold text-sm text-slate-700 uppercase">{String(salesmen.find(s=>s.id === printDoc.data?.salesmanId)?.name || 'N/A')}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notes / Description</p>
                              <p className="font-bold text-sm text-slate-700 uppercase">{String(printDoc.data?.description || printDoc.data?.ref || '--')}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex justify-between items-end mb-16 px-8 mt-32">
                      <div className="w-48 border-t-2 border-slate-300 pt-2 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Executive Signature</div>
                      <div className="w-48 border-t-2 border-slate-300 pt-2 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Authorized Stamp</div>
                  </div>
                </>
              )}

              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-slate-200 pt-4 flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                  <span>System Generated Document</span>
                  <span>Powered by {settings?.companyName || 'Cloud ERP'}</span>
              </div>
            </div>
          </div>
        )}

        {confirmDelete.isOpen && (
          <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 no-print transition-all">
            <div className="max-w-md w-full bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase">Delete Record?</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8 uppercase">Permanently remove <span className="text-slate-900 dark:text-white font-black">"{String(confirmDelete.title)}"</span>?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setConfirmDelete({ isOpen: false })} className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={executeDelete} className="py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-95 transition-transform">Confirm</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
