import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged, 
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit, 
  getDocs, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  Droplets, 
  CircleDashed, 
  Milk, 
  Baby, 
  Scale, 
  Ruler, 
  Activity, 
  Clock, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  X, 
  Save, 
  Download, 
  Upload, 
  Mail, 
  LogOut,
  UserPlus,
  CheckCircle2,
  Users,
  Timer,
  Edit2,
  Trash2,
  FileText,
  Lock,
  Home,
  FileSpreadsheet,
  Copy,
  RefreshCw,
  Key,
  Link as LinkIcon
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isSameDay, addMinutes, parse, isValid, differenceInDays, differenceInMinutes, differenceInHours } from 'date-fns';

// --- Firebase Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helper: Safe Date Parsing ---
const getSafeDate = (timestamp) => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    return new Date(timestamp);
};

// --- Helper: Password Validation ---
const isStrongPassword = (pwd) => {
    return pwd.length >= 6 && /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd);
};

// --- Components ---

// 1. Login Screen
const LoginScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        if (isSignUp) {
            if (!isStrongPassword(password)) {
                throw new Error("Password must be 6+ chars with letters & numbers.");
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create Default Infant for new user
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'infants'), {
                householdId: userCredential.user.uid,
                name: 'Baby 1',
                dob: serverTimestamp()
            });

            // Init settings to point to self
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_settings', userCredential.user.uid), {
                activeHouseholdId: userCredential.user.uid
            });

        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (err) {
        console.error("Auth Error", err);
        let msg = "Authentication failed.";
        if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = "Invalid email or password.";
        if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
        if (err.code === 'auth/weak-password') msg = "Password too weak.";
        if (err.message) msg = err.message;
        setError(msg);
    }
    setLoading(false);
  };
  
  const handleGoogleLogin = async () => {
      setLoading(true);
      setError('');
      try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const user = result.user;

          const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_settings', user.uid);
          const settingsSnap = await getDoc(settingsRef);
          
          if (!settingsSnap.exists()) {
              await setDoc(settingsRef, { activeHouseholdId: user.uid });
              const q = query(
                  collection(db, 'artifacts', appId, 'public', 'data', 'infants'),
                  where('householdId', '==', user.uid)
              );
              const snapshot = await getDocs(q);
              if (snapshot.empty) {
                  await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'infants'), {
                      householdId: user.uid,
                      name: 'Baby 1',
                      dob: serverTimestamp()
                  });
              }
          }
      } catch (err) {
          console.error("Google Auth Error", err);
          setError("Google sign-in failed. Please try again.");
      }
      setLoading(false);
  };

  const handleForgotPassword = async () => {
      if (!email) {
          setError("Please enter your email address first.");
          return;
      }
      try {
          await sendPasswordResetEmail(auth, email);
          setResetSent(true);
          setError(""); 
      } catch (err) {
          setError("Failed to send reset email. Check the address.");
      }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-white">
            <Home size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Household Login</h1>
        
        <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors mb-6 shadow-sm"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
        </button>
        
        <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-400 font-medium">OR EMAIL</span>
            <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isSignUp ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Login
            </button>
            <button 
                onClick={() => { setIsSignUp(true); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isSignUp ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Sign Up
            </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="family@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{error}</div>}
          {resetSent && <div className="text-green-600 text-sm text-center font-medium bg-green-50 p-2 rounded-lg">Reset email sent! Check your inbox.</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-pink-500/30 disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login')}
          </button>

          {!isSignUp && (
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600 mt-4"
              >
                  Forgot Password?
              </button>
          )}
        </form>
      </div>
    </div>
  );
};

// 2. Main App Shell
export default function App() {
  const [user, setUser] = useState(null);
  const [householdId, setHouseholdId] = useState(null);
  const [currentTab, setCurrentTab] = useState('tracking');
  const [infants, setInfants] = useState([]);
  const [selectedInfant, setSelectedInfant] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setHouseholdId(null);
    });
    return () => unsubscribe();
  }, []);

  // Sync Household ID
  useEffect(() => {
      if (!user) return;
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_settings', user.uid);
      const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
              setHouseholdId(docSnap.data().activeHouseholdId || user.uid);
          } else {
              setDoc(settingsRef, { activeHouseholdId: user.uid });
              setHouseholdId(user.uid);
          }
      });
      return () => unsubscribe();
  }, [user]);

  // Fetch Infants based on ACTIVE householdId
  useEffect(() => {
    if (!householdId) return;
    
    const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'infants'),
        where('householdId', '==', householdId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedInfants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInfants(loadedInfants);
      if (loadedInfants.length > 0 && !selectedInfant) {
        setSelectedInfant(loadedInfants[0]);
      }
    });
    return () => unsubscribe();
  }, [householdId]);

  useEffect(() => {
      if(selectedInfant && infants.length > 0) {
          const updated = infants.find(i => i.id === selectedInfant.id);
          if (updated) setSelectedInfant(updated);
      } else if (infants.length > 0 && !selectedInfant) {
          setSelectedInfant(infants[0]);
      }
  }, [infants]);

  if (!user || !householdId) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0">
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white">
                <Baby size={18} />
            </div>
            <span className="font-bold text-lg hidden sm:block">Infant Tracker</span>
        </div>

        <div className="flex items-center gap-2">
            <select 
                aria-label="Select infant to track"
                className="bg-slate-100 border-none rounded-full px-4 py-1.5 text-sm font-medium focus:ring-2 focus:ring-pink-500"
                value={selectedInfant?.id || ''}
                onChange={(e) => setSelectedInfant(infants.find(i => i.id === e.target.value))}
            >
                {infants.map(infant => (
                    <option key={infant.id} value={infant.id}>{infant.name}</option>
                ))}
            </select>
            <button 
                aria-label="Open settings"
                onClick={() => setCurrentTab('settings')}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
                <SettingsIcon size={20} />
            </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {currentTab === 'tracking' && selectedInfant && <TrackingTab householdId={householdId} infant={selectedInfant} />}
        {currentTab === 'history' && selectedInfant && <HistoryTab householdId={householdId} infant={selectedInfant} />}
        {currentTab === 'pumping' && <PumpingTab householdId={householdId} />}
        {currentTab === 'summary' && <SummaryTab householdId={householdId} infants={infants} currentInfantId={selectedInfant?.id} />}
        {currentTab === 'settings' && <SettingsTab user={user} householdId={householdId} infants={infants} appId={appId} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 md:hidden z-20 overflow-x-auto">
        <NavButton active={currentTab === 'tracking'} onClick={() => setCurrentTab('tracking')} icon={<Activity size={24} />} label="Track" />
        <NavButton active={currentTab === 'history'} onClick={() => setCurrentTab('history')} icon={<Clock size={24} />} label="History" />
        <NavButton active={currentTab === 'pumping'} onClick={() => setCurrentTab('pumping')} icon={<Milk size={24} />} label="Pump" />
        <NavButton active={currentTab === 'summary'} onClick={() => setCurrentTab('summary')} icon={<BarChart3 size={24} />} label="Summary" />
        <NavButton active={currentTab === 'settings'} onClick={() => setCurrentTab('settings')} icon={<SettingsIcon size={24} />} label="Settings" />
      </nav>

      <div className="hidden md:flex justify-center gap-4 mb-4 fixed bottom-8 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg border border-slate-200 z-20">
        <NavButton active={currentTab === 'tracking'} onClick={() => setCurrentTab('tracking')} icon={<Activity size={20} />} label="Tracking" />
        <NavButton active={currentTab === 'history'} onClick={() => setCurrentTab('history')} icon={<Clock size={20} />} label="History" />
        <NavButton active={currentTab === 'pumping'} onClick={() => setCurrentTab('pumping')} icon={<Milk size={20} />} label="Pumping" />
        <NavButton active={currentTab === 'summary'} onClick={() => setCurrentTab('summary')} icon={<BarChart3 size={20} />} label="Summary" />
        <NavButton active={currentTab === 'settings'} onClick={() => setCurrentTab('settings')} icon={<SettingsIcon size={20} />} label="Settings" />
      </div>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[60px] ${active ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
);


// --- KPI COMPONENT ---
const KPIDashboard = ({ entries, type, selectedDate, infant }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); 
        return () => clearInterval(timer);
    }, []);

    const lastEntry = useMemo(() => {
        return entries.find(e => e.type === type);
    }, [entries, type]);

    const timeAgo = useMemo(() => {
        if (!lastEntry) return 'Never';
        const date = getSafeDate(lastEntry.timestamp);
        const diffMins = differenceInMinutes(now, date);
        const diffHours = differenceInHours(now, date);
        
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
        return format(date, 'MMM d, HH:mm');
    }, [lastEntry, now]);

    // Calculate totals for selected date
    const selectedDateEntries = useMemo(() => {
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return entries.filter(e => {
            const date = getSafeDate(e.timestamp);
            return date && format(date, 'yyyy-MM-dd') === selectedDateStr;
        });
    }, [entries, selectedDate]);

    const iconMap = {
        pee: <Droplets size={16} className="text-yellow-600" />,
        poop: <CircleDashed size={16} className="text-orange-600" />,
        bottle: <Milk size={16} className="text-blue-600" />,
        breast: <Baby size={16} className="text-pink-600" />,
        pump: <Activity size={16} className="text-purple-600" />,
    };

    const colorMap = {
        pee: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        poop: 'bg-orange-50 border-orange-200 text-orange-800',
        bottle: 'bg-blue-50 border-blue-200 text-blue-800',
        breast: 'bg-pink-50 border-pink-200 text-pink-800',
        pump: 'bg-purple-50 border-purple-200 text-purple-800',
    };

    if (type === 'feed') {
        const lastBottle = entries.find(e => e.type === 'bottle');
        const lastBreast = entries.find(e => e.type === 'breast');
        let lastFeed = null;
        if(lastBottle && lastBreast) {
            lastFeed = getSafeDate(lastBottle.timestamp) > getSafeDate(lastBreast.timestamp) ? lastBottle : lastBreast;
        } else {
            lastFeed = lastBottle || lastBreast;
        }

        const feedTimeAgo = () => {
            if (!lastFeed) return 'Never';
            const date = getSafeDate(lastFeed.timestamp);
            const diffMins = differenceInMinutes(now, date);
            const diffHours = differenceInHours(now, date);
            if (diffMins < 60) return `${diffMins}m ago`;
            return `${diffHours}h ${diffMins % 60}m ago`;
        };

        // Calculate total bottle volume for selected date
        const totalBottleVolume = selectedDateEntries
            .filter(e => e.type === 'bottle')
            .reduce((sum, e) => sum + (e.details.breastMilk || 0) + (e.details.formula || 0), 0);

        return (
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${colorMap.bottle} w-full`}>
                <div className="flex items-center gap-1 mb-1">
                    <Milk size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Last Feed</span>
                </div>
                <span className="font-bold text-sm">{feedTimeAgo()}</span>
                {totalBottleVolume > 0 && (
                    <div className="text-xs text-blue-600 font-semibold mt-1">
                        {totalBottleVolume} ml today
                    </div>
                )}
            </div>
        );
    }

    if (type === 'pump') {
        const totalPumpVolume = selectedDateEntries
            .filter(e => e.type === 'pump')
            .reduce((sum, e) => sum + (e.details.totalVol || 0), 0);

        return (
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${colorMap[type]} w-full`}>
                <div className="flex items-center gap-1 mb-1">
                    {iconMap[type]}
                    <span className="text-xs font-bold uppercase tracking-wider">Last {type}</span>
                </div>
                <span className="font-bold text-sm">{timeAgo}</span>
                {totalPumpVolume > 0 && (
                    <div className="text-xs text-purple-600 font-semibold mt-1">
                        {totalPumpVolume} ml today
                    </div>
                )}
            </div>
        );
    }

    if (type === 'age' && infant && infant.dob) {
        const dob = getSafeDate(infant.dob);
        const ageInDays = differenceInDays(now, dob);
        const ageInMonths = Math.floor(ageInDays / 30);
        const ageInYears = Math.floor(ageInDays / 365);
        
        let ageDisplay = '';
        if (ageInDays < 30) {
            // Less than 1 month - show days
            ageDisplay = `${ageInDays} day${ageInDays !== 1 ? 's' : ''}`;
        } else if (ageInDays < 365) {
            // Less than 1 year - show months and days
            const remainingDays = ageInDays - (ageInMonths * 30);
            ageDisplay = `${ageInMonths}m ${remainingDays}d`;
        } else {
            // 1 year or more - show years
            const monthsRemainder = Math.floor((ageInDays - (ageInYears * 365)) / 30);
            if (monthsRemainder > 0) {
                ageDisplay = `${ageInYears}y ${monthsRemainder}m`;
            } else {
                ageDisplay = `${ageInYears} year${ageInYears !== 1 ? 's' : ''}`;
            }
        }

        return (
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-800 w-full`}>
                <div className="flex items-center gap-1 mb-1">
                    <Baby size={14} className="text-slate-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Baby Age</span>
                </div>
                <span className="font-bold text-sm">{ageDisplay}</span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${colorMap[type]} w-full`}>
            <div className="flex items-center gap-1 mb-1">
                {iconMap[type]}
                <span className="text-xs font-bold uppercase tracking-wider">Last {type}</span>
            </div>
            <span className="font-bold text-sm">{timeAgo}</span>
        </div>
    );
};


// --- TAB 1: TRACKING ---
const TrackingTab = ({ householdId, infant }) => {
    const [entries, setEntries] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); 
    const [editingEntry, setEditingEntry] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'entries'),
            where('householdId', '==', householdId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const filteredEntries = allEntries.filter(e => {
                return e.infantId === infant.id || e.type === 'pump' || e.infantId === 'mom';
            });

            filteredEntries.sort((a, b) => {
                const dateA = getSafeDate(a.timestamp);
                const dateB = getSafeDate(b.timestamp);
                return dateB - dateA; 
            });

            setEntries(filteredEntries.slice(0, 150));
        });
        return () => unsubscribe();
    }, [householdId, infant]);

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const quickAdd = async (type) => {
        try {
            const targetInfantId = type === 'pump' ? 'mom' : infant.id;
            
            // Use selected date for the entry
            const entryDate = new Date(selectedDate);
            entryDate.setHours(new Date().getHours());
            entryDate.setMinutes(new Date().getMinutes());
            entryDate.setSeconds(new Date().getSeconds());
            
            const entry = {
                householdId, 
                infantId: targetInfantId,
                type,
                timestamp: Timestamp.fromDate(entryDate),
                details: getDefaultDetails(type)
            };
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), entry);
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} logged successfully!`);
        } catch (error) {
            console.error("Quick add failed", error);
            alert("Failed to save entry. Please try again.");
        }
    };

    const getDefaultDetails = (type) => {
        switch(type) {
            case 'poop': return { color: 'Yellow', consistency: 'Normal' };
            case 'bottle': return { breastMilk: 0, formula: 0, unit: 'ml' };
            case 'breast': return { leftTime: 0, rightTime: 0 };
            case 'pump': return { leftVol: 0, rightVol: 0, totalVol: 0, duration: 15 };
            case 'weight': return { value: 0, unit: 'kg' };
            case 'height': return { value: 0, unit: 'cm' };
            default: return {};
        }
    };

    const openModal = (type, entry = null) => {
        setModalType(type);
        setEditingEntry(entry);
        setModalOpen(true);
    };

    const selectedDateEntries = useMemo(() => {
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return entries.filter(e => {
            const date = getSafeDate(e.timestamp);
            return date && format(date, 'yyyy-MM-dd') === selectedDateStr;
        });
    }, [entries, selectedDate]);

    const isToday = useMemo(() => {
        return isSameDay(selectedDate, new Date());
    }, [selectedDate]);

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <div className="space-y-6 relative">
            {toast.show && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
                    <CheckCircle2 size={20} className="text-green-400" />
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <KPIDashboard entries={entries} type="pee" selectedDate={selectedDate} />
                <KPIDashboard entries={entries} type="poop" selectedDate={selectedDate} />
                <KPIDashboard entries={entries} type="feed" selectedDate={selectedDate} />
                <KPIDashboard entries={entries} type="pump" selectedDate={selectedDate} />
                <KPIDashboard entries={entries} type="age" selectedDate={selectedDate} infant={infant} />
            </div>

            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                <ActionButton 
                    label="Pee" icon={<Droplets />} color="bg-yellow-500" 
                    onClick={() => quickAdd('pee')} 
                    onPlus={() => openModal('pee')} 
                />
                <ActionButton 
                    label="Poop" icon={<CircleDashed />} color="bg-orange-600" 
                    onClick={() => quickAdd('poop')} 
                    onPlus={() => openModal('poop')} 
                />
                <ActionButton 
                    label="Bottle" icon={<Milk />} color="bg-blue-600" 
                    onClick={() => quickAdd('bottle')} 
                    onPlus={() => openModal('bottle')} 
                />
                <ActionButton 
                    label="Breast" icon={<Baby />} color="bg-pink-500" 
                    onClick={() => quickAdd('breast')} 
                    onPlus={() => openModal('breast')} 
                />
                <ActionButton 
                    label="Pump" icon={<Activity />} color="bg-purple-600" 
                    onClick={() => openModal('pump')} 
                    onPlus={() => openModal('pump')} 
                />
                <ActionButton 
                    label="Weight" icon={<Scale />} color="bg-emerald-600" 
                    onClick={() => openModal('weight')} 
                    onPlus={() => openModal('weight')} 
                />
                <ActionButton 
                    label="Height" icon={<Ruler />} color="bg-teal-600" 
                    onClick={() => openModal('height')} 
                    onPlus={() => openModal('height')} 
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-700">{isToday ? "Today's Activity" : "Activity"}</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => changeDate(-1)}
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                            aria-label="Previous day"
                        >
                            <ChevronLeft size={16} className="text-slate-600" />
                        </button>
                        <div className="flex flex-col items-center">
                            <input 
                                type="date" 
                                value={format(selectedDate, 'yyyy-MM-dd')}
                                onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            />
                            {isToday && <span className="text-[10px] text-pink-600 font-semibold">Today</span>}
                        </div>
                        <button 
                            onClick={() => changeDate(1)}
                            disabled={isToday}
                            className={`p-1 rounded-full transition-colors ${
                                isToday ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-200 text-slate-600'
                            }`}
                            aria-label="Next day"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {selectedDateEntries.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No activity logged for this date</div>
                    ) : (
                        selectedDateEntries.map(entry => (
                            <LogItem 
                                key={entry.id} 
                                entry={entry} 
                                onClick={() => openModal(entry.type, entry)} 
                            />
                        ))
                    )}
                </div>
            </div>

            {modalOpen && (
                <EntryModal 
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    type={modalType}
                    existingEntry={editingEntry}
                    householdId={householdId}
                    infantId={infant.id}
                    appId={appId}
                    defaultDate={selectedDate}
                />
            )}
        </div>
    );
};

const MetricToggle = ({ label, active, onClick, color }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${active ? color : 'bg-slate-100 text-slate-400'}`}
    >
        {label}
    </button>
);

const ActionButton = ({ label, icon, color, onClick, onPlus }) => (
    <div className={`${color} rounded-xl shadow-md text-white relative group active:scale-95 transition-transform cursor-pointer`}>
        <button 
            className="w-full h-20 flex flex-col items-center justify-center gap-1 p-1 outline-none"
            onClick={onClick}
        >
            {React.cloneElement(icon, { size: 24 })}
            <span className="font-bold text-sm">{label}</span>
        </button>
        <button 
            aria-label={`Add ${label} with details`}
            className="absolute top-1 right-1 p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors z-10"
            onClick={(e) => {
                e.stopPropagation();
                onPlus();
            }}
        >
            <Plus size={12} />
        </button>
    </div>
);

const LogItem = ({ entry, onClick }) => {
    const date = getSafeDate(entry.timestamp);
    const time = isValid(date) ? format(date, 'HH:mm') : '';
    
    let detailsText = '';
    const d = entry.details || {};
    
    switch(entry.type) {
        case 'poop': 
            detailsText = d.color ? `Color: ${d.color}` : 'Recorded'; 
            break;
        case 'bottle': 
            if (!d.breastMilk && !d.formula) detailsText = <span className="text-blue-500 font-medium italic">Time Logged - Tap to add amount</span>;
            else detailsText = `Breast: ${d.breastMilk || 0}ml, Formula: ${d.formula || 0}ml`; 
            break;
        case 'breast': 
            if (!d.leftTime && !d.rightTime) detailsText = <span className="text-pink-500 font-medium italic">Time Logged - Tap to add duration</span>;
            else detailsText = `L: ${d.leftTime || 0}m, R: ${d.rightTime || 0}m`; 
            break;
        case 'pump': 
            detailsText = `Total: ${d.totalVol || 0}ml (${d.duration || 0}m)`; 
            break;
        case 'weight': 
            detailsText = `${d.value} ${d.unit}`; 
            break;
        case 'height': 
            detailsText = `${d.value} ${d.unit}`; 
            break;
        case 'pee': 
            detailsText = 'Wet Diaper'; 
            break;
        default: 
            detailsText = '';
    }

    const iconMap = {
        pee: <Droplets size={16} className="text-yellow-500" />,
        poop: <CircleDashed size={16} className="text-orange-600" />,
        bottle: <Milk size={16} className="text-blue-600" />,
        breast: <Baby size={16} className="text-pink-500" />,
        pump: <Activity size={16} className="text-purple-600" />,
        weight: <Scale size={16} className="text-emerald-600" />,
        height: <Ruler size={16} className="text-teal-600" />
    };

    return (
        <button onClick={onClick} className="w-full px-4 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left">
            <div className="text-sm font-medium text-slate-400 w-12">{time}</div>
            <div className="p-2 bg-slate-100 rounded-full">
                {iconMap[entry.type]}
            </div>
            <div className="flex-1">
                <div className="font-medium text-slate-700 capitalize">{entry.type}</div>
                <div className="text-xs text-slate-500">{detailsText}</div>
            </div>
        </button>
    );
};


// --- ENTRY MODAL (Unchanged) ---
const EntryModal = ({ isOpen, onClose, type, existingEntry, householdId, infantId, appId, defaultDate }) => {
    const initialDate = existingEntry ? getSafeDate(existingEntry.timestamp) : (defaultDate || new Date());
    const [date, setDate] = useState(format(initialDate, 'yyyy-MM-dd'));
    const [time, setTime] = useState(format(initialDate, 'HH:mm'));
    
    const [details, setDetails] = useState(existingEntry?.details || {
        ...(type === 'poop' && { color: 'Yellow' }),
        ...(type === 'bottle' && { breastMilk: 0, formula: 0 }),
        ...(type === 'breast' && { leftTime: 0, rightTime: 0 }),
        ...(type === 'pump' && { leftVol: 0, rightVol: 0, totalVol: 0, duration: 15 }),
        ...(type === 'weight' && { value: 0, unit: 'kg' }),
        ...(type === 'height' && { value: 0, unit: 'cm' }),
    });

    const handleSave = async () => {
        const timestamp = Timestamp.fromDate(parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date()));
        
        let targetInfantId = infantId;
        if (type === 'pump') {
             targetInfantId = 'mom'; 
        }

        const entryData = {
            householdId,
            infantId: targetInfantId,
            type,
            timestamp,
            details
        };

        try {
            if (existingEntry) {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'entries', existingEntry.id), entryData);
            } else {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), entryData);
            }
            onClose();
        } catch (e) {
            console.error("Error saving", e);
        }
    };

    const handleDelete = async () => {
        if (!existingEntry) return;
        if (confirm('Delete this entry?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'entries', existingEntry.id));
            onClose();
        }
    };

    useEffect(() => {
        if (type === 'pump') {
            const total = (parseFloat(details.leftVol) || 0) + (parseFloat(details.rightVol) || 0);
            setDetails(prev => ({ ...prev, totalVol: total }));
        }
    }, [details.leftVol, details.rightVol, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg capitalize flex items-center gap-2">
                        {type === 'pee' && <Droplets size={18} className="text-yellow-500"/>}
                        {type === 'poop' && <CircleDashed size={18} className="text-orange-600"/>}
                        {type === 'bottle' && <Milk size={18} className="text-blue-600"/>}
                        {type === 'breast' && <Baby size={18} className="text-pink-500"/>}
                        {type} Entry
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Time</label>
                            <input 
                                type="time" 
                                value={time} 
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                    </div>

                    {type === 'poop' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {['Yellow', 'Brown', 'Green', 'Black', 'Red'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setDetails({...details, color: c})}
                                        className={`px-3 py-1.5 rounded-full text-sm border ${details.color === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {type === 'bottle' && (
                        <div className="grid grid-cols-2 gap-4">
                            <CounterInput 
                                label="Breast Milk (ml)" 
                                value={details.breastMilk} 
                                onChange={(v) => setDetails({...details, breastMilk: v})} 
                            />
                            <CounterInput 
                                label="Formula (ml)" 
                                value={details.formula} 
                                onChange={(v) => setDetails({...details, formula: v})} 
                            />
                        </div>
                    )}

                    {type === 'breast' && (
                        <div className="grid grid-cols-2 gap-4">
                            <CounterInput 
                                label="Left Breast (min)" 
                                value={details.leftTime} 
                                onChange={(v) => setDetails({...details, leftTime: v})} 
                            />
                            <CounterInput 
                                label="Right Breast (min)" 
                                value={details.rightTime} 
                                onChange={(v) => setDetails({...details, rightTime: v})} 
                            />
                        </div>
                    )}

                    {type === 'pump' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <CounterInput label="Left (ml)" value={details.leftVol} onChange={v => setDetails({...details, leftVol: v})} />
                                <CounterInput label="Right (ml)" value={details.rightVol} onChange={v => setDetails({...details, rightVol: v})} />
                            </div>
                            <CounterInput label="Duration (min)" value={details.duration} onChange={v => setDetails({...details, duration: v})} />
                        </div>
                    )}

                    {(type === 'weight' || type === 'height') && (
                        <div className="flex gap-2">
                             <input 
                                type="number" 
                                value={details.value}
                                onChange={(e) => setDetails({...details, value: parseFloat(e.target.value)})}
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                                placeholder="0.0"
                             />
                             <select 
                                value={details.unit}
                                onChange={(e) => setDetails({...details, unit: e.target.value})}
                                className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
                             >
                                 {type === 'weight' ? ['kg', 'lb'].map(u => <option key={u} value={u}>{u}</option>) : ['cm', 'in'].map(u => <option key={u} value={u}>{u}</option>)}
                             </select>
                        </div>
                    )}

                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    {existingEntry && (
                        <button 
                            onClick={handleDelete}
                            className="px-4 py-2 text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    )}
                    <button 
                        onClick={handleSave}
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 rounded-lg transition-colors shadow-lg shadow-pink-500/20"
                    >
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    );
};

const CounterInput = ({ label, value, onChange }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
        <div className="flex items-center gap-1">
            <button onClick={() => onChange(Math.max(0, value - 5))} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">-</button>
            <input 
                type="number" 
                value={value} 
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-full text-center border-y border-slate-200 py-1.5 focus:outline-none" 
            />
            <button onClick={() => onChange(value + 5)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">+</button>
        </div>
    </div>
);


// --- TAB 2: HISTORY (Unchanged) ---
const HistoryTab = ({ householdId, infant }) => {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [gridData, setGridData] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [saving, setSaving] = useState(false);

    const intervals = useMemo(() => {
        const times = [];
        let start = startOfDay(new Date());
        for(let i=0; i<48; i++) {
            times.push(format(start, 'HH:mm'));
            start = addMinutes(start, 30);
        }
        return times;
    }, []);

    useEffect(() => {
        const start = startOfDay(parse(selectedDate, 'yyyy-MM-dd', new Date()));
        const end = endOfDay(start);

        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'entries'),
            where('householdId', '==', householdId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = {};
            snapshot.docs.forEach(doc => {
                const d = doc.data();
                if(d.infantId !== infant.id && d.infantId !== 'mom') return; 

                const date = getSafeDate(d.timestamp); 
                if(!date) return;
                
                // Manual Client-Side Filter
                if (date < start || date > end) return;

                const time = format(date, 'HH:mm');
                const [h, m] = time.split(':').map(Number);
                const roundedM = m < 15 ? '00' : (m < 45 ? '30' : '00'); 
                const roundedH = m >= 45 ? (h + 1).toString().padStart(2, '0') : h.toString().padStart(2, '0');
                const slotKey = `${roundedH}:${roundedM}`;

                if(!data[slotKey]) data[slotKey] = { ids: [], pee: false, poop: false, formula: 0, breast: 0 };
                
                data[slotKey].ids.push(doc.id);
                if(d.type === 'pee') data[slotKey].pee = true;
                if(d.type === 'poop') data[slotKey].poop = true;
                if(d.type === 'bottle') data[slotKey].formula += (d.details.formula || 0) + (d.details.breastMilk || 0);
                if(d.type === 'breast') data[slotKey].breast += (d.details.leftTime || 0) + (d.details.rightTime || 0);
            });
            setGridData(data);
        });
        return () => unsubscribe();
    }, [selectedDate, infant, householdId]);

    const handleGridChange = (time, field, value) => {
        setUnsavedChanges(prev => ({
            ...prev,
            [time]: {
                ...prev[time],
                [field]: value
            }
        }));
    };

    const getValue = (time, field) => {
        if (unsavedChanges[time] && unsavedChanges[time][field] !== undefined) {
            return unsavedChanges[time][field];
        }
        return gridData[time]?.[field];
    };

    const handleSave = async () => {
        setSaving(true);
        const promises = [];
        
        for (const [time, changes] of Object.entries(unsavedChanges)) {
            const timestamp = Timestamp.fromDate(parse(`${selectedDate} ${time}`, 'yyyy-MM-dd HH:mm', new Date()));
            
            if (changes.pee === true) {
                promises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), { 
                    householdId, type: 'pee', timestamp, infantId: infant.id, details: {} 
                }));
            }
            if (changes.poop === true) {
                promises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), { 
                    householdId, type: 'poop', timestamp, infantId: infant.id, details: { color: 'Yellow' } 
                }));
            }
            
            if (changes.formula > 0) {
                 promises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), { 
                     householdId, type: 'bottle', 
                     timestamp, 
                     infantId: infant.id, 
                     details: { formula: parseFloat(changes.formula), breastMilk: 0 } 
                 }));
            }
            
            if (changes.breast > 0) {
                 promises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), { 
                     householdId, type: 'breast', 
                     timestamp, 
                     infantId: infant.id, 
                     details: { leftTime: parseFloat(changes.breast), rightTime: 0 } 
                 }));
            }
        }
        
        try {
            await Promise.all(promises);
            setUnsavedChanges({}); 
        } catch (e) {
            console.error("Error saving batch", e);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = Object.keys(unsavedChanges).length > 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedDate(format(subDays(parse(selectedDate, 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM-dd'))}>
                        <ChevronLeft size={20} className="text-slate-500"/>
                    </button>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent font-bold text-slate-700 outline-none"
                    />
                    <button onClick={() => setSelectedDate(format(addMinutes(parse(selectedDate, 'yyyy-MM-dd', new Date()), 1440), 'yyyy-MM-dd'))}>
                        <ChevronRight size={20} className="text-slate-500"/>
                    </button>
                </div>
                
                {hasChanges && (
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors shadow-md shadow-pink-500/20 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 font-medium uppercase">
                        <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3 text-center">Pee</th>
                            <th className="px-4 py-3 text-center">Poop</th>
                            <th className="px-4 py-3 text-center">Bottle (ml)</th>
                            <th className="px-4 py-3 text-center">Breast (min)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {intervals.map(time => (
                            <tr key={time} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-500">{time}</td>
                                <td className="px-4 py-2 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={getValue(time, 'pee') || false}
                                        onChange={(e) => handleGridChange(time, 'pee', e.target.checked)}
                                        className="rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                                    />
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={getValue(time, 'poop') || false}
                                        onChange={(e) => handleGridChange(time, 'poop', e.target.checked)}
                                        className="rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input 
                                        type="number" 
                                        value={getValue(time, 'formula') || ''}
                                        placeholder={!unsavedChanges[time]?.formula && gridData[time]?.formula > 0 ? gridData[time].formula : "-"}
                                        className={`w-16 mx-auto block text-center bg-transparent border-b border-dashed outline-none ${unsavedChanges[time]?.formula ? 'border-pink-500 font-bold text-pink-600' : 'border-slate-300'}`}
                                        onChange={(e) => handleGridChange(time, 'formula', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input 
                                        type="number" 
                                        value={getValue(time, 'breast') || ''}
                                        placeholder={!unsavedChanges[time]?.breast && gridData[time]?.breast > 0 ? gridData[time].breast : "-"}
                                        className={`w-16 mx-auto block text-center bg-transparent border-b border-dashed outline-none ${unsavedChanges[time]?.breast ? 'border-pink-500 font-bold text-pink-600' : 'border-slate-300'}`}
                                        onChange={(e) => handleGridChange(time, 'breast', e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- TAB: PUMPING (Unchanged) ---
const PumpingTab = ({ householdId }) => {
    // ... [Unchanged Logic]
    const [period, setPeriod] = useState(7);
    const [data, setData] = useState([]);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({
        today: { total: 0, left: 0, right: 0 },
        period: { total: 0, left: 0, right: 0 },
    });

    useEffect(() => {
        const endDate = endOfDay(new Date());
        let startDate;
        
        if (period === 'all') {
            startDate = new Date(0); 
        } else {
            startDate = startOfDay(subDays(new Date(), period));
        }

        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'entries'),
            where('householdId', '==', householdId),
            where('type', '==', 'pump')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rawLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Client-side Filter
            const filteredLogs = rawLogs.filter(log => {
                const date = getSafeDate(log.timestamp);
                return date >= startDate && date <= endDate;
            });
            filteredLogs.sort((a,b) => getSafeDate(b.timestamp) - getSafeDate(a.timestamp)); // Descending

            setLogs(filteredLogs);

            // ... Stats logic (same)
            const newStats = {
                today: { total: 0, left: 0, right: 0 },
                period: { total: 0, left: 0, right: 0 }
            };
            
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const daily = {}; 

            if (period !== 'all') {
                for(let i=0; i<=period; i++) {
                    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
                    daily[d] = { date: d, volume: 0 };
                }
            }

            filteredLogs.forEach(log => {
                const d = log.details || {};
                const date = getSafeDate(log.timestamp);
                const dateKey = format(date, 'yyyy-MM-dd');
                
                const total = (d.totalVol || 0);
                const left = (d.leftVol || 0);
                const right = (d.rightVol || 0);

                newStats.period.total += total;
                newStats.period.left += left;
                newStats.period.right += right;

                if (dateKey === todayStr) {
                    newStats.today.total += total;
                    newStats.today.left += left;
                    newStats.today.right += right;
                }

                if(!daily[dateKey]) daily[dateKey] = { date: dateKey, volume: 0 };
                daily[dateKey].volume += total;
            });
            
            setStats(newStats);
            setData(Object.values(daily).sort((a,b) => a.date.localeCompare(b.date)));
        });

        return () => unsubscribe();
    }, [period, householdId]);

    const SummaryCard = ({ title, data, color }) => (
        <div className={`p-4 rounded-xl border ${color} flex flex-col justify-between`}>
            <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">{title}</div>
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-2xl font-bold">{data.total}</span>
                    <span className="text-xs font-medium ml-1">ml</span>
                </div>
                <div className="text-right text-xs space-y-0.5 opacity-80 font-medium">
                    <div>L: {data.left}</div>
                    <div>R: {data.right}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h2 className="font-bold text-lg text-purple-700 flex items-center gap-2">
                    <Milk size={20} /> Pumping Tracker
                </h2>
                <select 
                    className="px-4 py-2 bg-slate-100 rounded-lg font-medium text-sm"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                >
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SummaryCard 
                    title="Today's Summary" 
                    data={stats.today} 
                    color="bg-purple-50 border-purple-100 text-purple-900" 
                />
                <SummaryCard 
                    title={`Total (${period === 'all' ? 'All Time' : 'Last ' + period + ' Days'})`} 
                    data={stats.period} 
                    color="bg-blue-50 border-blue-100 text-blue-900" 
                />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tickFormatter={t => format(parse(t, 'yyyy-MM-dd', new Date()), 'MMM d')} tick={{fontSize: 12}} />
                        <YAxis />
                        <Tooltip labelFormatter={t => format(parse(t, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')} />
                        <Bar dataKey="volume" fill="#9333ea" radius={[4, 4, 0, 0]} name="Volume (ml)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">Recent Sessions</div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {logs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                            <div>
                                <div className="font-bold text-slate-700">{format(getSafeDate(log.timestamp), 'MMM d, yyyy')}</div>
                                <div className="text-sm text-slate-400">{format(getSafeDate(log.timestamp), 'HH:mm')}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-purple-600 text-lg">{log.details.totalVol || 0} ml</div>
                                <div className="text-xs text-slate-400 flex gap-2 justify-end">
                                    <span>L: {log.details.leftVol || 0}</span>
                                    <span>R: {log.details.rightVol || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- TAB 3: SUMMARY (Refined) ---
const SummaryTab = ({ householdId, infants, currentInfantId }) => {
    // Corrected householdId usage here
    const [period, setPeriod] = useState(7); 
    const [isCompare, setIsCompare] = useState(false);
    const [summaryData, setSummaryData] = useState([]);
    const [metrics, setMetrics] = useState({ pee: true, poop: true, bottle: true, breast: true, weight: false });

    useEffect(() => {
        const endDate = endOfDay(new Date());
        let startDate;
        
        if (period === 'all') {
            startDate = new Date(0); 
        } else {
            startDate = startOfDay(subDays(new Date(), period));
        }
        
        // Use householdId passed from parent, NOT user.uid directly if sharing
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'entries'),
            where('householdId', '==', householdId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Client-side Filter
            const filteredEntries = allEntries.filter(e => {
                const date = getSafeDate(e.timestamp);
                return date >= startDate && date <= endDate;
            });

            // Sorting client-side
            filteredEntries.sort((a,b) => getSafeDate(a.timestamp) - getSafeDate(b.timestamp)); // Ascending

            const dailyStats = {};
            
            if (period !== 'all') {
                for(let i=0; i<=period; i++) {
                    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
                    dailyStats[d] = { date: d }; 
                }
            }

            filteredEntries.forEach(d => {
                if (!isCompare) {
                    if (d.infantId !== currentInfantId) return;
                }

                const date = getSafeDate(d.timestamp);
                if(!date) return;
                const dayKey = format(date, 'yyyy-MM-dd');
                
                if (!dailyStats[dayKey]) dailyStats[dayKey] = { date: dayKey };
                
                const prefix = isCompare ? `${d.infantId}_` : '';
                
                const inc = (key, val) => {
                     dailyStats[dayKey][key] = (dailyStats[dayKey][key] || 0) + val;
                };

                if(d.type === 'pee') inc(`${prefix}pee`, 1);
                if(d.type === 'poop') inc(`${prefix}poop`, 1);
                if(d.type === 'bottle') inc(`${prefix}bottle`, (d.details.formula || 0) + (d.details.breastMilk || 0));
                if(d.type === 'breast') inc(`${prefix}breast`, (d.details.leftTime || 0) + (d.details.rightTime || 0));
                if(d.type === 'weight') dailyStats[dayKey][`${prefix}weight`] = d.details.value; 
            });

            const sorted = Object.values(dailyStats).sort((a,b) => a.date.localeCompare(b.date));
            
            // Augment with age - Added null check for infants
            const augmented = sorted.map(row => {
                const rowDate = parse(row.date, 'yyyy-MM-dd', new Date());
                if (infants && infants.length > 0) {
                    infants.forEach(infant => {
                        if (infant.dob) {
                            const dob = getSafeDate(infant.dob);
                            const age = differenceInDays(rowDate, dob);
                            if (age >= 0) {
                                row[`${infant.id}_age`] = age;
                            }
                        }
                    });
                }
                return row;
            });

            setSummaryData(augmented);
        });

        return () => unsubscribe();
    }, [period, currentInfantId, isCompare, householdId, infants]);

    const totals = useMemo(() => {
        const acc = {};
        summaryData.forEach(day => {
            Object.keys(day).forEach(key => {
                if(key === 'date' || key.includes('weight') || key.includes('age')) return; 
                acc[key] = (acc[key] || 0) + (day[key] || 0);
            });
        });
        return acc;
    }, [summaryData]);

    const renderChartElements = () => {
        const renderList = [];
        const activeInfants = isCompare ? infants : (infants.find(i => i.id === currentInfantId) ? [infants.find(i => i.id === currentInfantId)] : []);
        
        activeInfants.forEach((infant, index) => {
            const prefix = isCompare ? `${infant.id}_` : '';
            const suffix = isCompare ? ` (${infant.name})` : '';

            // Render bars for metrics
            if(metrics.pee) renderList.push(<Bar key={`${infant.id}-pee`} dataKey={`${prefix}pee`} fill="#eab308" name={`Pee${suffix}`} />);
            if(metrics.poop) renderList.push(<Bar key={`${infant.id}-poop`} dataKey={`${prefix}poop`} fill="#ea580c" name={`Poop${suffix}`} />);
            if(metrics.bottle) renderList.push(<Bar key={`${infant.id}-bottle`} dataKey={`${prefix}bottle`} fill="#2563eb" name={`Bottle (ml)${suffix}`} />);
            if(metrics.breast) renderList.push(<Bar key={`${infant.id}-breast`} dataKey={`${prefix}breast`} fill="#ec4899" name={`Breast (min)${suffix}`} />);
            if(metrics.weight) renderList.push(<Bar key={`${infant.id}-weight`} dataKey={`${prefix}weight`} fill="#059669" name={`Weight (kg)${suffix}`} />);
            
            // Render age as a line
            renderList.push(<Line yAxisId="right" key={`${infant.id}-age`} type="monotone" dataKey={`${infant.id}_age`} stroke="#94a3b8" strokeDasharray="4 1" strokeWidth={2} dot={false} name={`Age (days)${suffix}`} />);
        });
        
        return renderList;
    };

    const activeMetrics = Object.keys(metrics).filter(m => metrics[m]);
    const activeInfants = isCompare ? infants : (infants.find(i => i.id === currentInfantId) ? [infants.find(i => i.id === currentInfantId)] : []);

    // Empty State Check
    if (!summaryData || summaryData.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
                No data available for the selected period.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2">
                        <select 
                            className="px-4 py-2 bg-slate-100 rounded-lg font-medium"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        >
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 3 Months</option>
                            <option value="all">All Time</option>
                        </select>
                        
                        {infants.length > 1 && (
                            <button 
                                onClick={() => setIsCompare(!isCompare)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${isCompare ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}
                            >
                                <Users size={18} /> {isCompare ? 'Comparing' : 'Compare'}
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 flex-wrap justify-center">
                        <MetricToggle label="Pee" active={metrics.pee} onClick={() => setMetrics({...metrics, pee: !metrics.pee})} color="bg-yellow-100 text-yellow-700" />
                        <MetricToggle label="Poop" active={metrics.poop} onClick={() => setMetrics({...metrics, poop: !metrics.poop})} color="bg-orange-100 text-orange-700" />
                        <MetricToggle label="Bottle" active={metrics.bottle} onClick={() => setMetrics({...metrics, bottle: !metrics.bottle})} color="bg-blue-100 text-blue-700" />
                        <MetricToggle label="Breast" active={metrics.breast} onClick={() => setMetrics({...metrics, breast: !metrics.breast})} color="bg-pink-100 text-pink-700" />
                        <MetricToggle label="Weight" active={metrics.weight} onClick={() => setMetrics({...metrics, weight: !metrics.weight})} color="bg-emerald-100 text-emerald-700" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={summaryData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tickFormatter={t => format(parse(t, 'yyyy-MM-dd', new Date()), 'MMM d')} tick={{fontSize: 12}} />
                        <YAxis />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Age (Days)', angle: 90, position: 'insideRight' }} />
                        <Tooltip labelFormatter={t => format(parse(t, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')} />
                        <Legend />
                        {renderChartElements()}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3 border-b sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Date</th>
                                {activeMetrics.map(metric => (
                                    activeInfants.map((infant, index) => (
                                         <th key={`${metric}-${infant.id}`} className={`px-4 py-3 text-center border-b whitespace-nowrap min-w-[100px] border-r border-slate-100 ${index === activeInfants.length - 1 ? 'border-r-2 border-slate-200' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] opacity-60 font-normal tracking-wide">{metric}</span>
                                                <span className="text-slate-700 font-bold">{infant.name}</span>
                                            </div>
                                         </th>
                                    ))
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {summaryData.slice().reverse().map(row => (
                                <tr key={row.date} className="hover:bg-slate-50">
                                     <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100 bg-slate-50/50 sticky left-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] whitespace-nowrap">
                                         {row.date}
                                     </td>
                                     {activeMetrics.map(metric => (
                                         activeInfants.map((infant, index) => {
                                             const prefix = isCompare ? `${infant.id}_` : '';
                                             let val = row[`${prefix}${metric}`];
                                             let display = val || '-';
                                             if (val) {
                                                 if (metric === 'bottle') display = `${val} ml`;
                                                 if (metric === 'breast') display = `${val} min`;
                                                 if (metric === 'weight') display = `${val} kg`;
                                             }
                                             return (
                                                 <td key={`${metric}-${infant.id}-${row.date}`} className={`px-4 py-3 text-center border-r border-slate-100 ${index === activeInfants.length - 1 ? 'border-r-2 border-slate-200' : ''}`}>
                                                     {display}
                                                 </td>
                                             );
                                         })
                                     ))}
                                </tr>
                            ))}
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-200">
                                <td className="px-4 py-3 text-slate-800 border-r border-slate-200 bg-slate-100 sticky left-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                                    Total
                                </td>
                                {activeMetrics.map(metric => (
                                    activeInfants.map((infant, index) => {
                                        const prefix = isCompare ? `${infant.id}_` : '';
                                        
                                        if (metric === 'weight') {
                                             return <td key={`total-${metric}-${infant.id}`} className={`px-4 py-3 text-center text-slate-400 border-r border-slate-200 ${index === activeInfants.length - 1 ? 'border-r-2' : ''}`}> - </td>;
                                        }

                                        let val = totals[`${prefix}${metric}`];
                                        let display = val || 0;
                                        if (metric === 'bottle') display = `${display} ml`;
                                        if (metric === 'breast') display = `${display} min`;

                                        return (
                                            <td key={`total-${metric}-${infant.id}`} className={`px-4 py-3 text-center text-slate-800 border-r border-slate-200 ${index === activeInfants.length - 1 ? 'border-r-2' : ''}`}>
                                                {display}
                                            </td>
                                        );
                                    })
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- TAB 4: SETTINGS (Added Join Household UI) ---
const SettingsTab = ({ user, householdId, infants, onLogout, appId }) => {
    // ... [Previous logic]
    const [newInfantName, setNewInfantName] = useState('');
    const [dob, setDob] = useState('');
    const [exportingText, setExportingText] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDob, setEditDob] = useState('');
    
    // Join Household State
    const [partnerCode, setPartnerCode] = useState('');
    const [joinStatus, setJoinStatus] = useState('');

    const [resetOldPass, setResetOldPass] = useState('');
    const [resetNewPass, setResetNewPass] = useState('');
    const [resetStatus, setResetStatus] = useState('');

    // ... [Add/Edit/Delete Infant Functions - Unchanged] ...
    const addInfant = async () => {
        if(!newInfantName.trim()) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'infants'), {
            householdId, // Uses active householdId
            name: newInfantName,
            dob: dob ? Timestamp.fromDate(new Date(dob)) : serverTimestamp()
        });
        setNewInfantName('');
        setDob('');
    };
    
    const startEdit = (infant) => {
        setEditingId(infant.id);
        setEditName(infant.name);
        setEditDob(infant.dob ? format(getSafeDate(infant.dob), 'yyyy-MM-dd') : '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditDob('');
    };

    const saveEdit = async (id) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'infants', id), {
                name: editName,
                dob: editDob ? Timestamp.fromDate(new Date(editDob)) : null
            });
            setEditingId(null);
        } catch (e) {
            console.error("Update failed", e);
            alert("Failed to update.");
        }
    };

    const deleteInfant = async (id) => {
        if (confirm("Are you sure? This will delete the infant profile but keep data logs.")) {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'infants', id));
            } catch (e) {
                console.error("Delete failed", e);
            }
        }
    };

    const joinHousehold = async () => {
        if (!partnerCode) return;
        try {
            // Check if partner code (UID) has data
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'infants'), where('householdId', '==', partnerCode));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                if(!confirm("No infants found for this code. Join anyway?")) return;
            }

            // Update user settings to point to new household
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_settings', user.uid), {
                activeHouseholdId: partnerCode
            }, { merge: true });
            
            setJoinStatus('Joined successfully!');
            setPartnerCode('');
        } catch (e) {
            console.error("Join failed", e);
            setJoinStatus('Failed to join.');
        }
    };

    const handlePasswordReset = async () => {
        if (!resetOldPass || !resetNewPass) {
            setResetStatus('Please fill in both fields.');
            return;
        }
        if (!isStrongPassword(resetNewPass)) {
            setResetStatus('New password is not strong enough.');
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, resetOldPass);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, resetNewPass);
            setResetStatus('Password updated successfully!');
            setResetOldPass('');
            setResetNewPass('');
        } catch (e) {
            console.error("Reset failed", e);
            if (e.code === 'auth/wrong-password') {
                setResetStatus('Incorrect old password.');
            } else {
                setResetStatus('Failed to reset password. Please try again.');
            }
        }
    };
    
    // ... [Export Functions - Unchanged] ...
    const handleCsvExport = async () => {
        try {
            const q = query(
                collection(db, 'artifacts', appId, 'public', 'data', 'entries'),
                where('householdId', '==', householdId)
            );
            const querySnapshot = await getDocs(q);
            const entries = querySnapshot.docs.map(doc => {
                const d = doc.data();
                const date = getSafeDate(d.timestamp);
                return {
                    sortTime: date.getTime(),
                    date: date ? format(date, 'yyyy-MM-dd') : '',
                    time: date ? format(date, 'HH:mm') : '',
                    type: d.type,
                    infantId: d.infantId,
                    details: JSON.stringify(d.details || {})
                };
            });
            entries.sort((a,b) => b.sortTime - a.sortTime);
            // ... (CSV Generation Code) ...
            const headers = ['Date', 'Time', 'Type', 'Infant ID', 'Details'];
            const csvContent = [headers.join(','), ...entries.map(e => `${e.date},${e.time},${e.type},${e.infantId},"${e.details.replace(/"/g, '""')}"`)].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `infant_tracker_export_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) { console.error("Export failed", error); }
    };

    const handleTextExport = async () => {
        setExportingText(true);
        try {
            const q = query(
                collection(db, 'artifacts', appId, 'public', 'data', 'entries'),
                where('householdId', '==', householdId)
            );
            const querySnapshot = await getDocs(q);
            const entries = querySnapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    sortTime: d.timestamp ? d.timestamp.toMillis() : 0,
                    date: d.timestamp ? format(d.timestamp.toDate(), 'yyyy-MM-dd') : 'Unknown',
                    time: d.timestamp ? format(d.timestamp.toDate(), 'HH:mm') : 'Unknown',
                    type: d.type,
                    infantId: d.infantId,
                    details: d.details
                };
            });
            entries.sort((a,b) => b.sortTime - a.sortTime);
            // ... (Text Generation Code) ...
             const grouped = {};
            entries.forEach(e => {
                if(!grouped[e.date]) grouped[e.date] = [];
                grouped[e.date].push(e);
            });

            let textOutput = `Infant Tracker Export - Generated ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;

            Object.keys(grouped).sort().reverse().forEach(date => {
                textOutput += `========================================\n`;
                textOutput += `DATE: ${date}\n`;
                textOutput += `========================================\n`;
                
                // Calculate Daily Totals
                let pee = 0, poop = 0, bottle = 0, breast = 0, pump = 0;
                
                grouped[date].forEach(e => {
                    // Find infant name
                    const infantName = e.infantId === 'mom' ? 'Mom' : (infants.find(i => i.id === e.infantId)?.name || 'Unknown');
                    let detailStr = '';
                    
                    if (e.type === 'pee') pee++;
                    if (e.type === 'poop') poop++;
                    if (e.type === 'bottle') {
                        const vol = (e.details.formula || 0) + (e.details.breastMilk || 0);
                        bottle += vol;
                        detailStr = `Vol: ${vol}ml`;
                    }
                    if (e.type === 'breast') {
                        const dur = (e.details.leftTime || 0) + (e.details.rightTime || 0);
                        breast += dur;
                        detailStr = `Dur: ${dur}min`;
                    }
                    if (e.type === 'pump') {
                        pump += (e.details.totalVol || 0);
                        detailStr = `Vol: ${e.details.totalVol}ml`;
                    }
                    if (e.type === 'weight') detailStr = `${e.details.value}kg`;

                    textOutput += `[${e.time}] ${infantName.padEnd(10)} | ${e.type.toUpperCase().padEnd(8)} | ${detailStr}\n`;
                });

                textOutput += `----------------------------------------\n`;
                textOutput += `DAILY TOTALS: Pee: ${pee}, Poop: ${poop}, Bottle: ${bottle}ml, Breast: ${breast}min, Pump: ${pump}ml\n\n`;
            });

            const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `infant_tracker_log_${format(new Date(), 'yyyyMMdd')}.txt`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) { console.error("Export failed", error); } finally { setExportingText(false); }
    };
    
    // Copy Code Helper
    const copyShareCode = () => {
        const textField = document.createElement('textarea');
        textField.innerText = user.uid; // Share raw UID as code
        document.body.appendChild(textField);
        textField.select();
        document.execCommand('copy');
        textField.remove();
        alert('Share Code copied! Send this to your partner.');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Home size={20}/> Share Household</h3>
                <p className="text-sm text-slate-500 mb-2">Share this code to let others join your tracker:</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg mb-6">
                    <span className="font-mono font-medium text-slate-700 flex-1 truncate">{user.uid}</span>
                    <button onClick={copyShareCode} className="p-2 text-slate-500 hover:text-blue-600 transition-colors" title="Copy Code">
                        <Copy size={18} />
                    </button>
                </div>
                
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 pt-4 border-t border-slate-100"><LinkIcon size={20}/> Join Household</h3>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value)}
                        placeholder="Enter Partner's Code"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    <button 
                        onClick={joinHousehold}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
                    >
                        Join
                    </button>
                </div>
                {joinStatus && <p className="text-xs text-center mt-2 font-medium text-green-600">{joinStatus}</p>}

                {/* Password Reset Section */}
                <div className="border-t border-slate-100 pt-6 mt-6">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-slate-600"><Lock size={16}/> Reset Password</h4>
                    <div className="space-y-2">
                        <input 
                            type="password"
                            value={resetOldPass}
                            onChange={(e) => setResetOldPass(e.target.value)}
                            placeholder="Current Password"
                            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        />
                        <input 
                            type="password"
                            value={resetNewPass}
                            onChange={(e) => setResetNewPass(e.target.value)}
                            placeholder="New Password (Strong)"
                            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        />
                        <button 
                            onClick={handlePasswordReset}
                            className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-700 w-full"
                        >
                            Update Password
                        </button>
                        {resetStatus && <p className="text-xs text-center mt-2 font-medium text-blue-600">{resetStatus}</p>}
                    </div>
                </div>
            </div>

            {/* Manage Infants Section (Unchanged) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserPlus size={20}/> Manage Infants</h3>
                <div className="flex flex-col gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newInfantName}
                        onChange={(e) => setNewInfantName(e.target.value)}
                        placeholder="Baby Name"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                        <button 
                            onClick={addInfant}
                            className="bg-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-600"
                        >
                            Add Baby
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    {infants.map(infant => (
                        <div key={infant.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group hover:bg-slate-100 transition-colors">
                            {editingId === infant.id ? (
                                <div className="flex-1 flex flex-col gap-2">
                                    <input 
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="border p-1 rounded"
                                    />
                                    <input 
                                        type="date"
                                        value={editDob}
                                        onChange={e => setEditDob(e.target.value)}
                                        className="border p-1 rounded"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => saveEdit(infant.id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Save</button>
                                        <button onClick={cancelEdit} className="text-xs bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <span className="font-medium block">{infant.name}</span>
                                        {infant.dob && <span className="text-xs text-slate-400">DOB: {format(getSafeDate(infant.dob), 'MMM d, yyyy')}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => startEdit(infant)} className="p-2 text-slate-400 hover:text-blue-500">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deleteInfant(infant.id)} className="p-2 text-slate-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Save size={20}/> Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={handleCsvExport}
                        className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                        <Download size={18}/> Export CSV
                    </button>
                    <button 
                        onClick={handleTextExport}
                        disabled={exportingText}
                        className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        <FileText size={18}/> {exportingText ? 'Exporting...' : 'Export Text Log'}
                    </button>
                </div>
            </div>

            <button 
                onClick={() => {
                    signOut(auth);
                    onLogout();
                }}
                className="w-full p-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
                <LogOut size={20}/> Sign Out of Household
            </button>
        </div>
    );
};

