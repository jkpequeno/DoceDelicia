import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';

interface ScreenshotCaptureProps {
  flowName?: string;
  autoCapture?: boolean;
}

export function ScreenshotCapture({ flowName, autoCapture = false }: ScreenshotCaptureProps) {
  const [capturing, setCapturing] = useState(false);

  // Only run in development
  if (!import.meta.env.DEV) {
    return null;
  }

  useEffect(() => {
    if (autoCapture && flowName) {
      const delay = setTimeout(() => {
        captureFlow(flowName);
      }, 1500);
      
      return () => clearTimeout(delay);
    }
  }, [autoCapture, flowName]);

  const captureFlow = async (filename: string) => {
    if (capturing) return;
    
    setCapturing(true);
    
    try {
      console.log(`📸 Capturing flow: ${filename}`);
      
      // Wait for any loading states to finish
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Convert canvas to base64
      const base64Data = canvas.toDataURL('image/png');
      
      // Save to server
      await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: `${filename}.png`,
          data: base64Data
        })
      });
      
      console.log(`✅ Flow screenshot saved: ${filename}.png`);
    } catch (error) {
      console.error('❌ Flow screenshot failed:', error);
    } finally {
      setCapturing(false);
    }
  };

  // Manual capture trigger for testing
  const handleManualCapture = () => {
    const currentPath = window.location.pathname;
    let flowName = 'manual-capture';
    
    if (currentPath === '/') flowName = 'home-page';
    else if (currentPath === '/catalog') flowName = 'catalog-page';
    else if (currentPath === '/cart') flowName = 'cart-page';
    else if (currentPath === '/profile') flowName = 'profile-page';
    else if (currentPath === '/about') flowName = 'about-page';
    else if (currentPath.startsWith('/product/')) flowName = 'product-detail';
    else if (currentPath === '/admin') flowName = 'admin-page';
    
    captureFlow(flowName);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      zIndex: 9999,
      display: import.meta.env.DEV ? 'block' : 'none'
    }}>
      <button
        onClick={handleManualCapture}
        disabled={capturing}
        style={{
          background: '#ff69b4',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: capturing ? 'not-allowed' : 'pointer',
          opacity: capturing ? 0.6 : 1
        }}
      >
        {capturing ? '📸 Capturing...' : '📸 Capture'}
      </button>
    </div>
  );
}

// Auto-capture flows based on URL parameters
export function AutoScreenshotCapture() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const captureFlow = urlParams.get('capture-flow');
    
    if (captureFlow) {
      const delay = setTimeout(async () => {
        try {
          console.log(`📸 Auto-capturing flow: ${captureFlow}`);
          
          // Wait for page to load
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          const canvas = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: 0,
            scrollY: 0
          });
          
          const base64Data = canvas.toDataURL('image/png');
          
          await fetch('/api/screenshot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: `${captureFlow}.png`,
              data: base64Data
            })
          });
          
          console.log(`✅ Auto-captured: ${captureFlow}.png`);
          
          // Remove the parameter and reload without it
          urlParams.delete('capture-flow');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
          
        } catch (error) {
          console.error('❌ Auto-capture failed:', error);
        }
      }, 1500);
      
      return () => clearTimeout(delay);
    }
  }, []);

  return null;
}