import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getMessaging, getToken } from "firebase/messaging";
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
  // ഫയലിന്റെ പേര് സെറ്റ് ചെയ്യാൻ
  const originalTitle = document.title;
  if (customFilename) document.title = customFilename;
  
  // ബ്രൗസറിന്റെ നേറ്റീവ് പ്രിന്റ് വിളിക്കുന്നു
  window.print();
  
  // പ്രിന്റ് കഴിഞ്ഞാൽ പഴയ ടൈറ്റിൽ തിരികെ വെക്കുന്നു
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

   // 👉 ZATCA TLV Encoder for QR Code
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
  
  // 1. LocalStorage വഴി യൂസറെ ഓർമിച്ചു വെക്കുന്നു
  const [activeUserSession, setActiveUserSession] = useState(() => { 
    if (typeof window !== 'undefined') { const stored = localStorage.getItem('erp_active_user'); return stored ? JSON.parse(stored) : null; } 
    return null; 
  });

  const handleUserSelect = (selectedUser) => {
    setActiveUserSession(selectedUser);
    localStorage.setItem('erp_active_user', JSON.stringify(selectedUser));
  };

  const handleSwitchUser = () => {
    setActiveUserSession(null);
    localStorage.removeItem('erp_active_user');
  };

  // 2. ആപ്പ് അൺലോക്ക് ചെയ്തതും ഓർമിച്ചു വെക്കുന്നു
  const [isAppUnlocked, setIsAppUnlocked] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem('erp_unlocked') === 'true'; return false; });
  const [appPinInput, setAppPinInput] = useState(''); const [appPinError, setAppPinError] = useState(false);
  const [adminAuth, setAdminAuth] = useState({ isOpen: false, callback: null }); const [adminPinInput, setAdminPinInput] = useState(''); const [adminPinError, setAdminPinError] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => { if (typeof window !== 'undefined') { const storedTheme = localStorage.getItem('erp_theme'); if (storedTheme) return storedTheme === 'dark'; if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true; } return false; });
  const [activeTab, setActiveTab] = useState('dashboard'); const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024); const [showOnlyDueSales, setShowOnlyDueSales] = useState(false); const [showOnlyDuePurchases, setShowOnlyDuePurchases] = useState(false);
  const [hideZeroAging, setHideZeroAging] = useState(true); const [searchTerm, setSearchTerm] = useState(''); const [isNotifOpen, setIsNotifOpen] = useState(false); const notifRef = useRef(null);
  const [voiceActionPrompt, setVoiceActionPrompt] = useState(null);
  const [viewReceiptModal, setViewReceiptModal] = useState({ isOpen: false, image: null });
  const [lockNotifications, setLockNotifications] = useState([]);

  // നോട്ടിഫിക്കേഷൻ കാണിക്കാനുള്ള ഫംഗ്ഷൻ (ഇത് തനിയെ മാഞ്ഞുപോകില്ല)
  const showLockNotification = (title, message) => {
    const id = Date.now();
    setLockNotifications((prev) => [{ id, title, message }, ...prev]); 
  };

  // നോട്ടിഫിക്കേഷനിൽ ടാപ്പ് ചെയ്യുമ്പോൾ അത് ക്ലോസ് ആവാൻ
  const removeNotification = (id) => {
    setLockNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  const [customers, setCustomers] = useState([]); const [suppliers, setSuppliers] = useState([]); const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]); const [purchases, setPurchases] = useState([]); const [quotations, setQuotations] = useState([]);
  const [collections, setCollections] = useState([]); const [expenses, setExpenses] = useState([]); const [salesmen, setSalesmen] = useState([]); const [crms, setCrms] = useState([]);
  const [crmDropdownOpen, setCrmDropdownOpen] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  // =====================================================================
  // 🌟 THE ULTIMATE TEAM CHAT HUB (VOICE, DELETE, UNREAD PILL & PRESENCE)
  // =====================================================================

  const [teamMessages, setTeamMessages] = useState([]);
  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
  const [newTeamMessage, setNewTeamMessage] = useState('');
  
  // 1. ആപ്പ് ഓപ്പൺ ചെയ്യുമ്പോൾ പെർമിഷൻ ചോദിക്കാൻ
      useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }, []);

      // 2. പുതിയ മെസ്സേജ് വരുമ്പോൾ സൗണ്ടും നോട്ടിഫിക്കേഷനും നൽകാൻ (iPhone Sound Fixed)
      useEffect(() => {
        if (teamMessages.length > 0 && activeUserSession) {
          const latestMsg = teamMessages[teamMessages.length - 1];
          const isMe = latestMsg.senderName === activeUserSession.name;
          const msgTime = latestMsg.timestamp?.toDate ? latestMsg.timestamp.toDate().getTime() : Date.now();
          const now = Date.now();
          
          if (!isMe && (now - msgTime < 5000)) {
            // 1. ഐഫോൺ സപ്പോർട്ട് ചെയ്യുന്ന ഓഡിയോ പ്ലേ രീതി
            const audioEl = document.getElementById('notification-sound');
            if (audioEl) {
              audioEl.currentTime = 0; // വീണ്ടും വീണ്ടും കേൾക്കാൻ
              audioEl.play().catch(e => console.log("Audio play blocked by browser. User interaction needed first."));
            }

            // 2. കസ്റ്റം വാട്സാപ്പ് നോട്ടിഫിക്കേഷൻ
            showLockNotification(
              latestMsg.senderName, 
              latestMsg.type === 'image' ? '📷 Photo attached' : latestMsg.type === 'audio' ? '🎤 Voice message' : latestMsg.text
            );

            // 3. സിസ്റ്റം ഡീഫോൾട്ട് നോട്ടിഫിക്കേഷൻ
            if ('Notification' in window && Notification.permission === 'granted') {
               new Notification(`New message from ${latestMsg.senderName}`, {
                 body: latestMsg.type === 'image' ? '📷 Photo' : latestMsg.type === 'audio' ? '🎤 Voice message' : latestMsg.text,
                 icon: '/vite.svg' 
               });
            }
          }
        }
      }, [teamMessages, activeUserSession]);

  const teamChatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});

  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [mentionSearch, setMentionSearch] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const [unreadTeamCount, setUnreadTeamCount] = useState(0);
  const prevMsgCount = useRef(0);
  const typingTimeoutRef = useRef(null);

 // --- 🌟 Firebase Cloud Messaging (FCM) Setup ---
  useEffect(() => {
    if (!activeUserSession) return;

    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const messaging = getMessaging();
          
          const token = await getToken(messaging, { 
            vapidKey: 'BOLjdLFbdno964VI8AAIDjD7Uqtb1TYO1XquigclnwrpxGKhHfquQdejwjFwNuPNyCiRtR478IHHvrlC8zIHYhw' 
          });

          if (token) {
            console.log("FCM Token Generated:", token);
            const sessionId = activeUserSession.id || activeUserSession.name;
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'presence', sessionId), {
              fcmToken: token
            }, { merge: true });
          }
        }
      } catch (error) {
        console.error("FCM Token Error:", error);
      }
    };

    setupNotifications();
  }, [activeUserSession]);

  // 2. Real-time Presence Sync (Green Light)
  useEffect(() => {
    if (!isAppUnlocked || !activeUserSession) return;
    const sessionId = activeUserSession.id || activeUserSession.name;
    const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', sessionId);
    
    if (isTeamChatOpen) {
      setDoc(presenceRef, { isOnline: true, lastSeen: serverTimestamp() }, { merge: true }).catch(e=>console.log(e));
    } else {
      setDoc(presenceRef, { isOnline: false, lastSeen: serverTimestamp() }, { merge: true }).catch(e=>console.log(e));
    }

    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'presence'), (snap) => {
      const pMap = {};
      snap.docs.forEach(d => { pMap[d.id] = d.data(); });
      setOnlineUsers(pMap);
    });
    
    const handleBeforeUnload = () => setDoc(presenceRef, { isOnline: false, lastSeen: serverTimestamp() }, { merge: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsub();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAppUnlocked, isTeamChatOpen, activeUserSession]);

  // 3. Scroll & Unread Tab Handler (WhatsApp Style)
  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - (scrollTop + clientHeight) > 80;
    setShowScrollBottom(isScrolledUp);
    
    // User manually scrolled to bottom -> clear unread tab
    if (!isScrolledUp) {
      setUnreadTeamCount(0);
      prevMsgCount.current = teamMessages.length;
    }
  };

  const scrollToBottom = () => {
    teamChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadTeamCount(0);
    prevMsgCount.current = teamMessages.length;
  };

  useEffect(() => {
    if (isTeamChatOpen) {
      if (!showScrollBottom) {
        setUnreadTeamCount(0);
        prevMsgCount.current = teamMessages.length;
        teamChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (teamMessages.length > prevMsgCount.current) {
        setUnreadTeamCount(teamMessages.length - prevMsgCount.current);
      }
    } else {
      if (prevMsgCount.current === 0) {
        prevMsgCount.current = teamMessages.length;
      } else if (teamMessages.length > prevMsgCount.current) {
        const newMsgsCount = teamMessages.length - prevMsgCount.current;
        setUnreadTeamCount(newMsgsCount);
        
        const latestMsg = teamMessages[teamMessages.length - 1];
        if (latestMsg && latestMsg.senderName !== activeUserSession?.name) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message from ' + latestMsg.senderName, {
              body: latestMsg.isDeleted ? 'Message deleted' : latestMsg.type === 'audio' ? 'Voice Message' : latestMsg.text,
            });
          }
        }
      }
    }
  }, [teamMessages, isTeamChatOpen, showScrollBottom, activeUserSession]);

  const handleChatInputChange = (e) => {
    const val = e.target.value;
    setNewTeamMessage(val);
    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) { setMentionSearch(lastWord.slice(1).toLowerCase()); } else { setMentionSearch(null); }

    // --- Typing Indicator Logic ---
    if (activeUserSession) {
      const sessionId = activeUserSession.id || activeUserSession.name;
      const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', sessionId);
      setDoc(presenceRef, { isTyping: true, userName: activeUserSession.name }, { merge: true }).catch(e=>console.log(e));

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setDoc(presenceRef, { isTyping: false }, { merge: true }).catch(e=>console.log(e));
      }, 1500);
    }
  };

  const insertMention = (name) => {
    const words = newTeamMessage.split(' ');
    words.pop();
    words.push(`@${name.replace(/\s+/g, '')} `);
    setNewTeamMessage(words.join(' '));
    setMentionSearch(null);
  };

  // ചാറ്റിൽ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്ത് അയക്കാനുള്ള ഫംഗ്ഷൻ
  const handleSendImageMessage = async (e) => {
    // മൊബൈൽ കീബോർഡ് ഓട്ടോമാറ്റിക് ആയി ഹൈഡ് ചെയ്യാൻ
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const file = e.target.files[0];
    if (!file || !activeUserSession) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_chats'), {
          imageData: reader.result,
          senderName: activeUserSession.name,
          senderId: activeUserSession.id || activeUserSession.name,
          timestamp: serverTimestamp(),
          type: 'image',
          text: 'Shared an image'
        });
        scrollToBottom();
      } catch (err) { console.error("Image Send Error", err); }
    };
    e.target.value = '';
  };
  
  const handleSendTeamMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault(); 
    if (!newTeamMessage.trim() || !activeUserSession) return;
    
    const messageToSend = newTeamMessage; 
    setNewTeamMessage('');
    setMentionSearch(null);

    const sessionId = activeUserSession.id || activeUserSession.name;
    setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'presence', sessionId), { isTyping: false }, { merge: true });

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_chats'), {
        text: messageToSend,
        senderName: activeUserSession.name,
        senderId: sessionId,
        timestamp: serverTimestamp(),
        type: 'text'
      });
      scrollToBottom();
    } catch (err) { console.error("Chat Error", err); }
  };

  const handleDeleteMessage = async (msgId) => {
    if(!window.confirm("Delete this message for everyone?")) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_chats', msgId), {
        isDeleted: true, text: '🚫 This message was deleted', audioData: null, type: 'system'
      });
    } catch (err) { console.error("Delete Error", err); }
  };

  const startRecordingNote = async (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (isRecordingNote) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioType = mediaRecorderRef.current.mimeType || 'audio/mp4'; 
        const audioBlob = new Blob(audioChunksRef.current, { type: audioType }); 
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_chats'), {
              audioData: reader.result, senderName: activeUserSession?.name || 'Unknown', senderId: activeUserSession?.id || activeUserSession?.name || '00', timestamp: serverTimestamp(), type: 'audio'
            });
            scrollToBottom();
          } catch (err) { console.error("Audio Send Error", err); }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecordingNote(true);
    } catch (err) { alert("Microphone access is needed! Please check browser settings."); }
  };

  const stopRecordingNote = (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (mediaRecorderRef.current && isRecordingNote) {
      mediaRecorderRef.current.stop();
      setIsRecordingNote(false);
    }
  };

  const formatChatText = (text) => {
    if (!text) return '';
    return text.split(' ').map((word, i) => word.startsWith('@') ? <span key={i} className="text-blue-400 dark:text-cyan-400 font-black">{word} </span> : word + ' ');
  };

  // =====================================================================
  
  const [invoiceChoiceModal, setInvoiceChoiceModal] = useState({ isOpen: false, saleData: null, customerEntity: null });

  // FIXED AGING LOGIC
  const buildAgingReport = (type = 'customer') => {
    const dataList = type === 'customer' ? customers : suppliers; const txList = type === 'customer' ? sales : purchases; const paymentList = type === 'customer' ? collections : expenses;
    return dataList.map(entity => {
      let totalDue = 0; let current = 0; let days31to60 = 0; let days61to90 = 0; let days91to120 = 0; let days120Plus = 0;
      const entityTxs = txList.filter(t => type === 'customer' ? t.customerId === entity.id : t.supplierId === entity.id);
      entityTxs.forEach(t => {
        const paid = paymentList.filter(p => (p.ref && p.ref === t.invoiceNo) || (p.description && p.description === t.invoiceNo)).reduce((a,b) => a + Number(b.amount), 0);
        const due = (Number(t.grandTotal) || 0) - paid;
        if (due > 0 && t.date) {
          totalDue += due; const txDate = new Date(t.date); const diffDays = Math.ceil(Math.abs(new Date() - txDate) / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) current += due; else if (diffDays <= 60) days31to60 += due; else if (diffDays <= 90) days61to90 += due; else if (diffDays <= 120) days91to120 += due; else days120Plus += due;
        }
      });
      return { ...entity, totalDue, current, days31to60, days61to90, days91to120, days120Plus };
    }).filter(item => hideZeroAging ? item.totalDue > 0 : true);
  };
  
  const [formError, setFormError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatorItems, setEstimatorItems] = useState([]); const [showEstimatorDB, setShowEstimatorDB] = useState(false); const [estimateCart, setEstimateCart] = useState([]);
  const [calcForm, setCalcForm] = useState({ category: '', itemId: '', desc: '', width: '', height: '', thickness: '', minutes: '', qty: 1, matrixSize: '', matrixThick: '', isCustomMatrix: false });
  const [manualEstimateTotal, setManualEstimateTotal] = useState(''); const [estimatorPushModal, setEstimatorPushModal] = useState({ isOpen: false, type: '', customerId: '' });
  const [settings, setSettings] = useState({ 
    companyName: '', 
    taxId: '', 
    phone: '', 
    email: '', 
    address: '', 
    logo: '',        // 👉 ആപ്പിനും സൈഡ്‌ബാറിനുമുള്ള ലോഗോ
    printLogo: ''    // 👉 ഇൻവോയ്സിനും ലെറ്റർഹെഡിനുമുള്ള പ്രിന്റ് ലോഗോ
  }); 
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null }); const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, type: '', id: null, title: '' });
  const [printDoc, setPrintDoc] = useState({ isOpen: false, type: '', data: null }); const [formData, setFormData] = useState({}); const [invoiceItems, setInvoiceItems] = useState([]);
  const [dbError, setDbError] = useState(false); const collapsed = isDesktop && !isSidebarHovered;

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', handleResize);
    const initAuth = async () => { try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } else { await signInAnonymously(auth); } } catch (err) { console.error("Auth error:", err); } };
    initAuth(); const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => { window.removeEventListener('resize', handleResize); unsubscribe(); };
  }, []);

  useEffect(() => { const root = window.document.documentElement; if (isDarkMode) { root.classList.add('dark'); localStorage.setItem('erp_theme', 'dark'); } else { root.classList.remove('dark'); localStorage.setItem('erp_theme', 'light'); } }, [isDarkMode]);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

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

    // മൊബൈലിൽ PDF ഫയൽ ഒപ്പം ഷെയർ ചെയ്യാൻ സാധ്യമാണെങ്കിൽ (Web Share API)
    if (navigator.canShare && navigator.share) {
      try {
        // പ്രിന്റ് പ്രിവ്യൂ അല്ലെങ്കിൽ എലമെന്റിൽ നിന്ന് PDF ജനറേറ്റ് ചെയ്യാൻ ശ്രമിക്കുന്നു
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

    // ഫോൺ സപ്പോർട്ട് ചെയ്തില്ലെങ്കിൽ അല്ലെങ്കിൽ ഡെസ്ക്ടോപ്പ് ആണെങ്കിൽ WhatsApp URL വഴി മെസ്സേജ് അയക്കുന്നു
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

  useEffect(() => { const handleClickOutside = (event) => { if (notifRef.current && !notifRef.current.contains(event.target)) { setIsNotifOpen(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
  useEffect(() => { if (settings?.logo) { let link = document.querySelector("link[rel~='icon']"); if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.getElementsByTagName('head')[0].appendChild(link); } link.href = settings.logo; } }, [settings?.logo]);

     useEffect(() => { 
    if (settings?.logo) { 
      // 1. Browser Favicon
      let link = document.querySelector("link[rel~='icon']"); 
      if (!link) { 
        link = document.createElement('link'); 
        link.rel = 'icon'; 
        document.getElementsByTagName('head')[0].appendChild(link); 
      } 
      link.href = settings.logo; 

      // 2. Apple Touch Icon (Dynamic)
      let appleLink = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(appleLink);
      }
      appleLink.href = settings.logo;
    } 
  }, [settings?.logo]);

   // 👇 ഈ പഴയ കോഡ് ആയിരിക്കും അവിടെ ഉണ്ടാവുക (ഇത് ഡിലീറ്റ് ചെയ്യണം) 👇
  useEffect(() => {
    if (!isAppUnlocked) return; let timer; const resetTimer = () => { clearTimeout(timer); timer = setTimeout(() => { setIsAppUnlocked(false); sessionStorage.removeItem('erp_unlocked'); }, 60 * 60 * 1000); };
    window.addEventListener('mousemove', resetTimer); window.addEventListener('keypress', resetTimer); window.addEventListener('click', resetTimer); resetTimer(); 
    return () => { window.removeEventListener('mousemove', resetTimer); window.removeEventListener('keypress', resetTimer); window.removeEventListener('click', resetTimer); clearTimeout(timer); };
  }, [isAppUnlocked]);

  useEffect(() => {
    if (!user || !isAppUnlocked) return; 
    const collectionsMap = { customers: setCustomers, suppliers: setSuppliers, products: setProducts, sales: setSales, purchases: setPurchases, quotations: setQuotations, collections: setCollections, expenses: setExpenses, salesmen: setSalesmen, crms: setCrms, estimator_items: setEstimatorItems, tasks: setTasks, team_chats: setTeamMessages };
    const unsubscribers = Object.entries(collectionsMap).map(([colName, setter]) => 
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', colName), (snap) => { const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); setter(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))); }, (error) => { console.error(`Error syncing ${colName}:`, error); if (error.code === 'permission-denied') setDbError(true); })
    );
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'profile'), (snap) => { if (snap.exists()) setSettings(snap.data()); });
    return () => { unsubscribers.forEach(unsub => unsub()); unsubSettings(); };
  }, [user, isAppUnlocked]);

  const handleAppUnlock = (e) => { e.preventDefault(); if (appPinInput === APP_PIN) { setIsAppUnlocked(true); localStorage.setItem('erp_unlocked', 'true'); setAppPinError(false); } else { setAppPinError(true); setAppPinInput(''); } };
  
  const handleManualLock = () => { setIsAppUnlocked(false); setActiveUserSession(null); localStorage.removeItem('erp_unlocked'); localStorage.removeItem('erp_active_user'); setAppPinInput(''); };

  const requestAdminAuth = (callback) => { setAdminAuth({ isOpen: true, callback }); setAdminPinInput(''); setAdminPinError(false); };
  const handleAdminAuthSubmit = (e) => { e.preventDefault(); if (adminPinInput === ADMIN_PIN) { if (adminAuth.callback) adminAuth.callback(); setAdminAuth({ isOpen: false, callback: null }); } else { setAdminPinError(true); setAdminPinInput(''); } };
  const triggerDelete = (type, id, title) => { requestAdminAuth(() => { setConfirmDelete({ isOpen: true, type, id, title }); }); };

  const analytics = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0); const totalPurchases = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
    const totalCollections = collections.reduce((acc, c) => acc + (Number(c.amount) || 0), 0); const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    return { totalSales, totalPurchases, totalCollections, totalExpenses, outstandingReceivables: totalSales - totalCollections, netProfit: totalSales - totalPurchases - totalExpenses };
  }, [sales, purchases, collections, expenses]);

  // 👉 dashboardAlerts ലോജിക് ഇവിടെ ചേർക്കുക
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
        title: '', dueDate: new Date().toISOString().split('T')[0] // <--- പുതിയതായി ചേർത്തത്
      });
      if (['sale', 'purchase', 'crm', 'quotation'].includes(type)) { setInvoiceItems(data?.items || [{ productId: '', name: '', description: '', qty: 1, rate: 0, tax: 0, total: 0 }]); }
      setModalState({ isOpen: true, type, data });
    };
    if (data && type !== 'estimatorItem') { requestAdminAuth(executeOpen); } else { executeOpen(); }
  };
      
  const closeModal = () => { setModalState({ isOpen: false, type: null, data: null }); setFormData({}); setInvoiceItems([]); setFormError(''); setIsSubmitting(false); };

const handleDuplicateItem = (type, item) => {
    const clonedItem = cleanObject({ ...item });
    // പഴയ ഐഡികൾ കളയുന്നു, പുതിയത് സിസ്റ്റം തനിയെ ജനറേറ്റ് ചെയ്തോളും
    delete clonedItem.id;
    delete clonedItem.invoiceNo;
    delete clonedItem.quotationNo;
    delete clonedItem.jobId;
    delete clonedItem.createdAt;
    
    clonedItem.date = new Date().toISOString().split('T')[0]; // ഇന്നത്തെ ഡേറ്റ് ആക്കുന്നു
    
    // സ്റ്റാറ്റസുകൾ റീസെറ്റ് ചെയ്യുന്നു
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

// --- AI REPORT & CHAT LOGIC ---
 const [aiReport, setAiReport] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Voice Features State
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);

// Initialize Speech Recognition for Voice Input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        // ഇംഗ്ലീഷും മലയാളവും മംഗ്ലീഷും നന്നായി സപ്പോർട്ട് ചെയ്യാൻ:
        recognitionRef.current.lang = 'ml-IN';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          setChatInput((prev) => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);

          // MASTER ROUTING LOGIC: All Tabs (Malayalam + English + Manglish)
          if (transcript.match(/dashboard|home|overview|analytics|ഡാഷ്‌ബോർഡ്|ഹോം|ഡാഷ്ബോർഡ്/)) {
            setVoiceActionPrompt({ name: 'Dashboard', tab: 'dashboard', label: 'ഡാഷ്‌ബോർഡ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('dashboard');
            speakText('Dashboard open aakki');
          } 
          else if (transcript.match(/crm|job|work|lead|സി ആർ എം|സിആർഎം|ജോബ്|വർക്ക്/)) {
            setVoiceActionPrompt({ name: 'CRM Job Tracker', tab: 'crm', label: 'CRM ട്രാക്കർ ഓപ്പൺ ചെയ്തു' });
            setActiveTab('crm');
            speakText('CRM open aakki');
          } 
          else if (transcript.match(/quotation|quote|കൊട്ടേഷൻ|ക്വോട്ട്/)) {
            setVoiceActionPrompt({ name: 'Sales Quotations', tab: 'quotations', label: 'കൊട്ടേഷൻസ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('quotations');
            speakText('Quotations open aakki');
          } 
          else if (transcript.match(/sales|invoice|bill|സെയിൽസ്|ഇൻവോയ്സ്|ബിൽ/)) {
            setVoiceActionPrompt({ name: 'Sales Invoices', tab: 'sales', label: 'സെയിൽസ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('sales');
            speakText('Sales open aakki');
          } 
          else if (transcript.match(/purchase|buy|പർച്ചേസ്|വാങ്ങിയത്/)) {
            setVoiceActionPrompt({ name: 'Purchases', tab: 'purchases', label: 'പർച്ചേസസ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('purchases');
            speakText('Purchases open aakki');
          } 
          else if (transcript.match(/collection|receipt|കിട്ടിയ കാശ്|വരവ്|കളക്ഷൻ/)) {
            setVoiceActionPrompt({ name: 'Collections', tab: 'collections', label: 'കളക്ഷൻസ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('collections');
            speakText('Collections open aakki');
          } 
          else if (transcript.match(/expense|payment out|ചിലവ്|ചെലവ്|പേയ്മെന്റ്/)) {
            setVoiceActionPrompt({ name: 'Expenses', tab: 'expenses', label: 'എക്സ്പെൻസസ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('expenses');
            speakText('Expenses open aakki');
          } 
          else if (transcript.match(/customer aging|കിട്ടാനുള്ള|റിസീവബിൾ/)) {
            setVoiceActionPrompt({ name: 'Customer Aging', tab: 'customer_aging', label: 'കസ്റ്റമർ ഏജിങ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('customer_aging');
            speakText('Customer aging open aakki');
          } 
          else if (transcript.match(/supplier aging|കൊടുക്കാനുള്ള|പേയബിൾ/)) {
            setVoiceActionPrompt({ name: 'Supplier Aging', tab: 'supplier_aging', label: 'സപ്ലയർ ഏജിങ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('supplier_aging');
            speakText('Supplier aging open aakki');
          } 
          else if (transcript.match(/ai|report|insight|റിപ്പോർട്ട്|അനലിറ്റിക്സ്/)) {
            setVoiceActionPrompt({ name: 'AI Reports', tab: 'ai_reports', label: 'AI റിപ്പോർട്ട് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('ai_reports');
            speakText('AI reports open aakki');
          } 
          else if (transcript.match(/customer|client list|കസ്റ്റമർ/)) {
            setVoiceActionPrompt({ name: 'Customers', tab: 'customers', label: 'കസ്റ്റമേഴ്സ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('customers');
            speakText('Customers open aakki');
          } 
          else if (transcript.match(/supplier|vendor|സപ്ലയർ/)) {
            setVoiceActionPrompt({ name: 'Suppliers', tab: 'suppliers', label: 'സപ്ലയേഴ്സ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('suppliers');
            speakText('Suppliers open aakki');
          } 
          else if (transcript.match(/inventory|product|stock|item|ഇൻവെന്ററി|സ്റ്റോക്ക്|പ്രൊഡക്റ്റ്/)) {
            setVoiceActionPrompt({ name: 'Inventory', tab: 'products', label: 'ഇൻവെന്ററി ഓപ്പൺ ചെയ്തു' });
            setActiveTab('products');
            speakText('Inventory open aakki');
          } 
          else if (transcript.match(/salesman|staff|employee|സെയിൽസ്മാൻ|സ്റ്റാഫ്/)) {
            setVoiceActionPrompt({ name: 'Sales Team', tab: 'salesmen', label: 'സെയിൽസ് ടീം ഓപ്പൺ ചെയ്തു' });
            setActiveTab('salesmen');
            speakText('Sales team open aakki');
          } 
          else if (transcript.match(/estimator|calculate|എസ്റ്റിമേറ്റർ|കാൽക്കുലേറ്റർ/)) {
            setVoiceActionPrompt({ name: 'Price Estimator', tab: 'estimator', label: 'എസ്റ്റിമേറ്റർ ഓപ്പൺ ചെയ്തു' });
            setActiveTab('estimator');
            speakText('Estimator open aakki');
          } 
          else if (transcript.match(/setting|profile|സെറ്റിംഗ്സ്|പ്രൊഫൈൽ/)) {
            setVoiceActionPrompt({ name: 'Settings', tab: 'settings', label: 'സെറ്റിംഗ്സ് ഓപ്പൺ ചെയ്തു' });
            setActiveTab('settings');
            speakText('Settings open aakki');
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);
    
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Google Chrome on Desktop or Mobile.");
      return;
    }
    
    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (error) {
      console.error("Mic error:", error);
      alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
      setIsListening(false);
    }
  };

// Text to Speech for AI Response - Natural Malayali Female Tone
  // Text to Speech for AI Response - Enhanced Voice Picker
  const speakText = (text) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    
    const cleanText = text.replace(/[*#]/g, '').replace(/SAR/g, 'Riyals');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      
      const selectedVoice = voices.find(v => 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('google')) && 
        (v.lang.includes('en') || v.lang.includes('ml'))
      ) || voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en_IN'));
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = 0.92;
      utterance.pitch = 1.35; 
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    }
  };
    
  // Chat Suggestions in Manglish
  const suggestedQuestions = [
    "What is our total net profit?",
    "HI !",
    "Top 3 customers aaranu?",
    "Cash flow engane improve cheyyam?",
    "Nammude outstanding receivables onnu parayamo?"
  ];

  const handleCopyReport = () => {
    if(aiReport) { navigator.clipboard.writeText(aiReport); alert("Report copied to clipboard!"); }
  };

  const handlePrintAIReport = async () => {
    const element = document.getElementById('ai-report-content');
    if (!element) return;
    if (!window.html2pdf) {
        await new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'; script.onload = resolve; document.head.appendChild(script); });
    }
    const opt = { margin: 15, filename: `Executive_Report_${new Date().getTime()}.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
  };

  const getFullERPContext = () => ({
    totalSales: analytics.totalSales, totalPurchases: analytics.totalPurchases,
    totalCollections: analytics.totalCollections, totalExpenses: analytics.totalExpenses,
    netProfit: analytics.netProfit, customersCount: customers.length,
    suppliersCount: suppliers.length, salesCount: sales.length,
    purchasesCount: purchases.length, topCustomers: topCustomersData,
    topProducts: topProductsData, agingReceivables: agingReceivables, agingPayables: agingPayables
  });

    const generateAIReport = async () => {
    setIsGeneratingAI(true);
    setAiError('');
    
    // നമ്മൾ ട്രൈ ചെയ്യാൻ പോകുന്ന മോഡലുകളുടെ ലിസ്റ്റ് (ഒന്നിന് പിറകെ ഒന്നായി നോക്കും)
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let reportText = null;

    const apiKey = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY;
    
    if (apiKey && apiKey.trim() !== '') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const businessData = getFullERPContext();

      const prompt = `
        You are an expert Chief Financial Officer (CFO) and Business Analyst for a company in Saudi Arabia. 
        Analyze the following ERP system data and provide a comprehensive, professional, and actionable business performance report.
        
        CRITICAL RULES:
        1. You MUST use 'SAR' (Saudi Riyal) for all currency values. NEVER USE the dollar sign ($).
        2. Format clearly with Markdown (use # for main titles, ## for subheadings, and * or - for bullet points).

        ERP Data Summary:
        ${JSON.stringify(businessData, null, 2)}
      `;

      // വൺ ബൈ വൺ ആയി മോഡലുകൾ ലൂപ്പ് ചെയ്ത് നോക്കുന്നു
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          reportText = result.response.text();
          if (reportText) break; // കിട്ടിയാൽ പിന്നെ ബാക്കി നോക്കില്ല, ലൂപ്പ് നിർത്തും
        } catch (err) {
          console.warn(`Model ${modelName} failed, trying next...`, err);
        }
      }
    }

    // മോഡലുകൾ എല്ലാം ഫെയിൽ ആയാലോ അല്ലെങ്കിൽ കീ ഇല്ലെങ്കിലോ നേരെ നമ്മുടെ API Bypass-ലേക്ക് വരും
    if (reportText) {
      setAiReport(reportText);
    } else {
      console.warn("All Gemini models failed. Switching to Local System Engine (API Bypass)...");
      const fallbackReport = `
# EXECUTIVE BOARD REPORT
**Company:** ${settings?.companyName || 'Oxad BS Co.'}  
**Date:** ${new Date().toISOString().split('T')[0]}  
**Status:** Generated via Local System Engine (API Bypass - Smart Fallback)

---

## 1. Executive Highlights
* **Total Business Volume:** Total sales recorded stand at **SAR ${(analytics.totalSales || 0).toLocaleString()}**, reflecting steady operations.
* **Cash Flow Management:** Total collections have reached **SAR ${(analytics.totalCollections || 0).toLocaleString()}**, leaving an active outstanding balance of **SAR ${(analytics.outstandingReceivables || 0).toLocaleString()}**.
* **Net Financial Standing:** Current net profit calculation is recorded at **SAR ${(analytics.netProfit || 0).toLocaleString()}** after factoring in all operational expenses and purchases.

## 2. Financial Performance & Health
* **Sales vs Expenses:** Inward revenue is balanced against outward material purchases (**SAR ${(analytics.totalPurchases || 0).toLocaleString()}**) and operational expenses (**SAR ${(analytics.totalExpenses || 0).toLocaleString()}**).
* **Receivables Warning:** Outstanding customer dues require immediate follow-up to maintain healthy liquidity in the market.

## 3. Actionable Recommendations
* **Immediate Priority:** Initiate targeted collection reminders for customers with pending invoices over 30 days.
* **Inventory Control:** Monitor low-stock items closely to prevent fulfillment delays for ongoing projects.
      `;
      setAiReport(fallbackReport.trim());
    }

    setIsGeneratingAI(false);
  };

  const handleSendChat = async (overrideMsg = null) => {
    const messageToSend = overrideMsg || chatInput;
    if (!messageToSend.trim()) return;
    
    const userMsg = { role: 'user', content: messageToSend };
    const recentChatHistory = chatMessages.slice(-4);
    const newChatHistory = [...chatMessages, userMsg];
    
    setChatMessages(newChatHistory);
    setChatInput('');
    setIsSendingChat(true);

    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let responseText = null;

    const apiKey = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const businessData = getFullERPContext();
      const historyContext = recentChatHistory.map(m => `${m.role === 'user' ? 'User Question' : 'AI CFO Response'}: ${m.content}`).join('\n');

      const prompt = `
        You are an expert CFO and Business Advisor for "Oxad BS Co." based in Saudi Arabia.
        
        CURRENT SYSTEM DATA:
        - Complete Business Performance: ${JSON.stringify(businessData)}
       
        LANGUAGE STYLE:
        1. YOU MUST SPEAK FLUENT, COLLOQUIAL MANGLISH (Malayalam written in English script).
        2. Speak like a friendly Malayali colleague from Kerala.
        3. Use common Malayalam phrases, casual tone, and natural conversational style.
        4. Do NOT use formal language. Use words that Malayalis use in daily business discussions.
        5. The voice will be read in English (en-IN), so write the Malayalam words phonetically so they sound perfect when spoken.

        CRITICAL RULES:
        1. Always use 'SAR' (Saudi Riyal) for currency. NEVER use the dollar sign '$'.
        2. Provide a direct, insightful answer based strictly on the provided business data. Keep it concise.
        
        Conversation History: ${historyContext}
        User's Latest Question: "${messageToSend}"
      `;

      // ചാറ്റിലും ഒന്നിന് പിറകെ ഒന്നായി മോഡലുകൾ ചെക്ക് ചെയ്യുന്നു
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
          if (responseText) break;
        } catch (err) {
          console.warn(`Chat Model ${modelName} failed, trying next...`, err);
        }
      }
    }

    // മോഡലുകൾ എല്ലാം ഫെയിൽ ആയാൽ സൗഹൃദപരമായ ഒരു ലോക്കൽ മെസ്സേജ് നൽകുന്നു
    if (responseText) {
      setChatMessages(prev => [...prev, { role: 'ai', content: responseText }]);
      speakText(responseText);
    } else {
      const fallbackMsg = "Kooduthal request vannathukondu aayi quota temporary aayi nirthiyirikkunnu. Pakshe nammude system safe aanu, chila samayam kazhinju onnude try cheyyu tto! :)";
      setChatMessages(prev => [...prev, { role: 'ai', content: fallbackMsg }]);
      speakText(fallbackMsg);
    }

    setIsSendingChat(false);
  };

     const formatAITextToHTML = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
        if (line.startsWith('### ')) return <h4 key={idx} className="text-sm font-black text-slate-900 dark:text-white mt-4 mb-2">{line.replace('### ', '').replace(/\*\*/g, '')}</h4>;
        if (line.startsWith('## ')) return <h3 key={idx} className="text-base font-black text-blue-700 dark:text-blue-400 mt-6 mb-3 border-b border-slate-300 dark:border-slate-700 pb-2">{line.replace('## ', '').replace(/\*\*/g, '')}</h3>;
        if (line.startsWith('# ')) return <h2 key={idx} className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-2 mb-4 uppercase tracking-tight">{line.replace('# ', '').replace(/\*\*/g, '')}</h2>;
        if (line.trim() === '---') return <hr key={idx} className="my-4 border-slate-300 dark:border-slate-700" />;
        if (line.startsWith('* ') || line.startsWith('- ')) {
            const content = line.substring(2).replace(/\*\*(.*?)\*\*/g, '<span class="font-black text-slate-900 dark:text-white">$1</span>');
            return <li key={idx} className="ml-4 mb-2 text-xs font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0 shadow-sm"></div><span dangerouslySetInnerHTML={{__html: content}} /></li>;
        }
        if (line.trim() !== '') {
            const content = line.replace(/\*\*(.*?)\*\*/g, '<span class="font-black text-slate-900 dark:text-white">$1</span>');
            return <p key={idx} className="mb-2 text-xs font-bold text-slate-900 dark:text-slate-100 leading-relaxed" dangerouslySetInnerHTML={{__html: content}} />;
        }
        return <div key={idx} className="h-1"></div>;
    });
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
        {/* Animated Background Blobs for Premium Feel */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 dark:bg-blue-600/20 blur-[100px] rounded-full mix-blend-multiply animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/20 blur-[100px] rounded-full mix-blend-multiply animate-pulse delay-1000"></div>
        
        <div className="bg-white/70 dark:bg-[#1e293b]/70 backdrop-blur-2xl p-10 md:p-14 rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-700/50 flex flex-col items-center max-w-4xl w-full mx-4 z-10 animate-fade-in-up">
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Who is working today?</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Select your workspace profile to continue</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mt-4">
            {/* Default Admin / Director Card */}
            <button onClick={() => handleUserSelect({ id: 'admin', name: 'System Admin', role: 'Director' })} className="group flex flex-col items-center p-6 bg-white dark:bg-slate-800/80 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 hover:border-indigo-400/50 transition-all duration-300">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-black dark:from-slate-600 dark:to-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-inner mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">System Admin</h3>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Director</p>
            </button>

            {/* Dynamic Sales Team Cards */}
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
      {/* ഐഫോണിൽ സൗണ്ട് പ്ലേ ആവാൻ ഒളിപ്പിച്ചു വെക്കുന്ന ഓഡിയോ ഫയൽ */}
      <audio id="notification-sound" src="/coin.mp3" preload="auto"></audio>
      
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
          
          /* 👉 Perfect Multi-Page Print & PDF Styles */
          @media print {
            html, body { height: auto !important; overflow: visible !important; background: white !important; }
            body * { visibility: hidden; }
            
            .print-overlay {
               position: absolute !important;
               left: 0; top: 0;
               width: 100% !important;
               height: auto !important;
               overflow: visible !important;
               background: white !important;
            }

            #printable-area, #printable-area * { visibility: visible; }
            
            #printable-area { 
              position: relative !important; 
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              width: 100% !important; 
              min-height: auto !important;
              height: auto !important;
              background-color: white !important; 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 10mm 15mm !important;
              overflow: visible !important;
            }

            /* Ensure tables break naturally across pages without overlapping */
            table { page-break-inside: auto; width: 100% !important; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 10mm; }
          }

          /* 👉 Mobile View Scaling fix */
          @media screen and (max-width: 768px) {
            #printable-area { transform: scale(0.85); transform-origin: top center; margin-bottom: -15%; }
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
              <div className="hidden md:flex items-center bg-slate-50 dark:bg-[#0f172a] rounded-full px-4 py-2 w-80 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 ring-blue-100 dark:ring-blue-900/30 transition-all">
                <Search size={18} className="text-slate-400 mr-2" />
                <input type="text" placeholder="Global Entity Search..." className="bg-transparent border-none text-sm font-bold w-full focus:outline-none uppercase dark:text-white dark:placeholder-slate-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors bg-slate-50 dark:bg-[#0f172a] rounded-full border border-slate-100 dark:border-slate-800"><Sun size={20} className="hidden dark:block"/><Moon size={20} className="block dark:hidden"/></button>
              
              <div className="relative" ref={notifRef}>
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <Bell size={22}/>{notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#1e293b] animate-pulse"></span>}
                  </button>
                  {isNotifOpen && (
                      <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fade-in-up">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center"><span className="font-black text-xs uppercase text-slate-800 dark:text-white">Notifications</span><span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 py-1 px-2 rounded-full text-[9px] font-bold">{notifications.length} New</span></div>
                          <div className="max-h-80 overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (<div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">All Caught Up!</div>) : (
                                 notifications.map((n, i) => (
                                     <div key={i} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex gap-4">
                                         <div className={`mt-1 p-2 rounded-full h-fit shrink-0 ${n.type === 'warning' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}><n.icon size={14}/></div>
                                         <div><p className="text-xs font-black text-slate-800 dark:text-white uppercase">{n.title}</p><p className="text-[10px] font-bold text-slate-500 mt-1 uppercase leading-relaxed">{n.desc}</p></div>
                                     </div>
                                 ))
                              )}
                          </div>
                      </div>
                  )}
              </div>
              {/* Active User Display & Switcher */}
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

            {/* --- PRICE ESTIMATOR VIEW --- */}
            {activeTab === 'estimator' && (
              <div className="max-w-[100rem] mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex space-x-3">
                     <button onClick={() => requestAdminAuth(() => setShowEstimatorDB(!showEstimatorDB))} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center transition-colors border ${showEstimatorDB ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50' : 'bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'}`}>
                        <Database size={16} className="mr-2"/> {showEstimatorDB ? 'Close Database' : 'Manage Items Database'}
                     </button>
                  </div>
                  <div className="flex space-x-3">
                      {estimateCart.length > 0 && (
                          <>
                             <button onClick={() => setEstimatorPushModal({isOpen: true, type: 'quotation', customerId: ''})} className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center"><FileSignature size={14} className="mr-2"/> Push to Quotation</button>
                             <button onClick={() => setEstimatorPushModal({isOpen: true, type: 'crm', customerId: ''})} className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center"><SendToBack size={14} className="mr-2"/> Push to CRM</button>
                             <button onClick={() => setEstimatorPushModal({isOpen: true, type: 'invoice', customerId: ''})} className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center"><ArrowRightCircle size={14} className="mr-2"/> Push to Invoice</button>
                             <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                             <button onClick={() => setEstimateCart([])} className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">Clear All</button>
                             <button onClick={() => setPrintDoc({ isOpen: true, type: 'estimate', data: { items: estimateCart, grandTotal: estimateCart.reduce((a,b)=>a+b.totalPrice, 0), date: new Date().toISOString().split('T')[0] } })} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Printer size={16} className="mr-2"/> Print Estimate</button>
                          </>
                      )}
                  </div>
                </div>

                {showEstimatorDB ? (
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in-up">
                        <div className="lg:col-span-5 bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none"><Calculator size={120} /></div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Price Estimator</h3>
                            
                            <form onSubmit={handleAddEstimateToCart} className="space-y-5 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Select Category *</label>
                                    <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={calcForm.category} onChange={(e) => setCalcForm({...calcForm, category: e.target.value, itemId: ''})}>
                                        <option value="">Choose Category...</option>
                                        {[...new Set(estimatorItems.map(i => i.category))].map(cat => ( <option key={cat} value={cat}>{String(cat)}</option> ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Select Item Type *</label>
                                    <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={calcForm.itemId} onChange={(e) => setCalcForm({...calcForm, itemId: e.target.value})} disabled={!calcForm.category}>
                                        <option value="">Choose Item...</option>
                                        {estimatorItems.filter(i => i.category === calcForm.category).map(item => ( <option key={item.id} value={item.id}>{String(item.name)} {item.calcType !== 'Tiered' && item.calcType !== 'Standard_Matrix' && (!item.thicknessTiers || item.thicknessTiers.length === 0) && `(SAR ${item.rate})`}</option> ))}
                                    </select>
                                </div>

                                {(() => {
                                    const selItem = estimatorItems.find(i => i.id === calcForm.itemId);
                                    if(!selItem) return null;

                                    return (
                                        <div className="space-y-5 pt-2">
                                            {selItem.calcType === 'Standard_Matrix' && (
                                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <label className="text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-400 tracking-widest flex items-center"><Table size={14} className="mr-2"/> Matrix Chart Sizing</label>
                                                        <label className="flex items-center cursor-pointer space-x-2">
                                                            <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded bg-white dark:bg-slate-800 border-indigo-300 focus:ring-indigo-500" checked={calcForm.isCustomMatrix || false} onChange={(e) => setCalcForm({...calcForm, isCustomMatrix: e.target.checked, matrixSize: '', width: '', height: ''})} />
                                                            <span className="text-[9px] font-bold uppercase text-slate-500">Use Custom Dimensions</span>
                                                        </label>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {calcForm.isCustomMatrix ? (
                                                            <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                                                                <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-500">Width (CM) *</label><input type="number" required placeholder="0" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-indigo-100 dark:border-indigo-800/50 font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-indigo-500/20 shadow-sm" value={calcForm.width} onChange={e => setCalcForm({...calcForm, width: e.target.value})} /></div>
                                                                <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-500">Height (CM) *</label><input type="number" required placeholder="0" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-indigo-100 dark:border-indigo-800/50 font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-indigo-500/20 shadow-sm" value={calcForm.height} onChange={e => setCalcForm({...calcForm, height: e.target.value})} /></div>
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
                                                                    <button type="button" key={t} onClick={() => setCalcForm({...calcForm, matrixThick: String(t)})} className={`flex-1 py-2 px-3 rounded-lg font-black text-xs transition-all border ${calcForm.matrixThick === String(t) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30 scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>{t}</button>
                                                                ))}
                                                            </div>
                                                            <input type="text" className="h-0 w-0 opacity-0 p-0 m-0 absolute -z-10" required value={calcForm.matrixThick || ''} onChange={()=>{}} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selItem.calcType === 'Tiered' && (
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex gap-3 text-indigo-800 dark:text-indigo-300 mb-4">
                                                    <Info size={18} className="shrink-0"/><div className="text-xs"><p className="font-black uppercase tracking-widest mb-1">Tiered Pricing Active</p><p className="font-bold opacity-80">The unit price will automatically decrease based on the quantity you enter.</p></div>
                                                </div>
                                            )}

                                            {(selItem.calcType === 'Area' || selItem.calcType === 'Area_Thickness' || selItem.calcType === 'Sheet_Cut') && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Width (CM) *</label><input type="number" required placeholder="0" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.width} onChange={e => setCalcForm({...calcForm, width: e.target.value})} /></div>
                                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Height (CM) *</label><input type="number" required placeholder="0" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.height} onChange={e => setCalcForm({...calcForm, height: e.target.value})} /></div>
                                                </div>
                                            )}

                                            {(selItem.calcType === 'Area_Thickness' || selItem.calcType === 'Sheet_Cut') && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Thickness (MM) *</label>
                                                    {selItem.thicknessTiers && selItem.thicknessTiers.length > 0 ? (
                                                        <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.thickness} onChange={e => setCalcForm({...calcForm, thickness: e.target.value})}>
                                                            <option value="">Select Thickness...</option>
                                                            {selItem.thicknessTiers.map(t => ( <option key={t.thickness} value={t.thickness}>{t.thickness} mm (Reg: SAR {t.price} | {"<"}0.25sqm: SAR {t.smallAreaPrice || t.price})</option> ))}
                                                        </select>
                                                    ) : ( <input type="number" required placeholder="e.g., 3" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.thickness} onChange={e => setCalcForm({...calcForm, thickness: e.target.value})} /> )}
                                                </div>
                                            )}

                                            {(selItem.calcType === 'Time' || selItem.calcType === 'Sheet_Cut') && (
                                                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Minutes Required *</label><input type="number" required placeholder="e.g., 15" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.minutes} onChange={e => setCalcForm({...calcForm, minutes: e.target.value})} /></div>
                                            )}

                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Quantity *</label><input type="number" min="1" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white text-center focus:ring-2 ring-blue-500/20" value={calcForm.qty} onChange={e => setCalcForm({...calcForm, qty: e.target.value})} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Remarks / Description</label><textarea rows="3" placeholder="Add custom notes (multi-line)..." className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-xs text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20 resize-y whitespace-pre-wrap" value={calcForm.desc} onChange={e => setCalcForm({...calcForm, desc: e.target.value})} /></div>

                                            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700">
                                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">Line Estimate (SAR) - Editable</label>
                                                <div className="p-2 bg-slate-900 dark:bg-black rounded-2xl flex justify-between items-center shadow-inner focus-within:ring-2 ring-emerald-500/50 transition-all">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Total Amount</span>
                                                    <input type="number" step="any" required className="w-32 md:w-48 p-2 bg-transparent border-none font-black text-emerald-400 text-2xl text-right focus:outline-none" value={manualEstimateTotal} onChange={e => setManualEstimateTotal(e.target.value)} />
                                                </div>
                                            </div>

                                            <button type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:scale-95 transition-all">Add to Estimate List</button>
                                        </div>
                                    );
                                })()}
                            </form>
                        </div>

                        <div className="lg:col-span-7 bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-6 bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-100 dark:border-slate-800 flex items-center">
                                <ShoppingCart size={20} className="text-slate-400 mr-3"/><h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Estimate Preview</h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {estimateCart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 space-y-4 py-20">
                                        <ClipboardList size={48} className="opacity-50"/><p className="text-xs font-black uppercase tracking-widest">No items added yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {estimateCart.map((item, idx) => (
                                            <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group flex items-start justify-between">
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-center space-x-2 mb-1"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[8px] font-black uppercase tracking-widest">{idx + 1}. {item.category}</span></div>
                                                    <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase">{item.name}</h4>
                                                    {item.desc && <p className="text-xs font-bold text-slate-500 mt-0.5 whitespace-pre-wrap uppercase">{item.desc}</p>}
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specs: {item.specs} | Qty: <span className="text-slate-700 dark:text-slate-300">{item.qty}</span></p>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="font-black text-lg text-slate-900 dark:text-slate-100">{formatCurrency(item.totalPrice)}</span>
                                                    {item.rate && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base Rate: SAR {item.rate}</span>}
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
                  <button onClick={() => exportToExcel(crms, `CRM_JOBS_${new Date().toISOString().split('T')[0]}`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export</button>
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
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 w-1/4">Work Details</th>
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
                          let displayInvStatus = item.invoicingStatus || 'Not invoiced'; let displayCollStatus = item.collectionStatus || 'Pending';
                          let invBadgeColor = 'bg-gray-100 text-gray-700'; let collBadgeColor = 'bg-gray-100 text-gray-700'; let isSmartLinked = false;

                          if (linkedSale) {
                              isSmartLinked = true; displayInvStatus = 'TAX Invoice Created'; invBadgeColor = 'bg-emerald-600 text-white';
                              if (pendingAmount <= 0) { displayCollStatus = 'Collected'; collBadgeColor = 'bg-emerald-600 text-white'; } 
                              else if (relatedColls > 0) { displayCollStatus = 'Partial / Follow Up'; collBadgeColor = 'bg-amber-500 text-white'; } 
                              else { displayCollStatus = 'Pending Payment'; collBadgeColor = 'bg-rose-500 text-white'; }
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
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
      <div>{item.date}</div>
      {item.createdBy && <div className="text-[8px] font-black uppercase text-blue-500 mt-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full inline-block">By: {item.createdBy}</div>}
  </td>
                            <td className="px-4 py-3 uppercase">{item.customerName}</td>
                            <td className="px-4 py-3 uppercase max-w-xs">
                                {item.items && item.items.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {item.items.map((i, idx) => (
                                            <div key={idx} className="flex flex-col">
                                                <span className="font-bold text-[10px] text-blue-600 dark:text-blue-400">• {i.name} (Qty: {i.qty})</span>
                                                {i.description && <span className="text-[9px] opacity-70 ml-2 whitespace-pre-wrap uppercase">{i.description}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : ( <span className="truncate block uppercase" title={item.description}>{item.description || '--'}</span> )}
                            </td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[9px] uppercase tracking-widest ${getCRMClientTypeStyle(item.clientType)}`}>{item.clientType || 'Direct Client'}</span></td>
                            <td className="px-4 py-3 uppercase">{salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A'}</td>
                            
                            <td className="px-4 py-3 text-center">
                                <select className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center ${getCRMWorkStatusStyle(item.workStatus)}`} value={item.workStatus || 'Work Onboarded'} onChange={(e) => handleStatusChange(item.id, 'workStatus', e.target.value, 'crms')}>
                                    <option value="Price/Quotation Submitted">Price/Quotation Submitted</option><option value="Work Onboarded">Work Onboarded</option><option value="Work Finished">Work Finished</option><option value="Delivered">Delivered</option><option value="Cold Lead">Cold Lead</option><option value="Quote Rejected">Quote Rejected</option><option value="Quote Revised">Quote Revised</option><option value="Waiting Approval">Waiting Approval</option><option value="Canceled">Canceled</option>
                                </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                                {isSmartLinked ? ( <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${invBadgeColor}`} title={`Auto-linked to Sale: ${linkedSale?.invoiceNo}`}>{displayInvStatus} 🔗</span> ) : (
                                    <select className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center border-none ${invBadgeColor}`} value={displayInvStatus} onChange={(e) => handleStatusChange(item.id, 'invoicingStatus', e.target.value, 'crms')}>
                                        <option value="Not invoiced">Not invoiced</option><option value="TAX Invoice Created">TAX Invoice Created</option><option value="TAX Invoice Sent to Client">TAX Invoice Sent to Client</option><option value="Without Invoice">Without Invoice</option><option value="Proforma Invoice created and sent">Proforma Invoice created and sent</option><option value="Sample without payment">Sample without payment</option>
                                    </select>
                                )}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {isSmartLinked ? ( <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${collBadgeColor}`}>{displayCollStatus}</span> ) : (
                                    <select className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center border-none ${collBadgeColor}`} value={displayCollStatus} onChange={(e) => handleStatusChange(item.id, 'collectionStatus', e.target.value, 'crms')}>
                                        <option value="Pending">Pending</option><option value="Collection Follow up">Collection Follow up</option><option value="Collected">Collected</option>
                                    </select>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end no-print relative">
  {!isSmartLinked && (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setCrmDropdownOpen(crmDropdownOpen === item.id ? null : item.id)} 
        className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg" 
        title="Push to Quotation or Invoice"
      >
        <FilePlus size={14}/>
      </button>

      {crmDropdownOpen === item.id && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[999] overflow-hidden animate-fade-in-up">
          <button 
            onClick={() => {
              setCrmDropdownOpen(null);
              setActiveTab('quotations');
              openModal('quotation', {
                customerId: item.customerId || '',
                customerName: item.customerName || '',
                salesmanId: item.salesmanId || '',
                linkedJobId: item.id,
                date: new Date().toISOString().split('T')[0],
                items: item.items && item.items.length > 0 ? item.items : [{ productId: '', name: 'CUSTOM JOB', description: item.description || '', qty: 1, rate: 0, tax: 0, total: 0 }]
              });
            }}
            className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50"
          >
            <FileSignature size={14} className="text-blue-500"/> Push to Quotation
          </button>
          <button 
            onClick={() => {
              setCrmDropdownOpen(null);
              handlePushToInvoice(item);
            }}
            className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Receipt size={14} className="text-emerald-500"/> Push to Invoice
          </button>
        </div>
      )}
    </div>
  )}
  <button onClick={() => handleDuplicateItem('crm', item)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg" title="Duplicate Job"><Copy size={14}/></button>
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

            {/* --- QUOTATIONS VIEW --- */}
            {activeTab === 'quotations' && (
              <div className="max-w-[100rem] mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex space-x-3">
                      <button onClick={() => exportToExcel(quotations, `QUOTATIONS_${new Date().toISOString().split('T')[0]}`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export</button>
                  </div>
                  <button onClick={() => openModal('quotation')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Plus size={16} className="mr-2"/> Add New Quotation</button>
                </div>
                
                <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                      <thead className="bg-[#4a5568] text-[10px] uppercase tracking-widest font-black text-white">
                        <tr>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Quote ID</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Date</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Client Name</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">Exec</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right">Amount</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-center">Status</th>
                          <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right no-print">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {quotations.filter(q => safeSearch(q.quotationNo, searchTerm) || safeSearch(q.customerName, searchTerm) || safeSearch(q.status, searchTerm)).map((item) => {
                          const isConverted = item.status === 'Converted'; const isDropped = item.status === 'Dropped';
                          return (
                          <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${isDropped ? 'opacity-50' : ''}`}>
                            <td className="px-4 py-4 uppercase tracking-wider text-blue-600 dark:text-blue-400 font-black">{item.quotationNo}</td>
                            <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{item.date}</td>
                            <td className="px-4 py-4 uppercase">{item.customerName}</td>
                            <td className="px-4 py-4 uppercase">{salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A'}</td>
                            <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(item.grandTotal)}</td>
                            <td className="px-4 py-4 text-center">
                                <select className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center ${getBadgeStyle(item.status)}`} value={item.status || 'Draft'} onChange={(e) => handleStatusChange(item.id, 'status', e.target.value, 'quotations')}>
                                    <option value="Draft">Draft</option><option value="Sent">Sent (Pending)</option><option value="Follow Up (48 Hrs)">Follow Up (48 Hrs)</option><option value="Follow Up (1 Week)">Follow Up (1 Week)</option><option value="Follow Up (1 Month)">Follow Up (1 Month)</option><option value="Converted">Converted</option><option value="Dropped">Dropped</option>
                                </select>
                            </td>
                            <td className="px-4 py-4 text-right space-x-1 flex justify-end no-print items-center">
                              {/* Push to CRM Job Tracker */}
                              <button onClick={() => handlePushQuoteTo(item, 'crm')} className="p-1.5 text-purple-500 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg" title="Push to CRM Job Tracker"><SendToBack size={16}/></button>
                              
                              {/* Push to Sales Invoice */}
                              <button onClick={() => handlePushQuoteTo(item, 'sale')} className="p-1.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-lg" title="Push to Sales Invoice"><FilePlus size={16}/></button>

                              {/* Duplicate */}
                              <button onClick={() => handleDuplicateItem('quotation', item)} className="p-1.5 text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 rounded-lg" title="Duplicate Quotation"><Copy size={16}/></button>
                              
                              {/* Print */}
                              <button onClick={() => setPrintDoc({ isOpen: true, type: 'quotation', data: item })} className="p-1.5 text-slate-500 bg-slate-100 dark:bg-slate-800 hover:text-blue-500 rounded-lg" title="Print Quotation"><Printer size={16}/></button>
                              
                              {/* Edit Button */}
                              <button onClick={() => openModal('quotation', item)} className="p-1.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg" title="Edit Quotation"><Edit3 size={16}/></button>
                              
                              {/* Delete Button */}
                              <button onClick={() => triggerDelete('quotation', item.id, String(item.quotationNo))} className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded-lg" title="Delete"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        )})}
                        {quotations.length === 0 && <tr><td colSpan="7" className="py-12 text-center text-slate-300 dark:text-slate-600 uppercase tracking-widest">No Quotations Generated Yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

{activeTab === 'ai_reports' && (
              <div className="max-w-[100rem] mx-auto w-full space-y-6 animate-fade-in-up flex-1 pb-10">
                
                {/* Main Header */}
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
                        <Activity size={24}/>
                        </div>
                        <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">AI Executive Advisor</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Smart Analytics & Interactive Chat</p>
                        </div>
                    </div>
                    <button 
                        onClick={generateAIReport} 
                        disabled={isGeneratingAI}
                        className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                        {isGeneratingAI ? 'Generating...' : 'Generate Full PDF Report'}
                    </button>
                </div>

                {aiError && (
                    <div className="p-4 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-200 dark:border-rose-500/30 flex items-center">
                        <AlertTriangle size={16} className="mr-2 shrink-0"/> {aiError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT COLUMN: INTERACTIVE CHAT (Always Visible) */}
                    <div className="lg:col-span-5 bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-[700px] overflow-hidden relative">
                        <div className="p-6 bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={18} className="text-blue-500"/>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Ask ERP Assistant</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`p-2 rounded-full transition-colors shadow-sm ${isVoiceEnabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`} title={isVoiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}>
                                    {isVoiceEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                                </button>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Online</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4 bg-slate-50 dark:bg-[#0f172a]">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center">
                                        <Sparkles size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">How can I help you today?</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 max-w-[250px] leading-relaxed">I have full access to your sales, purchases, and outstanding balances. Chat in Manglish or click the mic to speak!</p>
                                    </div>
                                    <div className="w-full space-y-2 mt-4">
                                        {suggestedQuestions.map((sq, i) => (
                                            <button key={i} onClick={() => handleSendChat(sq)} className="w-full p-3 text-left bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm truncate">
                                                👉 {sq}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-sm' 
                                            : 'bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                        }`}>
                                        {msg.role === 'ai' ? formatAITextToHTML(msg.content) : msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isSendingChat && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white dark:bg-[#1e293b] border-t border-slate-100 dark:border-slate-800">
                            <div className="flex gap-2 relative items-center">
                                <button 
                                    onClick={(e) => { e.preventDefault(); toggleListening(); }}
                                    className={`relative z-20 p-3 rounded-xl transition-all cursor-pointer touch-manipulation ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
                                    title="Speak your question"
                                >
                                    <Mic size={18} />
                                </button>
                                <input
                                    type="text"
                                    placeholder={isListening ? "Listening... Speak now" : "Type or speak your question..."}
                                    className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 ring-blue-500/20 transition-all"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                                    disabled={isSendingChat}
                                />
                                <button 
                                    onClick={() => handleSendChat()}
                                    disabled={isSendingChat || !chatInput.trim()}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-md disabled:opacity-50 flex items-center justify-center shrink-0"
                                >
                                    <ArrowRightCircle size={18}/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FULL REPORT */}
                <div className="lg:col-span-7 bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-[700px] overflow-hidden relative">
                    <div className="p-6 bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-indigo-500"/>
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Executive Summary Report</h3>
                        </div>
                        {aiReport && (
                            <div className="flex gap-2">
                                <button onClick={handleCopyReport} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg transition-colors" title="Copy Text"><Copy size={16}/></button>
                                <button onClick={() => handleWhatsAppShare('sale', { customerName: 'Board of Directors', grandTotal: analytics.netProfit, invoiceNo: 'EXECUTIVE-REPORT' })} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 rounded-lg transition-colors" title="Share via WhatsApp"><MessageSquare size={16}/></button>
                                <button onClick={handlePrintAIReport} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg transition-colors" title="Download PDF"><Printer size={16}/></button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-[#0f172a] relative">
                        {isGeneratingAI ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating formal executive report...</p>
                            </div>
                        ) : aiReport ? (
                            <div id="ai-report-content" className="relative p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-100 pb-4 mb-6">
                                    <div>
                                        <h1 className="text-xl font-black uppercase text-slate-900 dark:text-white">{settings?.companyName || 'Oxad BS Co.'}</h1>
                                        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-0.5">Board of Directors - Executive Summary</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">Date: {new Date().toISOString().split('T')[0]}</p>
                                        <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Confidential Report</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                        <p className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400">Total Sales</p>
                                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(analytics.totalSales)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                        <p className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400">Outstanding</p>
                                        <p className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(analytics.outstandingReceivables)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                        <p className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400">Net Profit</p>
                                        <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(analytics.netProfit)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-slate-900 dark:text-slate-100">
                                    {formatAITextToHTML(aiReport)}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                                <ClipboardList size={48} className="text-slate-400"/>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No report generated yet.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
          </div>
        )}

            {/* --- COLLECTIONS AND EXPENSES VIEW --- */}
            {(activeTab === 'collections' || activeTab === 'expenses') && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'collections' ? collections : expenses, activeTab)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className={`px-8 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center hover:scale-95 transition-all ${activeTab === 'collections' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30' : 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/30'}`}><Plus size={16} className="mr-2"/> Record {activeTab.slice(0, -1)}</button>
                </div>
                {renderTable(['Date', 'Ref / Invoice Link', activeTab === 'collections' ? 'Customer' : 'Description', 'Executive', 'Amount', 'Method'], (activeTab === 'collections' ? collections : expenses).filter(i => safeSearch(i.ref, searchTerm) || safeSearch(i.customerName, searchTerm) || safeSearch(i.description, searchTerm) || safeSearch(i.method, searchTerm) || safeSearch(i.amount, searchTerm) || safeSearch(i.date, searchTerm)), activeTab.slice(0, -1),
                  (item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{String(item.date || (item.createdAt?.toDate ? item.createdAt.toDate().toISOString().split('T')[0] : ''))}</td>
                      <td className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase">{String(item.ref || item.category || 'N/A')}</td>
                      <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.customerName || item.description || '--')}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-400 dark:text-slate-500">{String(salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A')}</td>
                      <td className={`px-6 py-4 font-black ${activeTab === 'collections' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-500 dark:text-slate-400">{String(item.method || 'Cash')}</td>
                      
                       {/* 👉 പുതിയതായി ചേർത്ത 'Receipt' കോളം */}
          <td className="px-6 py-4">
            {item.receiptImage ? (
              <button 
                onClick={() => setViewReceiptModal({ isOpen: true, image: item.receiptImage })}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                📷 View Bill
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 uppercase">No Bill</span>
            )}
          </td>
                      
                      <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity no-print flex justify-end items-center">
                        <button onClick={() => setPrintDoc({ isOpen: true, type: activeTab.slice(0, -1), data: item })} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-lg" title="Print"><Printer size={16}/></button>
                        <button onClick={() => openModal(activeTab.slice(0, -1), item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg" title={`Edit ${activeTab.slice(0, -1)}`}><Edit3 size={16}/></button>
                        <button onClick={() => triggerDelete(activeTab.slice(0, -1), item.id, formatCurrency(item.amount))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                )}
              </div>
            )}

{/* --- SALES AND PURCHASES VIEW --- */}
            {(activeTab === 'sales' || activeTab === 'purchases') && (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => exportToExcel(activeTab === 'sales' ? sales : purchases, `${settings?.companyName || 'MY'}_${activeTab.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}`)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
                  <button onClick={() => openModal(activeTab.slice(0, -1))} className={`px-8 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center hover:scale-95 transition-all ${activeTab === 'sales' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30' : 'bg-gradient-to-r from-slate-700 to-slate-900 shadow-slate-900/30'}`}><Plus size={16} className="mr-2"/> Generate {activeTab.slice(0, -1)}</button>
                </div>
                {renderTable(['Date', 'Invoice No', activeTab === 'sales' ? 'Customer' : 'Supplier', 'Executive', 'Grand Total', 'Status'], (activeTab === 'sales' ? sales : purchases).filter(i => safeSearch(i.invoiceNo, searchTerm) || safeSearch(i.customerName, searchTerm) || safeSearch(i.supplierName, searchTerm) || safeSearch(i.date, searchTerm) || safeSearch(i.grandTotal, searchTerm) || safeSearch(salesmen.find(s=>s.id === i.salesmanId)?.name, searchTerm)), activeTab.slice(0, -1),
                  (item) => {
                    const relatedExps = activeTab === 'purchases' ? expenses.filter(e => (e.description === item.invoiceNo || e.ref === item.invoiceNo)).reduce((a,b)=>a+Number(b.amount),0) : 0;
                    const relatedColls = activeTab === 'sales' ? collections.filter(c => c.ref === item.invoiceNo).reduce((a,b)=>a+Number(b.amount),0) : 0;
                    const paidAmount = activeTab === 'sales' ? relatedColls : relatedExps;
                    const grandTotalNum = Number(item.grandTotal) || 0;
                    const pendingAmount = grandTotalNum - paidAmount;
                    
                    // ACCURATE PAYMENT STATUS CALCULATION
                    let status = 'Unpaid';
                    if (grandTotalNum > 0 && paidAmount >= grandTotalNum) {
                      status = 'Paid';
                    } else if (paidAmount > 0 && paidAmount < grandTotalNum) {
                      status = 'Partial';
                    } else {
                      status = 'Unpaid';
                    }

                    return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{String(item.date || '')}</td>
                      <td className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider flex items-center">{String(item.invoiceNo || '')} {item.linkedJobId && <ClipboardList size={14} className="ml-2 text-indigo-400" title="Linked to CRM Job"/>}</td>
                      <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.customerName || item.supplierName || '')}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-400 dark:text-slate-500">{String(salesmen.find(s=>s.id === item.salesmanId)?.name || 'N/A')}</td>
                      <td className={`px-6 py-4 font-black ${activeTab === 'sales' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>{formatCurrency(item.grandTotal)}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getBadgeStyle(status)}`}>{status}</span></td>
                      <td className="px-6 py-4 text-right space-x-2 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {pendingAmount > 0 && <button onClick={() => handleQuickPayment(item, activeTab.slice(0, -1), pendingAmount)} className="p-2 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg shrink-0" title={`Settle Pending: ${formatCurrency(pendingAmount)}`}><HandCoins size={16}/></button>}
                        
                        {/* WhatsApp Payment Reminder Button */}
                        <button onClick={() => handleWhatsAppShare(activeTab.slice(0, -1), item)} className="p-2 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg shrink-0" title="Send WhatsApp Payment Reminder">
                          <MessageSquare size={16}/>
                        </button>

                        <button onClick={() => handleDuplicateItem(activeTab.slice(0, -1), item)} className="p-2 text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg shrink-0" title="Duplicate"><Copy size={16}/></button>
                        <button onClick={() => setPrintDoc({ isOpen: true, type: activeTab.slice(0, -1), data: item })} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0" title="Download PDF"><Printer size={16}/></button>
                        <button onClick={() => openModal(activeTab.slice(0, -1), item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg shrink-0"><Edit3 size={16}/></button>
                        <button onClick={() => triggerDelete(activeTab.slice(0, -1), item.id, String(item.invoiceNo))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg shrink-0"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )}
                )}
              </div>
            )}

{/* --- AGING REPORTS VIEW --- */}
{(activeTab === 'customer_aging' || activeTab === 'supplier_aging') && (
  <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
        <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">
          {activeTab === 'customer_aging' ? 'Customer Aging Details' : 'Supplier Aging Details'}
        </h2>
        <button 
          onClick={() => activeTab === 'customer_aging' ? setShowOnlyDueSales(!showOnlyDueSales) : setShowOnlyDuePurchases(!showOnlyDuePurchases)}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center transition-all ${
            (activeTab === 'customer_aging' ? showOnlyDueSales : showOnlyDuePurchases) 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Filter size={14} className="mr-2" />
          Show Only Due
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Entity Name</th>
              <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">0-30 Days</th>
              <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">31-60 Days</th>
              <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">61-90 Days</th>
              <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">90+ Days</th>
              <th className="py-4 px-4 text-xs font-black text-blue-500 uppercase tracking-widest text-right">Total Due</th>
              <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {(() => {
              let reportData = buildAgingReport(activeTab === 'customer_aging' ? 'customer' : 'supplier');
              const isOnlyDue = activeTab === 'customer_aging' ? showOnlyDueSales : showOnlyDuePurchases;
              if (isOnlyDue) { reportData = reportData.filter(item => item.totalDue > 0); }

              if (reportData.length === 0) {
                return (
                  <tr><td colSpan="7" className="py-12 text-center text-slate-300 dark:text-slate-600 uppercase tracking-widest">No aging records found.</td></tr>
                );
              }

              return reportData.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="py-4 px-4 font-black uppercase text-slate-800 dark:text-white">{item.name || item.entityName || 'UNKNOWN'}</td>
                  <td className="py-4 px-4 text-right">{formatCurrency(item.current || 0)}</td>
                  <td className="py-4 px-4 text-right">{formatCurrency(item.days31to60 || 0)}</td>
                  <td className="py-4 px-4 text-right">{formatCurrency(item.days61to90 || 0)}</td>
                  <td className="py-4 px-4 text-right text-rose-500 dark:text-rose-400">{formatCurrency((item.days91to120 || 0) + (item.days120Plus || 0))}</td>
                  <td className="py-4 px-4 text-right font-black text-blue-600 dark:text-blue-400">{formatCurrency(item.totalDue || 0)}</td>
                  <td className="py-4 px-4 text-right no-print">
                    <button 
                      onClick={() => handleWhatsAppShare(activeTab === 'customer_aging' ? 'customer' : 'supplier', item)} 
                      className="p-2 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg inline-flex items-center transition-colors" 
                      title="Send WhatsApp Reminder"
                    >
                      <MessageSquare size={16}/>
                    </button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

   {/* --- CUSTOMERS AND SUPPLIERS VIEW --- */}
{(activeTab === 'customers' || activeTab === 'suppliers') && (
  <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
    <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex-wrap gap-4">
      <button onClick={() => exportToExcel(activeTab === 'customers' ? customers : suppliers, activeTab)} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
      
      <div className="relative">
        <select 
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'sample') {
              downloadSampleExcel(activeTab === 'customers' ? 'customer' : 'supplier');
            } else if (val === 'import') {
              document.getElementById(`fileInput-${activeTab}`).click();
            }
            e.target.value = "";
          }} 
          className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-200 dark:border-indigo-800/40 outline-none cursor-pointer appearance-none pr-10 shadow-sm"
        >
          <option value="" disabled selected>📂 Excel Actions...</option>
          <option value="sample">📥 Download Sample Template</option>
          <option value="import">📤 Upload & Import Excel</option>
        </select>
        
        <input 
          id={`fileInput-${activeTab}`} 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          className="hidden" 
          onChange={(e) => handleBulkExcelImport(e, activeTab === 'customers' ? 'customer' : 'supplier')} 
        />
      </div>

      <button onClick={() => openModal(activeTab.slice(0, -1))} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center hover:scale-95 transition-all"><Plus size={16} className="mr-2"/> Add {activeTab.slice(0, -1)}</button>
    </div>
    
    {renderTable(['Entity Name', 'Contact Info', 'Tax / GST', 'Opening Bal.', 'Current Bal.', 'Status'], (activeTab === 'customers' ? customers : suppliers).filter(c => safeSearch(c.name, searchTerm) || safeSearch(c.phone, searchTerm) || safeSearch(c.email, searchTerm) || safeSearch(c.gst, searchTerm)), activeTab,
      (item) => {
        let currentBal = Number(item.openingBalance || 0);
        
        if (activeTab === 'customers') {
            const totSales = sales.filter(s => s.customerId === item.id).reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0);
            const totColls = collections.filter(c => c.customerId === item.id).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            currentBal = currentBal + totSales - totColls;
        } else {
            const totPurchases = purchases.filter(p => p.supplierId === item.id).reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0);
            const totExps = expenses.filter(e => e.partyName === item.name || e.supplierName === item.name).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            currentBal = currentBal + totPurchases - totExps;
        }

        return (
          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <td className="px-6 py-4 font-black uppercase text-slate-800 dark:text-white">{String(item.name || '')}</td>
            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400"><div><Phone size={12} className="inline mr-2 opacity-70"/>{String(item.phone || 'N/A')}</div><div className="mt-1"><Mail size={12} className="inline mr-2 opacity-70"/>{String(item.email || 'N/A')}</div></td>
            <td className="px-6 py-4 font-bold text-xs uppercase text-slate-700 dark:text-slate-300">{String(item.gst || 'UNREGISTERED')}</td>
            <td className="px-6 py-4 font-black text-slate-400 dark:text-slate-500">{formatCurrency(item.openingBalance)}</td>
            <td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400">{formatCurrency(currentBal)}</td>
            <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30">Active</span></td>
            <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
              <button onClick={() => generateLedger(activeTab.slice(0, -1), item)} className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="View Ledger"><BookOpen size={16}/></button>
              <button onClick={() => openModal(activeTab.slice(0, -1), item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"><Edit3 size={16}/></button>
              <button onClick={() => triggerDelete(activeTab.slice(0, -1), item.id, String(item.name))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
            </td>
          </tr>
        );
      }
    )}
  </div>
)}

  {/* --- PRODUCTS VIEW --- */}
{activeTab === 'products' && (
  <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
    <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex-wrap gap-4">
      <div className="flex space-x-3 items-center flex-wrap gap-3">
        <button onClick={() => exportToExcel(products, 'products')} className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><DownloadCloud size={16} className="mr-2"/> Export Data</button>
        
        <div className="relative">
          <select 
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'sample') {
                downloadSampleExcel('product');
              } else if (val === 'import') {
                document.getElementById('fileInput-product').click();
              }
              e.target.value = "";
            }} 
            className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-200 dark:border-indigo-800/40 outline-none cursor-pointer appearance-none pr-10 shadow-sm"
          >
            <option value="" disabled selected>📂 Excel Actions...</option>
            <option value="sample">📥 Download Sample Template</option>
            <option value="import">📤 Upload & Import Excel</option>
          </select>
          
          <input 
            id="fileInput-product" 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={(e) => handleBulkExcelImport(e, 'product')} 
          />
        </div>
      </div>

      <button onClick={() => openModal('product')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center hover:scale-95 transition-all shadow-lg shadow-blue-500/30"><Plus size={16} className="mr-2"/> Add Product</button>
    </div>
    {renderTable(['Product Name', 'Category', 'Stock Lvl', 'Cost Price', 'Selling Price'], products.filter(p => safeSearch(p.name, searchTerm) || safeSearch(p.category, searchTerm) || safeSearch(p.sellingPrice, searchTerm) || safeSearch(p.purchasePrice, searchTerm)), 'product',
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

            {/* --- SALESMEN VIEW --- */}
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
                        <button onClick={() => generateLedger('salesman', sm, 'cash')} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-emerald-500 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors" title="View Cash In Hand Balance"><Wallet size={16}/></button>
                        <button onClick={() => generateLedger('salesman', sm, 'performance')} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-indigo-500 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors" title="View Sales Performance Ledger"><BookOpen size={16}/></button>
                        <button onClick={() => openModal('salesman', sm)} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"><Edit3 size={16}/></button>
                        <button onClick={() => triggerDelete('salesman', sm.id, String(sm.name))} className="p-3 bg-slate-50 dark:bg-[#0f172a] text-rose-500 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

{/* --- SETTINGS VIEW --- */}
            {activeTab === 'settings' && (
              <div className="max-w-3xl mx-auto w-full space-y-6 animate-fade-in-up flex-1">
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-6">
                    <Settings size={28} className="text-blue-500"/>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Company Profile</h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Manage your business details and logos</p>
                    </div>
                  </div>
                  {settingsSuccess && <div className="mb-6 p-4 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest text-center">Settings Saved Successfully</div>}
                  <form onSubmit={handleSettingsSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Company Name *</label>
                        <input required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={settings.companyName || ''} onChange={e => setSettings({...settings, companyName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Tax / VAT ID</label>
                        <input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={settings.taxId || ''} onChange={e => setSettings({...settings, taxId: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Phone Number</label>
                        <input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} />
                      </div>

                      {/* NEW DUAL LOGO UPLOAD SECTION */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">App / Sidebar Logo</label>
                        <input type="file" accept="image/*" className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none text-slate-500 focus:ring-2 ring-blue-500/20 text-xs" onChange={(e) => handleImageUpload(e, 'logo')} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Print / Invoice Logo</label>
                        <input type="file" accept="image/*" className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none text-slate-500 focus:ring-2 ring-indigo-500/20 text-xs" onChange={(e) => handleImageUpload(e, 'printLogo')} />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Address / Location</label>
                        <textarea rows="3" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20 resize-y" value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})}></textarea>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 transition-all">Save Profile Configuration</button>
                  </form>
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

        {/* --- ESTIMATOR PUSH MODAL --- */}
        {estimatorPushModal.isOpen && (
            <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all">
                <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
                    <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            estimatorPushModal.type === 'crm' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 
                            estimatorPushModal.type === 'quotation' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 
                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                            {estimatorPushModal.type === 'crm' ? <SendToBack size={28} /> : 
                             estimatorPushModal.type === 'quotation' ? <FileSignature size={28} /> : 
                             <ArrowRightCircle size={28} />}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 text-center">
                            Push to {estimatorPushModal.type === 'crm' ? 'CRM Job Tracker' : estimatorPushModal.type === 'quotation' ? 'Sales Quotation' : 'Sales Invoice'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Select a customer to link this estimate</p>
                        
                        <form onSubmit={handleEstimatorPushSubmit} className="w-full space-y-6">
                            <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20 shadow-sm" value={estimatorPushModal.customerId} onChange={(e) => setEstimatorPushModal({...estimatorPushModal, customerId: e.target.value})}>
                                <option value="">Select Existing Customer...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{String(c.name)}</option>)}
                            </select>

                            <div className="flex space-x-3">
                                <button type="button" onClick={() => setEstimatorPushModal({ isOpen: false, type: '', customerId: '' })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="submit" className={`flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-95 transition-all ${
                                    estimatorPushModal.type === 'crm' ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30' : 
                                    estimatorPushModal.type === 'quotation' ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30' :
                                    'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30'
                                }`}>
                                    Create {estimatorPushModal.type === 'crm' ? 'Job' : estimatorPushModal.type === 'quotation' ? 'Quote' : 'Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        )}

         {/* --- INVOICE CHOICE MODAL --- */}
        {invoiceChoiceModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 text-2xl font-black shadow-inner">
                  📊
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 text-center">
                  Choose Action
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">
                  Invoice: {invoiceChoiceModal.saleData?.invoiceNo}
                </p>

                <div className="w-full space-y-3">
                  <button 
                    onClick={() => {
                      const sale = invoiceChoiceModal.saleData;
                      setInvoiceChoiceModal({ isOpen: false, saleData: null, customerEntity: null });
                      setPrintDoc({ isOpen: true, type: 'sale', data: sale });
                    }}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    📄 View Tax Invoice
                  </button>

                  <button 
                    onClick={() => {
                      const entity = invoiceChoiceModal.customerEntity;
                      setInvoiceChoiceModal({ isOpen: false, saleData: null, customerEntity: null });
                      if (entity) generateLedger('customer', entity);
                    }}
                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    📑 View Due Statement (Ledger)
                  </button>

                  {/* 👉 പുതിയതായി ചേർത്ത WhatsApp Reminder ബട്ടൺ */}
                  <button 
                    onClick={() => {
                      const sale = invoiceChoiceModal.saleData;
                      setInvoiceChoiceModal({ isOpen: false, saleData: null, customerEntity: null });
                      if (sale) handleWhatsAppShare('sale', sale);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    💬 Send WhatsApp Reminder
                  </button>
                </div>

                <button 
                  onClick={() => setInvoiceChoiceModal({ isOpen: false, saleData: null, customerEntity: null })} 
                  className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


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
                            <input type="password" autoFocus required placeholder="PIN" className={`w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-2 font-black text-center text-xl text-slate-900 dark:text-white tracking-[0.5em] mb-4 focus:outline-none transition-colors ${adminPinError ? 'border-rose-500/50 focus:border-rose-500' : 'border-transparent dark:border-slate-800 focus:border-blue-500'}`} value={adminPinInput} onChange={e => setAdminPinInput(e.target.value)} />
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

        {/* --- MAIN FORM MODALS --- */}
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
                {formError && (
                    <div className="p-4 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-200 dark:border-rose-500/30 flex items-center">
                        <AlertTriangle size={16} className="mr-2 shrink-0"/> {formError}
                    </div>
                )}

                {/* --- ENTITY SELECTION (MOVED TO TOP) --- */}
                {['sale', 'purchase', 'expense', 'collection', 'crm', 'quotation'].includes(modalState.type) && (
                  <div className="p-6 bg-slate-50 dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner dark:shadow-none">
                     <div className="flex justify-between items-center mb-3">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                             {modalState.type === 'purchase' || modalState.type === 'expense' ? 'Select Supplier / Entity *' : 'Select Customer / Entity *'}
                         </label>
                         <button type="button" onClick={() => openModal(modalState.type === 'purchase' || modalState.type === 'expense' ? 'supplier' : 'customer')} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center shadow-sm" title="Add New Entity">
                             <Plus size={12} className="mr-1"/> Add New
                         </button>
                     </div>

                     <select required className="w-full p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-slate-800 dark:text-white uppercase focus:ring-2 ring-blue-500/20 shadow-sm" value={formData.customerId || formData.supplierId || formData.partyName || ''} onChange={(e) => { const val = e.target.value; if (['sale', 'collection', 'crm', 'quotation'].includes(modalState.type)) { const ent = customers.find(c => c.id === val); if (ent) setFormData({...formData, customerId: ent.id, customerName: ent.name, partyName: ent.name}); } else if (['purchase', 'expense'].includes(modalState.type)) { const ent = suppliers.find(s => s.id === val); if (ent) setFormData({...formData, supplierId: ent.id, supplierName: ent.name, partyName: ent.name}); } else { setFormData({...formData, partyName: val}); } }}>
                       <option value="">Choose Existing Entity...</option>
                       {['sale', 'collection', 'crm', 'quotation'].includes(modalState.type) ? customers.map(c => <option key={c.id} value={c.id}>{String(c.name)}</option>) : suppliers.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
                     </select>

                     {modalState.type === 'sale' && formData.customerId && !formData.linkedQuoteId && (
                         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Smart Link to CRM Job (Optional)</label>
                            <select className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white uppercase text-xs focus:ring-2 ring-indigo-500/20" value={formData.linkedJobId || ''} onChange={(e) => setFormData({...formData, linkedJobId: e.target.value})}>
                                <option value="">No Link (Independent Invoice)</option>
                                {crms.filter(c => c.customerId === formData.customerId).map(job => (
                                    <option key={job.id} value={job.id}>{job.jobId} - {job.items && job.items[0] ? job.items[0].name.slice(0,40) : '--'}...</option>
                                ))}
                            </select>
                         </div>
                     )}
                  </div>
                )}

                {/* --- COLLECTION & EXPENSE FIELDS --- */}
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
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Upload Receipt / Bill Image</label>
                      <input type="file" accept="image/*" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white text-xs" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setFormData({...formData, receiptImage: reader.result}); }; reader.readAsDataURL(file); } }} />
                      {formData.receiptImage && (
                        <div className="mt-2 flex items-center gap-3">
                          <img src={formData.receiptImage} alt="Receipt Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" />
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Receipt Attached Successfully ✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- CRM FIELDS --- */}
                {modalState.type === 'crm' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Date *</label><input type="date" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.date || new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Client Type *</label>
                      <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-800 dark:text-white uppercase" value={formData.clientType || 'Direct Client'} onChange={e => setFormData({...formData, clientType: e.target.value})}>
                        <option value="Direct Client">Direct Client</option>
                        <option value="Agency">Agency</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Sales Executive *</label>
                      <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase" value={formData.salesmanId || ''} onChange={e => setFormData({...formData, salesmanId: e.target.value})}>
                        <option value="">Select Exec...</option>{salesmen.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* --- TASK FIELDS --- */}
                {modalState.type === 'task' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Reminder / Task Title *</label>
                      <input required placeholder="E.g., Trade License Expiry" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Expiry / Due Date *</label>
                      <input type="date" required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase focus:ring-2 ring-blue-500/20" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                  </div>
                )}
                
                {/* --- CUSTOMER / SUPPLIER / SALESMAN FIELDS --- */}
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

                {/* --- PRODUCT FIELDS --- */}
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

                {/* --- ESTIMATOR ITEM FIELDS --- */}
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
                                        <div className="flex-1 space-y-1"><span className="text-[9px] font-bold text-slate-400 uppercase">Min Qty</span><input type="number" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.minQty} onChange={(e) => handleTierChange(idx, 'minQty', e.target.value)} /></div>
                                        <div className="flex-1 space-y-1"><span className="text-[9px] font-bold text-slate-400 uppercase">Unit Price (SAR)</span><input type="number" step="any" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.price} onChange={(e) => handleTierChange(idx, 'price', e.target.value)} /></div>
                                        <button type="button" onClick={() => removeTier(idx)} className="mt-4 p-3 text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addTier} className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-200 transition-colors">+ Add Tier Level</button>
                        </div>
                    ) : formData.calcType === 'Standard_Matrix' ? (
                        <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl flex items-center space-x-4 border border-indigo-100 dark:border-indigo-800">
                            <Table size={24} className="text-indigo-500 shrink-0"/>
                            <div><p className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Standard Matrix Applied</p><p className="text-[10px] font-bold text-indigo-500/80 mt-1">This item will automatically use the predefined Acrylic prices from the standard sizes chart. Custom inputs will be interpolated.</p></div>
                        </div>
                    ) : formData.calcType === 'Area_Thickness' || formData.calcType === 'Sheet_Cut' ? (
                        <>
                            <div className="md:col-span-2 bg-slate-50 dark:bg-[#0f172a] p-6 rounded-2xl">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-4 block">Thickness Pricing Tiers (Per Sq.Mtr)</label>
                                <div className="space-y-3">
                                    {formData.thicknessTiers?.map((tier, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="flex-1 space-y-1"><span className="text-[9px] font-bold text-slate-400 uppercase">Thickness (mm)</span><input type="number" step="any" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.thickness} onChange={(e) => { const newTiers = [...(formData.thicknessTiers || [])]; newTiers[idx].thickness = Number(e.target.value) || 0; setFormData({...formData, thicknessTiers: newTiers}); }} /></div>
                                            <div className="flex-1 space-y-1"><span className="text-[9px] font-bold text-slate-400 uppercase">Reg. Price ({">="} 0.25 sqm)</span><input type="number" step="any" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.price} onChange={(e) => { const newTiers = [...(formData.thicknessTiers || [])]; newTiers[idx].price = Number(e.target.value) || 0; setFormData({...formData, thicknessTiers: newTiers}); }} /></div>
                                            <div className="flex-1 space-y-1"><span className="text-[9px] font-bold text-slate-400 uppercase">Small Area Price ({"<"} 0.25 sqm)</span><input type="number" step="any" className="w-full p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500" value={tier.smallAreaPrice || ''} onChange={(e) => { const newTiers = [...(formData.thicknessTiers || [])]; newTiers[idx].smallAreaPrice = Number(e.target.value) || 0; setFormData({...formData, thicknessTiers: newTiers}); }} /></div>
                                            <button type="button" onClick={() => { const newTiers = [...(formData.thicknessTiers || [])]; newTiers.splice(idx, 1); setFormData({...formData, thicknessTiers: newTiers}); }} className="mt-4 p-3 text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => setFormData({...formData, thicknessTiers: [...(formData.thicknessTiers || []), { thickness: 0, price: 0, smallAreaPrice: 0 }]})} className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-200 transition-colors">+ Add Thickness Rate</button>
                            </div>
                            {formData.calcType === 'Sheet_Cut' && (
                                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Cut Rate per Minute *</label><input type="number" required step="any" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.timeRate || ''} onChange={e => setFormData({...formData, timeRate: e.target.value})} /></div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Base Rate (SAR) *</label><input type="number" required step="any" className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-black text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20" value={formData.rate || ''} onChange={e => setFormData({...formData, rate: e.target.value})} /></div>
                    )}
                  </div>
                )}

                {/* --- ITEMS SECTION (Sale, Purchase, CRM, Quotation) --- */}
                {['sale', 'purchase', 'crm', 'quotation'].includes(modalState.type) && (
                  <div className="space-y-6">
                    {modalState.type !== 'crm' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Sales Executive *</label>
                          <select required className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border-none font-bold text-slate-900 dark:text-white uppercase" value={formData.salesmanId || ''} onChange={e => setFormData({...formData, salesmanId: e.target.value})}>
                            <option value="">Select Staff...</option>
                            {salesmen.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
                          </select>
                        </div>
                    )}
                    
                    <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 mb-4">{modalState.type === 'crm' ? 'Job Tracking Items' : 'Item Details'}</h3>
                      
                      <div className="hidden md:flex gap-3 px-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <div className="w-[25%]">Item Name / Product</div>
                         <div className="flex-1">Description / Specifications</div>
                         <div className="w-16 text-center">Qty</div>
                         <div className="w-24 text-right">Rate</div>
                         {modalState.type !== 'crm' && <div className="w-16 text-center">Tax %</div>}
                         <div className="w-28 text-right">Total</div>
                         <div className="w-10"></div>
                      </div>

                      <div className="space-y-3 mt-3">
                        {Array.isArray(invoiceItems) && invoiceItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center p-3 md:p-0 bg-white dark:bg-[#1e293b] md:bg-transparent rounded-xl md:rounded-none border border-slate-200 dark:border-slate-700 md:border-none">
                            
                            <div className="w-full md:w-[25%] flex flex-col gap-2">
                                {modalState.type !== 'crm' && (
                                    <div className="flex items-center gap-2">
                                        <select className="flex-1 p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white uppercase text-xs" value={item.productId || ''} onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}>
                                            <option value="">Select Product...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}
                                        </select>
                                        <button 
                                            type="button" 
                                            onClick={() => openModal('product')} 
                                            className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl transition-all shrink-0" 
                                            title="Add New Product to Inventory"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                )}
                                <input type="text" placeholder="Custom Item Name" required className="w-full p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 uppercase" value={item.name || ''} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} />
                            </div>

                            <textarea 
                                placeholder="Detailed Description / Specifications (Multi-line)..." 
                                className="w-full md:flex-1 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 custom-scrollbar resize-y whitespace-pre-wrap uppercase min-h-[70px]" 
                                rows="3"
                                value={item.description || ''} 
                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)} 
                            />
                            
                            <div className="flex gap-3 w-full md:w-auto">
                              <input type="number" placeholder="Qty" required className="flex-1 md:w-16 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-center text-xs" value={item.qty || ''} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} />
                              <input type="number" placeholder="Rate" required className="flex-1 md:w-24 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-right text-xs" value={item.rate || ''} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} />
                              {modalState.type !== 'crm' && (
                                   <input type="number" placeholder="Tax" className="flex-1 md:w-16 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-center text-xs" value={item.tax || ''} onChange={(e) => handleItemChange(idx, 'tax', e.target.value)} />
                              )}
                            </div>
                            
                            <div className="w-full md:w-28 p-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-black text-right text-xs text-slate-800 dark:text-slate-200 border border-transparent dark:border-slate-700">{formatCurrency(item.total)}</div>
                            
                            <button type="button" onClick={() => removeRow(idx)} className="w-full md:w-10 p-3 flex justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors shrink-0" title="Remove Item">
                               <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setInvoiceItems([...invoiceItems, { productId: '', name: '', description: '', qty: 1, rate: 0, tax: 0, total: 0 }])} className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg mt-2 transition-colors"><Plus size={14} className="mr-1"/> Add Item Row</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SUBMIT BUTTONS --- */}
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

        {/* --- LEDGER MODAL --- */}
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
              <div className="flex space-x-3">
                <button onClick={() => handleWhatsAppShare(printDoc.type, printDoc.data)} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/30 hover:scale-95 flex items-center transition-all">WhatsApp</button>
                <button onClick={() => handleEmailShare(printDoc.type, printDoc.data)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:scale-95 flex items-center transition-all">Email</button>
                <button onClick={async () => {
                  const refNo = printDoc.data?.invoiceNo || printDoc.data?.quotationNo || printDoc.data?.ref || printDoc.data?.entity?.name || 'DOC';
                  const filename = `${settings?.companyName || 'MY'}_${String(printDoc.type).toUpperCase()}_${refNo}.pdf`;
                  
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  
                  if (isMobile) {
                    if (!window.html2pdf) {
                      await new Promise((resolve) => { 
                        const script = document.createElement('script'); 
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'; 
                        script.onload = resolve; 
                        document.head.appendChild(script); 
                      });
                    }
                    const element = document.getElementById('printable-area');
                    const opt = { 
                      margin: 5, 
                      filename: filename, 
                      image: { type: 'jpeg', quality: 0.98 }, 
                      html2canvas: { scale: 2, useCORS: true, letterRendering: true }, 
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
                    };
                    window.html2pdf().set(opt).from(element).save();
                  } else {
                    triggerSystemPrint(filename.replace('.pdf', ''));
                  }
                }} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-95 flex items-center transition-all">
                  <DownloadCloud size={18} className="mr-2"/> PRINT
                </button>
                <button onClick={() => setPrintDoc({ isOpen: false, type: '', data: null })} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors flex items-center justify-center"><X size={20}/></button>
              </div>
            </div>

            {/* --- MOBILE RESPONSIVE SCROLL WRAPPER --- */}
            <div className="w-full overflow-x-auto pb-20 custom-scrollbar flex justify-start md:justify-center">
              <div className="px-4 md:px-0">
                <div id="printable-area" className="w-[210mm] min-w-[210mm] shrink-0 mx-auto bg-white min-h-[297mm] p-[15mm] shadow-2xl relative font-sans text-slate-900 uppercase print:shadow-none print:w-full print:min-w-0 print:m-0" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                  
                  {/* --- 1. PERFECTLY ALIGNED LETTERHEAD LOGO --- */}
                  <div className="-mt-[9mm] mb-6 w-full flex justify-center">
                    {settings?.printLogo || settings?.logo ? (
                      <img 
                        src={settings?.printLogo || settings.logo} 
                        className="w-full max-h-36 object-contain mx-auto" 
                        alt="Company Header"
                      />
                    ) : (
                      <div className="pt-4 text-center">
                        <h2 className="font-black text-3xl uppercase tracking-tight text-slate-900">
                          {settings?.companyName || 'My Custom ERP'}
                        </h2>
                      </div>
                    )}
                  </div>

                  {/* --- 2. INVOICE TITLE & DETAILS --- */}
                  <div className="flex justify-between items-end pb-4 border-b-4 border-slate-900 mb-8">
                    <div>
                      {printDoc.type !== 'estimate' && (
                        <p className="text-xl font-black text-blue-600 uppercase mb-1">
                          Ref No: {String(printDoc.data?.invoiceNo || printDoc.data?.quotationNo || printDoc.data?.id?.slice(0, 8) || printDoc.data?.entity?.name || '')}
                        </p>
                      )}
                      
                      {(() => {
                        let docDate = new Date();
                        if (printDoc.data?.createdAt?.toDate) {
                          docDate = printDoc.data.createdAt.toDate();
                        } else if (printDoc.data?.date) {
                          docDate = new Date(printDoc.data.date);
                        }

                        const day = String(docDate.getDate()).padStart(2, '0');
                        const month = String(docDate.getMonth() + 1).padStart(2, '0');
                        const year = docDate.getFullYear();
                        const formattedDate = `${day}-${month}-${year}`;

                        const formattedTime = docDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                        const hijriDate = docDate.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });

                        return (
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-sm font-bold text-slate-500 tracking-widest uppercase flex items-center">
                              Date: <span className="text-slate-800 ml-1 mr-2">{formattedDate}</span> | <span className="text-[10px] ml-2">{formattedTime}</span>
                            </p>
                            <p className="text-xs font-bold text-slate-600 tracking-wider" dir="rtl">
                              التاريخ: <span className="font-normal">{hijriDate}</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="text-right">
                      {printDoc.type === 'sale' ? (
                        printDoc.data?.taxTotal > 0 ? (
                          printDoc.data?.gst ? (
                            <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">فاتورة ضريبية</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Tax Invoice</h2></>
                          ) : (
                            <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">فاتورة ضريبية مبسطة</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Simplified Tax Invoice</h2></>
                          )
                        ) : (
                          <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">فاتورة</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Invoice</h2></>
                        )
                    ) : printDoc.type === 'quotation' ? (
                        <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">عرض سعر</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Sales Quotation</h2></>
                      ) : printDoc.type === 'purchase' ? (
                        <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">امر شراء</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Purchase Order</h2></>
                      ) : printDoc.type === 'collection' ? (
                        <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">سند قبض</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Payment Receipt</h2></>
                      ) : printDoc.type === 'estimate' ? (
                        <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">تقدير السعر</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Price Estimate</h2></>
                      ) : printDoc.type === 'ledger' ? (
                        <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">كشف حساب</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Statement Of Account</h2></>
                      ) : (
                        <><h1 className="text-3xl font-black text-slate-900 tracking-normal normal-case leading-tight">سند صرف</h1><h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Expense Voucher</h2></>
                      )}
                    </div>
                  </div>

                  {/* --- 3. ISSUED BY & BILLED TO DETAILS --- */}
                  {printDoc.type !== 'estimate' && (
                    <div className="grid grid-cols-2 gap-12 mb-12">
                      <div className="border-l-4 border-blue-600 pl-4">
                        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Issued By</h2>
                        <p className="font-black text-sm uppercase text-slate-900">{settings?.companyName || 'My Custom ERP'}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-1">Tax ID/TIN: {settings?.taxId || '310294817200003'}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-1">{settings?.email || 'info@erp.com'} | {settings?.phone || '+966 50 000 0000'}</p>
                        {settings?.address && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{settings.address}</p>}
                      </div>
                      <div className="border-l-4 border-slate-900 pl-4">
                        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                          {printDoc.type === 'sale' || printDoc.type === 'quotation' ? 'Billed To Customer' : 
                          printDoc.type === 'purchase' ? 'Supplier Details' : 
                          printDoc.type === 'ledger' ? `${printDoc.data?.entityType} Details` :
                          printDoc.type === 'collection' ? 'Received From' : 'Expense Account'}
                        </h2>
                        <p className="font-black text-sm uppercase text-slate-900">
                          {String(printDoc.data?.customerName || printDoc.data?.supplierName || printDoc.data?.category || printDoc.data?.description || printDoc.data?.entity?.name || '')}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                          Customer VAT ID: {String(printDoc.data?.gst || 'N/A')}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                          Contact: {String(printDoc.data?.entity?.phone || '--')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* --- 4. TABLES --- */}
                      {printDoc.type === 'ledger' ? (
                        <table className="w-full text-left border-collapse mb-12">
                          <thead className="bg-slate-50 border-y-2 border-slate-900">
                            <tr>
                              <th className="py-4 px-2 text-slate-600"><span className="text-[12px] font-bold tracking-normal normal-case block">الرقم</span><span className="text-[9px] font-black uppercase tracking-widest mt-1 block">S.No</span></th>
                              <th className="py-4 px-2 text-slate-600"><span className="text-[12px] font-bold tracking-normal normal-case block">وصف المنتج</span><span className="text-[9px] font-black uppercase tracking-widest mt-1 block">Product Description</span></th>
                              <th className="py-4 px-2 text-slate-600 text-center"><span className="text-[12px] font-bold tracking-normal normal-case block">الكمية</span><span className="text-[9px] font-black uppercase tracking-widest mt-1 block">Qty</span></th>
                              <th className="py-4 px-2 text-slate-600 text-right"><span className="text-[12px] font-bold tracking-normal normal-case block">السعر</span><span className="text-[9px] font-black uppercase tracking-widest mt-1 block">Unit Rate</span></th>
                              <th className="py-4 px-2 text-slate-600 text-center"><span className="text-[12px] font-bold tracking-normal normal-case block">الضريبة %</span><span className="text-[9px] font-black uppercase tracking-widest mt-1 block">Tax %</span></th>
                              <th className="py-4 px-2 text-slate-600 text-right"><span className="text-[12px] font-bold tracking-normal normal-case block">المجموع</span><span className="text-[9px] font-black uppercase tracking-widest mt-1 block">Line Total</span></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-bold uppercase text-slate-800">
                            {printDoc.data?.rows?.map((r, idx) => (
                              <tr key={idx}><td className="py-3 px-2">{r.date}</td><td className="py-3 px-2 text-blue-600">{r.ref}</td><td className="py-3 px-2">{r.desc}</td><td className="py-3 px-2 text-right">{r.debit > 0 ? formatCurrency(r.debit) : '-'}</td><td className="py-3 px-2 text-right">{r.credit > 0 ? formatCurrency(r.credit) : '-'}</td><td className="py-3 px-2 text-right font-black">{formatCurrency(r.balance)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      ) : printDoc.type === 'estimate' ? (
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
                                    <div className="text-xs text-slate-500 mt-1 font-bold whitespace-pre-wrap uppercase">{item.specs}</div>
                                    {item.desc && <div className="text-[10px] text-slate-400 mt-1 font-normal normal-case whitespace-pre-wrap uppercase">{item.desc}</div>}
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
                      ) : ['sale', 'purchase', 'quotation'].includes(printDoc.type) ? (
                        <>
                          <table className="w-full text-left border-collapse mb-12">
                            <thead className="bg-slate-50 border-y-2 border-slate-900">
                              <tr>
                                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">S.No <br/><span className="text-[8px] font-normal">الرقم</span></th>
                                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Product Description <br/><span className="text-[8px] font-normal">وصف المنتج</span></th>
                                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Qty <br/><span className="text-[8px] font-normal">الكمية</span></th>
                                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Unit Rate <br/><span className="text-[8px] font-normal">السعر</span></th>
                                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Tax % <br/><span className="text-[8px] font-normal">ضريبة القيمة المضافة</span></th>
                                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Line Total <br/><span className="text-[8px] font-normal">المجموع</span></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-bold uppercase text-slate-900">
                              {printDoc.data?.items?.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-5 px-2 text-slate-400">{idx + 1}</td>
                                  <td className="py-5 px-2 text-slate-900">
                                    <div className="uppercase">{String(item.name || '')}</div>
                                    {item.description && <div className="text-xs text-slate-500 mt-1 font-normal whitespace-pre-wrap uppercase">{item.description}</div>}
                                  </td>
                                  <td className="py-5 px-2 text-center text-slate-700">{String(item.qty || 0)}</td>
                                  <td className="py-5 px-2 text-right text-slate-700">{formatCurrency(item.rate)}</td>
                                  <td className="py-5 px-2 text-center text-slate-500">{String(item.tax || 0)}%</td>
                                  <td className="py-5 px-2 text-right text-slate-900">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* 👉 QR Code & Totals Section Combined */}
                          <div className="flex justify-between items-end mb-8 pt-4">
                           {printDoc.type === 'sale' && printDoc.data?.taxTotal > 0 ? (
                          <div className="flex flex-col items-start">
                            <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
                              <QRCodeSVG 
                                value={generateZatcaTLV(
                                  settings?.companyName || 'Oxad', 
                                  settings?.taxId || '', 
                                  printDoc.data?.date ? new Date(printDoc.data.date).toISOString() : new Date().toISOString(), 
                                  printDoc.data?.grandTotal || 0, 
                                  printDoc.data?.taxTotal || 0
                                )} 
                                size={105} 
                              />
                            </div>
                            <div className="text-left border-l-2 border-slate-200 pl-3">
                              <p className="text-[12px] font-black text-slate-500 tracking-normal normal-case leading-tight">فاتورة إلكترونية</p>
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight mt-1">ZATCA Compliant E-Invoice</p>
                              <p className="text-[11px] font-bold text-slate-500 tracking-normal normal-case leading-tight mt-3">المملكة العربية السعودية</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-tight">Kingdom of Saudi Arabia</p>
                            </div>
                          </div>
                    ) : (
                          <div></div>
                    )}

                            <div className="w-80 space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                              <div className="flex justify-between items-center text-slate-500">
                                <div className="flex flex-col items-start">
                                  <span className="text-[13px] font-bold tracking-normal normal-case">المجموع</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Subtotal</span>
                                </div>
                                <span className="text-sm font-bold">{formatCurrency(printDoc.data?.subTotal)}</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-500">
                                <div className="flex flex-col items-start">
                                  <span className="text-[13px] font-bold tracking-normal normal-case">الضريبة</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Total Tax (15%)</span>
                                </div>
                                <span className="text-sm font-bold">{formatCurrency(printDoc.data?.taxTotal)}</span>
                              </div>
                              {Number(printDoc.data?.discount) > 0 && (
                                <div className="flex justify-between items-center text-rose-500">
                                  <div className="flex flex-col items-start">
                                    <span className="text-[13px] font-bold tracking-normal normal-case">الخصم</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Discount</span>
                                  </div>
                                  <span className="text-sm font-bold">-{formatCurrency(printDoc.data?.discount)}</span>
                                </div>
                              )}
                              <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center text-slate-900">
                                <div className="flex flex-col items-start">
                                  <span className="text-[16px] font-black tracking-normal normal-case">الإجمالي</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Grand Total</span>
                                </div>
                                <span className="text-xl font-black text-blue-600">{formatCurrency(printDoc.data?.grandTotal)}</span>
                              </div>
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
            </div>
          </div>
        )}
{/* --- CONFIRM DELETE MODAL --- */}
        {confirmDelete?.isOpen && (
          <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 no-print transition-all">
            <div className="max-w-md w-full bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase">Delete Record?</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8 uppercase">Permanently remove <span className="text-slate-900 dark:text-white font-black">"{String(confirmDelete?.title || '')}"</span>?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setConfirmDelete({ isOpen: false })} className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={executeDelete} className="py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-95 transition-transform">Confirm</button>
              </div>
            </div>
          </div>
        )}

      </div> {/* <-- ഇതാണ് Flex കണ്ടെയ്നർ ക്ലോസ് ചെയ്യുന്നത് --> */}

    {/* --- WhatsApp Style Lock Screen Notifications --- */}
    <div className="fixed top-12 left-0 right-0 z-[9999999] flex flex-col items-center gap-3 pointer-events-none px-4">
      {(lockNotifications || []).map((notif) => (
        <div 
          key={notif.id} 
          onClick={() => removeNotification(notif.id)}
          className="w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 shadow-2xl rounded-[1.5rem] p-4 pointer-events-auto cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-top-5 hover:bg-white/95 dark:hover:bg-slate-800/95"
          title="Tap to dismiss"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-[12px] text-white font-bold">W</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{notif.title}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">now</span>
          </div>
          <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300 mt-1 leading-snug pl-8">
            {notif.message}
          </p>
        </div>
      ))}
    </div>

{/* --- View Receipt Modal (FIXED Z-INDEX) --- */}
{viewReceiptModal?.isOpen && (
  <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-6" onClick={() => setViewReceiptModal({ isOpen: false, image: null })}>
    <div className="bg-white dark:bg-[#1e293b] p-4 sm:p-6 rounded-[2.5rem] max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
      
      <div className="flex justify-between items-center w-full mb-3 shrink-0">
        <h3 className="font-black uppercase text-sm text-slate-800 dark:text-white tracking-tight">Attached Preview</h3>
        <button onClick={() => setViewReceiptModal({ isOpen: false, image: null })} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={20} />
        </button>
      </div>

      <div className="relative w-full flex-1 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-2xl min-h-[220px]">
        <img 
          src={viewReceiptModal.image} 
          alt="Full Image" 
          className="w-auto h-auto max-w-full max-h-[70vh] object-contain rounded-xl" 
        />
      </div>

      <button onClick={() => setViewReceiptModal({ isOpen: false, image: null })} className="mt-4 w-full py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shrink-0 text-xs uppercase tracking-wider">
        Close Preview
      </button>
    </div>
  </div>
)}

      {/* --- FLOATING TEAM CHAT HUB UI --- */}
      <div className={`fixed z-[99998] transition-all duration-300 origin-bottom-right flex flex-col no-print pointer-events-auto ${
          isTeamChatOpen 
            ? 'inset-0 sm:inset-auto sm:bottom-32 sm:right-8 sm:w-[380px] sm:h-[600px] scale-100 opacity-100' 
            : 'bottom-44 right-5 sm:bottom-32 sm:right-8 sm:w-[380px] h-0 scale-0 opacity-0 pointer-events-none'
        }`}>
        
        <div className="w-full h-full bg-slate-50 dark:bg-[#0f172a] sm:bg-white/95 sm:dark:bg-[#1e293b]/95 sm:backdrop-blur-xl sm:border border-slate-200 dark:border-slate-700 sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative">
          
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shadow-md sm:rounded-t-[2rem] shrink-0 pt-12 sm:pt-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsTeamChatOpen(false)} className="sm:hidden p-2 -ml-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><ArrowRightCircle size={20} className="rotate-180"/></button>
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm flex items-center"><MessageSquare size={16} className="mr-2"/> OXAD Team-Hub</h3>
                <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Live Collaboration</p>
              </div>
            </div>
            <button onClick={() => setIsTeamChatOpen(false)} className="hidden sm:block p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={16}/></button>
          </div>
          
          <div 
           
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col space-y-4 bg-slate-100 sm:bg-transparent dark:bg-[#0b1120] sm:dark:bg-transparent relative pb-6"
          >
            {(teamMessages || []).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50">
                <MessageSquare size={40} className="mb-2"/>
                <p className="text-[10px] font-black uppercase tracking-widest">Start the conversation</p>
              </div>
            ) : (
              (teamMessages || [])
                .slice()
                .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0))
                .map((msg, index, array) => {
                  const isMe = msg.senderName === activeUserSession?.name;
                  const isUserOnline = (onlineUsers || {})[msg.senderId]?.isOnline;
                  
                  const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
                  const prevMsg = array[index - 1];
                  const prevDate = prevMsg?.timestamp?.toDate ? prevMsg.timestamp.toDate() : null;
                  const showDateBadge = !prevDate || msgDate.toDateString() !== prevDate.toDateString();

                  const formatChatDate = (date) => {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (date.toDateString() === today.toDateString()) return 'Today';
                    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
                    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  };

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateBadge && (
                        <div className="flex justify-center my-4 sticky top-2 z-10">
                          <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                            {formatChatDate(msgDate)}
                          </span>
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[85%] animate-fade-in-up group ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1 mx-1 mt-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{isMe ? 'You' : msg.senderName}</span>
                          {!isMe && isUserOnline && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]" title="Online Now"></span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isMe && !msg.isDeleted && (
                            <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded-full transition-all" title="Delete Message"><Trash2 size={12} /></button>
                          )}
                          <div className={`p-3 sm:p-3.5 rounded-[1.2rem] text-[13px] font-bold shadow-sm relative flex flex-col leading-relaxed ${
                              msg.isDeleted ? 'bg-slate-200 dark:bg-slate-800/50 text-slate-500 italic border border-slate-300 dark:border-slate-700 rounded-xl' 
                                : isMe ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
                            }`}>
                            
                            {msg.isDeleted ? (
                              <span className="flex items-center text-[10px]"><Trash2 size={12} className="mr-1 opacity-50"/> 🚫 This message was deleted</span>
                            ) : msg.type === 'audio' ? (
                              <audio controls src={msg.audioData} className="w-48 sm:w-56 h-8 scale-90 origin-left" />
                            ) : msg.type === 'image' ? (
                              <div className="flex justify-center my-2 w-full">
                                <img 
                                  src={msg.imageData} 
                                  alt="Shared" 
                                  className="max-w-[70%] max-h-60 object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity shadow-md border border-slate-200" 
                                  onClick={() => setViewReceiptModal({ isOpen: true, image: msg.imageData })} 
                                />
                              </div>
                            ) : (
                              formatChatText(msg.text)
                            )}

                            <div className={`text-[8px] font-black mt-2 self-end tracking-widest ${isMe && !msg.isDeleted ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
            )}

            {/* --- Typing Indicator Animation --- */}
            {Object.values(onlineUsers || {}).some(u => u?.isTyping && u?.userName !== activeUserSession?.name) && (
              <div 
                className="flex justify-start animate-fade-in-up mt-2 mb-2"
                ref={(el) => { if (el && !showScrollBottom) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}
              >
                <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                    {Object.values(onlineUsers || {}).find(u => u?.isTyping && u?.userName !== activeUserSession?.name)?.userName || 'Someone'} is typing...
                  </span>
                  <div className="flex items-center gap-1.5 h-2 ml-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={teamChatEndRef} />
          </div>

          {showScrollBottom && (
            <button onClick={scrollToBottom} className="absolute bottom-[80px] right-6 w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all z-50 animate-fade-in-up">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              {unreadTeamCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center rounded-full animate-bounce shadow-md">{unreadTeamCount}</span>}
            </button>
          )}

          <div className="w-full shrink-0 relative border-t border-slate-200 dark:border-slate-800 bg-slate-50 sm:bg-white dark:bg-[#1e293b] sm:rounded-b-[2rem] z-40 pb-safe">
            {mentionSearch !== null && (
              <div className="absolute bottom-full left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg max-h-40 overflow-y-auto z-50">
                <div className="p-2 text-[9px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-900">Select Team Member</div>
                {[{id: 'admin', name: 'System Admin'}, ...(salesmen || [])]
                  .filter(c => c?.name?.toLowerCase().includes((mentionSearch || '').toLowerCase()))
                  .map(member => (
                    <button key={member.id} type="button" onClick={() => insertMention(member?.name)} className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 transition-colors uppercase">@{member?.name}</button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendTeamMessage} className="p-3 sm:p-4 flex items-center gap-2 mb-4 sm:mb-0">
                <input 
                  type="text" 
                  placeholder="Type @ to mention..." 
                  className="flex-1 bg-white sm:bg-slate-50 dark:bg-[#0f172a] border border-slate-300 sm:border-slate-200 dark:border-slate-700 rounded-full sm:rounded-xl px-5 py-3.5 text-[16px] sm:text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ring-indigo-500/20 shadow-sm" 
                  value={newTeamMessage || ''} 
                  onChange={handleChatInputChange} 
                  disabled={!!isRecordingNote} 
                />
                
                <label htmlFor="chat-image-upload" className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-xl cursor-pointer transition-colors shrink-0 flex items-center justify-center" title="Attach Image">
                  <ImageIcon size={18} />
                </label>
                <input 
                  id="chat-image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleSendImageMessage} 
                />

                {(newTeamMessage || '').trim() ? (
                  <button type="button" onClick={handleSendTeamMessage} className="p-3.5 bg-indigo-600 text-white rounded-full sm:rounded-xl shadow-md hover:bg-indigo-700 transition-colors shrink-0 flex items-center justify-center">
                    <Send size={18} />
                  </button>
                ) : (
                  <button type="button" onPointerDown={startRecordingNote} onPointerUp={stopRecordingNote} onPointerCancel={stopRecordingNote} className={`p-3.5 rounded-full sm:rounded-xl shadow-md transition-colors shrink-0 flex items-center justify-center ${isRecordingNote ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {isRecordingNote ? <div className="w-4 h-4 bg-white rounded-sm animate-ping"></div> : <Mic size={18} />}
                  </button>
                )}
              </form>
          </div>
        </div>
      </div>

      {/* Floating Chat Trigger Button with Badge (FIXED CSS Position) */}
      {!isTeamChatOpen && (
        <button onClick={() => setIsTeamChatOpen(true)} className="fixed bottom-28 right-5 sm:bottom-32 sm:right-8 z-[99997] w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:shadow-indigo-500/20" title="Team Chat">
          <MessageSquare size={24} className="sm:w-7 sm:h-7" />
          {unreadTeamCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 animate-bounce shadow-md">{unreadTeamCount}</span>
          )}
          <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping z-[-1]"></span>
        </button>
      )}
      
      {/* Floating Voice Assistant Button (Responsive for PC & Mobile) */}
      <div className={`fixed right-5 sm:right-8 z-[99999] flex items-center gap-3 no-print transition-all duration-300 ${isTeamChatOpen ? 'scale-0 opacity-0 pointer-events-none' : 'bottom-6 sm:bottom-8 scale-100 opacity-100 pointer-events-auto'}`}>
        {isListening && (
          <div className="hidden sm:flex px-4 py-2 bg-rose-600 text-white rounded-full shadow-2xl items-center gap-2 animate-pulse text-xs font-black uppercase tracking-widest">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            Listening... Speak now
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleListening(); }}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer touch-manipulation ${
            isListening 
              ? 'bg-rose-500 text-white animate-bounce shadow-rose-500/50 ring-4 ring-rose-300/50' 
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-indigo-500/40 hover:shadow-indigo-500/60'
          }`}
          title="Click to speak command"
        >
          <Mic size={24} className="sm:w-7 sm:h-7" />
        </button>
      </div>

    </div>  
  );
};

export default App;