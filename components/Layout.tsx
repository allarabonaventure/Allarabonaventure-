
import React, { useEffect } from 'react';
import { Home, Search, Book, User, Bell, Menu, X, Sun, Moon, Languages, Settings, HelpCircle, LogOut, Phone, Mail, ChevronRight, BellRing } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('agroexpert_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [language, setLanguage] = React.useState('Français');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('agroexpert_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { id: 'home', label: 'Accueil', icon: <Home size={24} /> },
    { id: 'learn', label: 'Formation', icon: <Book size={24} /> },
    { id: 'expert', label: 'IA Expert', icon: <Search size={24} /> },
    { id: 'profile', label: 'Profil', icon: <User size={24} /> },
  ];

  const handleCall = (num: string) => {
    window.location.href = `tel:${num}`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'} pb-20 overflow-x-hidden`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
            <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight text-emerald-900 dark:text-emerald-500">AgroExpert</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>
          <button className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors relative">
            <Bell size={22} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-stone-900"></span>
          </button>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Side Settings Menu (Drawer) */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Panel */}
        <div className={`absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-stone-900 shadow-2xl transition-transform duration-300 transform p-6 flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">Paramètres</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
            {/* Language Section */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest px-1">Configuration Langue</h3>
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 border border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <Languages size={18} />
                    </div>
                    <span className="font-bold text-stone-700 dark:text-stone-300">Langue actuelle</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-500">{language}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Français', 'English', 'العربية'].map((lang) => (
                    <button 
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === lang ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-500 border border-stone-100 dark:border-stone-700'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* App Settings */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest px-1">Réglages Application</h3>
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800">
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-4 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </div>
                    <span className="font-bold text-stone-700 dark:text-stone-300">Mode Sombre</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-emerald-600' : 'bg-stone-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
                  </div>
                </button>
                <div className="h-px bg-stone-100 dark:bg-stone-800 mx-4" />
                <button className="w-full flex items-center justify-between p-4 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                      <BellRing size={18} />
                    </div>
                    <span className="font-bold text-stone-700 dark:text-stone-300">Notifications Push</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors bg-emerald-600`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full left-6`} />
                  </div>
                </button>
              </div>
            </section>

            {/* Support Section */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest px-1">Aide & Assistance</h3>
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 border border-stone-100 dark:border-stone-800 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <span className="block font-bold text-stone-700 dark:text-stone-300 text-sm">Support Technique</span>
                    <p className="text-[10px] text-stone-500 leading-relaxed">Notre équipe d'agronomes et techniciens est à votre écoute.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleCall('+23566022287')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 hover:border-emerald-500 transition-all group"
                  >
                    <Phone size={14} className="text-emerald-600" />
                    <span className="text-[9px] font-black uppercase text-stone-400 group-hover:text-emerald-600">Appeler</span>
                  </button>
                  <button 
                    onClick={() => window.location.href = 'mailto:allarabonaventure@gmail.com'}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 hover:border-emerald-500 transition-all group"
                  >
                    <Mail size={14} className="text-blue-600" />
                    <span className="text-[9px] font-black uppercase text-stone-400 group-hover:text-blue-600">Email</span>
                  </button>
                </div>
                <div className="bg-emerald-600/5 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <span className="block text-[8px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1">Contacts Directs</span>
                  <p className="text-[10px] font-bold text-emerald-900 dark:text-emerald-100 tracking-tight">
                    (+235) 66022287 / 90659359
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="pt-6 border-t border-stone-100 dark:border-stone-800">
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
              <LogOut size={18} /> Déconnexion
            </button>
            <p className="text-center text-[8px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-[0.3em] mt-4">AgroExpert Afrique v1.2</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-6 z-50 pointer-events-none">
        <nav className="max-w-lg mx-auto bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 px-2 sm:px-6 py-2 sm:py-3 rounded-[2rem] sm:rounded-[2.5rem] flex justify-around items-center shadow-2xl shadow-emerald-900/10 dark:shadow-none transition-all pointer-events-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex-1 flex flex-col items-center gap-0.5 sm:gap-1 group transition-all duration-300 active:scale-90 touch-none ${
                  isActive 
                    ? 'text-emerald-600 dark:text-emerald-500' 
                    : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'
                }`}
              >
                <div className={`p-2 sm:p-2.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 scale-110' : 'bg-transparent'}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { 
                    size: 20,
                    strokeWidth: isActive ? 2.5 : 2
                  })}
                </div>
                <span className={`text-[8px] sm:text-[9px] uppercase tracking-widest font-black transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 h-0 overflow-hidden'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-emerald-600 dark:bg-emerald-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
