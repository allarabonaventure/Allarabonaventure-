
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Camera, Sparkles, Loader2, Image as ImageIcon, X, RotateCcw, Copy, Check, Calendar, Plus, Trash2, ClipboardList, User, Wand2, AlertCircle, BellRing, WifiOff, Wifi, Save, Share2, Mail, Link, FlaskConical, Beaker, Sprout, Bug, Droplets, Mountain, Scissors, CheckCircle2, Lightbulb, FileDown, ShieldAlert, Zap, ChevronLeft, ChevronRight, RefreshCw, Microscope, ShieldCheck, ThermometerSnowflake, Banknote, ShoppingCart, Coins } from 'lucide-react';
import { getAgroAdvice, diagnosePlant, generateCropItinerary, getFertilizerAdvice, getCropFertilizationPlan, getCropProtectionPlan, getDiseaseInfo } from '../services/geminiService';

interface Message {
  role: 'user' | 'bot';
  text: string;
  image?: string;
}

interface InputCost {
  id: string;
  type: 'seed' | 'fertilizer' | 'pesticide' | 'other';
  name: string;
  unitCost: number;
  quantity: number;
}

interface ItineraryStep {
  id: string;
  description: string;
  deadline: string;
  completed: boolean;
  daysFromStart?: number;
  costs?: InputCost[];
}

interface DiseaseData {
  description: string;
  symptoms: string[];
  bioTreatments: string[];
  chemicalTreatments: string[];
}

const STORAGE_KEYS = {
  CHAT: 'agroexpert_chat_history',
  ITINERARY: 'agroexpert_itinerary_data',
  AVATAR: 'agroexpert_user_avatar',
  EMAIL: 'agroexpert_user_email',
  DIAGNOSIS: 'agroexpert_diagnosis_history',
  DISEASES: 'agroexpert_diseases_library'
};

const COMMON_DISEASES = ["Mildiou", "Oïdium", "Rouille", "Flétrissement bactérien", "Pourriture grise"];

const AgroExpert: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [input, setInput] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Initialize states from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
    return saved ? JSON.parse(saved) : [
      { role: 'bot', text: 'Bonjour ! Je suis votre assistant agronome. Comment puis-je vous aider aujourd\'hui ? Vous pouvez me poser une question ou m\'envoyer une photo d\'une plante pour un diagnostic.' }
    ];
  });

  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [fetchingGlobalFert, setFetchingGlobalFert] = useState(false);
  const [fetchingGlobalPest, setFetchingGlobalPest] = useState(false);
  const [fetchingCurrentPest, setFetchingCurrentPest] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState<string | null>(null);
  
  // Profile states
  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.AVATAR);
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.EMAIL) || '';
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Itinerary states
  const [itineraryData, setItineraryData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITINERARY);
    return saved ? JSON.parse(saved) : {
      cropName: '',
      scientificName: '',
      startDate: new Date().toISOString().split('T')[0],
      steps: [] as ItineraryStep[],
      globalFertPlan: null,
      globalPestPlan: null,
      stepAdvice: {},
      pestAdvice: {},
      currentStagePestAdvice: null
    };
  });

  const [cropName, setCropName] = useState(itineraryData.cropName);
  const [scientificName, setScientificName] = useState(itineraryData.scientificName);
  const [startDate, setStartDate] = useState(itineraryData.startDate);
  const [steps, setSteps] = useState<ItineraryStep[]>(itineraryData.steps);
  const [stepAdvice, setStepAdvice] = useState<Record<string, { text: string; loading: boolean }>>(itineraryData.stepAdvice || {});
  const [pestAdvice, setPestAdvice] = useState<Record<string, { text: string; loading: boolean }>>(itineraryData.pestAdvice || {});
  const [globalFertPlan, setGlobalFertPlan] = useState<string | null>(itineraryData.globalFertPlan);
  const [globalPestPlan, setGlobalPestPlan] = useState<string | null>(itineraryData.globalPestPlan);
  const [currentStagePestAdvice, setCurrentStagePestAdvice] = useState<string | null>(itineraryData.currentStagePestAdvice);
  
  // Disease states
  const [selectedDiseaseTab, setSelectedDiseaseTab] = useState(COMMON_DISEASES[0]);
  const [diseasesLibrary, setDiseasesLibrary] = useState<Record<string, DiseaseData>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISEASES);
    return saved ? JSON.parse(saved) : {};
  });
  const [loadingDisease, setLoadingDisease] = useState(false);

  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepDate, setNewStepDate] = useState(new Date().toISOString().split('T')[0]);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [editingCostsStepId, setEditingCostsStepId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const saveToDiagnosisHistory = (image: string, result: string) => {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEYS.DIAGNOSIS);
      const history = historyStr ? JSON.parse(historyStr) : [];
      const newEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image,
        result,
        crop: cropName || "Plante inconnue"
      };
      localStorage.setItem(STORAGE_KEYS.DIAGNOSIS, JSON.stringify([newEntry, ...history].slice(0, 20))); // Keep last 20
    } catch (e) {
      console.error("Error saving to diagnosis history", e);
    }
  };

  const fetchDiseaseDetails = async (disease: string) => {
    if (diseasesLibrary[disease] && !isOnline) return; // Use cache if offline
    
    setLoadingDisease(true);
    const data = await getDiseaseInfo(disease, cropName);
    if (data) {
      const updatedLibrary = { ...diseasesLibrary, [disease]: data };
      setDiseasesLibrary(updatedLibrary);
      localStorage.setItem(STORAGE_KEYS.DISEASES, JSON.stringify(updatedLibrary));
    }
    setLoadingDisease(false);
  };

  useEffect(() => {
    if (!diseasesLibrary[selectedDiseaseTab] && isOnline) {
      fetchDiseaseDetails(selectedDiseaseTab);
    }
  }, [selectedDiseaseTab, cropName, isOnline]);

  // Helpers to identify step types
  const isFertilizationStep = (description: string) => {
    const desc = description.toLowerCase();
    return desc.includes('fertili') || desc.includes('engrais') || desc.includes('npk') || desc.includes('urée') || desc.includes('fumure');
  };

  const isPhytoStep = (description: string) => {
    const desc = description.toLowerCase();
    return desc.includes('traitement') || desc.includes('phyto') || desc.includes('insect') || desc.includes('fongi') || desc.includes('pesticide') || desc.includes('maladie') || desc.includes('ravageur');
  };

  // Helper to get thematic icon for steps
  const getStepIconWithContext = (description: string) => {
    const desc = description.toLowerCase();
    let icon = <ClipboardList size={16} />;
    let colorClass = "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400";

    if (desc.includes('semis') || desc.includes('plantation') || desc.includes('repiquage')) {
      icon = <Sprout size={16} />;
      colorClass = "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
    } else if (isFertilizationStep(description)) {
      icon = <FlaskConical size={16} />;
      colorClass = "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    } else if (isPhytoStep(description) || desc.includes('pulv')) {
      icon = <Bug size={16} />;
      colorClass = "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    } else if (desc.includes('arrosage') || desc.includes('irrigation')) {
      icon = <Droplets size={16} />;
      colorClass = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    } else if (desc.includes('sarclage') || desc.includes('désherb') || desc.includes('nettoyage')) {
      icon = <Scissors size={16} />;
      colorClass = "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    } else if (desc.includes('récolte')) {
      icon = <CheckCircle2 size={16} />;
      colorClass = "bg-emerald-600 text-white";
    } else if (desc.includes('labour') || desc.includes('sol') || desc.includes('prépar')) {
      icon = <Mountain size={16} />;
      colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    }

    return { icon, colorClass };
  };

  // Connection listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state and Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
    setLastSaved(new Date());
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVATAR, userAvatar || '');
  }, [userAvatar]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMAIL, userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify({
      cropName,
      scientificName,
      startDate,
      steps,
      globalFertPlan,
      globalPestPlan,
      stepAdvice,
      pestAdvice,
      currentStagePestAdvice
    }));
    setLastSaved(new Date());
  }, [cropName, scientificName, startDate, steps, globalFertPlan, globalPestPlan, stepAdvice, pestAdvice, currentStagePestAdvice]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!isOnline) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const botResponse = await getAgroAdvice(userMsg);
    setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    setLoading(false);
  };

  const handleReset = () => {
    if (window.confirm("Effacer l'historique du chat ?")) {
      const initialMessage: Message[] = [
        { role: 'bot', text: 'Historique effacé. Comment puis-je vous aider ?' }
      ];
      setMessages(initialMessage);
    }
  };

  const handleResetItinerary = () => {
    if (window.confirm("Attention : Cela effacera toutes les étapes et tous les conseils de cet itinéraire. Continuer ?")) {
      setCropName('');
      setScientificName('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setSteps([]);
      setGlobalFertPlan(null);
      setGlobalPestPlan(null);
      setStepAdvice({});
      setPestAdvice({});
      setCurrentStagePestAdvice(null);
    }
  };

  const totalCost = useMemo(() => {
    return steps.reduce((acc, step) => {
      const stepTotal = (step.costs || []).reduce((sAcc, cost) => sAcc + (cost.unitCost * cost.quantity), 0);
      return acc + stepTotal;
    }, 0);
  }, [steps]);

  const getItineraryAsText = () => {
    let text = `📋 ITINÉRAIRE TECHNIQUE : ${cropName.toUpperCase() || 'Sans titre'}\n`;
    if (scientificName) text += `🧬 Nom Scientifique : ${scientificName}\n`;
    if (userEmail) text += `✉️ Contact : ${userEmail}\n`;
    text += `📅 Date de début : ${new Date(startDate).toLocaleDateString('fr-FR')}\n\n`;
    text += `ÉTAPES PRÉVUES :\n`;
    
    steps.slice().sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).forEach((s, i) => {
      text += `${i + 1}. [${new Date(s.deadline).toLocaleDateString('fr-FR')}] ${s.description}${s.completed ? ' ✅' : ''}\n`;
      if (s.costs && s.costs.length > 0) {
        text += `   💰 Coûts : ${s.costs.map(c => `${c.name} (${c.quantity} x ${c.unitCost} FCFA)`).join(', ')}\n`;
        const stepTotal = s.costs.reduce((acc, c) => acc + (c.unitCost * c.quantity), 0);
        text += `   💵 Total étape : ${stepTotal.toLocaleString()} FCFA\n`;
      }
    });

    if (globalFertPlan) {
      text += `\n🧪 PLAN DE FERTILISATION :\n${globalFertPlan}\n`;
    }

    if (globalPestPlan) {
      text += `\n🛡️ PLAN DE PROTECTION :\n${globalPestPlan}\n`;
    }

    text += `\n💰 TOTAL GÉNÉRAL : ${totalCost.toLocaleString()} FCFA\n`;
    text += `\nExporté depuis AgroExpert Afrique`;
    return text;
  };

  const copyItineraryToClipboard = () => {
    if (steps.length === 0) return;
    const text = getItineraryAsText();
    navigator.clipboard.writeText(text).then(() => {
      setShowShareSuccess('copy');
      setTimeout(() => setShowShareSuccess(null), 3000);
    });
  };

  const shareViaEmail = () => {
    if (steps.length === 0) return;
    const subject = encodeURIComponent(`Mon Itinéraire Technique : ${cropName}`);
    const body = encodeURIComponent(getItineraryAsText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareSuccess('email');
    setTimeout(() => setShowShareSuccess(null), 3000);
  };

  const shareViaNative = async () => {
    if (steps.length === 0) return;
    const text = getItineraryAsText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Itinéraire ${cropName}`,
          text: text,
        });
        setShowShareSuccess('share');
        setTimeout(() => setShowShareSuccess(null), 3000);
      } catch (err) {
        copyItineraryToClipboard();
      }
    } else {
      copyItineraryToClipboard();
    }
  };

  const exportToPdf = () => {
    if (steps.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Itinéraire Technique - ${cropName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #1c1917; background: #fafaf9; }
              @media print {
                  body { padding: 0; background: white; }
                  .no-print { display: none; }
              }
              .step-number { min-width: 24px; height: 24px; }
              .ai-box { white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
          </style>
      </head>
      <body class="bg-stone-50">
          <div class="max-w-4xl mx-auto bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm">
              <div class="flex justify-between items-start border-b-2 border-emerald-600 pb-8 mb-8">
                  <div class="flex gap-6 items-center">
                      ${userAvatar ? `<img src="${userAvatar}" class="w-20 h-20 rounded-full object-cover border-4 border-emerald-50 shadow-md">` : ''}
                      <div>
                          <div class="flex items-center gap-2 mb-2">
                            <div class="bg-emerald-600 p-1.5 rounded-lg">
                              <div class="w-4 h-4 border-2 border-white rounded-full flex items-center justify-center">
                                 <div class="w-1 h-1 bg-white rounded-full"></div>
                              </div>
                            </div>
                            <span class="font-bold text-xl text-emerald-900">AgroExpert Afrique</span>
                          </div>
                          <h1 class="text-3xl font-black text-stone-900 uppercase tracking-tight">${cropName || 'Itinéraire sans nom'}</h1>
                          <p class="text-emerald-600 italic font-bold text-sm">${scientificName || ''}</p>
                      </div>
                  </div>
                  <div class="text-right">
                      <p class="text-xs font-black text-stone-400 uppercase tracking-widest mb-1">Détails du projet</p>
                      <p class="text-sm font-bold text-stone-700">Début : ${new Date(startDate).toLocaleDateString('fr-FR')}</p>
                      ${totalCost > 0 ? `<p class="text-sm font-black text-emerald-600 mt-1">BUDGET TOTAL : ${totalCost.toLocaleString()} FCFA</p>` : ''}
                      ${userEmail ? `<p class="text-sm font-medium text-stone-500">${userEmail}</p>` : ''}
                  </div>
              </div>

              ${currentStagePestAdvice ? `
                  <div class="mb-10 bg-red-900 text-white p-6 rounded-3xl shadow-lg border-l-8 border-red-500">
                      <h3 class="text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        ⚠️ Alerte Situation Actuelle
                      </h3>
                      <p class="ai-box italic font-medium opacity-90">${currentStagePestAdvice}</p>
                  </div>
              ` : ''}

              <div class="mb-10">
                  <h2 class="text-lg font-black text-stone-900 mb-6 flex items-center gap-3 uppercase tracking-wider">
                      <span class="w-2 h-8 bg-emerald-600 rounded-full"></span>
                      Calendrier Cultural et Conseils IA
                  </h2>
                  <div class="space-y-6">
                      ${steps.slice().sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map((s, i) => `
                          <div class="flex items-start gap-5 p-6 bg-stone-50 rounded-[2rem] border border-stone-100 shadow-sm">
                              <div class="step-number bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm mt-1">
                                  ${i + 1}
                              </div>
                              <div class="flex-1">
                                  <div class="flex justify-between items-center mb-3">
                                      <p class="font-black text-stone-900 text-lg">${s.description}</p>
                                      <span class="text-[10px] font-black bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                        📅 ${new Date(s.deadline).toLocaleDateString('fr-FR')}
                                      </span>
                                  </div>
                                  
                                  <div class="space-y-3">
                                    ${s.costs && s.costs.length > 0 ? `
                                        <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                          <p class="text-[9px] font-black text-amber-600 uppercase mb-2 tracking-widest flex items-center gap-2">
                                            💰 Suivi des Coûts
                                          </p>
                                          <div class="space-y-1">
                                            ${s.costs.map(c => `
                                              <div class="flex justify-between text-[10px] font-bold text-stone-700">
                                                <span>${c.name || c.type} (${c.quantity} x ${c.unitCost} FCFA)</span>
                                                <span>${(c.unitCost * c.quantity).toLocaleString()} FCFA</span>
                                              </div>
                                            `).join('')}
                                            <div class="pt-2 mt-2 border-t border-amber-200 flex justify-between text-[11px] font-black text-amber-700">
                                              <span>TOTAL ÉTAPE</span>
                                              <span>${s.costs.reduce((acc, c) => acc + (c.unitCost * c.quantity), 0).toLocaleString()} FCFA</span>
                                            </div>
                                          </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${stepAdvice[s.id] ? `
                                        <div class="p-4 bg-white rounded-2xl border border-emerald-100">
                                          <p class="text-[9px] font-black text-emerald-600 uppercase mb-2 tracking-widest flex items-center gap-2">
                                            🧪 Recommandation Fertilisation
                                          </p>
                                          <div class="ai-box text-stone-700">${stepAdvice[s.id].text}</div>
                                        </div>
                                    ` : ''}
                                    
                                    ${pestAdvice[s.id] ? `
                                        <div class="p-4 bg-red-50 rounded-2xl border border-red-100">
                                          <p class="text-[9px] font-black text-red-600 uppercase mb-2 tracking-widest flex items-center gap-2">
                                            🛡️ Protection des Cultures
                                          </p>
                                          <div class="ai-box text-red-900 font-medium">${pestAdvice[s.id].text}</div>
                                        </div>
                                    ` : ''}
                                  </div>
                              </div>
                          </div>
                      `).join('')}
                  </div>
              </div>

              ${globalFertPlan ? `
                  <div class="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden mb-8">
                      <div class="relative z-10">
                        <h2 class="text-lg font-black mb-4 flex items-center gap-3 uppercase tracking-wider text-emerald-400">
                            Plan de Fertilisation Global
                        </h2>
                        <div class="ai-box text-emerald-50 opacity-95 font-medium">
                            ${globalFertPlan}
                        </div>
                      </div>
                      <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                  </div>
              ` : ''}

              ${globalPestPlan ? `
                  <div class="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                      <div class="relative z-10">
                        <h2 class="text-lg font-black mb-4 flex items-center gap-3 uppercase tracking-wider text-red-400">
                            Calendrier de Protection Global
                        </h2>
                        <div class="ai-box text-stone-300 opacity-95 font-medium">
                            ${globalPestPlan}
                        </div>
                      </div>
                      <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-red-500/5 rounded-full blur-3xl"></div>
                  </div>
              ` : ''}

              <div class="mt-16 pt-8 border-t border-stone-200 text-center">
                  <p class="text-[9px] text-stone-400 font-black uppercase tracking-[0.3em] mb-2">Document officiel AgroExpert Afrique</p>
                  <p class="text-[10px] text-stone-500 font-medium">Expertise Agronomique IA au service de l'agriculteur moderne</p>
                  <p class="text-[10px] text-emerald-600 font-bold mt-2">(+235) 66022287 / 90659359</p>
              </div>
          </div>
          <script>
              window.onload = () => {
                  setTimeout(() => {
                      window.print();
                  }, 500);
              };
          </script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOnline) return;
    const mimeType = file.type;

    const reader = new FileReader();
    reader.onloadstart = () => setLoading(true);
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setMessages(prev => [...prev, { role: 'user', text: "Diagnostic photo en cours...", image: dataUrl }]);
      const diagnosis = await diagnosePlant(base64, mimeType);
      setMessages(prev => [...prev, { role: 'bot', text: diagnosis }]);
      saveToDiagnosisHistory(dataUrl, diagnosis);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const addStep = () => {
    if (!newStepDesc || !newStepDate) return;
    const newStep: ItineraryStep = {
      id: Date.now().toString(),
      description: newStepDesc,
      deadline: newStepDate,
      completed: false,
    };
    setSteps([...steps, newStep]);
    setNewStepDesc('');
    setShowCalendar(false);
  };

  const handleAiSuggest = async () => {
    if (!cropName || !isOnline) return;
    setSuggesting(true);
    const suggestedSteps = await generateCropItinerary(cropName);
    if (suggestedSteps) {
      const start = new Date(startDate);
      const newSteps: ItineraryStep[] = suggestedSteps.map((s: any, idx: number) => {
        const deadlineDate = new Date(start);
        deadlineDate.setDate(start.getDate() + s.daysFromStart);
        return {
          id: `ai-${Date.now()}-${idx}`,
          description: s.description,
          deadline: deadlineDate.toISOString().split('T')[0],
          completed: false,
          daysFromStart: s.daysFromStart
        };
      });
      setSteps(newSteps);
    }
    setSuggesting(false);
  };

  const handleFetchGlobalFert = async () => {
    if (!cropName || !isOnline) return;
    setFetchingGlobalFert(true);
    const plan = await getCropFertilizationPlan(cropName);
    setGlobalFertPlan(plan);
    setFetchingGlobalFert(false);
  };

  const handleFetchGlobalPest = async () => {
    if (!cropName || !isOnline) return;
    setFetchingGlobalPest(true);
    const plan = await getCropProtectionPlan(cropName, steps);
    setGlobalPestPlan(plan);
    setFetchingGlobalPest(false);
  };

  const handleFetchCurrentStagePestAdvice = async (stageDescription: string) => {
    if (!cropName || !isOnline || !stageDescription) return;
    setFetchingCurrentPest(true);
    const prompt = `En tant qu'expert phytopathologiste africain, identifie les parasites ou maladies les plus probables pour la culture de "${cropName}" lors de l'étape : "${stageDescription}". Suggère des méthodes de lutte (insecticides, fongicides, bio-pesticides comme le neem, ou méthodes culturales) adaptées au contexte africain (disponibilité et coût). Réponds par un texte court et percutant de maximum 80 mots.`;
    const advice = await getAgroAdvice(prompt);
    setCurrentStagePestAdvice(advice);
    setFetchingCurrentPest(false);
  };

  const toggleStep = (id: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const addCostToStep = (stepId: string) => {
    setSteps(steps.map(s => {
      if (s.id === stepId) {
        const newCost: InputCost = {
          id: Date.now().toString(),
          type: 'other',
          name: '',
          unitCost: 0,
          quantity: 1
        };
        return { ...s, costs: [...(s.costs || []), newCost] };
      }
      return s;
    }));
  };

  const updateCost = (stepId: string, costId: string, updates: Partial<InputCost>) => {
    setSteps(steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          costs: (s.costs || []).map(c => c.id === costId ? { ...c, ...updates } : c)
        };
      }
      return s;
    }));
  };

  const removeCost = (stepId: string, costId: string) => {
    setSteps(steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          costs: (s.costs || []).filter(c => c.id !== costId)
        };
      }
      return s;
    }));
  };

  const fetchFertilizerAdviceForStep = async (stepId: string, description: string) => {
    if (!cropName || !isOnline) return;
    
    // Toggle off if already showing
    if (stepAdvice[stepId] && !stepAdvice[stepId].loading) {
      const newAdvice = { ...stepAdvice };
      delete newAdvice[stepId];
      setStepAdvice(newAdvice);
      return;
    }

    setStepAdvice(prev => ({ ...prev, [stepId]: { text: '', loading: true } }));
    const advice = await getFertilizerAdvice(cropName, description);
    setStepAdvice(prev => ({ ...prev, [stepId]: { text: advice, loading: false } }));
  };

  const fetchPestAdviceForStep = async (stepId: string, description: string) => {
    if (!cropName || !isOnline) return;

    // Toggle off if already showing
    if (pestAdvice[stepId] && !pestAdvice[stepId].loading) {
      const newPestAdvice = { ...pestAdvice };
      delete newPestAdvice[stepId];
      setPestAdvice(newPestAdvice);
      return;
    }

    setPestAdvice(prev => ({ ...prev, [stepId]: { text: '', loading: true } }));
    
    const prompt = `En tant qu'expert phytopathologiste africain, identifie les parasites ou maladies les plus probables pour la culture de "${cropName}" lors de l'étape : "${description}". Suggère des méthodes de lutte (insecticides, fongicides, bio-pesticides comme le neem, ou méthodes culturales) adaptées au contexte africain (disponibilité et coût). Format: Court, structuré, maximum 100 mots.`;
    
    const advice = await getAgroAdvice(prompt);
    setPestAdvice(prev => ({ ...prev, [stepId]: { text: advice, loading: false } }));
  };

  const getStepStatus = (step: ItineraryStep) => {
    if (step.completed) return 'completed';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(step.deadline);
    if (deadlineDate < today) return 'overdue';
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 ? 'upcoming' : 'pending';
  };

  const counts = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return steps.reduce((acc, s) => {
      if (!s.completed) {
        const d = new Date(s.deadline);
        if (d < today) acc.overdue++;
        else if (Math.ceil((d.getTime() - today.getTime())/(86400000)) <= 3) acc.upcoming++;
      }
      return acc;
    }, { overdue: 0, upcoming: 0 });
  }, [steps]);

  // Current stage logic
  const currentStageInfo = useMemo(() => {
    if (!cropName || steps.length === 0) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const sorted = [...steps].sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    // Find the current active step (not completed and closest to today)
    const active = sorted.find(s => !s.completed && new Date(s.deadline) >= today);
    return active ? active.description : "Phase de récolte ou fin de cycle";
  }, [steps, cropName]);

  // Trigger stage specific advice when currentStageInfo changes
  useEffect(() => {
    if (currentStageInfo && isOnline && cropName) {
      handleFetchCurrentStagePestAdvice(currentStageInfo);
    }
  }, [currentStageInfo, isOnline, cropName]);

  // Custom Calendar Logic
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ 
        day: prevMonthLastDay - i, 
        month: month - 1, 
        year, 
        currentMonth: false,
        dateString: new Date(year, month - 1, prevMonthLastDay - i).toISOString().split('T')[0]
      });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i, 
        month, 
        year, 
        currentMonth: true,
        dateString: new Date(year, month, i).toISOString().split('T')[0]
      });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ 
        day: i, 
        month: month + 1, 
        year, 
        currentMonth: false,
        dateString: new Date(year, month + 1, i).toISOString().split('T')[0]
      });
    }
    return days;
  }, [calendarViewDate]);

  const changeMonth = (offset: number) => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + offset, 1));
  };

  const getStepsForDate = (dateStr: string) => {
    return steps.filter(s => s.deadline === dateStr);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header Statut & Profil */}
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-4 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative group cursor-pointer shrink-0" onClick={() => avatarInputRef.current?.click()}>
            <div className="w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center bg-stone-100 dark:bg-stone-800 shadow-inner">
              {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User size={24} className="text-stone-400" />}
            </div>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity flex items-center justify-center">
              <Camera size={14} className="text-white" />
            </div>
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/png, image/gif, image/jpeg, image/jpg" 
              onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onloadend = () => setUserAvatar(reader.result as string);
                 reader.readAsDataURL(file);
               }
            }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">Mon Espace Agricole</h4>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600'}`}>
                  {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
                {lastSaved && (
                  <span className="text-[8px] text-stone-300 dark:text-stone-600 font-bold uppercase flex items-center gap-1">
                    <Save size={8} /> {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
              <input 
                type="email" 
                value={userEmail} 
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="votre@email.com"
                className="text-[10px] font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-[180px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat IA */}
      <div className="flex flex-col h-[55vh] bg-white dark:bg-stone-900 rounded-[2rem] shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden relative transition-colors">
        <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-4 text-white flex items-center justify-between shadow-lg relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl"><Sparkles size={20} /></div>
            <div>
              <span className="font-bold block leading-tight">Assistant IA</span>
              <span className="text-[10px] uppercase font-black tracking-widest opacity-80 italic">Contextualisé Afrique</span>
            </div>
          </div>
          <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><RotateCcw size={18} /></button>
        </div>

        {!isOnline && (
          <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-2 animate-pulse">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Connexion perdue. IA indisponible.</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50/50 dark:bg-stone-950/20">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
               <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm ${
                 m.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 rounded-tl-none'
               }`}>
                 {m.image && <img src={m.image} className="rounded-xl mb-2 max-h-48 w-full object-cover" />}
                 <p className="text-sm leading-relaxed">{m.text}</p>
               </div>
            </div>
          ))}
          {loading && <div className="flex gap-2 p-2"><Loader2 size={16} className="animate-spin text-emerald-600" /><span className="text-xs italic text-stone-400 dark:text-stone-500">L'IA réfléchit...</span></div>}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 transition-colors">
           <div className="flex items-center gap-2">
             <button onClick={() => fileInputRef.current?.click()} disabled={!isOnline} className={`p-3 rounded-2xl ${isOnline ? 'text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-stone-300 dark:text-stone-700 cursor-not-allowed'}`}><ImageIcon size={20} /></button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/gif, image/jpeg, image/jpg" onChange={handleFileUpload} />
             <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSend()} 
              disabled={!isOnline} 
              placeholder={isOnline ? "Votre question..." : "IA Indisponible"} 
              className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition-colors" 
             />
             <button onClick={handleSend} disabled={!isOnline || !input.trim()} className="p-3.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl shadow-lg disabled:bg-stone-200 dark:disabled:bg-stone-800 transition-all active:scale-95"><Send size={18} /></button>
           </div>
        </div>
      </div>

      {/* Itinéraire Technique */}
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl text-amber-600 dark:text-amber-400 relative">
               <ClipboardList size={22} />
               {(counts.overdue > 0 || counts.upcoming > 0) && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-stone-900 animate-pulse"></span>}
             </div>
             <div>
               <h3 className="font-bold text-stone-900 dark:text-stone-100 leading-tight">Itinéraire Technique</h3>
               <div className="flex items-center gap-2">
                <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest">Sauvegarde Locale Active</p>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               </div>
               {totalCost > 0 && (
                 <div className="flex items-center gap-1 mt-1">
                   <Banknote size={12} className="text-emerald-600" />
                   <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Budget Total : {totalCost.toLocaleString()} FCFA</span>
                 </div>
               )}
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex items-center bg-stone-50 dark:bg-stone-800 rounded-2xl p-1 border border-stone-100 dark:border-stone-700 transition-colors">
               <button 
                onClick={handleResetItinerary}
                className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-white dark:hover:bg-stone-700 transition-all"
                title="Effacer tout l'itinéraire"
               >
                 <RefreshCw size={18} />
               </button>
               <div className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1"></div>
               <button 
                onClick={exportToPdf} 
                disabled={steps.length === 0} 
                className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                title="Exporter en PDF"
               >
                 <FileDown size={18} />
               </button>
               <button 
                onClick={shareViaEmail} 
                disabled={steps.length === 0} 
                className={`p-2 rounded-xl transition-all ${showShareSuccess === 'email' ? 'bg-emerald-500 text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700 hover:text-emerald-600'}`}
                title="Partager par Email"
               >
                 <Mail size={18} />
               </button>
               <button 
                onClick={shareViaNative} 
                disabled={steps.length === 0} 
                className={`p-2 rounded-xl transition-all ${showShareSuccess === 'share' ? 'bg-emerald-500 text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700 hover:text-emerald-600'}`}
                title="Partager un lien"
               >
                 <Share2 size={18} />
               </button>
               <button 
                onClick={copyItineraryToClipboard} 
                disabled={steps.length === 0} 
                className={`p-2 rounded-xl transition-all ${showShareSuccess === 'copy' ? 'bg-emerald-500 text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700 hover:text-emerald-600'}`}
                title="Copier en texte"
               >
                 {showShareSuccess === 'copy' ? <Check size={18} /> : <Link size={18} />}
               </button>
             </div>
             <button onClick={() => setIsItineraryOpen(!isItineraryOpen)} className="p-2.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={18} className={`transition-transform ${isItineraryOpen ? 'rotate-45' : ''}`} /></button>
          </div>
        </div>

        {isItineraryOpen && (
          <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">Culture</label>
                  <div className="flex gap-1">
                    <input value={cropName} onChange={e => setCropName(e.target.value)} placeholder="Ex: Mil" className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-colors" />
                    <button onClick={handleAiSuggest} disabled={!isOnline || !cropName || suggesting} className="p-2.5 bg-amber-500 text-white rounded-xl disabled:opacity-50 transition-all active:scale-90 shadow-sm">
                      {suggesting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">Nom Scientifique</label>
                  <input value={scientificName} onChange={e => setScientificName(e.target.value)} placeholder="Ex: Pennisetum glaucum" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 text-sm italic font-medium outline-none focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">Date du Semis</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </div>
             </div>

              {/* Dynamic Global Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Global Fertilizer Section */}
                {cropName && (
                  <div className="bg-stone-900 dark:bg-emerald-950 rounded-3xl p-5 border border-stone-800 dark:border-emerald-900/50 text-white relative overflow-hidden group transition-all">
                     <div className="relative z-10">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                             <Beaker size={20} />
                           </div>
                           <div>
                             <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-0.5">Focus Fertilisation</span>
                             <h4 className="text-sm font-bold">Suggestions : {cropName}</h4>
                           </div>
                         </div>
                         <button 
                           onClick={handleFetchGlobalFert}
                           disabled={!isOnline || fetchingGlobalFert}
                           className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                         >
                           {fetchingGlobalFert ? <Loader2 size={14} className="animate-spin" /> : "Générer Plan"}
                         </button>
                       </div>

                       {globalFertPlan ? (
                         <div className="text-xs text-stone-300 dark:text-stone-200 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap transition-all">
                           {globalFertPlan}
                         </div>
                       ) : (
                         <p className="text-[10px] text-stone-500 italic">Cliquez sur "Générer Plan" pour obtenir des recommandations d'engrais.</p>
                       )}
                     </div>
                     <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
                  </div>
                )}

                {/* Global Protection Section */}
                {cropName && (
                  <div className="bg-stone-900 dark:bg-red-950 rounded-3xl p-5 border border-stone-800 dark:border-red-900/50 text-white relative overflow-hidden group transition-all">
                     <div className="relative z-10">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div className="bg-red-500/20 p-2.5 rounded-xl text-red-400">
                             <ShieldAlert size={20} />
                           </div>
                           <div>
                             <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-0.5">Focus Protection</span>
                             <h4 className="text-sm font-bold">Plan Phyto : {cropName}</h4>
                           </div>
                         </div>
                         <button 
                           onClick={handleFetchGlobalPest}
                           disabled={!isOnline || fetchingGlobalPest}
                           className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                         >
                           {fetchingGlobalPest ? <Loader2 size={14} className="animate-spin" /> : "Générer Plan Phyto"}
                         </button>
                       </div>

                       {globalPestPlan ? (
                         <div className="text-xs text-stone-300 dark:text-stone-200 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap transition-all">
                           {globalPestPlan}
                         </div>
                       ) : (
                         <p className="text-[10px] text-stone-500 italic">Cliquez sur "Générer Plan Phyto" pour obtenir des conseils de protection.</p>
                       )}
                     </div>
                     <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all"></div>
                  </div>
                )}
              </div>

             <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-3xl border border-emerald-100/50 dark:border-emerald-900/20 space-y-4 transition-colors relative">
                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest block ml-1">Planifier une tâche manuelle</span>
                <div className="flex flex-col gap-3">
                  <input 
                    value={newStepDesc} 
                    onChange={e => setNewStepDesc(e.target.value)} 
                    placeholder="Ex: Deuxième sarclage" 
                    className="w-full bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" 
                  />
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="flex-1 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-2xl px-5 py-3 text-sm font-bold flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-emerald-600" />
                        <span>{new Date(newStepDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <ChevronRight size={16} className={`transition-transform duration-300 ${showCalendar ? 'rotate-90' : ''}`} />
                    </button>
                    <button 
                      onClick={addStep} 
                      disabled={!newStepDesc || !newStepDate}
                      className="bg-emerald-600 dark:bg-emerald-700 text-white px-6 rounded-2xl shadow-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Plus size={20} />
                      <span className="text-xs font-black uppercase">Ajouter</span>
                    </button>
                  </div>
                </div>

                {showCalendar && (
                  <div className="mt-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 z-50">
                    <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
                       <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
                       <div className="text-sm font-black uppercase tracking-widest">
                         {calendarViewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                       </div>
                       <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={20} /></button>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
                          <div key={d} className="text-center text-[8px] font-black text-stone-400 uppercase tracking-widest">{d}</div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                          const isSelected = newStepDate === day.dateString;
                          const hasSteps = getStepsForDate(day.dateString).length > 0;
                          const isToday = new Date().toISOString().split('T')[0] === day.dateString;
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => setNewStepDate(day.dateString)}
                              className={`
                                relative h-10 rounded-xl flex flex-col items-center justify-center transition-all text-xs font-bold
                                ${day.currentMonth ? 'text-stone-800 dark:text-stone-200' : 'text-stone-300 dark:text-stone-700'}
                                ${isSelected ? 'bg-emerald-600 text-white scale-110 shadow-lg z-10' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}
                                ${isToday && !isSelected ? 'border border-emerald-500' : ''}
                              `}
                            >
                              {day.day}
                              {hasSteps && !isSelected && (
                                <div className="absolute bottom-1.5 w-1 h-1 bg-emerald-500 rounded-full"></div>
                              )}
                              {hasSteps && isSelected && (
                                <div className="absolute bottom-1.5 w-1 h-1 bg-white rounded-full"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Tasks mini list on calendar */}
                    <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-700 max-h-32 overflow-y-auto scrollbar-hide">
                       <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-2">Tâches prévues le {new Date(newStepDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                       {getStepsForDate(newStepDate).length > 0 ? (
                         <div className="space-y-1.5">
                           {getStepsForDate(newStepDate).map(s => (
                             <div key={s.id} className="flex items-center gap-2 text-[10px] text-stone-600 dark:text-stone-300 font-medium">
                               <div className="w-1 h-1 bg-emerald-500 rounded-full shrink-0"></div>
                               <span className="truncate">{s.description}</span>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <span className="text-[10px] text-stone-400 italic">Aucune tâche prévue.</span>
                       )}
                    </div>
                  </div>
                )}
             </div>

             <div className="space-y-3">
                {steps.length > 0 ? (
                  steps.sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map(step => {
                    const status = getStepStatus(step);
                    const currentAdvice = stepAdvice[step.id];
                    const currentPestAdvice = pestAdvice[step.id];
                    const { icon, colorClass } = getStepIconWithContext(step.description);
                    const isFert = isFertilizationStep(step.description);
                    const isPhyto = isPhytoStep(step.description);
                    
                    return (
                      <div key={step.id} className="space-y-2">
                        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          step.completed ? 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 opacity-60' :
                          status === 'overdue' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' :
                          status === 'upcoming' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 shadow-sm'
                        }`}>
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                             <button onClick={() => toggleStep(step.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${step.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'}`}>
                               {step.completed && <Check size={14} />}
                             </button>
                             <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-xl shadow-sm shrink-0 transition-colors ${colorClass}`}>
                                  {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-bold truncate ${step.completed ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>{step.description}</p>
                                    {(isFert || isPhyto) && !currentAdvice && !currentPestAdvice && !step.completed && (
                                      <span className="flex items-center gap-1 text-[8px] font-black bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded uppercase animate-pulse">
                                        <Lightbulb size={10} /> Conseil dispo
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <span className={`text-[10px] font-bold flex items-center gap-1 uppercase ${status === 'overdue' ? 'text-red-500' : 'text-stone-400 dark:text-stone-500'}`}>
                                       <Calendar size={10} /> {new Date(step.deadline).toLocaleDateString('fr-FR')}
                                     </span>
                                     {status === 'overdue' && !step.completed && <span className="text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase animate-pulse">Retard</span>}
                                     {status === 'upcoming' && !step.completed && <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase">Urgent</span>}
                                  </div>
                                  {isFert && !step.completed && (
                                    <button 
                                      onClick={() => fetchFertilizerAdviceForStep(step.id, step.description)}
                                      disabled={currentAdvice?.loading}
                                      className={`mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 ${currentAdvice ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                    >
                                      {currentAdvice?.loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                      {currentAdvice ? 'Masquer Conseil' : 'Conseil Engrais IA'}
                                    </button>
                                  )}
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => fetchFertilizerAdviceForStep(step.id, step.description)} 
                              disabled={!isOnline || !cropName}
                              className={`p-2 rounded-xl transition-all shadow-sm ${currentAdvice ? 'bg-emerald-600 text-white rotate-12 scale-110' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-30'}`}
                              title="Conseils Engrais IA"
                            >
                              {currentAdvice?.loading ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
                            </button>

                            <button 
                              onClick={() => fetchPestAdviceForStep(step.id, step.description)} 
                              disabled={!isOnline || !cropName}
                              className={`p-2 rounded-xl transition-all shadow-sm ${currentPestAdvice ? 'bg-red-600 text-white rotate-12 scale-110' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-30'}`}
                              title="Traitement Antiparasitaire IA"
                            >
                              {currentPestAdvice?.loading ? <Loader2 size={16} className="animate-spin" /> : <Bug size={16} />}
                            </button>

                            <button 
                              onClick={() => setEditingCostsStepId(editingCostsStepId === step.id ? null : step.id)} 
                              className={`p-2 rounded-xl transition-all shadow-sm ${editingCostsStepId === step.id ? 'bg-amber-500 text-white rotate-12 scale-110' : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
                              title="Gérer les coûts"
                            >
                              <Banknote size={16} />
                            </button>

                            <button onClick={() => removeStep(step.id)} className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        
                        {/* Fertilizer Advice Dropdown */}
                        {currentAdvice && !currentAdvice.loading && (
                          <div className="bg-emerald-900 dark:bg-emerald-950 text-emerald-50 p-5 rounded-3xl text-xs leading-relaxed border border-emerald-800 dark:border-emerald-900/50 animate-in slide-in-from-top-2 ml-10 shadow-xl relative transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-emerald-400">
                                <Beaker size={14} />
                                <span className="font-black uppercase tracking-widest text-[9px]">Recommandations Fertilisation IA</span>
                              </div>
                              <button onClick={() => fetchFertilizerAdviceForStep(step.id, step.description)} className="text-emerald-400 hover:text-white transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                            <div className="whitespace-pre-wrap font-medium text-stone-200 dark:text-stone-300 bg-emerald-950/40 dark:bg-black/20 p-3 rounded-2xl border border-emerald-800/50">
                              {currentAdvice.text}
                            </div>
                            <div className="mt-3 flex items-center gap-1.5 text-[8px] font-bold text-emerald-500 uppercase tracking-widest opacity-60">
                              <Sparkles size={8} /> Dosages indicatifs pour contexte local
                            </div>
                          </div>
                        )}

                        {/* Pest Control Advice Dropdown */}
                        {currentPestAdvice && !currentPestAdvice.loading && (
                          <div className="bg-stone-900 dark:bg-stone-950 text-stone-50 p-5 rounded-3xl text-xs leading-relaxed border border-stone-800 animate-in slide-in-from-top-2 ml-10 shadow-xl relative transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-red-400">
                                <ShieldAlert size={14} />
                                <span className="font-black uppercase tracking-widest text-[9px]">Protection des Cultures IA</span>
                              </div>
                              <button onClick={() => fetchPestAdviceForStep(step.id, step.description)} className="text-stone-400 hover:text-white transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                            <div className="whitespace-pre-wrap font-medium text-stone-300 bg-stone-950/40 p-3 rounded-2xl border border-stone-800/50">
                              {currentPestAdvice.text}
                            </div>
                            <div className="mt-3 flex items-center gap-1.5 text-[8px] font-bold text-red-500 uppercase tracking-widest opacity-60">
                              <Sparkles size={8} /> Solutions bio & conventionnelles adaptées
                            </div>
                          </div>
                        )}

                        {/* Cost Management Dropdown */}
                        {editingCostsStepId === step.id && (
                          <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30 animate-in slide-in-from-top-2 ml-10 shadow-xl relative transition-all">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                 <ShoppingCart size={14} />
                                 <span className="font-black uppercase tracking-widest text-[9px]">Suivi des Coûts d'Intrants</span>
                               </div>
                               <button onClick={() => setEditingCostsStepId(null)} className="text-amber-400 hover:text-amber-600 transition-colors">
                                 <X size={14} />
                               </button>
                             </div>

                             <div className="space-y-3">
                               {(step.costs || []).map(cost => (
                                 <div key={cost.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white dark:bg-stone-800 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-sm">
                                   <div className="sm:col-span-1">
                                      <select 
                                        value={cost.type} 
                                        onChange={e => updateCost(step.id, cost.id, { type: e.target.value as any })}
                                        className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 text-[10px] font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
                                      >
                                        <option value="seed">Semences</option>
                                        <option value="fertilizer">Engrais</option>
                                        <option value="pesticide">Pesticides</option>
                                        <option value="other">Autre</option>
                                      </select>
                                   </div>
                                   <div className="sm:col-span-1">
                                      <input 
                                        placeholder="Nom" 
                                        value={cost.name} 
                                        onChange={e => updateCost(step.id, cost.id, { name: e.target.value })}
                                        className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 text-[10px] font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
                                      />
                                   </div>
                                   <div className="flex gap-2 sm:col-span-2">
                                      <div className="flex-1 flex flex-col">
                                        <label className="text-[7px] font-black text-stone-400 uppercase ml-1">Prix Unitaire</label>
                                        <input 
                                          type="number" 
                                          value={cost.unitCost} 
                                          onChange={e => updateCost(step.id, cost.id, { unitCost: Number(e.target.value) })}
                                          className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 text-[10px] font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                      </div>
                                      <div className="flex-1 flex flex-col">
                                        <label className="text-[7px] font-black text-stone-400 uppercase ml-1">Quantité</label>
                                        <input 
                                          type="number" 
                                          value={cost.quantity} 
                                          onChange={e => updateCost(step.id, cost.id, { quantity: Number(e.target.value) })}
                                          className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 text-[10px] font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                      </div>
                                      <button onClick={() => removeCost(step.id, cost.id)} className="mt-4 text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                      </button>
                                   </div>
                                 </div>
                               ))}

                               <button 
                                 onClick={() => addCostToStep(step.id)}
                                 className="w-full py-2 border-2 border-dashed border-amber-200 dark:border-amber-900/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 transition-all flex items-center justify-center gap-2"
                               >
                                 <Plus size={14} /> Ajouter un intrant
                               </button>

                               {(step.costs || []).length > 0 && (
                                 <div className="pt-3 border-t border-amber-100 dark:border-amber-900/20 flex justify-between items-center">
                                   <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Total Étape</span>
                                   <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                     {(step.costs || []).reduce((acc, c) => acc + (c.unitCost * c.quantity), 0).toLocaleString()} FCFA
                                   </span>
                                 </div>
                               )}
                             </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-3xl">
                     <ClipboardList className="mx-auto text-stone-200 dark:text-stone-700 mb-2" size={32} />
                     <p className="text-xs text-stone-400 dark:text-stone-600 font-bold uppercase tracking-widest">Aucun plan enregistré localement</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Plan de Protection Phytosanitaire IA */}
      {cropName && (
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-xl text-red-600 dark:text-red-400">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 leading-tight">Plan de Protection IA</h3>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest">Protection des Cultures : {cropName}</p>
              </div>
            </div>
            <button 
              onClick={handleFetchGlobalPest}
              disabled={!isOnline || fetchingGlobalPest}
              className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {fetchingGlobalPest ? <Loader2 size={16} className="animate-spin" /> : <Bug size={16} />}
              {fetchingGlobalPest ? "Génération..." : "Générer Plan Phyto"}
            </button>
          </div>

          <div className="p-6">
            {/* Targeted Stage Protection Section */}
            {currentStageInfo && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-5 border border-red-100 dark:border-red-900/20 mb-6 animate-in fade-in zoom-in-95">
                 <div className="flex items-center gap-2 mb-3">
                   <Zap size={16} className="text-amber-500" />
                   <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Alerte Stade Actuel : {currentStageInfo}</span>
                 </div>
                 {fetchingCurrentPest ? (
                   <div className="flex items-center gap-3 py-2">
                     <Loader2 size={14} className="animate-spin text-red-500" />
                     <span className="text-xs italic text-stone-500">Analyse des risques en cours...</span>
                   </div>
                 ) : currentStagePestAdvice ? (
                   <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic bg-white dark:bg-stone-800/50 p-4 rounded-2xl border border-red-50 dark:border-red-900/10 shadow-inner">
                     {currentStagePestAdvice}
                   </div>
                 ) : (
                   <p className="text-xs text-stone-500 italic">Connectez-vous pour charger les conseils spécifiques à ce stade.</p>
                 )}
              </div>
            )}

            {globalPestPlan ? (
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-3xl p-6 border border-stone-100 dark:border-stone-700 whitespace-pre-wrap text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-medium shadow-inner animate-in fade-in duration-500">
                {globalPestPlan}
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-3xl">
                <Bug className="mx-auto text-stone-200 dark:text-stone-700 mb-3" size={40} />
                <p className="text-xs text-stone-400 dark:text-stone-600 font-bold uppercase tracking-widest px-10">
                  Cliquez sur "Générer Plan Phyto" pour obtenir un calendrier de traitement complet adapté à votre culture et vos étapes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Common Diseases Library */}
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
           <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-xl text-red-600 dark:text-red-400">
             <Microscope size={22} />
           </div>
           <div>
             <h3 className="font-bold text-stone-900 dark:text-stone-100 leading-tight">Bibliothèque des Maladies</h3>
             <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest">Connaissances Phytopathologiques IA</p>
           </div>
        </div>

        {/* Horizontal Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-stone-50 dark:border-stone-800 p-2 bg-stone-50/50 dark:bg-stone-950/20">
          {COMMON_DISEASES.map(disease => (
            <button
              key={disease}
              onClick={() => setSelectedDiseaseTab(disease)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedDiseaseTab === disease 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105 z-10' 
                  : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'
              }`}
            >
              {disease}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loadingDisease ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
               <Loader2 size={40} className="animate-spin text-emerald-600" />
               <p className="text-xs font-black text-stone-400 uppercase tracking-widest animate-pulse">L'expert IA rédige la fiche technique...</p>
            </div>
          ) : diseasesLibrary[selectedDiseaseTab] ? (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* Context Badge */}
               {cropName && (
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50 inline-flex items-center gap-2">
                   <CheckCircle2 size={12} className="text-emerald-600" />
                   <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Spécialisé pour : {cropName}</span>
                 </div>
               )}

               <section>
                 <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                   <Zap size={14} className="text-amber-500" /> Description de la Maladie
                 </h4>
                 <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium bg-stone-50 dark:bg-stone-800/40 p-5 rounded-[1.5rem] border border-stone-100 dark:border-stone-800/50">
                   {diseasesLibrary[selectedDiseaseTab].description}
                 </p>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <section>
                   <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                     <ShieldAlert size={14} /> Symptômes Clés
                   </h4>
                   <ul className="space-y-2 bg-red-50/30 dark:bg-red-900/5 p-5 rounded-[1.5rem] border border-red-100 dark:border-red-900/20">
                     {diseasesLibrary[selectedDiseaseTab].symptoms.map((s, i) => (
                       <li key={i} className="text-xs text-stone-600 dark:text-stone-400 font-bold flex items-start gap-3">
                         <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 mt-1.5"></span>
                         {s}
                       </li>
                     ))}
                   </ul>
                 </section>

                 <section>
                   <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                     <ShieldCheck size={14} /> Traitement Bio
                   </h4>
                   <ul className="space-y-2 bg-emerald-50/30 dark:bg-emerald-900/5 p-5 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-900/20">
                     {diseasesLibrary[selectedDiseaseTab].bioTreatments.map((t, i) => (
                       <li key={i} className="text-xs text-stone-600 dark:text-stone-400 font-bold flex items-start gap-3">
                         <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-1.5"></span>
                         {t}
                       </li>
                     ))}
                   </ul>
                 </section>
               </div>

               <section>
                 <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                   <ThermometerSnowflake size={14} className="text-blue-400" /> Solutions Conventionnelles
                 </h4>
                 <div className="bg-stone-900 dark:bg-stone-950 p-6 rounded-[1.5rem] border border-stone-800">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {diseasesLibrary[selectedDiseaseTab].chemicalTreatments.map((t, i) => (
                        <li key={i} className="text-[11px] text-stone-300 font-medium flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center text-[10px] text-blue-400 font-black">
                            {i + 1}
                          </div>
                          {t}
                        </li>
                      ))}
                    </ul>
                 </div>
               </section>
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-3xl">
               {!isOnline ? (
                 <>
                   <WifiOff className="mx-auto text-stone-200 dark:text-stone-700 mb-2" size={32} />
                   <p className="text-xs text-stone-400 dark:text-stone-600 font-bold uppercase tracking-widest px-10 leading-relaxed">Cette fiche n'a pas été pré-chargée. Reconnectez-vous pour l'activer.</p>
                 </>
               ) : (
                 <p className="text-xs text-stone-400 font-bold uppercase animate-pulse tracking-widest">Initialisation de la bibliothèque...</p>
               )}
            </div>
          )}
        </div>
      </div>

      <p className="text-[8px] text-center text-stone-300 dark:text-stone-600 font-bold uppercase tracking-[0.2em] py-2">
        AgroExpert Afrique • Sécurité & Sauvegarde Locale Active
      </p>
    </div>
  );
};

export default AgroExpert;
