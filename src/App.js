import React, { useState, useEffect } from 'react';
import * as api from './api';

function wdays(start, n) {
  let d = new Date(start), c = 0;
  while (c < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) c++; }
  return d;
}
function fr(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
function money(n) { return `${Number(n || 0).toLocaleString('fr-FR')} F`; }
function tPaid(c) { return (Number(c.advance_paid) || 0) + (c._payments || []).reduce((s, p) => s + Number(p.amount), 0); }
function remBal(c) { return Math.max(0, Number(c.gps_price || 0) - tPaid(c)); }

const S = {
  app: (lt) => ({ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: 420, margin: '0 auto', background: lt ? '#f0f4f8' : '#0f172a', minHeight: '100vh', color: lt ? '#0d1b2a' : '#e2e8f0', position: 'relative' }),
  header: (lt) => ({ background: lt ? '#ffffff' : '#1e293b', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${lt ? '#e2e8f0' : '#334155'}` }),
  card: (lt) => ({ background: lt ? '#ffffff' : '#1e293b', borderRadius: 12, padding: 14, margin: '8px 12px', border: `1px solid ${lt ? '#e2e8f0' : '#334155'}` }),
  input: (lt) => ({ width: '100%', background: lt ? '#e8edf2' : '#0f172a', border: `1px solid ${lt ? '#b8c4ce' : '#334155'}`, borderRadius: 8, padding: '10px 12px', color: lt ? '#0d1b2a' : '#e2e8f0', fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }),
  label: (lt) => ({ color: lt ? '#3d5a73' : '#94a3b8', fontSize: 12, marginBottom: 4, display: 'block' }),
  btn: (color) => ({ background: color || '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }),
  btnFull: (color) => ({ background: color || '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', cursor: 'pointer', fontWeight: 'bold', fontSize: 15, width: '100%' }),
  btnGhost: (lt) => ({ background: 'transparent', color: lt ? '#3d5a73' : '#94a3b8', border: `1px solid ${lt ? '#b8c4ce' : '#334155'}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }),
  stat: (lt) => ({ background: lt ? '#ffffff' : '#1e293b', borderRadius: 12, padding: 14, border: `1px solid ${lt ? '#e2e8f0' : '#334155'}`, textAlign: 'center', cursor: 'pointer' }),
  badge: (color) => ({ background: color + '20', color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 'bold', display: 'inline-block' }),
  row: (lt) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${lt ? '#e8edf2' : '#1e293b'}` }),
  nav: (lt) => ({ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: lt ? 'rgba(255,255,255,0.97)' : 'rgba(30,41,59,0.97)', borderTop: `1px solid ${lt ? '#e2e8f0' : '#334155'}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 30 }),
  navBtn: (active, lt) => ({ background: 'none', border: 'none', color: active ? '#3b82f6' : '#64748b', cursor: 'pointer', fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 6px' }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 50 },
  sheet: (lt) => ({ background: lt ? '#ffffff' : '#1e293b', width: '100%', maxWidth: 420, margin: '0 auto', borderRadius: '20px 20px 0 0', padding: 20, maxHeight: '88vh', overflowY: 'auto' }),
  secTitle: (lt) => ({ color: '#3b82f6', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 0 }),
  page: (lt) => ({ position: 'fixed', inset: 0, background: lt ? '#f0f4f8' : '#0f172a', zIndex: 30, maxWidth: 420, margin: '0 auto', overflowY: 'auto', paddingBottom: 30 }),
};

function Av({ name, size = 38, impaye, photoUrl }) {
  const i = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['#3b82f6','#6366f1','#0ea5e9','#06b6d4','#8b5cf6'];
  const bg = colors[(name || '').length % colors.length];
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: photoUrl ? 'pointer' : 'default' }} onClick={() => photoUrl && setZoomed(true)}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: size * 0.35 }}>{i}</div>
        )}
        {impaye && <div style={{ position: 'absolute', bottom: -1, right: -1, background: '#ef4444', borderRadius: '50%', width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a', color: '#fff', fontSize: 8, fontWeight: 'bold' }}>!</div>}
      </div>
      {zoomed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setZoomed(false)}>
          <img src={photoUrl} alt={name} style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: 12, objectFit: 'contain' }} />
          <p style={{ position: 'absolute', bottom: 30, color: '#fff', fontSize: 13, opacity: 0.7 }}>Appuyer pour fermer</p>
        </div>
      )}
    </>
  );
}

function SBadge({ status }) {
  return status === 'achete'
    ? <span style={S.badge('#22c55e')}>✓ Acheté</span>
    : <span style={S.badge('#f59e0b')}>⏳ En attente</span>;
}

function Sheet({ title, onClose, lt, children }) {
  return (
    <div style={S.overlay}>
      <div style={S.sheet(lt)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: 16, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{title}</p>
          <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ICard({ title, lt, children }) {
  return (
    <div style={{ background: lt ? '#fff' : '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${lt ? '#e2e8f0' : '#334155'}` }}>
      <p style={S.secTitle(lt)}>{title}</p>
      {children}
    </div>
  );
}

function IRow({ label, value, lt, onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${lt ? '#e8edf2' : '#0f172a'}` }} onClick={onClick}>
      <span style={{ color: lt ? '#506a80' : '#94a3b8', fontSize: 12 }}>{label}</span>
      <span style={{ color: onClick ? '#3b82f6' : (lt ? '#0d1b2a' : '#e2e8f0'), fontSize: 13, textAlign: 'right', cursor: onClick ? 'pointer' : 'default', textDecoration: onClick ? 'underline' : 'none' }}>{value || '—'}</span>
    </div>
  );
}

function Toggle({ field, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      {options.map(([v, l]) => (
        <button key={String(v)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer', background: value === v ? '#3b82f620' : '#0f172a', color: value === v ? '#3b82f6' : '#94a3b8', fontWeight: 'bold', fontSize: 13 }} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

// ── Add Partner Form ──────────────────────────────────────────
const ID_TYPES_BENIN = ['CIP (Bénin)','NPI (Bénin)','CNI','Passeport','Permis de conduire','Carte consulaire','Autre'];

function AddPartnerForm({ lt, onClose, onSave }) {
  const [f, setF] = useState({ full_name: '', phone: '', address: '', workplace: '', job: '', id_type: 'CIP (Bénin)', id_number: '', id_type_autre: '', username: '', password: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [idPhotoFile, setIdPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const s = k => e => setF(x => ({ ...x, [k]: e.target.value }));

  async function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = (height * maxDim) / width; width = maxDim; }
            else { width = (width * maxDim) / height; height = maxDim; }
          }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          let quality = 0.75;
          const compress = () => {
            canvas.toBlob((blob) => {
              if (blob.size / 1024 > 250 && quality > 0.1) { quality -= 0.1; compress(); }
              else resolve(blob);
            }, 'image/jpeg', quality);
          };
          compress();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadPhoto(file, folder, name) {
    const { supabase } = await import('./supabase');
    const compressed = await compressImage(file);
    const path = `${folder}/${name}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(path, compressed, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!f.full_name || !f.phone || !f.username || !f.password) {
      alert('Veuillez remplir le nom, téléphone, identifiant et mot de passe.'); return;
    }
    setLoading(true);
    try {
      let photo_url = null, id_photo_url = null;
      if (photoFile) { setProgress('Upload photo partenaire...'); photo_url = await uploadPhoto(photoFile, 'partners', f.username); }
      if (idPhotoFile) { setProgress("Upload photo pièce d'identité..."); id_photo_url = await uploadPhoto(idPhotoFile, 'id_cards', f.username); }
      setProgress('Enregistrement...');
      await onSave({ ...f, id_type: f.id_type === 'Autre' ? (f.id_type_autre || 'Autre') : f.id_type, photo_url, id_photo_url });
      onClose();
    } catch (err) { alert('Erreur : ' + err.message); }
    setLoading(false); setProgress('');
  }

  const pickerStyle = (lt) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10, cursor: 'pointer', border: `2px dashed ${lt ? '#b8c4ce' : '#334155'}`, background: lt ? '#e8edf2' : '#0f172a', color: lt ? '#3d5a73' : '#94a3b8', fontSize: 13, marginBottom: 12 });

  return (
    <Sheet title="Ajouter un partenaire" lt={lt} onClose={onClose}>
      {/* Photo partenaire */}
      <label style={S.label(lt)}>Photo du partenaire</label>
      <label style={pickerStyle(lt)}>
        {photoFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={URL.createObjectURL(photoFile)} alt="preview" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ color: '#22c55e', fontSize: 12 }}>✓ Photo sélectionnée — appuyer pour changer</span>
          </div>
        ) : <>📷 Importer la photo du partenaire</>}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setPhotoFile(e.target.files[0])} />
      </label>

      {/* Infos de base */}
      {[['full_name','Nom complet','Issa Koné'],['phone','Téléphone','07 00 00 00 00'],['address','Domicile','Cotonou, Bénin'],['workplace','Lieu de travail / atelier','Atelier Koné Moto'],['job','Profession / activité','Mécanicien moto'],['username','Identifiant de connexion','issa.kone']].map(([k,l,ph]) => (
        <div key={k}><label style={S.label(lt)}>{l}</label><input style={S.input(lt)} placeholder={ph} value={f[k]} onChange={s(k)} /></div>
      ))}
      <label style={S.label(lt)}>Mot de passe</label>
      <input style={S.input(lt)} type="password" placeholder="Mot de passe" value={f.password} onChange={s('password')} />

      {/* Pièce d'identité */}
      <label style={S.label(lt)}>Type de pièce d'identité</label>
      <select style={S.input(lt)} value={f.id_type} onChange={s('id_type')}>
        {ID_TYPES_BENIN.map(t => <option key={t}>{t}</option>)}
      </select>
      {f.id_type === 'Autre' && (
        <input style={S.input(lt)} placeholder="Préciser le type de pièce..." value={f.id_type_autre} onChange={s('id_type_autre')} />
      )}
      <label style={S.label(lt)}>Numéro de la pièce</label>
      <input style={S.input(lt)} placeholder="Numéro de la pièce" value={f.id_number} onChange={s('id_number')} />

      {/* Photo pièce d'identité */}
      <label style={S.label(lt)}>Photo de la pièce d'identité</label>
      <label style={pickerStyle(lt)}>
        {idPhotoFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={URL.createObjectURL(idPhotoFile)} alt="preview" style={{ width: 70, height: 45, borderRadius: 6, objectFit: 'cover' }} />
            <span style={{ color: '#22c55e', fontSize: 12 }}>✓ Photo sélectionnée — appuyer pour changer</span>
          </div>
        ) : <>🪪 Importer la photo de la pièce</>}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setIdPhotoFile(e.target.files[0])} />
      </label>

      {progress && (
        <div style={{ background: '#3b82f610', borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <p style={{ margin: 0, color: '#3b82f6', fontSize: 13 }}>⏳ {progress}</p>
        </div>
      )}
      <button style={S.btnFull()} onClick={handleSave} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer le partenaire'}</button>
    </Sheet>
  );
}

// ── Add Client Form ───────────────────────────────────────────
function AddClientForm({ partnerId, lt, onClose, onSave }) {
  const [f, setF] = useState({ full_name: '', phone: '', district: '', city: '', workplace: '', job: '', moto_is_new: true, stolen_before: false, stolen_count: 0, heard_via: 'Par le partenaire', moto_brand: '', moto_model: '', moto_plate: '', gps_type: 'Achat neuf', payment_type: 'cash', advance_paid: 0, daily_rate: 600, install_date: '', id_type: 'CNI', id_number: '', w1n: '', w1p: '', w1a: '', w2n: '', w2p: '', w2a: '' });
  const [loading, setLoading] = useState(false);
  const s = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const rem2 = 35000 - (f.payment_type === 'credit' ? Number(f.advance_paid || 0) : 0);
  const days = f.payment_type === 'credit' && f.daily_rate > 0 ? Math.ceil(rem2 / f.daily_rate) : 0;
  const ech = f.payment_type === 'credit' && f.install_date && days > 0 ? wdays(new Date(f.install_date), days) : null;

  async function handleSave() {
    setLoading(true);
    try {
      const client = {
        partner_id: partnerId, full_name: f.full_name || 'Nouveau client', phone: f.phone,
        district: f.district, city: f.city, workplace: f.workplace, job: f.job,
        moto_is_new: f.moto_is_new, stolen_before: f.stolen_before, stolen_count: Number(f.stolen_count || 0),
        heard_via: f.heard_via, moto_brand: f.moto_brand, moto_model: f.moto_model, moto_plate: f.moto_plate || '—',
        gps_type: f.gps_type, gps_brand: '', gps_model: '', gps_price: 0, gps_imei: '', gps_sim: '', sim_international: false,
        payment_type: f.payment_type, advance_paid: Number(f.advance_paid || 0), daily_rate: Number(f.daily_rate || 0),
        install_date: f.install_date || null, deadline_date: ech ? ech.toISOString().split('T')[0] : null,
        status: 'attente', id_type: f.id_type, id_number: f.id_number,
      };
      const saved = await api.addClient(client);
      if (f.payment_type === 'credit') {
        await api.addWitnesses(saved.id, [
          { name: f.w1n, phone: f.w1p, address: f.w1a, idType: 'CNI', idNumber: '' },
          { name: f.w2n, phone: f.w2p, address: f.w2a, idType: 'CNI', idNumber: '' },
        ]);
      }
      onSave(saved); onClose();
    } catch (err) { alert('Erreur : ' + err.message); }
    setLoading(false);
  }

  return (
    <div style={S.page(lt)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 14px 12px' }}>
        <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }} onClick={onClose}>←</button>
        <h2 style={{ margin: 0, fontSize: 17, color: lt ? '#0d1b2a' : '#e2e8f0' }}>Nouveau client</h2>
      </div>
      <div style={{ padding: '0 12px' }}>
        <ICard title="Client" lt={lt}>
          {[['full_name','Nom complet','Nom complet'],['phone','Téléphone','07 00 00 00 00'],['district','Quartier','Yopougon'],['city','Ville','Abidjan'],['workplace',"Lieu d'activité (optionnel)",'Atelier, boutique...'],['job','Profession','Mécanicien...']].map(([k,l,ph]) => (
            <div key={k}><label style={S.label(lt)}>{l}</label><input style={S.input(lt)} placeholder={ph} value={f[k]} onChange={s(k)} /></div>
          ))}
        </ICard>
        <ICard title="Moto & historique" lt={lt}>
          {[['moto_brand','Marque','Sanya, Haojue...'],['moto_model','Modèle','SY125, DK150...']].map(([k,l,ph]) => (
            <div key={k}><label style={S.label(lt)}>{l}</label><input style={S.input(lt)} placeholder={ph} value={f[k]} onChange={s(k)} /></div>
          ))}
          <label style={S.label(lt)}>Moto neuve ou ancienne ?</label>
          <Toggle value={f.moto_is_new} options={[[true,'Neuve'],[false,'Ancienne']]} onChange={v => setF(x => ({ ...x, moto_is_new: v }))} />
          <label style={S.label(lt)}>Victime de vol de moto ?</label>
          <Toggle value={f.stolen_before} options={[[false,'Non'],[true,'Oui']]} onChange={v => setF(x => ({ ...x, stolen_before: v }))} />
          {f.stolen_before && (<><label style={S.label(lt)}>Combien de motos perdues ?</label><input style={S.input(lt)} type="number" value={f.stolen_count} onChange={s('stolen_count')} /></>)}
          <label style={S.label(lt)}>Comment a-t-il entendu parler du GPS ?</label>
          <select style={S.input(lt)} value={f.heard_via} onChange={s('heard_via')}>
            {['Par le partenaire','Radio','Télévision','Bouche à oreille','Réseaux sociaux'].map(o => <option key={o}>{o}</option>)}
          </select>
        </ICard>
        <ICard title="Type d'opération" lt={lt}>
          <select style={S.input(lt)} value={f.gps_type} onChange={s('gps_type')}>
            {['Achat neuf','Entretien GPS existant','GPS autre marque','GPS pour enfant'].map(o => <option key={o}>{o}</option>)}
          </select>
          <div style={{ background: '#3b82f610', borderRadius: 8, padding: 10 }}>
            <p style={{ margin: 0, color: '#3b82f6', fontSize: 12 }}>🔒 Les détails GPS seront renseignés par l'administrateur lors de la validation.</p>
          </div>
        </ICard>
        <ICard title="Paiement" lt={lt}>
          <label style={S.label(lt)}>Mode de paiement</label>
          <Toggle value={f.payment_type} options={[['cash','Cash'],['credit','Crédit']]} onChange={v => setF(x => ({ ...x, payment_type: v }))} />
          <label style={S.label(lt)}>Date d'installation prévue</label>
          <input style={S.input(lt)} type="date" value={f.install_date} onChange={s('install_date')} />
          {f.payment_type === 'credit' && (
            <>
              <label style={S.label(lt)}>Avance versée (F)</label>
              <input style={S.input(lt)} type="number" value={f.advance_paid} onChange={s('advance_paid')} />
              <label style={S.label(lt)}>Montant par jour (min 600 F, négociable)</label>
              <input style={S.input(lt)} type="number" value={f.daily_rate} onChange={s('daily_rate')} />
              {ech && <div style={{ background: '#3b82f610', borderRadius: 8, padding: 10, marginBottom: 10 }}><p style={{ margin: 0, color: '#3b82f6', fontSize: 12 }}>Échéance estimée : {fr(ech)} ({days} jours, lun–sam)</p></div>}
              <label style={S.label(lt)}>Pièce d'identité du client</label>
              <select style={S.input(lt)} value={f.id_type} onChange={s('id_type')}>{['CNI','Passeport','Permis de conduire','Carte consulaire'].map(t => <option key={t}>{t}</option>)}</select>
              <input style={S.input(lt)} placeholder="Numéro de la pièce" value={f.id_number} onChange={s('id_number')} />
              <label style={S.label(lt)}>Témoin 1 — Nom</label><input style={S.input(lt)} value={f.w1n} onChange={s('w1n')} />
              <label style={S.label(lt)}>Témoin 1 — Téléphone</label><input style={S.input(lt)} value={f.w1p} onChange={s('w1p')} />
              <label style={S.label(lt)}>Témoin 1 — Domicile</label><input style={S.input(lt)} value={f.w1a} onChange={s('w1a')} />
              <label style={S.label(lt)}>Témoin 2 — Nom</label><input style={S.input(lt)} value={f.w2n} onChange={s('w2n')} />
              <label style={S.label(lt)}>Témoin 2 — Téléphone</label><input style={S.input(lt)} value={f.w2p} onChange={s('w2p')} />
              <label style={S.label(lt)}>Témoin 2 — Domicile</label><input style={S.input(lt)} value={f.w2a} onChange={s('w2a')} />
            </>
          )}
        </ICard>
        <button style={S.btnFull()} onClick={handleSave} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer le client'}</button>
      </div>
    </div>
  );
}

// ── GPS Validation ────────────────────────────────────────────
function GPSVal({ client, lt, onClose, onConfirm }) {
  const [f, setF] = useState({ gpsBrand: '', gpsModel: '', gpsPrice: '', gpsImei: '', gpsSim: '', sim: false, purchaseDate: '' });
  const s = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  return (
    <Sheet title="Valider l'achat — GPS" lt={lt} onClose={onClose}>
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 0 }}>Détails GPS pour <strong style={{ color: lt ? '#0d1b2a' : '#e2e8f0' }}>{client.full_name}</strong></p>
      {[['gpsBrand','Marque du GPS','Ex: Tracker GT06'],['gpsModel','Modèle du GPS','Ex: GT06N, TK103'],['gpsImei','IMEI du GPS','15 chiffres'],['gpsSim','Numéro SIM du GPS','+225 07 00 00 00 00']].map(([k,l,ph]) => (
        <div key={k}><label style={S.label(lt)}>{l}</label><input style={S.input(lt)} placeholder={ph} value={f[k]} onChange={s(k)} /></div>
      ))}
      <label style={S.label(lt)}>Prix du GPS (F) — saisie libre</label>
      <input style={S.input(lt)} type="number" placeholder="Ex: 5000, 16000, 25000, 35000, 50000..." value={f.gpsPrice} onChange={s('gpsPrice')} />
      <label style={{ ...S.label(lt), display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input type="checkbox" checked={f.sim} onChange={e => setF(x => ({ ...x, sim: e.target.checked }))} /> SIM internationale incluse
      </label>
      <label style={S.label(lt)}>Date d'achat</label>
      <input style={S.input(lt)} type="date" value={f.purchaseDate} onChange={s('purchaseDate')} />
      <button style={S.btnFull('#22c55e')} onClick={() => onConfirm({ ...f, gpsPrice: Number(f.gpsPrice) })}>✅ Confirmer l'achat</button>
    </Sheet>
  );
}

// ── Payment Calendar ──────────────────────────────────────────
function PayCal({ client, lt, onClose }) {
  const [cur, setCur] = useState(() => {
    const d = client.install_date ? new Date(client.install_date) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const pmts = client._payments || [];
  const pSet = new Set(pmts.map(p => { const d = new Date(p.payment_date); return isNaN(d) ? '' : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));
  const inst = client.install_date ? new Date(client.install_date) : null;
  const ech = client.deadline_date ? new Date(client.deadline_date) : null;
  const today = new Date();
  const yr = cur.getFullYear(), mo = cur.getMonth();
  const fd = new Date(yr, mo, 1).getDay();
  const dim = new Date(yr, mo + 1, 0).getDate();
  function dk(d) { return `${yr}-${mo}-${d}`; }
  function inR(d) { const dt = new Date(yr, mo, d); return inst && ech && dt >= inst && dt <= ech; }
  function isWD(d) { return new Date(yr, mo, d).getDay() !== 0; }
  function isPaid(d) { return pSet.has(dk(d)); }
  function isLate(d) { const dt = new Date(yr, mo, d); return inR(d) && isWD(d) && dt < today && !isPaid(d); }
  function isRem(d) { const dt = new Date(yr, mo, d); return inR(d) && isWD(d) && dt >= today && !isPaid(d); }
  const months = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
  return (
    <div style={S.page(lt)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 14px 12px' }}>
        <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }} onClick={onClose}>←</button>
        <h2 style={{ margin: 0, fontSize: 17, color: lt ? '#0d1b2a' : '#e2e8f0' }}>Échéancier</h2>
      </div>
      <div style={{ padding: '0 12px' }}>
        {inst && ech && (
          <div style={{ background: lt ? '#fff' : '#1e293b', borderRadius: 10, padding: 12, marginBottom: 12, border: `1px solid ${lt ? '#e2e8f0' : '#334155'}` }}>
            <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: 12 }}>Début : <span style={{ color: lt ? '#0d1b2a' : '#e2e8f0' }}>{fr(inst)}</span></p>
            <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>Échéance : <span style={{ color: lt ? '#0d1b2a' : '#e2e8f0' }}>{fr(ech)}</span></p>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={() => setCur(new Date(yr, mo - 1, 1))} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>‹</button>
          <p style={{ margin: 0, fontWeight: 'bold', color: lt ? '#0d1b2a' : '#e2e8f0' }}>{months[mo]} {yr}</p>
          <button onClick={() => setCur(new Date(yr, mo + 1, 1))} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
          {['D','L','M','M','J','V','S'].map((w, i) => <div key={i} style={{ textAlign: 'center', color: '#64748b', fontSize: 11, padding: '4px 0' }}>{w}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {Array(fd).fill(null).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: dim }, (_, i) => i + 1).map(d => {
            const paid = isPaid(d), late = isLate(d), rem = isRem(d);
            return (
              <div key={d} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 12, fontWeight: 'bold', background: paid ? '#3b82f620' : late ? '#ef444420' : rem ? '#22c55e15' : 'transparent', color: paid ? '#3b82f6' : late ? '#ef4444' : rem ? '#22c55e' : '#475569' }}>
                {paid ? '✓' : d}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
          {[['#3b82f6','Payé ✓'],['#ef4444','Retard'],['#22c55e','À venir']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c + '30' }} />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Client Detail ─────────────────────────────────────────────
function ClientDetail({ client: init, viewer, lt, partners, onBack, onMarkBought, onUpdateClient }) {
  const [client, setClient] = useState(init);
  const [showGPS, setShowGPS] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showOp, setShowOp] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [payF, setPayF] = useState({ amount: client.daily_rate || 1000, date: '', note: '', method: 'cash', fees: 0 });
  const [opF, setOpF] = useState({ op_type: 'Vente SIM', description: '', price: 5000, payment_mode: 'cash', advance_paid: 0, witness_agreed: null });
  const [loading, setLoading] = useState(false);
  const paid = tPaid(client), rem = remBal(client);
  const gpsOk = client.status === 'achete' && client.gps_brand;
  const partnerName = partners.find(p => p.id === client.partner_id)?.full_name || '—';

  async function handleValidate(gpsData) {
    setLoading(true);
    try {
      const partner = partners.find(p => p.id === client.partner_id);
      await api.validatePurchase(client.id, gpsData, partner?.id);
      const updated = { ...client, status: 'achete', gps_brand: gpsData.gpsBrand, gps_model: gpsData.gpsModel, gps_price: Number(gpsData.gpsPrice), gps_imei: gpsData.gpsImei, gps_sim: gpsData.gpsSim, sim_international: gpsData.sim, purchase_date: gpsData.purchaseDate };
      setClient(updated); onMarkBought(client.id, updated); setShowGPS(false);
    } catch (err) { alert('Erreur : ' + err.message); }
    setLoading(false);
  }

  async function handleAddPay() {
    setLoading(true);
    try {
      const net = Number(payF.amount) - Number(payF.fees);
      const p = { client_id: client.id, amount: Number(payF.amount), mobile_fees: Number(payF.fees), payment_date: payF.date || new Date().toISOString().split('T')[0], note: payF.note, method: payF.method };
      await api.addPayment(p);
      const updated = { ...client, _payments: [...(client._payments || []), { ...p, amount: net }] };
      setClient(updated); onUpdateClient(client.id, updated); setShowPay(false);
    } catch (err) { alert('Erreur : ' + err.message); }
    setLoading(false);
  }

  async function handleAddOp() {
    setLoading(true);
    try {
      const op = { client_id: client.id, ...opF, price: Number(opF.price) };
      await api.addOperation(op);
      const updated = { ...client, _operations: [...(client._operations || []), op] };
      setClient(updated); onUpdateClient(client.id, updated); setShowOp(false);
    } catch (err) { alert('Erreur : ' + err.message); }
    setLoading(false);
  }

  return (
    <div style={S.page(lt)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }} onClick={onBack}>←</button>
          <h2 style={{ margin: 0, fontSize: 17, color: lt ? '#0d1b2a' : '#e2e8f0' }}>Fiche client</h2>
        </div>
        {viewer === 'admin' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {client.payment_type === 'credit' && <button style={S.btn('#3b82f6')} onClick={() => setShowPay(true)}>💳 Paiement</button>}
            <button style={S.btn('#6366f1')} onClick={() => setShowOp(true)}>+ Op.</button>
          </div>
        )}
      </div>
      <div style={{ padding: '0 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
          <Av name={client.full_name} size={80} />
          <h3 style={{ margin: '10px 0 4px', color: lt ? '#0d1b2a' : '#e2e8f0', fontSize: 18 }}>{client.full_name}</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{client.phone}</p>
          <div style={{ marginTop: 8 }}><SBadge status={client.status} /></div>
        </div>
        <ICard title="Informations" lt={lt}>
          <IRow label="Enregistré par" value={partnerName} lt={lt} />
          <IRow label="Domicile" value={`${client.district || ''} ${client.city || ''}`.trim()} lt={lt} />
          {client.workplace && <IRow label="Lieu d'activité" value={client.workplace} lt={lt} />}
          <IRow label="Profession" value={client.job} lt={lt} />
          <IRow label="Moto" value={client.moto_is_new ? 'Neuve' : 'Ancienne'} lt={lt} />
          <IRow label="Victime de vol" value={client.stolen_before ? `Oui (${client.stolen_count}×)` : 'Non'} lt={lt} />
          <IRow label="Entendu via" value={client.heard_via} lt={lt} />
        </ICard>
        <ICard title="Moto" lt={lt}>
          <IRow label="Marque" value={client.moto_brand} lt={lt} />
          <IRow label="Modèle" value={client.moto_model} lt={lt} />
          <IRow label="Plaque" value={client.moto_plate} lt={lt} />
        </ICard>
        <ICard title="GPS" lt={lt}>
          <IRow label="Type d'opération" value={client.gps_type} lt={lt} />
          {gpsOk ? (
            <>
              <IRow label="Marque GPS" value={client.gps_brand} lt={lt} />
              <IRow label="Modèle GPS" value={client.gps_model} lt={lt} />
              <IRow label="Prix" value={money(client.gps_price)} lt={lt} />
              <IRow label="SIM internationale" value={client.sim_international ? 'Oui' : 'Non'} lt={lt} />
              {viewer === 'admin' && <IRow label="IMEI" value={client.gps_imei} lt={lt} />}
              {viewer === 'admin' && <IRow label="SIM GPS" value={client.gps_sim} lt={lt} />}
            </>
          ) : (
            <p style={{ color: '#f59e0b', fontSize: 12, margin: '6px 0 0' }}>⏳ GPS à valider par l'administrateur</p>
          )}
        </ICard>
        <ICard title="Paiement" lt={lt}>
          <IRow label="Mode" value={client.payment_type === 'credit' ? 'Crédit' : 'Cash'} lt={lt} />
          {client.gps_price > 0 && <IRow label="Total dû" value={money(client.gps_price)} lt={lt} />}
          {client.gps_price > 0 && <IRow label="Déjà payé" value={money(paid)} lt={lt} />}
          {client.payment_type === 'credit' && client.gps_price > 0 && <IRow label="Reste à payer" value={money(rem)} lt={lt} />}
          {client.payment_type === 'credit' && <IRow label="Tarif journalier" value={`${money(client.daily_rate)}/jour`} lt={lt} />}
          {client.deadline_date && <IRow label="Échéance" value={fr(client.deadline_date)} lt={lt} />}
          <IRow label="Inscrit le" value={fr(client.register_date)} lt={lt} />
          <IRow label="Acheté le" value={fr(client.purchase_date)} lt={lt} />
          <IRow label="Installation" value={fr(client.install_date)} lt={lt} />
        </ICard>
        {(client._payments || []).length > 0 && (
          <ICard title="Historique des paiements" lt={lt}>
            {client._payments.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${lt ? '#e8edf2' : '#0f172a'}` }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontFamily: 'monospace', color: lt ? '#0d1b2a' : '#e2e8f0' }}>{money(p.amount)}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{fr(p.payment_date)}{p.note ? ` — ${p.note}` : ''}</p>
                </div>
                <span style={S.badge(p.method === 'mobile' ? '#8b5cf6' : '#22c55e')}>{p.method === 'mobile' ? 'Mobile' : 'Cash'}</span>
              </div>
            ))}
          </ICard>
        )}
        {(client._operations || []).length > 0 && (
          <ICard title="Opérations" lt={lt}>
            {client._operations.map((o, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${lt ? '#e8edf2' : '#0f172a'}` }}>
                <span style={{ fontSize: 13, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{o.op_type}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{money(o.price)}</span>
              </div>
            ))}
          </ICard>
        )}
        {viewer === 'admin' && client.status === 'attente' && (
          <button style={{ ...S.btnFull('#22c55e'), marginBottom: 10 }} onClick={() => setShowGPS(true)} disabled={loading}>✅ Valider l'achat</button>
        )}
        {client.payment_type === 'credit' && (
          <button style={{ ...S.btnFull(), background: 'transparent', color: lt ? '#3d5a73' : '#94a3b8', border: `1px solid ${lt ? '#b8c4ce' : '#334155'}`, marginBottom: 10 }} onClick={() => setShowCal(true)}>📅 Voir l'échéancier</button>
        )}
      </div>
      {showGPS && <GPSVal client={client} lt={lt} onClose={() => setShowGPS(false)} onConfirm={handleValidate} />}
      {showCal && <PayCal client={client} lt={lt} onClose={() => setShowCal(false)} />}
      {showPay && (
        <Sheet title="Enregistrer un paiement" lt={lt} onClose={() => setShowPay(false)}>
          <label style={S.label(lt)}>Date</label>
          <input style={S.input(lt)} type="date" value={payF.date} onChange={e => setPayF(x => ({ ...x, date: e.target.value }))} />
          <label style={S.label(lt)}>Note (optionnel)</label>
          <input style={S.input(lt)} placeholder="Description..." value={payF.note} onChange={e => setPayF(x => ({ ...x, note: e.target.value }))} />
          <label style={S.label(lt)}>Montant (F)</label>
          <input style={S.input(lt)} type="number" value={payF.amount} onChange={e => setPayF(x => ({ ...x, amount: e.target.value }))} />
          <Toggle value={payF.method} options={[['cash','Cash'],['mobile','Mobile Money']]} onChange={v => setPayF(x => ({ ...x, method: v }))} />
          {payF.method === 'mobile' && (
            <><label style={S.label(lt)}>Frais mobile (F)</label>
            <input style={S.input(lt)} type="number" value={payF.fees} onChange={e => setPayF(x => ({ ...x, fees: e.target.value }))} />
            <div style={{ background: '#3b82f610', borderRadius: 8, padding: 10, marginBottom: 10 }}><p style={{ margin: 0, color: '#3b82f6', fontSize: 12 }}>Net crédité : {money(Number(payF.amount) - Number(payF.fees))}</p></div></>
          )}
          <div style={{ background: '#3b82f610', borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <p style={{ margin: 0, color: '#3b82f6', fontSize: 12 }}>Reste après ce versement : {money(Math.max(0, rem - (Number(payF.amount) - Number(payF.fees))))}</p>
          </div>
          <button style={S.btnFull()} onClick={handleAddPay} disabled={loading}>{loading ? 'Enregistrement...' : 'Valider le paiement'}</button>
        </Sheet>
      )}
      {showOp && (
        <Sheet title="Ajouter une opération" lt={lt} onClose={() => setShowOp(false)}>
          <label style={S.label(lt)}>Type d'opération</label>
          <select style={S.input(lt)} value={opF.op_type} onChange={e => setOpF(x => ({ ...x, op_type: e.target.value }))}>
            {['Vente SIM','Relais / Entretien','Vente GPS supplémentaire','Autre'].map(t => <option key={t}>{t}</option>)}
          </select>
          {opF.op_type === 'Autre' && <input style={S.input(lt)} placeholder="Décrire l'opération..." value={opF.description} onChange={e => setOpF(x => ({ ...x, description: e.target.value }))} />}
          <label style={S.label(lt)}>Prix (F)</label>
          <input style={S.input(lt)} type="number" value={opF.price} onChange={e => setOpF(x => ({ ...x, price: e.target.value }))} />
          <Toggle value={opF.payment_mode} options={[['cash','Cash'],['credit','Crédit']]} onChange={v => setOpF(x => ({ ...x, payment_mode: v }))} />
          {opF.payment_mode === 'credit' && (<><label style={S.label(lt)}>Avance (F)</label><input style={S.input(lt)} type="number" value={opF.advance_paid} onChange={e => setOpF(x => ({ ...x, advance_paid: e.target.value }))} /></>)}
          <label style={S.label(lt)}>Témoins informés et accepté ?</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[true, false].map(v => (
              <button key={String(v)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer', background: opF.witness_agreed === v ? (v ? '#22c55e20' : '#ef444420') : '#0f172a', color: opF.witness_agreed === v ? (v ? '#22c55e' : '#ef4444') : '#94a3b8', fontWeight: 'bold' }} onClick={() => setOpF(x => ({ ...x, witness_agreed: v }))}>
                {v ? 'Oui' : 'Non'}
              </button>
            ))}
          </div>
          <button style={S.btnFull()} onClick={handleAddOp} disabled={loading}>{loading ? 'Enregistrement...' : "Enregistrer l'opération"}</button>
        </Sheet>
      )}
    </div>
  );
}

// ── Messages View ─────────────────────────────────────────────
function MsgView({ partnerId, partnerName, lt, isAdmin, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api.getMessages(partnerId).then(setMsgs);
    const sub = api.subscribeToMessages(partnerId, payload => setMsgs(prev => [...prev, payload.new]));
    return () => { if (sub?.unsubscribe) sub.unsubscribe(); };
  }, [partnerId]);
  async function send() {
    if (!text.trim()) return;
    setLoading(true);
    await api.sendMessage(partnerId, isAdmin ? 'admin' : 'partner', text.trim());
    setText('');
    const data = await api.getMessages(partnerId);
    setMsgs(data);
    setLoading(false);
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: lt ? '#f0f4f8' : '#0f172a', zIndex: 30, maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 14px 12px', background: lt ? '#fff' : '#1e293b', borderBottom: `1px solid ${lt ? '#e2e8f0' : '#334155'}` }}>
        <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }} onClick={onBack}>←</button>
        <h2 style={{ margin: 0, fontSize: 17, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{isAdmin ? partnerName : 'Service GPS'}</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.length === 0 && <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Aucun message pour l'instant.</p>}
        {msgs.map((m, i) => {
          const isMe = isAdmin ? m.sender === 'admin' : m.sender === 'partner';
          const isIA = m.sender === 'ia';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%', background: isMe ? '#3b82f6' : isIA ? '#8b5cf620' : (lt ? '#fff' : '#1e293b'), borderRadius: 16, padding: '10px 14px', border: isIA ? '1px solid #8b5cf640' : 'none' }}>
                {isIA && <p style={{ margin: '0 0 4px', color: '#8b5cf6', fontSize: 10, textTransform: 'uppercase' }}>IA · automatique</p>}
                <p style={{ margin: 0, color: isMe ? '#fff' : isIA ? '#8b5cf6' : (lt ? '#0d1b2a' : '#e2e8f0'), fontSize: 14 }}>{m.content}</p>
                <p style={{ margin: '4px 0 0', color: isMe ? '#ffffffaa' : '#64748b', fontSize: 10 }}>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: lt ? '#fff' : '#1e293b', borderTop: `1px solid ${lt ? '#e2e8f0' : '#334155'}` }}>
        <input style={{ ...S.input(lt), marginBottom: 0, flex: 1, borderRadius: 24 }} placeholder="Écrire un message..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button style={{ ...S.btn(), borderRadius: '50%', width: 44, height: 44, padding: 0, flexShrink: 0 }} onClick={send} disabled={loading}>➤</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('login');
  const [role, setRole] = useState(null);
  const [lt, setLt] = useState(false);
  const [me, setMe] = useState(null);
  const [partners, setPartners] = useState([]);
  const [clients, setClients] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [adminTab, setAdminTab] = useState('home');
  const [partnerTab, setPartnerTab] = useState('home');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [selClient, setSelClient] = useState(null);
  const [selPartner, setSelPartner] = useState(null);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showMsg, setShowMsg] = useState(null);
  const [cFilter, setCFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [wdForm, setWdForm] = useState({ amount: 10000, method: 'MTN' });

  const app = S.app(lt);

  useEffect(() => {
    if (role === 'admin') loadAll();
    if (role === 'partner' && me) loadPartnerData();
  }, [role]);

  async function loadAll() {
    const [p, c, w] = await Promise.all([api.getPartners(), api.getClients(), api.getWithdrawals()]);
    setPartners(p); setClients(c); setWithdrawals(w);
  }

  async function loadPartnerData() {
    const [c, w] = await Promise.all([api.getClientsByPartner(me.id), api.getWithdrawalsByPartner(me.id)]);
    setClients(c); setWithdrawals(w);
  }

  async function handleLogin() {
    setLoading(true); setLoginError('');
    if (username === 'Admin' && password === 'adminjoino') {
      setRole('admin'); setView('admin');
    } else {
      const partner = await api.loginPartner(username);
      if (partner) { setMe(partner); setRole('partner'); setView('partner'); }
      else setLoginError('Identifiant ou mot de passe incorrect');
    }
    setLoading(false);
  }

  function logout() { setRole(null); setMe(null); setView('login'); setUsername(''); setPassword(''); setClients([]); setPartners([]); setWithdrawals([]); }

  async function handleSearch(term) {
    setSearch(term);
    if (term.length >= 2) { const r = await api.searchClient(term); setSearchResult(r[0] || null); }
    else setSearchResult(null);
  }

  const myClients = clients.filter(c => c.partner_id === me?.id);
  const visClients = (role === 'admin' ? clients : myClients).filter(c => cFilter === 'all' || c.status === cFilter);

  // LOGIN
  if (view === 'login') return (
    <div style={app}>
      <div style={{ padding: '60px 24px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🛰️</div>
          <h1 style={{ color: '#3b82f6', margin: 0, fontSize: 26, fontWeight: 'bold' }}>GPS Partenaires</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Connectez-vous à votre compte</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <button style={S.btnGhost(lt)} onClick={() => setLt(x => !x)}>{lt ? '🌙 Sombre' : '☀️ Clair'}</button>
          </div>
        </div>
        {loginError && <div style={{ background: '#ef444420', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{loginError}</div>}
        <label style={S.label(lt)}>Identifiant</label>
        <input style={S.input(lt)} placeholder="Votre identifiant" value={username} onChange={e => setUsername(e.target.value)} />
        <label style={S.label(lt)}>Mot de passe</label>
        <input style={S.input(lt)} type="password" placeholder="Votre mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button style={S.btnFull()} onClick={handleLogin} disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        <p style={{ color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 16 }}>Admin : admin / admin123</p>
      </div>
    </div>
  );

  // PARTNER
  if (view === 'partner') return (
    <div style={{ ...app, paddingBottom: 70 }}>
      {selClient && <ClientDetail client={selClient} viewer="partner" lt={lt} partners={partners} onBack={() => setSelClient(null)} onMarkBought={() => {}} onUpdateClient={() => {}} />}
      {showAddClient && <AddClientForm partnerId={me?.id} lt={lt} onClose={() => setShowAddClient(false)} onSave={c => setClients(prev => [c, ...prev])} />}
      {showMsg && <MsgView partnerId={me?.id} partnerName="Service GPS" lt={lt} isAdmin={false} onBack={() => setShowMsg(null)} />}

      <div style={S.header(lt)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Av name={me?.full_name || ''} size={38} photoUrl={me?.photo_url} />
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: lt ? '#0d1b2a' : '#e2e8f0', fontSize: 15 }}>Bienvenue {me?.full_name?.split(' ')[0]}</p>
            <p style={{ margin: 0, color: '#3b82f6', fontSize: 11, fontFamily: 'monospace' }}>{me?.code}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btnGhost(lt)} onClick={() => setLt(x => !x)}>{lt ? '🌙' : '☀️'}</button>
          <button style={S.btnGhost(lt)} onClick={logout}>Déco.</button>
        </div>
      </div>

      {partnerTab === 'home' && (
        <div style={{ padding: '12px 12px' }}>
          <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#1e293b)', borderRadius: 14, padding: 18, marginBottom: 12, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>Solde disponible</p>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }} onClick={() => setHideBalance(x => !x)}>{hideBalance ? '👁️' : '🙈'}</button>
                </div>
                <p style={{ margin: 0, color: '#fff', fontSize: 30, fontWeight: 'bold', fontFamily: 'monospace' }}>{hideBalance ? '•••• F' : money(me?.balance || 0)}</p>
              </div>
              <span style={{ fontSize: 28 }}>🛰️</span>
            </div>
            <button style={{ ...S.btnFull(), marginTop: 14, background: '#3b82f640', color: '#60a5fa' }} onClick={() => setPartnerTab('wallet')}>Demander un retrait</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={S.stat(lt)} onClick={() => { setCFilter('all'); setPartnerTab('clients'); }}>
              <div style={{ color: '#3b82f6', fontSize: 26, fontWeight: 'bold' }}>{myClients.length}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Clients amenés</div>
            </div>
            <div style={S.stat(lt)} onClick={() => { setCFilter('achete'); setPartnerTab('clients'); }}>
              <div style={{ color: '#22c55e', fontSize: 26, fontWeight: 'bold' }}>{myClients.filter(c => c.status === 'achete').length}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Achetés</div>
            </div>
          </div>
          <div style={S.card(lt)}>
            <p style={S.secTitle(lt)}>Derniers clients</p>
            {myClients.length === 0 && <p style={{ color: '#475569', fontSize: 13 }}>Aucun client encore.</p>}
            {myClients.slice(0, 5).map(c => (
              <div key={c.id} style={{ ...S.row(lt), cursor: 'pointer' }} onClick={() => setSelClient(c)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Av name={c.full_name} size={34} />
                  <div><p style={{ margin: 0, fontWeight: 'bold', fontSize: 14, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{c.full_name}</p><p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>{c.phone}</p></div>
                </div>
                <SBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {partnerTab === 'clients' && (
        <div style={{ padding: '12px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all','achete','attente'].map(f => (
                <button key={f} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', background: cFilter === f ? '#3b82f620' : lt ? '#e8edf2' : '#1e293b', color: cFilter === f ? '#3b82f6' : '#64748b', fontSize: 12, fontWeight: 'bold' }} onClick={() => setCFilter(f)}>
                  {f === 'all' ? 'Tous' : f === 'achete' ? 'Achetés' : 'En attente'}
                </button>
              ))}
            </div>
            <button style={S.btn()} onClick={() => setShowAddClient(true)}>+ Ajouter</button>
          </div>
          {visClients.map(c => (
            <div key={c.id} style={{ ...S.card(lt), margin: '0 0 8px', cursor: 'pointer' }} onClick={() => setSelClient(c)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Av name={c.full_name} size={38} />
                  <div><p style={{ margin: 0, fontWeight: 'bold', fontSize: 14, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{c.full_name}</p><p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>{c.phone}</p></div>
                </div>
                <SBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {partnerTab === 'wallet' && (
        <div style={{ padding: '12px 12px' }}>
          <div style={S.card(lt)}>
            <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 4px' }}>Solde disponible</p>
            <p style={{ color: lt ? '#0d1b2a' : '#fff', fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace', margin: '0 0 16px' }}>{money(me?.balance || 0)}</p>
            <button style={S.btnFull()} onClick={() => setShowWithdraw(true)}>Demander un retrait</button>
          </div>
          <div style={S.card(lt)}>
            <p style={S.secTitle(lt)}>Mes demandes de retrait</p>
            {withdrawals.length === 0 && <p style={{ color: '#475569', fontSize: 13 }}>Aucun retrait encore.</p>}
            {withdrawals.map(w => (
              <div key={w.id} style={S.row(lt)}>
                <div><p style={{ margin: 0, fontWeight: 'bold', color: lt ? '#0d1b2a' : '#e2e8f0', fontFamily: 'monospace', fontSize: 14 }}>{money(w.amount)}</p><p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>{w.method} Money</p></div>
                <span style={S.badge(w.status === 'valide' ? '#22c55e' : w.status === 'refuse' ? '#ef4444' : '#f59e0b')}>{w.status === 'valide' ? '✓ Validé' : w.status === 'refuse' ? '✗ Refusé' : '⏳ En attente'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {partnerTab === 'messages' && me?.id && <MsgView partnerId={me.id} partnerName="Service GPS" lt={lt} isAdmin={false} onBack={() => setPartnerTab('home')} />}

      <div style={S.nav(lt)}>
        {[['home','🏠','Accueil'],['clients','👥','Clients'],['wallet','💰','Portefeuille'],['messages','💬','Messages']].map(([tab, icon, label]) => (
          <button key={tab} style={S.navBtn(partnerTab === tab, lt)} onClick={() => setPartnerTab(tab)}>
            <span style={{ fontSize: 20 }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {showWithdraw && (
        <Sheet title="Demande de retrait" lt={lt} onClose={() => setShowWithdraw(false)}>
  {/* Vérification solde */}
  <div style={{ background: me?.balance > 0 ? '#22c55e10' : '#ef444410', borderRadius: 10, padding: 12, marginBottom: 14 }}>
    <p style={{ margin: 0, color: me?.balance > 0 ? '#22c55e' : '#ef4444', fontSize: 13, fontWeight: 'bold' }}>
      Solde disponible : {money(me?.balance || 0)}
    </p>
  </div>

  <label style={S.label(lt)}>Montant à retirer (F)</label>
  <input style={S.input(lt)} type="number" value={wdForm.amount}
    onChange={e => setWdForm(x => ({ ...x, amount: Number(e.target.value) }))} />

  <label style={S.label(lt)}>Opérateur Mobile Money</label>
  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
    {['MTN', 'Moov', 'Celtis'].map(m => (
      <button key={m} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer', background: wdForm.method === m ? '#f59e0b20' : lt ? '#e8edf2' : '#0f172a', color: wdForm.method === m ? '#f59e0b' : '#94a3b8', fontWeight: 'bold', fontSize: 12 }}
        onClick={() => setWdForm(x => ({ ...x, method: m }))}>
        {m}
      </button>
    ))}
  </div>

  <label style={S.label(lt)}>Numéro de téléphone pour le dépôt</label>
  <input style={S.input(lt)} type="tel" placeholder="Ex: 97 00 00 00"
    value={wdForm.phone || ''}
    onChange={e => setWdForm(x => ({ ...x, phone: e.target.value }))} />

  <label style={S.label(lt)}>Nom du bénéficiaire</label>
  <input style={S.input(lt)} placeholder="Nom complet"
    value={wdForm.beneficiary || ''}
    onChange={e => setWdForm(x => ({ ...x, beneficiary: e.target.value }))} />

  <button style={S.btnFull()} onClick={async () => {
    if (!me?.balance || me.balance <= 0) {
      alert('❌ Solde insuffisant — vous ne pouvez pas faire de retrait.');
      return;
    }
    if (wdForm.amount > me.balance) {
      alert(`❌ Montant demandé (${money(wdForm.amount)}) supérieur au solde disponible (${money(me.balance)})`);
      return;
    }
    if (!wdForm.phone) {
      alert('❌ Veuillez entrer le numéro de téléphone pour le dépôt.');
      return;
    }
    await api.addWithdrawal({
      partner_id: me.id,
      amount: wdForm.amount,
      method: wdForm.method,
      mobile_number: wdForm.phone,
      beneficiary_name: wdForm.beneficiary || me.full_name,
      status: 'attente'
    });
    await loadPartnerData();
    setShowWithdraw(false);
    alert('✅ Demande envoyée à l\'administrateur !');
  }}>
    Envoyer la demande
  </button>
  <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
    L'administrateur valide et effectue le dépôt sur votre numéro.
  </p>
</Sheet>
      )}
    </div>
  );

  // ADMIN
  if (view === 'admin') return (
    <div style={{ ...app, paddingBottom: 70 }}>
      {selClient && <ClientDetail client={selClient} viewer="admin" lt={lt} partners={partners} onBack={() => setSelClient(null)} onMarkBought={(id, updated) => { setClients(cs => cs.map(c => c.id === id ? updated : c)); setPartners(ps => ps.map(p => p.id === updated.partner_id ? { ...p, balance: (p.balance || 0) + 5000 } : p)); }} onUpdateClient={(id, updated) => setClients(cs => cs.map(c => c.id === id ? updated : c))} />}
      {selPartner && (
        <div style={S.page(lt)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 14px 12px' }}>
            <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSelPartner(null)}>←</button>
            <h2 style={{ margin: 0, fontSize: 17, color: lt ? '#0d1b2a' : '#e2e8f0' }}>Fiche partenaire</h2>
          </div>
          <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
              <Av name={selPartner.full_name} size={80} photoUrl={selPartner.photo_url} />
              <h3 style={{ margin: '10px 0 4px', color: lt ? '#0d1b2a' : '#e2e8f0', fontSize: 18 }}>{selPartner.full_name}</h3>
              <p style={{ margin: 0, color: '#3b82f6', fontSize: 12, fontFamily: 'monospace' }}>{selPartner.code}</p>
              {selPartner.is_blocked && <span style={{ ...S.badge('#ef4444'), marginTop: 8 }}>🔒 Bloqué</span>}
            </div>
            <ICard title="Informations" lt={lt}>
              <IRow label="Téléphone" value={selPartner.phone} lt={lt} />
              <IRow label="Domicile" value={selPartner.address} lt={lt} />
              <IRow label="Lieu de travail" value={selPartner.workplace} lt={lt} />
              <IRow label="Profession" value={selPartner.job} lt={lt} />
              <IRow label="Partenaire depuis" value={fr(selPartner.joined_at)} lt={lt} />
            </ICard>
            <ICard title="Performance" lt={lt}>
              <IRow label="Clients amenés" value={clients.filter(c => c.partner_id === selPartner.id).length} lt={lt} />
              <IRow label="Achetés" value={clients.filter(c => c.partner_id === selPartner.id && c.status === 'achete').length} lt={lt} />
              <IRow label="Solde" value={money(selPartner.balance)} lt={lt} />
            </ICard>
            <ICard title="Pièce d'identité" lt={lt}>
              <IRow label="Type" value={selPartner.id_type} lt={lt} />
              <IRow label="Numéro" value={selPartner.id_number} lt={lt} />
            </ICard>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button style={{ ...S.btn(selPartner.is_blocked ? '#22c55e' : '#ef4444'), flex: 1, padding: 12 }} onClick={async () => {
                if (selPartner.is_blocked) { await api.unblockPartner(selPartner.id); }
                else { const r = prompt('Raison du blocage ?'); if (r) await api.blockPartner(selPartner.id, r); }
                await loadAll(); setSelPartner(null);
              }}>{selPartner.is_blocked ? '🔓 Débloquer' : '🔒 Bloquer'}</button>
              <button style={{ ...S.btn(), flex: 1, padding: 12 }} onClick={() => setShowMsg(selPartner)}>💬 Message</button>
            </div>
          </div>
        </div>
      )}
      {showAddPartner && <AddPartnerForm lt={lt} onClose={() => setShowAddPartner(false)} onSave={async f => { await api.addPartner({ full_name: f.full_name, phone: f.phone, address: f.address, workplace: f.workplace, job: f.job, username: f.username, password_hash: f.password, id_type: f.id_type, id_number: f.id_number, balance: 0, is_blocked: false, code: '' }); await loadAll(); }} />}
      {showMsg && <MsgView partnerId={showMsg.id} partnerName={showMsg.full_name} lt={lt} isAdmin={true} onBack={() => setShowMsg(null)} />}

      <div style={S.header(lt)}>
        <h1 style={{ margin: 0, color: '#3b82f6', fontSize: 18, fontWeight: 'bold' }}>🛰️ GPS Partenaires</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btnGhost(lt)} onClick={() => setLt(x => !x)}>{lt ? '🌙' : '☀️'}</button>
          <button style={S.btnGhost(lt)} onClick={logout}>Déco.</button>
        </div>
      </div>

      {adminTab === 'home' && (
        <div style={{ padding: '12px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              [partners.length,'#3b82f6','Partenaires',() => setAdminTab('partners')],
              [clients.length,'#3b82f6','Clients',() => setAdminTab('clients')],
              [clients.filter(c=>c.status==='achete').length,'#22c55e','Ventes (mois)',() => { setCFilter('achete'); setAdminTab('clients'); }],
              [withdrawals.filter(w=>w.status==='attente').length,'#f59e0b','Retraits en attente',() => setAdminTab('withdrawals')],
              [clients.filter(c=>c.status==='achete'&&c.payment_type==='cash').length,'#3b82f6','Ventes comptant',() => { setCFilter('achete'); setAdminTab('clients'); }],
              [clients.filter(c=>c.status==='achete'&&c.payment_type==='credit').length,'#8b5cf6','Ventes crédit',() => { setCFilter('achete'); setAdminTab('clients'); }],
            ].map(([val, color, label, onClick]) => (
              <div key={label} style={S.stat(lt)} onClick={onClick}>
                <div style={{ color, fontSize: 26, fontWeight: 'bold' }}>{val}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={S.card(lt)}>
            <p style={S.secTitle(lt)}>Clients en attente de validation</p>
            {clients.filter(c => c.status === 'attente').length === 0 && <p style={{ color: '#475569', fontSize: 13 }}>Aucun client en attente.</p>}
            {clients.filter(c => c.status === 'attente').slice(0, 5).map(c => (
              <div key={c.id} style={S.row(lt)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }} onClick={() => setSelClient(c)}>
                  <Av name={c.full_name} size={34} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: 13, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{c.full_name}</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 11 }}>via {partners.find(p => p.id === c.partner_id)?.full_name || '—'}</p>
                  </div>
                </div>
                <button style={S.btn('#22c55e')} onClick={() => setSelClient(c)}>Valider</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'partners' && (
        <div style={{ padding: '12px 12px' }}>
          <button style={{ ...S.btnFull(), marginBottom: 12 }} onClick={() => setShowAddPartner(true)}>+ Ajouter un partenaire</button>
          {partners.map(p => (
            <div key={p.id} style={{ ...S.card(lt), margin: '0 0 8px', cursor: 'pointer' }} onClick={() => setSelPartner(p)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Av name={p.full_name} size={40} photoUrl={p.photo_url} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: 14, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{p.full_name}</p>
                      {p.is_blocked && <span style={S.badge('#ef4444')}>Bloqué</span>}
                    </div>
                    <p style={{ margin: 0, color: '#3b82f6', fontSize: 11, fontFamily: 'monospace' }}>{p.code} · {p.phone}</p>
                  </div>
                </div>
                <p style={{ margin: 0, color: '#3b82f6', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 14 }}>{money(p.balance)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'clients' && (
        <div style={{ padding: '12px 12px' }}>
          <input style={{ ...S.input(lt), marginBottom: 10 }} placeholder="🔍 Rechercher un numéro ou un nom..." value={search} onChange={e => handleSearch(e.target.value)} />
          {search.length >= 2 && (
            <div style={{ background: searchResult ? '#3b82f610' : lt ? '#fff' : '#1e293b', borderRadius: 10, padding: 12, marginBottom: 10, border: `1px solid ${searchResult ? '#3b82f640' : lt ? '#e2e8f0' : '#334155'}` }}>
              {searchResult ? (
                <><p style={{ margin: 0, color: '#3b82f6', fontWeight: 'bold', fontSize: 14 }}>{searchResult.full_name}</p><p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>Enregistré par {partners.find(p => p.id === searchResult.partner_id)?.full_name || '—'}</p></>
              ) : <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Aucun client trouvé.</p>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['all','achete','attente'].map(f => (
              <button key={f} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', background: cFilter === f ? '#3b82f620' : lt ? '#e8edf2' : '#1e293b', color: cFilter === f ? '#3b82f6' : '#64748b', fontSize: 12, fontWeight: 'bold' }} onClick={() => setCFilter(f)}>
                {f === 'all' ? 'Tous' : f === 'achete' ? 'Achetés' : 'En attente'}
              </button>
            ))}
          </div>
          {visClients.map(c => (
            <div key={c.id} style={{ ...S.card(lt), margin: '0 0 8px', cursor: 'pointer' }} onClick={() => setSelClient(c)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Av name={c.full_name} size={38} />
                  <div><p style={{ margin: 0, fontWeight: 'bold', fontSize: 14, color: lt ? '#0d1b2a' : '#e2e8f0' }}>{c.full_name}</p><p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>{partners.find(p => p.id === c.partner_id)?.full_name || c.phone}</p></div>
                </div>
                <SBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'withdrawals' && (
        <div style={{ padding: '12px 12px' }}>
          {withdrawals.length === 0 && <p style={{ color: '#475569', fontSize: 13 }}>Aucun retrait.</p>}
          {withdrawals.map(w => (
            <div key={w.id} style={{ ...S.card(lt), margin: '0 0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: lt ? '#0d1b2a' : '#e2e8f0', fontSize: 14 }}>{partners.find(p => p.id === w.partner_id)?.full_name || '—'}</p>
                <p style={{ margin: 0, color: '#3b82f6', fontFamily: 'monospace', fontWeight: 'bold' }}>{money(w.amount)}</p>
              </div>
              <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: 12 }}>{w.method} Money · {w.mobile_number}</p>
              {w.status === 'attente'
                ? <button style={S.btnFull('#22c55e')} onClick={async () => { const partner = partners.find(p => p.id === w.partner_id); await api.validateWithdrawal(w.id, w.partner_id, w.amount); await loadAll(); }}>✅ Valider et déposer</button>
                : <span style={S.badge('#22c55e')}>✓ Validé</span>}
            </div>
          ))}
        </div>
      )}

      {adminTab === 'messages' && (
        <div style={{ padding: '12px 12px' }}>
          <p style={S.secTitle(lt)}>Conversations</p>
          {partners.length === 0 && <p style={{ color: '#475569', fontSize: 13 }}>Aucun partenaire encore.</p>}
          {partners.map(p => (
            <div key={p.id} style={{ ...S.card(lt), margin: '0 0 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setShowMsg(p)}>
              <Av name={p.full_name} size={40} photoUrl={p.photo_url} />
              <div><p style={{ margin: 0, fontWeight: 'bold', color: lt ? '#0d1b2a' : '#e2e8f0', fontSize: 14 }}>{p.full_name}</p><p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>Appuyer pour écrire</p></div>
            </div>
          ))}
        </div>
      )}

      <div style={S.nav(lt)}>
        {[['home','🏠','Accueil'],['partners','👥','Partenaires'],['clients','👤','Clients'],['withdrawals','💳','Retraits'],['messages','💬','Messages']].map(([tab, icon, label]) => (
          <button key={tab} style={S.navBtn(adminTab === tab, lt)} onClick={() => setAdminTab(tab)}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return null;
}
