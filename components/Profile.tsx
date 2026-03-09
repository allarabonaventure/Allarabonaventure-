
import React, { useState, useRef } from 'react';
import { 
  User as UserIcon, Camera, Mail, Phone, ShieldCheck, History, 
  Trash2, Eye, Calendar, CheckCircle2, Settings, Bell, Languages, 
  Moon, Sun, ChevronRight, Edit3, Save, X, BarChart3, Award, Zap
} from 'lucide-react';
import { User } from '../types';

interface ProfileProps {
  user: User;
  setUser: (user: User) => void;
  diagnosisHistory: any[];
  clearHistory: () => void;
  setSelectedDiagnosis: (item: any) => void;
  enrolledCourseIds: string[];
  onUpgrade: () => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  user, 
  setUser, 
  diagnosisHistory, 
  clearHistory, 
  setSelectedDiagnosis,
  enrolledCourseIds,
  onUpgrade
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name: editName,
      email: editEmail,
      phone: editPhone
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSetting = (key: 'notifications' | 'theme') => {
    if (!user.settings) return;
    const newSettings = { ...user.settings };
    if (key === 'theme') {
      newSettings.theme = newSettings.theme === 'light' ? 'dark' : 'light';
    } else {
      newSettings.notifications = !newSettings.notifications;
    }
    setUser({ ...user, settings: newSettings });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 overflow-hidden shadow-lg flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <UserIcon size={40} className="text-stone-400" />
                )}
              </div>
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all active:scale-90"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
            </div>
          </div>
          <div className="absolute top-4 right-6">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
              {isEditing ? <X size={16} /> : <Edit3 size={16} />}
              {isEditing ? "Annuler" : "Modifier"}
            </button>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          {isEditing ? (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nom Complet</label>
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    value={editEmail} 
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Téléphone</label>
                  <input 
                    value={editPhone} 
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={handleSaveProfile}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> Enregistrer les modifications
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">{user.name}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-sm font-medium">
                    <Mail size={14} className="text-emerald-600" />
                    {user.email || "Non renseigné"}
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-sm font-medium">
                    <Phone size={14} className="text-emerald-600" />
                    {user.phone || "Non renseigné"}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                    user.plan === 'Pro' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}>
                    Membre {user.plan}
                  </span>
                  {user.plan === 'Free' && (
                    <button 
                      onClick={onUpgrade}
                      className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <Zap size={10} /> Devenir Pro
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center gap-4">
                <div className="text-center px-4 border-r border-stone-200 dark:border-stone-700">
                  <span className="block text-2xl font-black text-emerald-600">85%</span>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Score IA</span>
                </div>
                <div className="text-center px-4">
                  <span className="block text-2xl font-black text-amber-500">12</span>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Badges</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats & Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section>
            <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] mb-4 ml-2 flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-600" />
              Progression des Apprentissages
            </h3>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              {enrolledCourseIds.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-400">Modules en cours</span>
                    <span className="text-xs font-black text-emerald-600">{enrolledCourseIds.length} modules</span>
                  </div>
                  <div className="space-y-4">
                    {/* Mock progress for demonstration */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                        <span>Maïs : Technique 8t/ha</span>
                        <span>65%</span>
                      </div>
                      <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full w-[65%] shadow-sm"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                        <span>Pédologie : Sols Africains</span>
                        <span>30%</span>
                      </div>
                      <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[30%] shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Aucun module commencé</p>
                </div>
              )}
            </div>
          </section>

          {/* Activity History */}
          <section>
            <div className="flex items-center justify-between mb-4 ml-2">
              <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={16} className="text-emerald-600" />
                Derniers Diagnostics
              </h3>
              {diagnosisHistory.length > 0 && (
                <button onClick={clearHistory} className="text-red-500 hover:text-red-600 p-1 transition-colors">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            {diagnosisHistory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {diagnosisHistory.slice(0, 4).map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedDiagnosis(item)}
                    className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-500 transition-all group"
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
              <div className="py-12 bg-white dark:bg-stone-900 rounded-[2rem] border-2 border-dashed border-stone-200 dark:border-stone-800 text-center">
                <ShieldCheck className="mx-auto text-stone-200 dark:text-stone-700 mb-2" size={32} />
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Aucun diagnostic récent</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Quick Stats */}
          <section>
            <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] mb-4 ml-2">Résumé</h3>
            <div className="grid grid-cols-1 gap-4">
               <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 flex flex-col items-center shadow-sm">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 mb-3">
                    <Award size={24} />
                  </div>
                  <span className="text-3xl font-black text-stone-900 dark:text-stone-100">{enrolledCourseIds.length}</span>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center mt-1">Modules suivis</span>
               </div>
               <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 flex flex-col items-center shadow-sm">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl text-amber-600 mb-3">
                    <History size={24} />
                  </div>
                  <span className="text-3xl font-black text-stone-900 dark:text-stone-100">{diagnosisHistory.length}</span>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center mt-1">Diagnostics</span>
               </div>
            </div>
          </section>

          {/* Settings Section */}
          <section>
            <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] mb-4 ml-2 flex items-center gap-2">
              <Settings size={16} className="text-emerald-600" />
              Préférences
            </h3>
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="p-4 space-y-1">
                <button 
                  onClick={() => toggleSetting('notifications')}
                  className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                      <Bell size={16} />
                    </div>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Notifications</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${user.settings?.notifications ? 'bg-emerald-600' : 'bg-stone-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${user.settings?.notifications ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                </button>

                <button 
                  onClick={() => toggleSetting('theme')}
                  className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600">
                      {user.settings?.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </div>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Mode Sombre</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${user.settings?.theme === 'dark' ? 'bg-emerald-600' : 'bg-stone-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${user.settings?.theme === 'dark' ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                </button>

                <button className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">
                      <Languages size={16} />
                    </div>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Langue</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{user.settings?.language || 'Français'}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
