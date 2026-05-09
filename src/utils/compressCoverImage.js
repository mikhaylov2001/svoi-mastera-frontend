/**
 * Обложка профиля: ограничение длинной стороны с высоким качеством сглаживания,
 * чтобы на широких/Retina экранах хватало пикселей и не раздувался localStorage.
 */
export function compressCoverToDataUrl(file, maxSide = 2560, quality = 0.92) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(typeof e.target?.result === 'string' ? e.target.result : '');
          return;
        }
        const M = maxSide;
        if (w > M || h > M) {
          if (w >= h) {
            h = Math.round((h * M) / w);
            w = M;
          } else {
            w = Math.round((w * M) / h);
            h = M;
          }
        }
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(typeof e.target?.result === 'string' ? e.target.result : '');
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('cover image load failed'));
      img.src = e.target.result;
    };
    r.onerror = () => reject(new Error('cover read failed'));
    r.readAsDataURL(file);
  });
}
