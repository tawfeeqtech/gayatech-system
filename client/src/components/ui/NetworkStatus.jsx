import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * مراقب حالة الاتصال بالإنترنت
 * - يفحص الاتصال كل 10 ثواني
 * - يعرض بانر تحذيري عند انقطاع الاتصال
 * - يعرض إشعار عند عودة الاتصال
 */
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOffline = useRef(false);

  // فحص اتصال فعلي عبر ping للـ API
  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`https://api.ghayatech.com/`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }, []);

  const updateStatus = useCallback(async () => {
    const browserOnline = navigator.onLine;
    if (!browserOnline) {
      if (isOnline) {
        setIsOnline(false);
        wasOffline.current = true;
        toast.error('⚠️ تم انقطاع الاتصال بالإنترنت', {
          duration: Infinity,
          id: 'network-offline',
          style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
        });
      }
      return;
    }

    // المتصفح يقول متصل، نفحص فعلياً
    const actuallyOnline = await checkConnectivity();
    if (actuallyOnline) {
      if (!isOnline && wasOffline.current) {
        toast.dismiss('network-offline');
        toast.success('✅ تم استعادة الاتصال بالإنترنت', {
          duration: 3000,
          style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
        });
      }
      setIsOnline(true);
      wasOffline.current = false;
    } else {
      if (isOnline) {
        setIsOnline(false);
        wasOffline.current = true;
        toast.error('⚠️ تم انقطاع الاتصال بالإنترنت', {
          duration: Infinity,
          id: 'network-offline',
          style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
        });
      }
    }
  }, [isOnline, checkConnectivity]);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 10000);

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      toast.dismiss('network-offline');
    };
  }, [updateStatus]);

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#dc2626',
      color: '#fff',
      textAlign: 'center',
      padding: '8px 16px',
      fontFamily: 'Cairo, sans-serif',
      fontWeight: 600,
      fontSize: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      direction: 'rtl',
    }}>
      ⚠️ لا يوجد اتصال بالإنترنت — يرجى التحقق من الشبكة
    </div>
  );
};

export default NetworkStatus;
