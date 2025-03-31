import { useState, useEffect } from 'react';
import './App.css';
import '@fontsource/inter';

// Disable right click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Disable keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'u' || e.key === 'i' || e.key === 'c')) {
    e.preventDefault();
  }
});

// Console warning
console.log('%cStop!', 'color: red; font-size: 40px; font-weight: bold;');
console.log('%cThis code is protected and any unauthorized use is prohibited.', 'font-size: 20px;');

const API_KEYS = [
  "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",
  "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",
  "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"
];

const getRandomApiKey = () => {
  const randomIndex = Math.floor(Math.random() * API_KEYS.length);
  return API_KEYS[randomIndex];
};

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [imageCount, setImageCount] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false); // Added state for modal

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkTheme(savedTheme === "dark" || (!savedTheme && systemPrefersDark));
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem("theme", !isDarkTheme ? "dark" : "light");
  };

  const handleRandomPrompt = () => {
    const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    setPrompt(randomPrompt);
  };

  const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    // Ensure dimensions are multiples of 16 (AI model requirement)
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
    return { width: calculatedWidth, height: calculatedHeight };
  };

  const generateImages = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const MODEL_URL = `https://router.huggingface.co/hf-inference/models/${model}`;
    const { width, height } = getImageDimensions(aspectRatio);
    const generatedRatio = aspectRatio;

    const newImages = Array(imageCount).fill({ loading: true, ratio: generatedRatio });
    setImages(newImages);

    try {
      const promises = newImages.map(async (image, index) => { //Corrected line
        try {
          const apiKey = getRandomApiKey(); // Get a random API key for each request
          const response = await fetch(MODEL_URL, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "x-use-cache": "false",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: prompt,
              parameters: { width, height },
              options: { wait_for_model: true, use_cache: false },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (errorData?.error?.includes("rate limit") && API_KEYS.length > 1) {
              const newKey = getRandomApiKey(); //Try a different key if rate limited
              // Retry with new key
              return fetch(MODEL_URL, {
                headers: {
                  Authorization: `Bearer ${newKey}`,
                  "Content-Type": "application/json",
                  "x-use-cache": "false",
                },
                method: "POST",
                body: JSON.stringify({
                  inputs: prompt,
                  parameters: { width, height },
                  options: { wait_for_model: true, use_cache: false },
                }),
              });
            }
            throw new Error(errorData?.error || "Unknown error");
          }

          const blob = await response.blob();
          return { url: URL.createObjectURL(blob), error: null, ratio: generatedRatio };
        } catch (error) {
          return { error: error.message, ratio: generatedRatio }; //Added ratio to error object
        }
      });

      const results = await Promise.all(promises);
      setImages(results);
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  return (
    <div>
      <div className="container">
        <header className="header">
          <div className="logo-wrapper">
            <div className="logo">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <h1>AI Image Generator</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button class="about-dev"
              onClick={() => setShowAboutModal(true)}
              style={{ 
                background: '#8B5CF6',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600',
                height: '43px',
                cursor: 'pointer'
              }}>
              <i className="fa-solid fa-user"></i>
              About Dev
            </button>
            <button className="theme-toggle" onClick={toggleTheme} title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <i className="fa-solid fa-sun"></i>
              <i className="fa-solid fa-moon"></i>
            </button>
          </div>
        </header>

        <div className="main-content">
          <form onSubmit={generateImages}>
            <div className="prompt-container">
              <textarea
                className="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your imagination in detail..."
                required
              />
              <button type="button" className="prompt-btn" onClick={handleRandomPrompt}>
                <i className="fa-solid fa-dice"></i>
              </button>
            </div>

            <div className="prompt-actions">
              <div className="select-wrapper">
                <select className="custom-select" value={model} onChange={(e) => setModel(e.target.value)}>
                  <option value="" disabled>Select Model</option>
                  <option value="black-forest-labs/FLUX.1-dev">FLUX.1-dev</option>
                  <option value="black-forest-labs/FLUX.1-schnell">FLUX.1-schnell</option>
                  <option value="stabilityai/stable-diffusion-xl-base-1.0">Stable Diffusion XL</option>
                  <option value="runwayml/stable-diffusion-v1-5">Stable Diffusion v1.5</option>
                  <option value="prompthero/open journey">Openjourney</option>
                </select>
              </div>

              <div className="select-wrapper">
                <select className="custom-select" value={imageCount} onChange={(e) => setImageCount(Number(e.target.value))}>
                  <option value="" disabled>Image Count</option>
                  <option value="1">1 Image</option>
                  <option value="2">2 Images</option>
                  <option value="3">3 Images</option>
                  <option value="4">4 Images</option>
                </select>
              </div>

              <div className="select-wrapper">
                <select 
                  className="custom-select" 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value)}
                >
                  <option value="" disabled selected>Aspect Ratio</option>
                  <option value="1/1">Square (1:1)</option>
                  <option value="16/9">Landscape (16:9)</option>
                  <option value="9/16">Portrait (9:16)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="generate-btn" 
                disabled={isGenerating || !model || !imageCount || !aspectRatio || !prompt.trim()}
              >
                <i className="fa-solid fa-wand-sparkles"></i>
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>

            <div className="gallery-grid">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className={`img-card ${image.loading ? 'loading' : image.error ? 'error' : ''}`}
                  style={{ aspectRatio: (image.ratio || aspectRatio).replace('/', '/') }}
                >
                  {image.loading ? (
                    <div className="status-container">
                      <div className="spinner"></div>
                      <p className="status-text">Generating...</p>
                    </div>
                  ) : image.error ? (
                    <>
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <p className="status-text">Failed to generate image</p>
                    </>
                  ) : (
                    <>
                      <img src={image.url} alt="Generated" className="result-img" />
                      <div className="img-overlay">
                        <a href={image.url} className="img-download-btn" download={`generated-image-${index}.png`}>
                          <i className="fa-solid fa-download"></i>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
      {showAboutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          opacity: 1,
          animation: 'fadeIn 1s ease-out'
        }} onClick={() => setShowAboutModal(false)}>
          <div style={{
            animation: 'modalFadeIn 0.3s ease-out',
            background: isDarkTheme ? '#1A1F2E' : '#FFFFFF',
            padding: '30px',
            borderRadius: '24px',
            maxWidth: '360px',
            width: '90%',
            textAlign: 'center',
            color: isDarkTheme ? '#fff' : '#1A1F2E',
            position: 'relative',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '4px solid #8B5CF6',
              margin: '0 auto 8px',
              overflow: 'hidden'
            }}>
              <img 
                src="src/a_fe6fbe3cec2fccbff3c71ccb6d0c9f9a.gif" 
                alt="Profile"
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            </div>
            <h2 style={{color: '#8B5CF6', marginBottom: '8px', fontSize: '22px'}}>Doremxn</h2>
            <p style={{color: isDarkTheme ? '#94A3B8' : '#64748B', marginBottom: '8px'}}>Sometimes I Turn Coffee Into Code.</p>
            <p style={{color: isDarkTheme ? '#E2E8F0' : '#334155', marginBottom: '16px', lineHeight: '1.5'}}>
              Designing Stunning Visuals, Crafting Engaging Websites, and Developing Smart Discord Bots for a Seamless Digital Experience.
            </p>
            <div style={{display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px'}}>
              <a href="https://github.com/RaviVerma0912" target="_blank" rel="noopener noreferrer" style={{color: isDarkTheme ? '#fff' : '#1A1F2E'}}>
                <i className="fa-brands fa-github fa-lg"></i>
              </a>
              <a href="https://www.linkedin.com/in/ravi-verma-2b6951351/" target="_blank" rel="noopener noreferrer" style={{color: isDarkTheme ? '#fff' : '#1A1F2E'}}>
                <i className="fa-brands fa-linkedin fa-lg"></i>
              </a>
            </div>
            <button 
              style={{
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.2)';
              }}
              onClick={() => window.open('https://ravi09.netlify.app/', '_blank')}
            >
              <i className="fa-solid fa-globe"></i>
              Visit My Portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}