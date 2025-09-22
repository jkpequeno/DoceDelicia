import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';

export function BatchScreenshotCapture() {
  const [currentFlow, setCurrentFlow] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Only run in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const flows = [
    { name: 'home-page', url: '/', description: 'Homepage' },
    { name: 'catalog-page', url: '/catalog', description: 'Product Catalog' },
    { name: 'catalog-filters', url: '/catalog', description: 'Catalog with Filters' },
    { name: 'cart-page', url: '/cart', description: 'Shopping Cart' },
    { name: 'profile-page', url: '/profile', description: 'User Profile' },
    { name: 'about-page', url: '/about', description: 'About Page' },
    { name: 'mobile-view', url: '/', description: 'Mobile Homepage' },
  ];

  const captureScreenshot = async (flowName: string, description: string) => {
    try {
      console.log(`📸 Capturing: ${description} (${flowName})`);
      
      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
          filename: `${flowName}.png`,
          data: base64Data
        })
      });
      
      console.log(`✅ Saved: ${flowName}.png`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to capture ${flowName}:`, error);
      return false;
    }
  };

  const startBatchCapture = async () => {
    setIsCapturing(true);
    setProgress(0);
    
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i];
      setCurrentFlow(flow.description);
      setProgress(((i + 1) / flows.length) * 100);
      
      // Navigate to the page if not already there
      if (window.location.pathname !== flow.url) {
        window.location.href = flow.url;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for navigation
      }
      
      await captureScreenshot(flow.name, flow.description);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between captures
    }
    
    setIsCapturing(false);
    setCurrentFlow('Complete!');
    console.log('🎉 All screenshots captured successfully!');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '60px', 
      right: '10px', 
      zIndex: 9999,
      background: 'white',
      border: '2px solid #ff69b4',
      borderRadius: '8px',
      padding: '12px',
      minWidth: '200px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: import.meta.env.DEV ? 'block' : 'none'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
        📸 Batch Screenshot Capture
      </div>
      
      {!isCapturing ? (
        <button
          onClick={startBatchCapture}
          style={{
            background: '#ff69b4',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '12px'
          }}
        >
          🚀 Capture All Flows
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: '8px', color: '#666' }}>
            Progress: {Math.round(progress)}%
          </div>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: '#f0f0f0', 
            borderRadius: '3px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: '#ff69b4',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div style={{ color: '#333', fontSize: '11px' }}>
            {currentFlow}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
        Screenshots saved to /screenshots/
      </div>
    </div>
  );
}