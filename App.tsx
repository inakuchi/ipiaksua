import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { generateDeterministicAvatar, Theme } from './services/avatarGenerator';
import { db } from './services/firebase';
// Using Firebase v9+ modular imports
import { getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const PublishIcon = () => (
    <svg xmlns="http:zz//www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);


type View = 'generator' | 'gallery' | 'how';

interface Creation {
  id: string;
  seed: string;
  theme: Theme;
}

const AVATAR_SIZE = 400;

const themeConfig = {
  ipiak: {
    accentBg: 'bg-red-600',
    accentBgHover: 'hover:bg-red-500',
    accentText: 'text-red-500',
    accentRing: 'focus:ring-red-500',
    accentBorder: 'border-red-500',
    accentBorderHover: 'group-hover:border-red-500',
    switchColor: '#DC2626', // red-600
    themeSelectorBg: 'bg-red-600'
  },
  sua: {
    accentBg: 'bg-stone-700',
    accentBgHover: 'hover:bg-stone-600',
    accentText: 'text-stone-400',
    accentRing: 'focus:ring-stone-500',
    accentBorder: 'border-stone-400',
    accentBorderHover: 'group-hover:border-stone-500',
    switchColor: '#57534E', // stone-600
    themeSelectorBg: 'bg-stone-600'
  }
};

const removeSvgClipping = (svg: string): string => {
    if (!svg) return '';
    return svg
        .replace(/<defs>.*?<\/defs>/s, '')
        .replace(/clip-path=".*?"/g, '');
};

const generateAvatarDataUrlWithoutClip = (userId: string, size: number = 200, animated: boolean = false, theme: Theme = 'ipiak'): string => {
  const svg = generateDeterministicAvatar(userId, { size, animated, theme });
  const modifiedSvg = removeSvgClipping(svg);
  const encoded = encodeURIComponent(modifiedSvg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}


const GeneratorView: React.FC<{
  userId: string;
  setUserId: (id: string) => void;
  avatarSvgString: string;
  handleDownload: () => void;
  handlePublish: () => Promise<void>;
  isPublishing: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: typeof themeConfig.ipiak;
}> = ({ userId, setUserId, avatarSvgString, handleDownload, handlePublish, isPublishing, theme, setTheme, currentTheme }) => (
    <div className="w-full flex-1 flex flex-col">

      {/* Avatar display area - constrained height */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {avatarSvgString ? (
          <div 
            className="w-full aspect-square shadow-lg transition-transform duration-300 ease-in-out hover:scale-[1.02] cursor-pointer"
            style={{ maxWidth: '400px', maxHeight: '400x' }}
            dangerouslySetInnerHTML={{ __html: avatarSvgString }} 
          />
        ) : (
          <div 
            className="w-full aspect-square flex items-center justify-center text-stone-500 border-2 border-dashed border-stone-700 rounded-full"
            style={{ maxWidth: '400px', maxHeight: '400px' }}
          >
            <p className="text-center">Introduce un texto<br />para generar</p>
          </div>
        )}
      </div>

      {/* Bottom controls - responsive layout */}
      <div className="flex justify-center flex-shrink-0 px-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full max-w-2xl">
          {/* Top row on mobile: Input field */}
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Escribe algo..."
            className={`w-full sm:w-64 bg-stone-800 text-white text-center rounded-lg px-3 py-2 text-sm border border-stone-700 focus:outline-none focus:ring-2 ${currentTheme.accentRing} transition-all duration-300`}
          />
          
          {/* Bottom row on mobile: Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme selector */}
            <div className="flex items-center space-x-1 p-1 bg-stone-800 border border-stone-700 rounded-lg">
              <button 
                onClick={() => setTheme('ipiak')}
                className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors duration-300 ${theme === 'ipiak' ? `${themeConfig.ipiak.themeSelectorBg} text-white shadow` : 'text-stone-400 hover:bg-stone-700'}`}>
                Ipiak
              </button>
              <button 
                onClick={() => setTheme('sua')}
                className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors duration-300 ${theme === 'sua' ? `${themeConfig.sua.themeSelectorBg} text-white shadow` : 'text-stone-400 hover:bg-stone-700'}`}>
                Sua
              </button>
            </div>

            {/* Animation toggle */}
            <label htmlFor="animation-toggle" className="flex items-center cursor-pointer group">
              <div className="relative">
                <input type="checkbox" id="animation-toggle" className="sr-only" />
                <div className="block bg-stone-700 w-10 h-5 rounded-full group-hover:bg-stone-600 transition-colors duration-300"></div>
                <div className="dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform"></div>
              </div>
              <div className="ml-2 text-stone-300 text-xs hidden sm:block">Anim</div>
            </label>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing || !userId.trim()}
              className={`flex items-center justify-center bg-stone-700 text-white font-medium py-2 px-3 sm:px-4 text-sm rounded-lg hover:bg-stone-600 transition-all duration-200 ease-in-out hover:scale-105 hover:brightness-110 shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <PublishIcon />
              <span className="hidden sm:inline ml-1">{isPublishing ? 'Publicando...' : 'Publicar'}</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        input:checked ~ .dot {
          transform: translateX(20px);
          background-color: ${currentTheme.switchColor};
        }
      `}</style>
    </div>
);

const GalleryView: React.FC<{
  theme: Theme;
  currentTheme: typeof themeConfig.ipiak;
}> = ({ theme, currentTheme }) => {
    const [creations, setCreations] = useState<Creation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCreations = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const creationsRef = collection(db, 'creations');
                const q = query(creationsRef, orderBy('createdAt', 'desc'), limit(50));
                const querySnapshot = await getDocs(q);
                const creationsList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        seed: data.seed,
                        theme: data.theme
                    } as Creation;
                });
                setCreations(creationsList);
            } catch (err: any) {
                console.error("Error fetching creations:", err.message);
                setError("No se pudo cargar la galería. Revisa tu conexión y la configuración de Firebase.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCreations();
    }, []);

    if (isLoading) {
        return <div className="text-center text-stone-400 mt-16">Cargando galería...</div>;
    }
    
    if (error) {
        return <div className="text-center text-red-400 mt-16">{error}</div>;
    }

    if (creations.length === 0) {
        return <div className="text-center text-stone-400 mt-16">La galería está vacía. ¡Sé el primero en publicar!</div>;
    }

    return (
        <section className="w-full max-w-5xl mt-8 px-4">
            <h2 className="text-4xl font-bold text-center text-stone-200 mb-8" style={{fontFamily: 'serif'}}>Galería</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {creations.map((creation) => (
                <div key={creation.id} className="flex flex-col items-center space-y-2 group cursor-pointer">
                  <div className={`w-24 h-24 relative transition-all duration-300 ease-out group-hover:scale-110 group-hover:z-10`}>
                    <div className={`absolute inset-0 rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-opacity-80 ${theme === 'ipiak' ? 'group-hover:ring-red-500' : 'group-hover:ring-stone-500'}`}>
                      <div 
                        className="absolute inset-0"
                        dangerouslySetInnerHTML={{
                          __html: generateDeterministicAvatar(creation.seed, {
                            size: 96,
                            animated: false,
                            theme: creation.theme
                          })
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-stone-400 text-sm font-mono group-hover:text-white transition-colors duration-300">{creation.seed}</p>
                </div>
              ))}
            </div>
        </section>
    );
};


const App: React.FC = () => {
  const [userId, setUserId] = useState<string>('ipiak');
  const [isAnimated, setIsAnimated] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<View>('generator');
  const [theme, setTheme] = useState<Theme>('ipiak');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const currentTheme = themeConfig[theme];

  // The background colors are extracted from the generator logic to ensure they match perfectly.
  // Ipiak: A deep, earthy chocolate-red.
  // Sua: A very dark, near-black gray.
  const appStyle = {
    backgroundColor: theme === 'ipiak' ? '#1A0E09' : '#0F0F0F'
  };

  const avatarSvgString = useMemo(() => {
    if (!userId) return '';
    const rawSvg = generateDeterministicAvatar(userId, { size: AVATAR_SIZE, animated: isAnimated, theme });
    return removeSvgClipping(rawSvg);
  }, [userId, isAnimated, theme]);

  const handleDownload = () => {
    const encoded = encodeURIComponent(avatarSvgString)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');
    const dataUrl = `data:image/svg+xml,${encoded}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${userId.replace(/\s+/g, '_')}_ipiak_sua_avatar.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePublish = async () => {
    if (!userId.trim()) {
        alert("Por favor, introduce un texto para publicar.");
        return;
    }
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "creations"), {
        seed: userId,
        theme: theme,
        createdAt: serverTimestamp()
      });
      alert('¡Publicado con éxito!');
      setCurrentView('gallery'); // Switch to gallery after successful publish
    } catch (e: any) {
      console.error("Error al publicar: ", e.message);
      alert('Hubo un error al publicar. Revisa la configuración de Firebase.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div 
      style={appStyle}
      className={`h-screen text-stone-200 font-sans px-4 sm:px-8 pt-4 sm:pt-8 pb-2 sm:pb-4 flex flex-col items-center transition-colors duration-500 overflow-hidden`}
    >
      

      {/* Header with logo and navigation */}
      <header className="w-full flex justify-between items-center mb-4">
        {/* Logo - top left */}
        <h1 className="text-2xl font-bold text-stone-200 cursor-pointer" 
            style={{fontFamily: 'serif'}}
            onClick={() => setCurrentView('generator')}>
          Ipiak&Sua
        </h1>
        
        {/* Navigation toggle - center */}
        <div className="flex items-center">
          {currentView === 'generator' ? (
            <button 
              onClick={() => setCurrentView('gallery')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${currentTheme.accentBg} ${currentTheme.accentBgHover} text-white`}>
              Galería
            </button>
          ) : currentView === 'gallery' ? (
            <button 
              onClick={() => setCurrentView('generator')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${currentTheme.accentBg} ${currentTheme.accentBgHover} text-white`}>
              Generador
            </button>
          ) : (
            <button 
              onClick={() => setCurrentView('generator')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${currentTheme.accentBg} ${currentTheme.accentBgHover} text-white`}>
              Generador
            </button>
          )}
        </div>
        
        {/* How it works - top right */}
        <button 
          onClick={() => setCurrentView('how')}
          className="text-sm text-stone-400 hover:text-stone-200 transition-colors duration-300">
          ¿Cómo funciona?
        </button>
      </header>
      <main className="flex-1 w-full flex flex-col items-center">

      {currentView === 'generator' ? (
        <GeneratorView 
            userId={userId} 
            setUserId={setUserId} 
            avatarSvgString={avatarSvgString} 
            handleDownload={handleDownload}
            handlePublish={handlePublish}
            isPublishing={isPublishing}
            theme={theme}
            setTheme={setTheme}
            currentTheme={currentTheme}
        />
      ) : currentView === 'gallery' ? (
        <GalleryView 
          theme={theme} 
          currentTheme={currentTheme} 
        />
      ) : (
        <HowItWorksView />
      )}
    </main>
      {/* Footer */}
      <footer className="text-center text-stone-500 text-sm leading-none">
        <p>Ipiak&Sua™ by TGOW™</p>
      </footer>
    </div>
  );
};


const HowItWorksView: React.FC = () => (
  <section className="max-w-3xl w-full mx-auto pt-8 pb-16">
    <h2 className="text-4xl font-bold text-center mb-8" style={{fontFamily: 'serif'}}>¿Cómo funciona?</h2>
    <div className="space-y-8 text-stone-300 leading-relaxed">
      <div>
        <h3 className="text-2xl font-semibold mb-2 text-white">1. Generador de Avatares</h3>
        <p>Introduce un texto, selecciona un color y pulsa «Publicar». El generador crea un avatar determinístico: la misma semilla siempre genera el mismo diseño.</p>
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-2 text-white">2. Galería de Avatares</h3>
        <p>Descubre los avatares generados por la comunidad en una cuadrícula ordenada y responsive. Cada tarjeta muestra el avatar y su semilla.</p>
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-2 text-white">3. Comparte y Explora</h3>
        <p>Cuando publicas, tu avatar se agrega inmediatamente a la galería. Explora, descarga o reutiliza la semilla para recrear cualquier diseño.</p>
      </div>
    </div>
  </section>
);

export default App;