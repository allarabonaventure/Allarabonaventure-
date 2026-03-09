
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import AgroExpert from './components/AgroExpert';
import { CATEGORIES, COURSES, PLANS } from './constants';
import { 
  Phone, ChevronRight, CheckCircle2, CreditCard, Smartphone, Play, Loader2, Video, 
  Sparkles, Filter, X, Clock, BarChart, ListOrdered, CloudSun, MapPin, Wind, 
  Droplets, Thermometer, LayoutGrid, Info, Sun, Cloud, CloudRain, CloudLightning, CloudFog, 
  UserPlus, Share2, Building2, Landmark, Copy, Check, ArrowLeft, Upload, Send, Heart, Target, Gem,
  ShieldCheck, Quote, Camera, History, Eye, Search, Trash2, Calendar, Maximize, Volume2, Pause, Settings2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const STORAGE_KEYS = {
  ENROLLED_COURSES: 'agroexpert_enrolled_courses',
  DIAGNOSIS: 'agroexpert_diagnosis_history'
};

const BANK_DETAILS = [
  { id: 'ecobank', name: 'Ecobank', logo: 'https://www.ecobank.com/favicon.ico', account: '1234 5678 9012 34', holder: 'AGROEXPERT SARL' },
  { id: 'orabank', name: 'Orabank', logo: 'https://www.orabank.net/favicon.ico', account: '9876 5432 1098 76', holder: 'AGROEXPERT SARL' },
  { id: 'uba', name: 'UBA', logo: 'https://www.ubagroup.com/favicon.ico', account: '5566 7788 9900 11', holder: 'AGROEXPERT SARL' },
];

const MOBILE_MONEY = [
  { id: 'moov', name: 'Moov Money', color: 'bg-blue-600', number: '+235 66022287' },
  { id: 'orange', name: 'Orange Money', color: 'bg-orange-600', number: '+235 90659359' },
  { id: 'airtel', name: 'Airtel Money', color: 'bg-red-600', number: '+235 66022287' },
];

interface DiagnosisEntry {
  id: string;
  date: string;
  image: string;
  result: string;
  crop: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Payment flow states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep] = useState<'method' | 'details' | 'confirm'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'mobile' | 'bank' | null>(null);
  const [selectedSubMethod, setSelectedSubMethod] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  
  // Enrolled courses state
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ENROLLED_COURSES);
    return saved ? JSON.parse(saved) : [];
  });

  // Diagnosis History
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisEntry[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisEntry | null>(null);

  // Weather states
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filtering states
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterDuration, setFilterDuration] = useState<string>('all');

  // Video generation states
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
  const [videoQualities, setVideoQualities] = useState<Record<string, '720p' | '1080p'>>({});
  const [videoLoadingMessage, setVideoLoadingMessage] = useState("");

  // Learning steps states
  const [courseSteps, setCourseSteps] = useState<Record<string, string[]>>({});
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENROLLED_COURSES, JSON.stringify(enrolledCourseIds));
  }, [enrolledCourseIds]);

  // Load diagnosis history when profile is active
  useEffect(() => {
    if (activeTab === 'profile') {
      const historyStr = localStorage.getItem(STORAGE_KEYS.DIAGNOSIS);
      if (historyStr) {
        setDiagnosisHistory(JSON.parse(historyStr));
      }
    }
  }, [activeTab]);

  const handleLogin = (method: 'google' | 'phone') => {
    setIsLoggedIn(true);
    setUser({ name: "Bonaventure", plan: 'Free' });
  };

  const handleJoinCourse = (courseId: string) => {
    if (!enrolledCourseIds.includes(courseId)) {
      setEnrolledCourseIds(prev => [...prev, courseId]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleConfirmPayment = () => {
    if (!transactionId.trim()) {
      alert("Veuillez entrer la référence de la transaction.");
      return;
    }
    setIsProcessingPay(true);
    // Simulation d'envoi de confirmation
    setTimeout(() => {
      setIsProcessingPay(false);
      setShowPayModal(false);
      setPayStep('method');
      setUser({ ...user, plan: 'Pro' });
      alert("Paiement envoyé ! Votre compte sera activé dès validation par nos services (généralement sous 30 minutes).");
    }, 2000);
  };

  const getWeatherIcon = (condition: string = "", size: number = 24) => {
    const c = condition.toLowerCase();
    if (c.includes('soleil') || c.includes('dégagé') || c.includes('clair') || c.includes('sunny')) return <Sun size={size} className="text-amber-500" />;
    if (c.includes('pluie') || c.includes('averse') || c.includes('rain')) return <CloudRain size={size} className="text-blue-500" />;
    if (c.includes('orage') || c.includes('tempête') || c.includes('storm')) return <CloudLightning size={size} className="text-purple-500" />;
    if (c.includes('brouillard') || c.includes('brume') || c.includes('fog')) return <CloudFog size={size} className="text-stone-400" />;
    if (c.includes('nuage') || c.includes('cloud') || c.includes('couvert')) {
       if (c.includes('partiel') || c.includes('épar')) return <CloudSun size={size} className="text-amber-600" />;
       return <Cloud size={size} className="text-stone-400" />;
    }
    return <CloudSun size={size} className="text-amber-600" />;
  };

  const fetchWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Donne-moi la météo actuelle précise pour les coordonnées lat: ${lat}, lon: ${lon}. 
        Inclus la température (°C), l'humidité (%), la vitesse du vent (km/h), les conditions (ensoleillé, pluvieux, nuageux, etc.) et le nom de la ville/zone.
        Ajoute aussi un conseil agronomique court adapté à cette météo pour un agriculteur africain.
        Réponds uniquement en format JSON structuré.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              temp: { type: Type.NUMBER },
              condition: { type: Type.STRING },
              humidity: { type: Type.NUMBER },
              wind: { type: Type.NUMBER },
              agroAdvice: { type: Type.STRING }
            },
            required: ["location", "temp", "condition", "humidity", "wind", "agroAdvice"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setWeatherData(data);
    } catch (error) {
      console.error("Weather fetching error:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !weatherData && !weatherLoading) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Géolocalisation refusée ou indisponible.");
          fetchWeather(12.1348, 15.0557);
        }
      );
    }
  }, [isLoggedIn]);

  const fetchStepsForCourse = async (course: any) => {
    if (courseSteps[course.id] || loadingSteps[course.id]) return;

    setLoadingSteps(prev => ({ ...prev, [course.id]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Tu es un mentor agronomique africain passionné qui veut inspirer une nouvelle génération d'agriculteurs. 
        Génère 3 à 5 étapes clés d'apprentissage TRÈS PRATIQUES et MOTIVANTES pour le cours : "${course.title}". 
        La description du cours est : "${course.description}".
        
        Chaque étape doit amener à l'action immédiate, montrer l'intérêt de la pratique (profit, durabilité) et inclure un exemple concret de réussite réelle en Afrique (mentionne des pays comme le Tchad, Sénégal, Mali, Côte d'Ivoire).
        Utilise un ton encourageant, professionnel et entrepreneurial.
        
        Réponds uniquement sous forme de liste JSON de chaînes de caractères (strings).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const steps = JSON.parse(response.text);
      setCourseSteps(prev => ({ ...prev, [course.id]: steps }));
    } catch (error) {
      console.error("Error fetching steps:", error);
    } finally {
      setLoadingSteps(prev => ({ ...prev, [course.id]: false }));
    }
  };

  useEffect(() => {
    if (activeTab === 'learn') {
      filteredCourses.forEach(course => {
        if (!courseSteps[course.id]) {
          fetchStepsForCourse(course);
        }
      });
    }
  }, [activeTab, filterCategory, filterLevel, filterDuration]);

  const filteredCourses = useMemo(() => {
    return COURSES.filter(course => {
      const matchCategory = filterCategory === 'all' || course.category === filterCategory;
      const matchLevel = filterLevel === 'all' || course.level === filterLevel;
      const matchDuration = filterDuration === 'all' || course.duration === filterDuration;
      return matchCategory && matchLevel && matchDuration;
    });
  }, [filterCategory, filterLevel, filterDuration]);

  const generateCourseVideo = async (course: any) => {
    try {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }

      const selectedQuality = videoQualities[course.id] || '720p';
      setGeneratingVideoId(course.id);
      setVideoLoadingMessage(`Initialisation de l'immersion IA en ${selectedQuality}...`);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const loadingStepsArr = [
        "Analyse du contenu pédagogique...",
        "Génération du script visuel...",
        "Création des séquences cinématiques...",
        `Optimisation pour le format ${selectedQuality}...`,
        "Finalisation du tutoriel vidéo..."
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        stepIdx = (stepIdx + 1) % loadingStepsArr.length;
        setVideoLoadingMessage(loadingStepsArr[stepIdx]);
      }, 7000);

      const prompt = `Un tutoriel éducatif professionnel montrant le succès agricole de : ${course.title}. ${course.description}. Style cinématographique, environnement agricole africain réaliste, lumière naturelle, inspirant, montrant la richesse et la fierté d'être agriculteur.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: selectedQuality,
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      clearInterval(interval);
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (response.status === 404) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
          throw new Error("Clé API non valide ou projet non configuré.");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGeneratedVideos(prev => ({ ...prev, [course.id]: url }));
      }
    } catch (error) {
      console.error("Video Generation Error:", error);
      alert("Erreur lors de la génération. Assurez-vous d'utiliser une clé API valide avec facturation activée.");
    } finally {
      setGeneratingVideoId(null);
      setVideoLoadingMessage("");
    }
  };

  const toggleFullscreen = (courseId: string) => {
    const video = document.getElementById(`video-${courseId}`) as HTMLVideoElement;
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).msRequestFullscreen) {
        (video as any).msRequestFullscreen();
      }
    }
  };

  const resetFilters = () => {
    setFilterCategory('all');
    setFilterLevel('all');
    setFilterDuration('all');
  };

  const clearHistory = () => {
    if (window.confirm("Voulez-vous vraiment effacer tout votre historique de diagnostics ?")) {
      localStorage.removeItem(STORAGE_KEYS.DIAGNOSIS);
      setDiagnosisHistory([]);
    }
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
          <div className="bg-emerald-600 p-6 rounded-[2.5rem] mb-8 shadow-xl shadow-emerald-200">
            <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center">
               <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
          </div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-4">Bienvenue sur AgroExpert</h1>
          <p className="text-stone-500 dark:text-stone-400 mb-10 max-w-xs font-medium leading-relaxed">
            Votre compagnon agronomique intelligent pour une agriculture moderne, rentable et fière en Afrique.
          </p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={() => handleLogin('google')}
              className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] transition-all text-stone-700 dark:text-stone-200"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continuer avec Google
            </button>
            <button 
              onClick={() => handleLogin('phone')}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] transition-all"
            >
              <Phone size={20} />
              S'inscrire par téléphone
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Inspirational Hero Section */}
            <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2.5 rounded-2xl">
                      <Heart size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Osez l'Agrobusiness</h2>
                  </div>
                  <p className="text-emerald-50 text-sm leading-relaxed mb-6 opacity-90 font-medium">
                    L'Afrique possède 60% des terres arables non cultivées au monde. L'agriculture n'est plus un métier de survie, c'est l'industrie du futur. Ici, nous vous donnons les clés pour réussir comme un pro.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      <Target size={20} className="mb-2 text-emerald-200" />
                      <span className="block text-[10px] font-black uppercase mb-1 tracking-widest">Vision</span>
                      <p className="text-[10px] opacity-80 leading-tight">Devenez le leader agricole de votre communauté.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      <Gem size={20} className="mb-2 text-amber-200" />
                      <span className="block text-[10px] font-black uppercase mb-1 tracking-widest">Valeur</span>
                      <p className="text-[10px] opacity-80 leading-tight">Créez de la richesse réelle et durable.</p>
                    </div>
                  </div>
               </div>
               <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            </section>

            {/* Weather Section */}
            <section className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden relative transition-all">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl flex items-center justify-center ${weatherData?.condition.toLowerCase().includes('soleil') ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-stone-100 dark:bg-stone-800'}`}>
                    {weatherLoading ? <Loader2 size={24} className="animate-spin text-stone-300" /> : getWeatherIcon(weatherData?.condition, 28)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">Météo Locale</h2>
                    <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500">
                      <MapPin size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {weatherLoading ? "Localisation..." : weatherData?.location || "Chargement..."}
                      </span>
                    </div>
                  </div>
                </div>
                {weatherLoading ? (
                  <div className="w-16 h-8 bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse"></div>
                ) : (
                  <div className="text-right">
                    <div className="text-3xl font-black text-stone-900 dark:text-stone-100">{weatherData?.temp ?? '--'}°C</div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      {getWeatherIcon(weatherData?.condition, 14)}
                      <span className="text-xs font-bold text-stone-400 dark:text-stone-500 capitalize">{weatherData?.condition ?? 'Chargement...'}</span>
                    </div>
                  </div>
                )}
              </div>

              {weatherData && (
                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-3 flex items-center gap-3">
                    <Droplets className="text-blue-500" size={20} />
                    <div>
                      <span className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">Humidité</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{weatherData.humidity}%</span>
                    </div>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-3 flex items-center gap-3">
                    <Wind className="text-emerald-500" size={20} />
                    <div>
                      <span className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">Vent</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{weatherData.wind} km/h</span>
                    </div>
                  </div>
                </div>
              )}

              {weatherData?.agroAdvice && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 flex gap-3 relative z-10 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="bg-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase mb-1 tracking-widest">Conseil IA en temps réel</span>
                    <p className="text-sm text-emerald-900 dark:text-emerald-100 font-medium leading-snug">
                      {weatherData.agroAdvice}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Modules Agro</h2>
                <button className="text-emerald-600 dark:text-emerald-500 text-sm font-semibold" onClick={() => setActiveTab('learn')}>Tout voir</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => {
                      setFilterCategory(cat.id);
                      setActiveTab('learn');
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg dark:shadow-none group-active:scale-95 transition-all`}>
                      {React.cloneElement(cat.icon as React.ReactElement, { size: 28 })}
                    </div>
                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Diagnosis Shortcut */}
            <section className="bg-stone-900 dark:bg-stone-950 rounded-3xl p-6 text-white flex items-center justify-between border border-stone-800">
               <div>
                 <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                   <ShieldCheck className="text-emerald-500" size={20} />
                   Diagnostic Santé
                 </h3>
                 <p className="text-xs text-stone-400 max-w-[200px]">Votre plante est malade ? Photographiez-la pour un diagnostic instantané.</p>
               </div>
               <button 
                onClick={() => setActiveTab('expert')}
                className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
               >
                 <Camera size={24} />
               </button>
            </section>
          </div>
        );
      case 'learn':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">Votre Avenir Agricole</h1>
                <p className="text-stone-500 dark:text-stone-400 text-sm italic font-medium">"Le savoir est le premier intrant de toute récolte réussie."</p>
              </div>
              {(filterCategory !== 'all' || filterLevel !== 'all' || filterDuration !== 'all') && (
                <button 
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <X size={14} /> Réinitialiser
                </button>
              )}
            </div>

            {/* Category Tabs Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-4 px-4">
              <button
                onClick={() => setFilterCategory('all')}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-bold transition-all shadow-sm ${
                  filterCategory === 'all' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-800'
                }`}
              >
                <LayoutGrid size={16} />
                Tous les parcours
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-bold transition-all shadow-sm ${
                    filterCategory === cat.id 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-800'
                  }`}
                >
                  {React.cloneElement(cat.icon as React.ReactElement, { size: 16 })}
                  {cat.name}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 gap-12">
              {filteredCourses.length > 0 ? (
                filteredCourses.map(course => (
                  <div key={course.id} className="bg-white dark:bg-stone-900 rounded-[2.5rem] overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm transition-all hover:shadow-md">
                    <div className="relative">
                      {generatedVideos[course.id] ? (
                        <div className="bg-black relative group">
                           {/* Custom AI Video Player Container */}
                           <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                             <div className="bg-emerald-600 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                               <Video size={12} /> Immersion IA • {videoQualities[course.id] || '720p'}
                             </div>
                           </div>
                           
                           <video 
                            id={`video-${course.id}`}
                            src={generatedVideos[course.id]} 
                            className="w-full aspect-video object-cover"
                           />
                           
                           {/* Quick Controls Overlay (visible on hover) */}
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                              <div className="flex items-center justify-between gap-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 pointer-events-auto">
                                 <div className="flex items-center gap-4">
                                   <button 
                                     onClick={() => {
                                       const v = document.getElementById(`video-${course.id}`) as HTMLVideoElement;
                                       if (v) {
                                         if (v.paused) v.play();
                                         else v.pause();
                                       }
                                     }}
                                     className="text-white hover:text-emerald-400 transition-colors"
                                   >
                                     <Play size={20} fill="currentColor" />
                                   </button>
                                   
                                   <div className="flex items-center gap-2">
                                     <Volume2 size={18} className="text-white" />
                                     <input 
                                       type="range" 
                                       min="0" 
                                       max="1" 
                                       step="0.1" 
                                       defaultValue="1"
                                       onChange={(e) => {
                                         const v = document.getElementById(`video-${course.id}`) as HTMLVideoElement;
                                         if (v) v.volume = parseFloat(e.target.value);
                                       }}
                                       className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                     />
                                   </div>
                                 </div>

                                 <button 
                                   onClick={() => toggleFullscreen(course.id)}
                                   className="text-white hover:text-emerald-400 transition-colors p-1"
                                   title="Plein écran"
                                 >
                                   <Maximize size={20} />
                                 </button>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <img src={course.image} className="w-full h-72 object-cover" alt={course.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          {enrolledCourseIds.includes(course.id) && (
                            <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-xl flex items-center gap-2">
                               <CheckCircle2 size={16} />
                               Déjà inscrit !
                            </div>
                          )}
                          <div className="absolute bottom-6 left-8 right-8">
                             <h3 className="font-black text-2xl text-white mb-3 leading-tight drop-shadow-lg">{course.title}</h3>
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-950/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/30">{course.level}</span>
                                <span className="text-[10px] font-black uppercase text-white/90 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">{course.duration}</span>
                             </div>
                          </div>
                          {generatingVideoId === course.id && (
                            <div className="absolute inset-0 bg-stone-900/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                              <Loader2 className="animate-spin text-emerald-400 mb-4" size={56} />
                              <p className="text-white font-bold text-lg mb-2">{videoLoadingMessage}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-300"></div>
                              </div>
                              <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest mt-4 opacity-60">Séquençage haute résolution en cours...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8">
                      <p className="text-sm text-stone-700 dark:text-stone-300 mb-8 leading-relaxed font-medium">{course.description}</p>
                      
                      <div className="mb-8 p-6 bg-stone-50 dark:bg-stone-800/40 rounded-3xl border border-stone-100 dark:border-stone-800 italic relative">
                         <Quote className="absolute -top-3 -left-3 text-emerald-600/20" size={48} />
                         <p className="text-xs text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                            "Avant ce module, je perdais 40% de ma récolte à cause du sol fatigué. Aujourd'hui, mon rendement a doublé et j'ai pu acheter mon premier tracteur d'occasion." 
                            <span className="block mt-2 font-black uppercase text-[10px] text-emerald-600 not-italic tracking-widest">— Oumar D., Entrepreneur Agricole (Tchad)</span>
                         </p>
                      </div>

                      <div className="mb-8 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl p-6 border border-emerald-100/30 dark:border-emerald-800 transition-all">
                        <div className="flex items-center gap-3 mb-4 text-emerald-800 dark:text-emerald-400">
                          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200/50 text-white">
                            <Sparkles size={18} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">Le Parcours de votre Succès</span>
                        </div>
                        
                        {loadingSteps[course.id] ? (
                          <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 py-2">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] italic">Votre mentor IA prépare votre plan...</span>
                          </div>
                        ) : courseSteps[course.id] ? (
                          <div className="space-y-4">
                            {courseSteps[course.id].map((step, idx) => (
                              <div key={idx} className="flex gap-4 items-start group">
                                <div className="flex flex-col items-center shrink-0">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-md group-hover:scale-110 transition-transform">
                                    {idx + 1}
                                  </div>
                                  {idx < courseSteps[course.id].length - 1 && (
                                    <div className="w-px h-full bg-emerald-200 dark:bg-emerald-900/50 mt-2"></div>
                                  )}
                                </div>
                                <span className="text-xs text-stone-700 dark:text-stone-300 font-bold leading-snug pb-2">{step}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button 
                            onClick={() => fetchStepsForCourse(course)}
                            className="text-xs text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                          >
                            Charger les étapes clés du succès <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-6">
                        {/* Quality Selector & Trigger */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-3xl border border-stone-100 dark:border-stone-700">
                           <div className="flex items-center gap-3 flex-1">
                              <div className="bg-white dark:bg-stone-700 p-2.5 rounded-xl text-emerald-600 shadow-sm">
                                <Settings2 size={18} />
                              </div>
                              <div>
                                <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Réglages Immersion</span>
                                <div className="flex gap-2 mt-1">
                                  {['720p', '1080p'].map((q) => (
                                    <button 
                                      key={q}
                                      onClick={() => setVideoQualities(prev => ({ ...prev, [course.id]: q as '720p' | '1080p' }))}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                                        (videoQualities[course.id] || '720p') === q 
                                          ? 'bg-emerald-600 text-white shadow-md' 
                                          : 'bg-white dark:bg-stone-700 text-stone-400 border border-stone-200 dark:border-stone-600'
                                      }`}
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                           </div>
                           
                           <button 
                            onClick={() => generateCourseVideo(course)}
                            disabled={!!generatingVideoId}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                           >
                             <Video size={18} /> 
                             {generatedVideos[course.id] ? "Régénérer Immersion IA" : "Lancer Immersion IA"}
                           </button>
                        </div>

                        {/* Main Course Action */}
                        <div className="grid grid-cols-2 gap-4">
                          {enrolledCourseIds.includes(course.id) ? (
                            <button className="col-span-2 flex items-center justify-center gap-3 bg-stone-900 dark:bg-stone-800 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-black dark:hover:bg-stone-700 transition-all shadow-xl shadow-stone-200 dark:shadow-none">
                              <Play size={20} /> Reprendre le module de formation
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleJoinCourse(course.id)}
                              className="col-span-2 flex items-center justify-center gap-3 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] border border-stone-200 dark:border-stone-700 hover:bg-stone-200 transition-all"
                            >
                              <UserPlus size={20} /> S'inscrire gratuitement
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center bg-white dark:bg-stone-900 rounded-[3rem] border-2 border-dashed border-stone-100 dark:border-stone-800">
                  <Filter className="mx-auto text-stone-200 dark:text-stone-700 mb-4" size={64} />
                  <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-sm">Aucun parcours ne correspond</p>
                  <button onClick={resetFilters} className="mt-4 text-emerald-600 dark:text-emerald-500 font-black uppercase text-xs underline">Voir tout le catalogue</button>
                </div>
              )}
            </div>
          </div>
        );
      case 'expert':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">Conseiller IA Expert</h1>
              <p className="text-stone-500 dark:text-stone-400 text-sm italic font-medium">"Réponses techniques et diagnostics santé en temps réel."</p>
            </div>
            <AgroExpert />
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-6 bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-black text-3xl border-4 border-white dark:border-stone-800 shadow-md shrink-0">
                {user?.name[0]}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 truncate tracking-tight">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                    user?.plan === 'Pro' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}>
                    Membre {user?.plan}
                  </span>
                  {user?.plan === 'Free' && (
                    <button 
                      onClick={() => setShowPayModal(true)}
                      className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest hover:underline"
                    >
                      Devenir Pro
                    </button>
                  )}
                </div>
              </div>
            </div>

            <section>
              <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] mb-4 ml-2">Mes Performances</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-100 dark:border-stone-800 flex flex-col items-center shadow-sm">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{enrolledCourseIds.length}</span>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center mt-1">Modules suivis</span>
                 </div>
                 <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-100 dark:border-stone-800 flex flex-col items-center shadow-sm">
                    <span className="text-3xl font-black text-amber-600">{diagnosisHistory.length}</span>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center mt-1">Diagnostics effectués</span>
                 </div>
              </div>
            </section>

            {/* Diagnosis History Section */}
            <section>
              <div className="flex items-center justify-between mb-4 ml-2">
                <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em]">Historique des Diagnostics</h3>
                {diagnosisHistory.length > 0 && (
                  <button onClick={clearHistory} className="text-red-500 hover:text-red-600 p-1 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {diagnosisHistory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {diagnosisHistory.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedDiagnosis(item)}
                      className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-500 transition-all group"
                    >
                      <img src={item.image} className="w-16 h-16 rounded-xl object-cover shrink-0" alt="Plante" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          <Eye size={14} className="text-stone-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs truncate">{item.crop}</h4>
                        <p className="text-[10px] text-stone-500 line-clamp-1 italic mt-0.5">{item.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-stone-50 dark:bg-stone-800/30 rounded-[2rem] border-2 border-dashed border-stone-200 dark:border-stone-800 text-center">
                  <History className="mx-auto text-stone-300 dark:text-stone-700 mb-2" size={32} />
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Aucun historique de diagnostic</p>
                  <button onClick={() => setActiveTab('expert')} className="text-emerald-600 text-[10px] font-black uppercase mt-2 hover:underline">Analyser ma première plante</button>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] mb-4 ml-2">Plans d'abonnement</h3>
              <div className="grid grid-cols-1 gap-6">
                {PLANS.map(plan => (
                  <div key={plan.id} className={`p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${
                    plan.popular 
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' 
                      : 'border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm'
                  }`}>
                    {plan.popular && (
                      <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-widest shadow-xl">Recommandé</span>
                    )}
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h4 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">{plan.name}</h4>
                        <p className="text-emerald-700 dark:text-emerald-500 font-black text-lg mt-1">{plan.price}</p>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300 font-bold">
                          <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => plan.id !== 'free' && setShowPayModal(true)}
                      disabled={plan.id === 'free'}
                      className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-lg transition-all ${
                        plan.id === 'free' 
                          ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600' 
                          : 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-[0.98]'
                      }`}
                    >
                      {plan.id === 'free' ? 'Plan Actuel' : 'Souscrire'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  const renderDiagnosisDetailModal = () => {
    if (!selectedDiagnosis) return null;

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
          <div className="relative h-64 shrink-0">
            <img src={selectedDiagnosis.image} className="w-full h-full object-cover" alt="Plante diagnostiquée" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <button 
              onClick={() => setSelectedDiagnosis(null)}
              className="absolute top-6 right-6 p-3 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-full text-white transition-all active:scale-90"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-6 left-8">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Détails du Diagnostic</span>
              <h3 className="text-2xl font-black text-white">{selectedDiagnosis.crop}</h3>
              <p className="text-xs text-stone-300 font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                <Calendar size={14} /> Analyste le {new Date(selectedDiagnosis.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-800/50 mb-6">
               <div className="flex items-center gap-3 mb-4 text-emerald-800 dark:text-emerald-400">
                  <ShieldCheck size={20} />
                  <span className="font-black uppercase tracking-widest text-xs">Analyse Technique IA</span>
               </div>
               <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap font-medium">
                 {selectedDiagnosis.result}
               </div>
            </div>
            
            <button 
              onClick={() => setSelectedDiagnosis(null)}
              className="w-full bg-stone-900 dark:bg-stone-800 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-[0.98] transition-all"
            >
              Fermer l'archive
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentModal = () => {
    if (!showPayModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
          {/* Header Modal */}
          <div className="p-6 bg-emerald-600 text-white shrink-0">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black uppercase tracking-tight">Investir dans mon futur</h3>
                <button onClick={() => { setShowPayModal(false); setPayStep('method'); }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
             </div>
             {payStep !== 'method' && (
               <button onClick={() => setPayStep('method')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline">
                 <ArrowLeft size={14} /> Revenir au choix
               </button>
             )}
          </div>

          <div className="p-8 overflow-y-auto flex-1 no-scrollbar">
            {payStep === 'method' && (
              <div className="space-y-4">
                <p className="text-stone-500 dark:text-stone-400 text-sm font-bold mb-6 italic">Sélectionnez votre levier de réussite :</p>
                
                <button 
                  onClick={() => { setSelectedMethod('card'); setPayStep('details'); }}
                  className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 border-stone-100 dark:border-stone-800 hover:border-emerald-500 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl group-hover:bg-emerald-50">
                      <CreditCard className="text-blue-600 group-hover:text-emerald-600" size={24} />
                    </div>
                    <span className="font-black text-stone-700 dark:text-stone-300 uppercase text-xs tracking-widest">Visa / Mastercard</span>
                  </div>
                  <ChevronRight className="text-stone-300" size={18} />
                </button>

                <button 
                  onClick={() => { setSelectedMethod('mobile'); setPayStep('details'); }}
                  className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 border-stone-100 dark:border-stone-800 hover:border-emerald-500 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl group-hover:bg-emerald-50">
                      <Smartphone className="text-amber-600 group-hover:text-emerald-600" size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-stone-700 dark:text-stone-300 uppercase text-xs tracking-widest">Mobile Money</span>
                      <span className="text-[9px] text-stone-400 uppercase font-black tracking-[0.2em]">Rapide & Sécurisé</span>
                    </div>
                  </div>
                  <ChevronRight className="text-stone-300" size={18} />
                </button>

                <button 
                  onClick={() => { setSelectedMethod('bank'); setPayStep('details'); }}
                  className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 border-stone-100 dark:border-stone-800 hover:border-emerald-500 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl group-hover:bg-emerald-50">
                      <Building2 className="text-stone-600 group-hover:text-emerald-600" size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-stone-700 dark:text-stone-300 uppercase text-xs tracking-widest">Banque Locale</span>
                      <span className="text-[9px] text-stone-400 uppercase font-black tracking-[0.2em]">Zone CEMAC</span>
                    </div>
                  </div>
                  <ChevronRight className="text-stone-300" size={18} />
                </button>
              </div>
            )}

            {payStep === 'details' && selectedMethod === 'bank' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Choisissez votre banque</h4>
                {BANK_DETAILS.map(bank => (
                  <button 
                    key={bank.id}
                    onClick={() => { setSelectedSubMethod(bank); setPayStep('confirm'); }}
                    className="w-full p-5 rounded-[1.5rem] border-2 border-stone-100 dark:border-stone-800 hover:border-emerald-500 flex items-center gap-5 transition-all"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-stone-100 shrink-0">
                      <img src={bank.logo} alt={bank.name} className="max-w-full h-auto" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-stone-800 dark:text-stone-100 uppercase text-xs">{bank.name}</span>
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Validation rapide</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {payStep === 'details' && selectedMethod === 'mobile' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Opérateur de transfert</h4>
                {MOBILE_MONEY.map(op => (
                  <button 
                    key={op.id}
                    onClick={() => { setSelectedSubMethod(op); setPayStep('confirm'); }}
                    className="w-full p-5 rounded-[1.5rem] border-2 border-stone-100 dark:border-stone-800 hover:border-emerald-500 flex items-center gap-5 transition-all"
                  >
                    <div className={`${op.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
                       <Smartphone size={24} className="text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-stone-800 dark:text-stone-100 uppercase text-xs">{op.name}</span>
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Confirmation par code</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {payStep === 'details' && selectedMethod === 'card' && (
              <div className="text-center py-10 space-y-6">
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                    <CreditCard size={48} className="text-emerald-600" />
                 </div>
                 <p className="text-sm text-stone-600 dark:text-stone-400 font-bold">Initialisation de la passerelle de paiement internationale...</p>
                 <button 
                  onClick={() => { setSelectedSubMethod({ name: 'Visa/Mastercard' }); setPayStep('confirm'); }}
                  className="bg-emerald-600 text-white px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-200/50 hover:bg-emerald-700 transition-all"
                 >
                   Payer par Carte
                 </button>
              </div>
            )}

            {payStep === 'confirm' && (
              <div className="space-y-8">
                 {selectedMethod === 'bank' && selectedSubMethod && (
                   <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-[2rem] border border-stone-100 dark:border-stone-700">
                      <div className="flex items-center gap-3 mb-6">
                        <Landmark size={20} className="text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">RIB / Coordonnées {selectedSubMethod.name}</span>
                      </div>
                      <div className="space-y-4">
                         <div>
                            <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Titulaire</span>
                            <span className="text-xs font-black text-stone-800 dark:text-stone-100 uppercase">{selectedSubMethod.holder}</span>
                         </div>
                         <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800">
                            <div className="min-w-0">
                               <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Numéro de compte</span>
                               <span className="text-sm font-black font-mono tracking-tighter text-stone-800 dark:text-stone-100 break-all">{selectedSubMethod.account}</span>
                            </div>
                            <button onClick={() => copyToClipboard(selectedSubMethod.account, 'bank')} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl shrink-0 active:scale-90 transition-all">
                               {copiedAccount === 'bank' ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                         </div>
                      </div>
                   </div>
                 )}

                 {selectedMethod === 'mobile' && selectedSubMethod && (
                   <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-[2rem] border border-stone-100 dark:border-stone-700">
                      <div className="flex items-center gap-3 mb-6">
                        <Smartphone size={20} className="text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Paiement {selectedSubMethod.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 p-5 bg-white dark:bg-stone-900 rounded-[1.5rem] border border-stone-100 dark:border-stone-800">
                        <div>
                           <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Numéro marchand</span>
                           <span className="text-xl font-black text-emerald-600 tracking-tight">{selectedSubMethod.number}</span>
                        </div>
                        <button onClick={() => copyToClipboard(selectedSubMethod.number, 'mobile')} className="p-4 bg-emerald-600 text-white rounded-2xl shrink-0 active:scale-90 transition-all shadow-lg">
                           {copiedAccount === 'mobile' ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 font-bold uppercase text-center mt-4 tracking-wider leading-relaxed">Veuillez effectuer le transfert puis saisir la référence de confirmation.</p>
                   </div>
                 )}

                 <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Upload size={14} /> Référence de la transaction
                      </label>
                      <input 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Ex: T2409... ou Code Réf"
                        className="w-full bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-stone-100 dark:border-stone-700 rounded-[1.5rem] px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm transition-all"
                      />
                    </div>
                    
                    <div className="p-5 bg-emerald-600/5 dark:bg-emerald-950/20 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-900/30 flex gap-4">
                       <Info size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold leading-relaxed">
                         Validation prioritaire : Envoyez une capture d'écran du reçu au <strong>+235 66022287</strong> via WhatsApp.
                       </p>
                    </div>

                    <button 
                      onClick={handleConfirmPayment}
                      disabled={isProcessingPay || !transactionId}
                      className="w-full bg-emerald-600 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isProcessingPay ? <Loader2 size={24} className="animate-spin" /> : <Send size={20} />}
                      {isProcessingPay ? 'Vérification...' : 'Confirmer le Paiement'}
                    </button>
                 </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 text-center shrink-0">
             <p className="text-[8px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-[0.3em]">Plateforme Certifiée AgroExpert Afrique • 2024</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
      {renderContent()}
      {renderPaymentModal()}
      {renderDiagnosisDetailModal()}
    </Layout>
  );
};

export default App;
