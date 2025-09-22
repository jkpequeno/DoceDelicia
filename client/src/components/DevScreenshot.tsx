import { useEffect } from 'react';
import html2canvas from 'html2canvas';

export function DevScreenshot() {
  // Only run in development
  if (!import.meta.env.DEV) {
    return null;
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const captureParam = urlParams.get('capture');
    const armReloadParam = urlParams.get('arm-reload');

    // Handle direct capture request
    if (captureParam) {
      const delay = setTimeout(() => {
        captureScreenshot(`${captureParam}.png`);
      }, 1200); // Wait for page to fully load
      
      return () => clearTimeout(delay);
    }

    // Handle arm-reload: set up for post-reload capture
    if (armReloadParam) {
      sessionStorage.setItem('capture', `${armReloadParam}.png`);
      location.reload();
      return;
    }

    // Handle post-reload capture
    const sessionCapture = sessionStorage.getItem('capture');
    if (sessionCapture) {
      const delay = setTimeout(() => {
        captureScreenshot(sessionCapture);
        sessionStorage.removeItem('capture');
      }, 1200);
      
      return () => clearTimeout(delay);
    }
  }, []);

  const captureScreenshot = async (filename: string) => {
    try {
      console.log(`📸 Capturing screenshot: ${filename}`);
      
      // Wait for any loading states to finish
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
      try {
        await fetch('/api/screenshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename,
            data: base64Data
          })
        });
        console.log(`✅ Screenshot saved to file: ${filename}`);
      } catch (saveError) {
        console.error('❌ Failed to save screenshot to server:', saveError);
        // Fallback to download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`✅ Screenshot downloaded: ${filename}`);
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('❌ Screenshot failed:', error);
    }
  };

  return null;
}