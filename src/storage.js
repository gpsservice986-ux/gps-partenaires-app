import { supabase } from './supabase';

// ── Compresse une image avant upload ─────────────────────────
export async function compressImage(file, maxSizeKB = 300) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Réduire les dimensions si trop grande
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compression progressive jusqu'à atteindre la taille cible
        let quality = 0.8;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob.size / 1024 > maxSizeKB && quality > 0.1) {
                quality -= 0.1;
                compress();
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            quality
          );
        };
        compress();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Upload une photo vers Supabase Storage ────────────────────
export async function uploadPhoto(file, folder, fileName) {
  try {
    // Compresse la photo avant upload
    const compressed = await compressImage(file, 250);

    const ext = 'jpg';
    const path = `${folder}/${fileName}_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(path, compressed, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    // Retourne l'URL publique
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Erreur upload photo:', err);
    throw err;
  }
}

// ── Affiche une photo depuis son URL ─────────────────────────
export function PhotoPicker({ label, value, onChange, lt }) {
  const inputStyle = {
    display: 'none',
  };

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (file) onChange(file);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ color: lt ? '#3d5a73' : '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</p>
      <label style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '12px', borderRadius: 10, cursor: 'pointer',
        border: `2px dashed ${lt ? '#b8c4ce' : '#334155'}`,
        background: lt ? '#e8edf2' : '#0f172a',
        color: lt ? '#3d5a73' : '#94a3b8', fontSize: 13,
      }}>
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={typeof value === 'string' ? value : URL.createObjectURL(value)}
              alt="preview"
              style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
            />
            <span style={{ color: '#22c55e', fontSize: 12 }}>✓ Photo sélectionnée — appuyer pour changer</span>
          </div>
        ) : (
          <>📷 {label}</>
        )}
        <input type="file" accept="image/*" style={inputStyle} onChange={handleChange} />
      </label>
    </div>
  );
}