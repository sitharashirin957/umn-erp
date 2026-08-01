import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, ReceiptText, Users, Settings, Plus, Search, 
  Briefcase, X, Printer, TrendingUp, Trash2, Phone, Mail, 
  ShieldCheck, HandCoins, ShoppingBag, CreditCard, Menu, 
  Edit3, Receipt, Package, Truck, FileText, PieChart as PieChartIcon, 
  Bell, DownloadCloud, AlertTriangle, UsersRound, Activity, BookOpen, Image as ImageIcon,
  Sun, Moon
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment, setDoc } from 'firebase/firestore';

// --- Firebase Configuration ---
// ... existing code ...
// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// ... existing code ...  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'custom-erp-v1';

const safeSearch = (val, term) => String(val || '').toLowerCase().includes(String(term || '').toLowerCase());
const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(Number(num) || 0);
const generateID = (prefix, length) => `${prefix}-${String(length + 1).padStart(5, '0')}`;

const getBadgeStyle = (status) => {
  if (status === 'Paid' || status === 'Active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 border';
  if (status === 'Partial') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 border';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 border';
};

// Clean object utility for Firestore
const cleanObject = (obj) => {
  const cleaned = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !obj[key].toDate) {
        cleaned[key] = cleanObject(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  return cleaned;
};

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
        <span className="relative text-white font-black text-xl tracking-tighter">M<span className="text-cyan-300">Y</span></span>
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

const KPICard = ({ title, value, icon: Icon, colorClass, bgClass, trend }) => (
  <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 group relative overflow-hidden">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${bgClass} opacity-50 dark:opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{String(title)}</p>
        <h3 className={`text-3xl font-black ${colorClass} tracking-tight`}>{String(value)}</h3>
        {trend && <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400 mt-2 flex items-center"><TrendingUp size={12} className="mr-1"/> {String(trend)}</p>}
      </div>
      <div className={`p-4 rounded-2xl ${bgClass} ${colorClass} shadow-inner dark:bg-opacity-20`}><Icon size={24} /></div>
    </div>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [searchTerm, setSearchTerm] = useState('');

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  
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
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return; 
    const collectionsMap = {
      customers: setCustomers, suppliers: setSuppliers, products: setProducts,
      sales: setSales, purchases: setPurchases, collections: setCollections, 
      expenses: setExpenses, salesmen: setSalesmen
    };

    const unsubscribers = Object.entries(collectionsMap).map(([colName, setter]) => 
      onSnapshot(
        collection(db, 'artifacts', appId, 'public', 'data', colName), 
        (snap) => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setter(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        },
        (error) => {
          console.error(`Error syncing ${colName}:`, error);
          if (error.code === 'permission-denied') setDbError(true);
        }
      )
    );
    
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'profile'), (snap) => {
        if (snap.exists()) setSettings(snap.data());
    });
    
    return () => {
        unsubscribers.forEach(unsub => unsub());
        unsubSettings();
    };
  }, [user]);

  const analytics = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
    const totalCollections = collections.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const outstandingReceivables = totalSales - totalCollections;
    const netProfit = totalSales - totalPurchases - totalExpenses;
    return { totalSales, totalPurchases, totalCollections, totalExpenses, outstandingReceivables, netProfit };
  }, [sales, purchases, collections, expenses]);

  const chartData = useMemo(() => {
    const map = {};
    const process = (arr, key) => {
      arr.forEach(item => {
        if(!item.date) return;
        const ym = item.date.substring(0, 7); 
        if(!map[ym]) {
           const d = new Date(item.date);
           const mName = d.toLocaleString('default', { month: 'short' });
           map[ym] = { sortKey: ym, name: `${mName} '${d.getFullYear().toString().slice(2)}`, sales: 0, purchases: 0 };
        }
        map[ym][key] += Number(item.grandTotal) || 0;
      });
    };
    process(sales, 'sales');
    process(purchases, 'purchases');
    return Object.values(map)
      .sort((a,b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6);
  }, [sales, purchases]);

  const topDebtors = useMemo(() => {
    return customers.map(c => {
       const tSales = sales.filter(s => s.customerId === c.id).reduce((sum, s) => sum + Number(s.grandTotal), 0);
       const tColls = collections.filter(coll => coll.customerId === c.id).reduce((sum, coll) => sum + Number(coll.amount), 0);
       const bal = (Number(c.openingBalance)||0) + tSales - tColls;
       return { ...c, balance: bal };
    }).filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5);
  }, [customers, sales, collections]);

  const openModal = (type, data = null) => {
    setFormData(data ? { ...data } : {});
    if (type === 'sale' || type === 'purchase') {
      setInvoiceItems(data?.items || [{ productId: '', name: '', qty: 1, rate: 0, tax: 0, total: 0 }]);
    }
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
    setFormData({});
    setInvoiceItems([]);
  };

  const handleQuickPayment = (item, type, pendingAmount) => {
    if (type === 'sale') {
      setFormData({
        customerId: item.customerId,
        customerName: item.customerName,
        partyName: item.customerName,
        ref: item.invoiceNo, 
        amount: pendingAmount > 0 ? pendingAmount : 0,
        date: new Date().toISOString().split('T')[0]
      });
      setModalState({ isOpen: true, type: 'collection', data: null });
    } else if (type === 'purchase') {
      setFormData({
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        partyName: item.supplierName,
        description: item.invoiceNo, 
        amount: pendingAmount > 0 ? pendingAmount : 0,
        date: new Date().toISOString().split('T')[0]
      });
      setModalState({ isOpen: true, type: 'expense', data: null });
    }
  };

  const generateLedger = (type, entity) => {
    let rows = [];
    let balance = Number(entity.openingBalance) || 0;
    
    if (type === 'customer') {
        rows.push({ date: '-', ref: 'OP-BAL', desc: 'Opening Balance', debit: balance > 0 ? balance : 0, credit: balance < 0 ? Math.abs(balance) : 0, balance, rawDate: new Date(0) });
        const s = sales.filter(x => x.customerId === entity.id).map(x => ({ date: x.date, ref: x.invoiceNo, desc: 'Sales Invoice', debit: Number(x.grandTotal), credit: 0, rawDate: new Date(x.date) }));
        const c = collections.filter(x => x.customerId === entity.id).map(x => ({ date: x.date, ref: x.ref || 'PAYMENT', desc: x.method || 'Collection Received', debit: 0, credit: Number(x.amount), rawDate: new Date(x.date) }));
        [...s, ...c].sort((a,b) => a.rawDate - b.rawDate).forEach(r => {
            balance = balance + r.debit - r.credit;
            rows.push({ ...r, balance });
        });
    } else if (type === 'supplier') {
        rows.push({ date: '-', ref: 'OP-BAL', desc: 'Opening Balance', debit: balance < 0 ? Math.abs(balance) : 0, credit: balance > 0 ? balance : 0, balance, rawDate: new Date(0) });
        const p = purchases.filter(x => x.supplierId === entity.id).map(x => ({ date: x.date, ref: x.invoiceNo, desc: 'Purchase Order', debit: 0, credit: Number(x.grandTotal), rawDate: new Date(x.date) }));
        const e = expenses.filter(x => x.partyName === entity.name || x.supplierName === entity.name).map(x => ({ date: x.date, ref: x.ref || x.description || 'PAYMENT', desc: x.method || 'Payment Sent', debit: Number(x.amount), credit: 0, rawDate: new Date(x.date) }));
        [...p, ...e].sort((a,b) => a.rawDate - b.rawDate).forEach(r => {
            balance = balance - r.debit + r.credit;
            rows.push({ ...r, balance });
        });
    } else if (type === 'salesman') {
        const s = sales.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.invoiceNo, desc: `Sale (${x.customerName})`, debit: Number(x.grandTotal), credit: 0, rawDate: new Date(x.date) }));
        const c = collections.filter(x => x.salesmanId === entity.id).map(x => ({ date: x.date, ref: x.ref || 'PAYMENT', desc: `Collection (${x.customerName})`, debit: 0, credit: Number(x.amount), rawDate: new Date(x.date) }));
        let perfBal = 0;
        [...s, ...c].sort((a,b) => a.rawDate - b.rawDate).forEach(r => {
            perfBal = perfBal + r.debit - r.credit;
            rows.push({ ...r, balance: perfBal });
        });
    }

    setModalState({ isOpen: true, type: 'ledger', data: { entity, entityType: type, rows } });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { type, data } = modalState;
    const isEdit = !!data?.id;
    const colMap = { 'salesman': 'salesmen', 'customer': 'customers', 'supplier': 'suppliers', 'product': 'products', 'sale': 'sales', 'purchase': 'purchases', 'collection': 'collections', 'expense': 'expenses' };
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

      } else {
        if (isEdit) {
          await updateDoc(doc(collectionRef, data.id), payload);
        } else {
          await addDoc(collectionRef, { ...payload, createdAt: serverTimestamp() });
        }
      }
      closeModal();
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'profile'), cleanObject(settings), { merge: true });
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (e) { console.error(e); }
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
      const colMap = { 'salesman': 'salesmen', 'customer': 'customers', 'supplier': 'suppliers', 'product': 'products', 'sale': 'sales', 'purchase': 'purchases', 'collection': 'collections', 'expense': 'expenses' };
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
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 overflow-hidden selection:bg-blue-500/30 transition-colors duration-300">
        
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
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
               <NavItem id="settings" icon={Settings} label="Company Profile" activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setMobileMenu={setIsMobileMenuOpen} />
            </div>
          </nav>
        </aside>

        {}
        <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isDesktop ? 'lg:pl-24' : ''}`}>
          <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 no-print">
            <div className="flex items-center space-x-4">
              <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24}/></button>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="hidden md:flex items-center bg-slate-50 dark:bg-[#0f172a] rounded-full px-4 py-2 w-80 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 ring-blue-100 dark:ring-blue-900/30 transition-all">
                <Search size={18} className="text-slate-400 mr-2" />
                <input type="text" placeholder="Global Entity Search..." className="bg-transparent border-none text-sm font-bold w-full focus:outline-none uppercase dark:text-white dark:placeholder-slate-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors bg-slate-50 dark:bg-[#0f172a] rounded-full border border-slate-100 dark:border-slate-800">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button className="relative p-2 text-slate-400 hover:text-blue-500 transition-colors">
                <Bell size={22}/>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#1e293b]"></span>
              </button>
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">
                {settings?.companyName ? settings.companyName.charAt(0).toUpperCase() : 'M'}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar pb-32 relative">
            
            {/* Dashboard Analytics */}
            {activeTab === 'dashboard' && (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard title="Total Revenue" value={formatCurrency(analytics.totalSales)} icon={TrendingUp} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-500/10" trend="Active Cycle" />
                  <KPICard title="Total Collections" value={formatCurrency(analytics.totalCollections)} icon={HandCoins} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-500/10" trend="Healthy Flow" />
                  <KPICard title="Outstanding A/R" value={formatCurrency(analytics.outstandingReceivables)} icon={AlertTriangle} colorClass="text-rose-500 dark:text-rose-400" bgClass="bg-rose-50 dark:bg-rose-500/10" />
                  <KPICard title="Net Profit (Estimate)" value={formatCurrency(analytics.netProfit)} icon={PieChartIcon} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-500/10" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center">
                      <Activity className="mr-2 text-blue-500"/> Revenue vs Expenses Analytics
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#94a3b8', fontSize: 11, fontWeight: 700}} tickFormatter={(value) => `SAR ${value/1000}k`} />
                          <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                          <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" name="Sales Revenue" />
                          <Area type="monotone" dataKey="purchases" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorPurchases)" name="Purchases/Expenses" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center">
                      <UsersRound className="mr-2 text-indigo-500"/> Top Outstanding Ledgers
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                      {topDebtors.map(customer => (
                        <div key={customer.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group border border-transparent dark:border-slate-800">
                          <div className="overflow-hidden">
                            <p className="font-black text-sm text-slate-800 dark:text-white uppercase truncate">{customer.name}</p>
                            <p className="text-xs font-bold text-rose-500 dark:text-rose-400">{formatCurrency(customer.balance)} Due</p>
                          </div>
                          <button onClick={() => generateLedger('customer', customer)} className="p-3 bg-white dark:bg-[#1e293b] text-blue-600 rounded-xl shadow-sm hover:shadow-md transition-all shrink-0 border border-slate-100 dark:border-slate-700" title="Open Ledger">
                            <BookOpen size={16} />
                          </button>
                        </div>
                      ))}
                      {topDebtors.length === 0 && (
                        <div className="text-center text-slate-400 dark:text-slate-500 font-bold text-xs uppercase py-10">No outstanding balances.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
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

            {}
            {(activeTab === 'customers' || activeTab === 'suppliers') && (
              <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'customers' ? customers : suppliers, activeTab)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Plus size={16} className="mr-2"/> Add {activeTab.slice(0, -1)}</button>
                </div>
                
                {renderTable(
                  ['Entity Name', 'Contact Info', 'Tax / GST', 'Opening Bal.', 'Status'],
                  (activeTab === 'customers' ? customers : suppliers).filter(c => safeSearch(c.name, searchTerm)),
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
                        <button onClick={() => setConfirmDelete({ isOpen: true, type: activeTab.slice(0, -1), id: item.id, title: String(item.name) })} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                )}
              </div>
            )}

            {}
            {activeTab === 'products' && (
              <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(products, 'products')} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal('product')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center hover:scale-95 transition-all shadow-lg shadow-blue-500/30"><Plus size={16} className="mr-2"/> Add Product</button>
                </div>
                {renderTable(
                  ['Product Name', 'Category', 'Stock Lvl', 'Cost Price', 'Selling Price'],
                  products.filter(p => safeSearch(p.name, searchTerm)),
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
                        <button onClick={() => setConfirmDelete({ isOpen: true, type: 'product', id: item.id, title: String(item.name) })} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                )}
              </div>
            )}

            {(activeTab === 'sales' || activeTab === 'purchases') && (
              <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'sales' ? sales : purchases, `${settings?.companyName || 'MY'}_${activeTab.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className={`px-8 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center hover:scale-95 transition-all ${activeTab === 'sales' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30' : 'bg-gradient-to-r from-slate-700 to-slate-900 shadow-slate-900/30'}`}><Plus size={16} className="mr-2"/> Generate {activeTab.slice(0, -1)}</button>
                </div>
                
                {renderTable(
                  ['Date', 'Invoice No', activeTab === 'sales' ? 'Customer' : 'Supplier', 'Executive', 'Grand Total', 'Status'],
                  (activeTab === 'sales' ? sales : purchases).filter(i => safeSearch(i.invoiceNo, searchTerm) || safeSearch(i.customerName, searchTerm) || safeSearch(i.supplierName, searchTerm)),
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
                      <td className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider">{String(item.invoiceNo || '')}</td>
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
                        <button onClick={() => setConfirmDelete({ isOpen: true, type: activeTab.slice(0, -1), id: item.id, title: String(item.invoiceNo) })} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg shrink-0"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )}
                )}
              </div>
            )}

            {}
            {(activeTab === 'collections' || activeTab === 'expenses') && (
              <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'collections' ? collections : expenses, activeTab)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className={`px-8 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center hover:scale-95 transition-all ${activeTab === 'collections' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30' : 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/30'}`}><Plus size={16} className="mr-2"/> Record {activeTab.slice(0, -1)}</button>
                </div>
                
                {renderTable(
                  ['Date', 'Ref / Invoice Link', activeTab === 'collections' ? 'Customer' : 'Description', 'Executive', 'Amount', 'Method'],
                  (activeTab === 'collections' ? collections : expenses).filter(i => safeSearch(i.ref, searchTerm) || safeSearch(i.customerName, searchTerm) || safeSearch(i.description, searchTerm)),
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
                        <button onClick={() => setPrintDoc({ isOpen: true, type: activeTab.slice(0, -1), data: item })} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-lg"><Printer size={16}/></button>
                        <button onClick={() => setConfirmDelete({ isOpen: true, type: activeTab.slice(0, -1), id: item.id, title: `${formatCurrency(item.amount)}` })} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                )}
              </div>
            )}

            {}
            {activeTab === 'salesmen' && (
              <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(salesmen, 'salesmen')} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal('salesman')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Plus size={16} className="mr-2"/> Register Staff</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {salesmen.filter(s => safeSearch(s.name, searchTerm)).map(sm => (
                    <div key={sm.id} className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl dark:shadow-none transition-all relative overflow-hidden group">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-500/20">{String(sm.name || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{String(sm.name || '')}</h3>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"><Phone size={10} className="inline mr-1"/>{String(sm.phone || 'N/A')}</p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <button onClick={() => generateLedger('salesman', sm)} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-indigo-500 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors" title="View Performance Ledger"><BookOpen size={16}/></button>
                        <button onClick={() => openModal('salesman', sm)} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"><Edit3 size={16}/></button>
                        <button onClick={() => setConfirmDelete({ isOpen: true, type: 'salesman', id: sm.id, title: String(sm.name) })} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-rose-500 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="w-full text-center py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md shrink-0 no-print">
            © umnabeel 2026
          </footer>
        </main>

        {}
        {modalState.isOpen && modalState.type !== 'ledger' && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto no-print transition-all">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative my-8 border border-slate-200 dark:border-slate-800">
              <div className="sticky top-0 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center rounded-t-[2.5rem] z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">{modalState.data?.id ? 'Edit' : 'New'} {String(modalState.type)}</h2>
                <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                
                {['sale', 'purchase', 'expense', 'collection'].includes(modalState.type) && (
                  <div className="p-6 bg-slate-50 dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 mb-6 shadow-inner dark:shadow-none">
                     <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">Select Entity / Party Account *</label>
                     <select required className="w-full p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-slate-800 dark:text-white uppercase focus:ring-2 ring-blue-500/20 shadow-sm" 
                             value={formData.customerId || formData.supplierId || formData.partyName || ''} 
                             onChange={e => {
                               if(modalState.type === 'sale' || modalState.type === 'collection') {
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
                       {(['sale', 'collection'].includes(modalState.type) ? customers : suppliers).map(c => <option key={c.id} value={c.id}>{String(c.name)}</option>)}
                     </select>
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

                {}
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
                      <div className="space-y-3">
                        {invoiceItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row gap-3 items-end">
                            <select required className="flex-1 p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white uppercase text-xs" value={item.productId || ''} onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}>
                              <option value="">Select Product...</option>{products.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}
                            </select>
                            <input type="number" placeholder="Qty" required className="w-24 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-center text-xs" value={item.qty || ''} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} />
                            <input type="number" placeholder="Rate" required className="w-32 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-right text-xs" value={item.rate || ''} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} />
                            <div className="w-32 p-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-black text-right text-xs text-slate-800 dark:text-slate-200 border border-transparent dark:border-slate-700">{formatCurrency(item.total)}</div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setInvoiceItems([...invoiceItems, { productId: '', name: '', qty: 1, rate: 0, tax: 0, total: 0 }])} className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg mt-2 transition-colors"><Plus size={14} className="mr-1"/> Add Row</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-4">
                  <button type="button" onClick={closeModal} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 transition-all">Save {String(modalState.type)}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {}
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

        {}
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

            {/* PRINTABLE AREA - FORCED LIGHT MODE FOR CLEAN PRINTS */}
            <div id="printable-area" className="max-w-[210mm] mx-auto bg-white min-h-[297mm] p-[15mm] shadow-2xl relative font-sans text-slate-900 mb-20 print:shadow-none" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                <div className="w-64 text-slate-900">
                    {settings?.logo ? <img src={settings.logo} className="w-16 h-16 object-contain mb-2 rounded-xl" alt="Logo"/> : <div className="text-3xl font-black tracking-tighter mb-2 text-slate-900">M<span className="text-blue-500">Y</span></div>}
                    <h2 className="font-black text-lg uppercase tracking-tight text-slate-900">{settings?.companyName || 'My ERP Solutions'}</h2>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-1">
                    {printDoc.type === 'sale' ? 'INVOICE' : 
                     printDoc.type === 'purchase' ? 'PURCHASE ORDER' : 
                     printDoc.type === 'collection' ? 'PAYMENT RECEIPT' : 
                     printDoc.type === 'ledger' ? 'STATEMENT OF ACCOUNT' : 'EXPENSE VOUCHER'}
                  </h1>
                  <p className="text-lg font-black text-blue-600">
                    {String(printDoc.data?.invoiceNo || printDoc.data?.id?.slice(0, 8) || printDoc.data?.entity?.name || '')}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Date: {String(printDoc.data?.date || (printDoc.data?.createdAt?.toDate ? printDoc.data.createdAt.toDate().toISOString().split('T')[0] : ''))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Issued By</h2>
                  <p className="font-black text-sm uppercase text-slate-900">{settings?.companyName || 'My ERP Solutions'}</p>
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
                          <td className="py-5 px-2 text-slate-900">{String(item.name || '')}</td>
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