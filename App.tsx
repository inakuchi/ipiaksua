

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { generateDeterministicAvatar, Theme } from './services/avatarGenerator';
import { db, auth } from './services/firebase';
import { signInAnonymously } from "firebase/auth";
import firebase from "firebase/app";

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 1  10 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const PublishIcon = () => (
    <svg xmlns="http:zz//www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);


type View = 'generator' | 'gallery';

interface Creation {
  id: string;
  seed: string;
  theme: Theme;
}

const AVATAR_SIZE = 320;

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
    <main className="w-full max-w-md flex flex-col items-center pt-8">
      <h1 className="text-6xl font-bold text-stone-200" style={{fontFamily: 'serif'}}>
        Ipiak&Sua
      </h1>
      <input
        type="text"
        id="userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Escribe algo..."
        className={`w-full bg-stone-800 text-white text-center rounded-lg px-4 py-3 mt-8 border border-stone-700 focus:outline-none focus:ring-2 ${currentTheme.accentRing} transition-all duration-300`}
      />
      
      <div className="flex items-center space-x-2 mt-6 p-1 bg-stone-800 border border-stone-700 rounded-lg">
        <button 
          onClick={() => setTheme('ipiak')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${theme === 'ipiak' ? `${themeConfig.ipiak.themeSelectorBg} text-white shadow` : 'text-stone-400 hover:bg-stone-700'}`}>
          Ipiak
        </button>
        <button 
          onClick={() => setTheme('sua')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${theme === 'sua' ? `${themeConfig.sua.themeSelectorBg} text-white shadow` : 'text-stone-400 hover:bg-stone-700'}`}>
          Sua
        </button>
      </div>

      {avatarSvgString ? (
        <div className="mt-6 flex flex-col items-center w-full">
          <div 
              className="w-full aspect-square shadow-lg transition-transform duration-300 ease-in-out hover:scale-[1.02] cursor-pointer"
              style={{ maxWidth: `${AVATAR_SIZE}px` }}
              dangerouslySetInnerHTML={{ __html: avatarSvgString }} 
          />
          <div className="flex space-x-4 mt-8">
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`flex items-center justify-center bg-stone-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-stone-600 transition-all duration-200 ease-in-out hover:scale-105 hover:brightness-110 shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <PublishIcon />
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </button>
            {/* Botón de descarga temporalmente oculto
            <button
              onClick={handleDownload}
              className={`flex items-center justify-center ${currentTheme.accentBg} text-white font-bold py-2 px-6 rounded-lg ${currentTheme.accentBgHover} transition-all duration-200 ease-in-out hover:scale-105 hover:brightness-110 shadow-md`}
            >
              <DownloadIcon />
              Descargar SVG
            </button>
            */}
          </div>
        </div>
      ) : (
        <div className="w-64 h-64 flex items-center justify-center text-stone-500 mt-8">
          <p>Introduce un texto para generar.</p>
        </div>
      )}
    </main>
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
                // FIX: Updated Firestore query to use Firebase v8 syntax.
                const creationsCol = db.collection('creations');
                const q = creationsCol.orderBy('createdAt', 'desc').limit(50);
                const snapshot = await q.get();
                const creationsList = snapshot.docs.map(doc => {
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
      // Sign in anonymously before publishing
      await signInAnonymously(auth);

      // FIX: Updated Firestore document creation to use Firebase v8 syntax.
      await db.collection("creations").add({
        seed: userId,
        theme: theme,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
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
      className={`min-h-screen text-stone-200 font-sans p-4 sm:p-8 flex flex-col items-center transition-colors duration-500`}
    >
      
      <div className="fixed top-6 right-6 z-20">
        <label htmlFor="animation-toggle" className="flex items-center cursor-pointer group">
            <div className="relative">
                <input type="checkbox" id="animation-toggle" className="sr-only" checked={isAnimated} onChange={() => setIsAnimated(!isAnimated)} />
                <div className="block bg-stone-700 w-14 h-8 rounded-full group-hover:bg-stone-600 transition-colors duration-300"></div>
                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform"></div>
            </div>
            <div className="ml-3 text-stone-300 font-medium hidden sm:block">Animación</div>
        </label>
        <style>{`
            input:checked ~ .dot {
                transform: translateX(100%);
                background-color: ${currentTheme.switchColor};
            }
        `}</style>
      </div>

      <nav className="w-full max-w-md flex justify-center border-b border-stone-700 mb-8">
        <button 
            onClick={() => setCurrentView('generator')} 
            className={`px-6 py-3 text-lg font-medium transition-all duration-300 border-b-2 ${currentView === 'generator' ? `${currentTheme.accentText} ${currentTheme.accentBorder}` : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-600'}`}>
            Generador
        </button>
        <button 
            onClick={() => setCurrentView('gallery')}
            className={`px-6 py-3 text-lg font-medium transition-all duration-300 border-b-2 ${currentView === 'gallery' ? `${currentTheme.accentText} ${currentTheme.accentBorder}` : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-600'}`}>
            Galería
        </button>
      </nav>

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
      ) : (
        <GalleryView 
            theme={theme} 
            currentTheme={currentTheme} 
        />
      )}

      <footer className="mt-16 text-center text-stone-500 text-sm">
        <p>Ipiak&Sua™ by TGOW™</p>
      </footer>
    </div>
  );
};

export default App;