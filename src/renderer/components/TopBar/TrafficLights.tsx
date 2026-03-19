/**
 * TrafficLights — macOS trafik lambaları (kapat/küçült/büyüt)
 * Sadece macOS'te gösterilir. Windows'ta gizlenir.
 */

export default function TrafficLights() {
  const platform = window.electronAPI?.platform ?? 'win32';

  // macOS'te Electron zaten native trafik lambalarını gösteriyor
  // Bu bileşen sadece boşluk ayırıcı olarak kullanılır
  if (platform !== 'darwin') return null;

  return (
    <div
      className="no-drag"
      style={{
        width: '70px',
        height: '100%',
        flexShrink: 0,
      }}
    />
  );
}
