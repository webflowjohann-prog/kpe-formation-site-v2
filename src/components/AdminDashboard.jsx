import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.PUBLIC_SUPABASE_URL || 'https://xiglhxtsukjgkgfkqlnp.supabase.co';
const supabaseAnonKey = import.meta.env?.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZ2xoeHRzdWtqZ2tnZmtxbG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjQ1NDcsImV4cCI6MjA4OTI0MDU0N30.WXu8utUbq0iptHW2eaH43ws2UO-BbRU0mCibm5YfdlY';

function getSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// ============================================
// STYLES
// ============================================
const styles = {
  container: { maxWidth: '1140px', margin: '0 auto', padding: '0 24px', fontFamily: 'DM Sans, sans-serif' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' },
  tab: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#6b7280', transition: 'all 0.2s' },
  tabActive: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #0d4f4f', background: '#0d4f4f', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'white' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' },
  kpiCard: { background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  kpiLabel: { fontSize: '13px', color: '#9ca3af', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  kpiValue: { fontSize: '32px', fontWeight: '700', color: '#111827' },
  kpiSub: { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  badgeGreen: { background: '#ecfdf5', color: '#059669' },
  badgeRed: { background: '#fef2f2', color: '#dc2626' },
  badgeYellow: { background: '#fffbeb', color: '#d97706' },
  progressBar: { height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #0d4f4f, #14b8a6)', borderRadius: '3px', transition: 'width 0.3s' },
  searchInput: { width: '100%', maxWidth: '400px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '20px', outline: 'none' },
  btn: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  btnPrimary: { background: '#0d4f4f', color: 'white' },
  btnSecondary: { background: 'white', color: '#374151', border: '1px solid #e5e7eb' },
  loginBox: { maxWidth: '400px', margin: '60px auto', background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' },
  activityItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f9fafb' },
  activityDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0 },
};

// ============================================
// LOGIN FORM (admin)
// ============================================
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabase();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError('Email ou mot de passe incorrect.'); setLoading(false); return; }

    // Check admin role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (!profile || profile.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Acces reserve aux administrateurs.');
      setLoading(false);
      return;
    }
    onLogin(data.user, data.session);
    setLoading(false);
  };

  return (
    <div style={styles.loginBox}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>k</div>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', marginBottom: '8px', color: '#111' }}>Administration KPE</h2>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>Connectez-vous avec votre compte administrateur.</p>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      <form onSubmit={handleLogin}>
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input style={styles.input} type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} style={{ ...styles.btn, ...styles.btnPrimary, width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

// ============================================
// KPI CARD
// ============================================
function KpiCard({ label, value, sub }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
      {sub && <div style={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ students, enrollments, totalRevenue, recentActivity }) {
  const thisMonth = enrollments.filter(e => {
    const d = new Date(e.enrolled_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div>
      <div style={styles.kpiGrid}>
        <KpiCard label="Total eleves" value={students.length} />
        <KpiCard label="Revenus totaux" value={`${(totalRevenue / 100).toLocaleString('fr-FR')} €`} />
        <KpiCard label="Inscriptions ce mois" value={thisMonth} />
        <KpiCard label="Note Google" value="5.0 ★" sub="59 avis" />
      </div>

      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '16px', color: '#111' }}>Activite recente</h3>
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {recentActivity.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Aucune activite recente.</p>}
        {recentActivity.slice(0, 10).map((a, i) => (
          <div key={i} style={styles.activityItem}>
            <div style={styles.activityDot}></div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: '600', color: '#111', fontSize: '14px' }}>{a.full_name || a.email}</span>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}> s'est inscrit(e)</span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>{new Date(a.enrolled_at).toLocaleDateString('fr-FR')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// STUDENTS TAB
// ============================================
function StudentsTab({ students, progress, totalLessons, session }) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [localStudents, setLocalStudents] = useState(students);

  useEffect(() => { setLocalStudents(students); }, [students]);

  const filtered = localStudents.filter(s =>
    (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getProgress = (userId) => {
    const completed = progress.filter(p => p.user_id === userId && p.completed).length;
    return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Email', 'Date inscription', 'Montant paye', 'Progression'];
    const rows = filtered.map(s => [
      s.full_name || '',
      s.email,
      s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('fr-FR') : '',
      s.amount_paid ? `${s.amount_paid / 100}€` : '0€',
      `${getProgress(s.id)}%`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kpe-eleves-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <input style={styles.searchInput} type="text" placeholder="Rechercher un eleve..." value={search} onChange={e => setSearch(e.target.value)} />
        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={exportCSV}>Exporter CSV</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Eleve</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Inscription</th>
              <th style={styles.th}>Montant</th>
              <th style={styles.th}>Progression</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>Aucun eleve trouve.</td></tr>
            )}
            {filtered.map(s => {
              const pct = getProgress(s.id);
              return (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(selectedStudent?.id === s.id ? null : s)}>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '600', color: '#111' }}>{s.full_name || 'Sans nom'}</span>
                  </td>
                  <td style={styles.td}>{s.email}</td>
                  <td style={styles.td}>{s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('fr-FR') : '-'}</td>
                  <td style={styles.td}>{s.amount_paid ? `${(s.amount_paid / 100).toLocaleString('fr-FR')} €` : '-'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...styles.progressBar, width: '100px' }}>
                        <div style={{ ...styles.progressFill, width: `${pct}%` }}></div>
                      </div>
                      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <div style={{ marginTop: '20px', background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600' }}>Detail : {selectedStudent.full_name || selectedStudent.email}</h4>
            <button onClick={async () => {
              const supabase = getSupabase();
              const newBlocked = !selectedStudent.is_blocked;
              await supabase.from('profiles').update({ is_blocked: newBlocked }).eq('id', selectedStudent.id);
              setLocalStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, is_blocked: newBlocked } : s));
              setSelectedStudent({ ...selectedStudent, is_blocked: newBlocked });
            }} style={{ ...styles.btn, ...(selectedStudent.is_blocked ? styles.btnPrimary : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }) }}>
              {selectedStudent.is_blocked ? 'Debloquer' : 'Bloquer cet eleve'}
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Email : {selectedStudent.email} | Progression : {getProgress(selectedStudent.id)}% ({progress.filter(p => p.user_id === selectedStudent.id && p.completed).length} / {totalLessons} lecons)
            {selectedStudent.is_blocked && <span style={{ ...styles.badge, ...styles.badgeRed, marginLeft: '8px' }}>Bloque</span>}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// PAYMENTS TAB
// ============================================
function PaymentsTab({ enrollments }) {
  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
  const paid = enrollments.filter(e => e.status === 'active');
  const refunded = enrollments.filter(e => e.status === 'refunded');

  return (
    <div>
      <div style={styles.kpiGrid}>
        <KpiCard label="Total encaisse" value={`${(totalRevenue / 100).toLocaleString('fr-FR')} €`} />
        <KpiCard label="Paiements reussis" value={paid.length} />
        <KpiCard label="Remboursements" value={refunded.length} />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Eleve</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Montant</th>
              <th style={styles.th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 && (
              <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>Aucun paiement.</td></tr>
            )}
            {enrollments.map(e => (
              <tr key={e.id}>
                <td style={styles.td}>{new Date(e.enrolled_at).toLocaleDateString('fr-FR')}</td>
                <td style={styles.td}><span style={{ fontWeight: '500' }}>{e.profiles?.full_name || e.profiles?.email || '-'}</span></td>
                <td style={styles.td}>{e.product_type === 'online' ? 'En ligne' : 'Presentiel'}</td>
                <td style={styles.td}><strong>{e.amount_paid ? `${(e.amount_paid / 100).toLocaleString('fr-FR')} €` : '-'}</strong></td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    ...(e.status === 'active' ? styles.badgeGreen : e.status === 'refunded' ? styles.badgeRed : styles.badgeYellow)
                  }}>
                    {e.status === 'active' ? 'Paye' : e.status === 'refunded' ? 'Rembourse' : e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// PROMO CODES TAB
// ============================================
function PromoCodesTab({ session }) {
  const [codes, setCodes] = useState([]);
  const [discount, setDiscount] = useState(100);
  const [quantity, setQuantity] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load existing codes from Stripe on mount
  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promo-codes', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
    } catch (err) {
      console.error('Error loading codes:', err);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ discount, quantity })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage(`${data.quantity} code(s) Stripe créé(s) avec ${data.discount} de réduction.`);
        loadCodes(); // Refresh the list
      }
    } catch (err) {
      setError('Erreur lors de la création des codes.');
    }
    setGenerating(false);
    setTimeout(() => { setMessage(''); setError(''); }, 5000);
  };

  const exportCodes = () => {
    const headers = ['Code', 'Réduction', 'Créé le', 'Utilisé', 'Max utilisations'];
    const rows = codes.map(c => [c.code, c.discount, new Date(c.created).toLocaleDateString('fr-FR'), c.times_redeemed, c.max_redemptions || '-']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kpe-codes-stripe-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Générer des codes promo Stripe</h3>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>Les codes sont créés directement dans Stripe et utilisables sur la page d'achat.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Réduction (%)</label>
            <select value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ ...styles.input, marginBottom: 0, width: '140px' }}>
              <option value={10}>10%</option>
              <option value={20}>20%</option>
              <option value={30}>30%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100% (gratuit)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Quantité</label>
            <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ ...styles.input, marginBottom: 0, width: '120px' }}>
              <option value={1}>1</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating} style={{ ...styles.btn, ...styles.btnPrimary, opacity: generating ? 0.6 : 1 }}>
            {generating ? 'Création en cours...' : `Générer ${quantity} code(s)`}
          </button>
        </div>
        {message && <p style={{ marginTop: '12px', color: '#059669', fontSize: '14px', fontWeight: '500' }}>✅ {message}</p>}
        {error && <p style={{ marginTop: '12px', color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>❌ {error}</p>}
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>Chargement des codes Stripe...</p>}

      {!loading && codes.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{codes.length} code(s) actif(s) dans Stripe</h3>
            <button onClick={exportCodes} style={{ ...styles.btn, ...styles.btnSecondary }}>Exporter CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Réduction</th>
                  <th style={styles.th}>Créé le</th>
                  <th style={styles.th}>Utilisé</th>
                  <th style={styles.th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c, i) => (
                  <tr key={i}>
                    <td style={styles.td}><code style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', fontSize: '13px', background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>{c.code}</code></td>
                    <td style={styles.td}>{c.discount}</td>
                    <td style={styles.td}>{new Date(c.created).toLocaleDateString('fr-FR')}</td>
                    <td style={styles.td}>{c.times_redeemed} fois</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(c.active ? styles.badgeGreen : styles.badgeRed) }}>
                        {c.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && codes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <p style={{ fontSize: '16px' }}>Aucun code promo actif dans Stripe.</p>
          <p style={{ fontSize: '14px' }}>Utilisez le formulaire ci-dessus pour créer vos codes de réduction.</p>
        </div>
      )}
    </div>
  );
}
// ============================================

// ============================================
// CHAT TAB
// ============================================
function ChatTab({ students, session, adminId }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = students.filter(s =>
    (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (selectedStudent) loadMessages(selectedStudent.id);
  }, [selectedStudent]);

  const loadMessages = async (studentId) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${adminId},recipient_id.eq.${studentId}),and(sender_id.eq.${studentId},recipient_id.eq.${adminId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    // Mark unread messages as read
    if (data) {
      const unread = data.filter(m => m.recipient_id === adminId && !m.read).map(m => m.id);
      if (unread.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unread);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent) return;
    setSending(true);
    const supabase = getSupabase();
    await supabase.from('messages').insert({
      sender_id: adminId,
      recipient_id: selectedStudent.id,
      content: newMessage.trim()
    });
    setNewMessage('');
    await loadMessages(selectedStudent.id);
    // Send email notification to student
    try {
      await fetch('/api/notify-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ studentEmail: selectedStudent.email, studentName: selectedStudent.full_name })
      });
    } catch (e) { console.error('Notification error:', e); }
    setSending(false);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '500px' }}>
      <div style={{ width: '280px', flexShrink: 0 }}>
        <input style={{ ...styles.searchInput, maxWidth: '100%', marginBottom: '12px' }} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelectedStudent(s)} style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb',
              background: selectedStudent?.id === s.id ? '#f0fdfa' : 'white',
              transition: 'background 0.2s'
            }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#111' }}>{s.full_name || 'Sans nom'}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{s.email}</div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Aucun élève</div>}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
        {!selectedStudent ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <p>Sélectionnez un élève pour démarrer une conversation.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', fontWeight: '600', color: '#111' }}>
              {selectedStudent.full_name || selectedStudent.email}
            </div>
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px' }}>
              {messages.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '14px' }}>Aucun message. Commencez la conversation.</p>}
              {messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.sender_id === adminId ? 'flex-end' : 'flex-start',
                  background: m.sender_id === adminId ? '#0d4f4f' : '#f3f4f6',
                  color: m.sender_id === adminId ? 'white' : '#111',
                  padding: '10px 14px', borderRadius: '12px', maxWidth: '70%', fontSize: '14px', lineHeight: '1.5'
                }}>
                  {m.content}
                  <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>{new Date(m.created_at).toLocaleString('fr-FR')}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '8px' }}>
              <input style={{ ...styles.input, marginBottom: 0, flex: 1 }} placeholder="Votre message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
              <button onClick={sendMessage} disabled={sending} style={{ ...styles.btn, ...styles.btnPrimary, whiteSpace: 'nowrap' }}>
                {sending ? '...' : 'Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// REVENUE CHART TAB
// ============================================
function RevenueChart({ enrollments }) {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    const monthEnrollments = enrollments.filter(e => {
      const ed = new Date(e.enrolled_at);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
    });
    const revenue = monthEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0) / 100;
    const count = monthEnrollments.length;
    months.push({ key, label, revenue, count });
  }

  const maxRevenue = Math.max(...months.map(m => m.revenue), 1);

  return (
    <div>
      <div style={styles.kpiGrid}>
        <KpiCard label="Revenus 12 derniers mois" value={`${months.reduce((s, m) => s + m.revenue, 0).toLocaleString('fr-FR')} €`} />
        <KpiCard label="Inscriptions 12 derniers mois" value={months.reduce((s, m) => s + m.count, 0)} />
        <KpiCard label="Meilleur mois" value={`${Math.max(...months.map(m => m.revenue)).toLocaleString('fr-FR')} €`} />
        <KpiCard label="Moyenne mensuelle" value={`${Math.round(months.reduce((s, m) => s + m.revenue, 0) / 12).toLocaleString('fr-FR')} €`} />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>Revenus par mois</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px' }}>
          {months.map(m => (
            <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>{m.revenue > 0 ? `${m.revenue}€` : ''}</div>
              <div style={{
                width: '100%', maxWidth: '40px',
                height: `${Math.max((m.revenue / maxRevenue) * 160, m.revenue > 0 ? 8 : 2)}px`,
                background: m.revenue > 0 ? 'linear-gradient(180deg, #14b8a6, #0d4f4f)' : '#f3f4f6',
                borderRadius: '4px 4px 0 0', transition: 'height 0.3s'
              }} title={`${m.label}: ${m.revenue}€ (${m.count} inscriptions)`}></div>
              <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '24px', background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Détail par mois</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Mois</th>
              <th style={styles.th}>Inscriptions</th>
              <th style={styles.th}>Revenus</th>
            </tr>
          </thead>
          <tbody>
            {[...months].reverse().map(m => (
              <tr key={m.key}>
                <td style={styles.td}>{m.label}</td>
                <td style={styles.td}>{m.count}</td>
                <td style={styles.td}><strong>{m.revenue.toLocaleString('fr-FR')} €</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ============================================
// EMAIL MARKETING TAB
// ============================================
function EmailMarketingTab({ session }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [filter, setFilter] = useState('all'); // all, online, presentiel
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const templates = [
    {
      id: 'welcome_back',
      name: 'Relance : Reprenez votre formation',
      subject: 'Votre formation KPE vous attend !',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#0d4f4f;font-size:24px;">Bonjour {{name}},</h1>
        <p style="font-size:16px;line-height:1.6;color:#333;">Cela fait un moment que vous n'avez pas visité votre espace formation KPE. Vos modules vous attendent !</p>
        <p style="font-size:16px;line-height:1.6;color:#333;">Saviez-vous que les élèves qui pratiquent régulièrement obtiennent des résultats remarquables dès les premières séances avec leurs consultants ?</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="https://kpe-formation-site.netlify.app/espace-eleve/" style="background:#c8a44e;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">Reprendre ma formation</a>
        </div>
        <p style="color:#666;font-size:14px;">Joël Prieur<br>Formateur KPE</p>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">KPE Formation – Kinésiologie Professionnelle et Énergétique</p>
      </div>`
    },
    {
      id: 'upsell_presentiel',
      name: 'Upsell : Découvrez le présentiel',
      subject: 'Passez au niveau supérieur : formation KPE en présentiel',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#0d4f4f;font-size:24px;">Bonjour {{name}},</h1>
        <p style="font-size:16px;line-height:1.6;color:#333;">Vous avez déjà franchi un cap important en suivant la formation KPE en ligne. Félicitations !</p>
        <p style="font-size:16px;line-height:1.6;color:#333;">Pour aller encore plus loin, la <strong>formation en présentiel à Aurillac</strong> vous permet de pratiquer directement sous la supervision de Joël Prieur. 8 week-ends, des cas réels, et l'énergie du groupe.</p>
        <div style="background:#f8f6f1;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0;font-size:15px;color:#333;"><strong>Prochaine session :</strong> Septembre 2026 à Aurillac</p>
          <p style="margin:8px 0 0;font-size:15px;color:#333;"><strong>Tarif :</strong> 3 999€</p>
        </div>
        <div style="text-align:center;margin:30px 0;">
          <a href="https://kpe-formation-site.netlify.app/formation-presentiel/" style="background:#c8a44e;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">Découvrir le présentiel</a>
        </div>
        <p style="color:#666;font-size:14px;">Joël Prieur<br>Formateur KPE</p>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">KPE Formation – Kinésiologie Professionnelle et Énergétique</p>
      </div>`
    },
    {
      id: 'new_content',
      name: 'Nouveau contenu disponible',
      subject: 'Nouveau contenu disponible dans votre formation KPE',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#0d4f4f;font-size:24px;">Bonjour {{name}},</h1>
        <p style="font-size:16px;line-height:1.6;color:#333;">Bonne nouvelle ! De nouveaux contenus sont disponibles dans votre espace formation KPE.</p>
        <p style="font-size:16px;line-height:1.6;color:#333;">Connectez-vous dès maintenant pour découvrir les nouvelles leçons et continuer votre progression.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="https://kpe-formation-site.netlify.app/espace-eleve/" style="background:#c8a44e;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">Accéder aux nouveautés</a>
        </div>
        <p style="color:#666;font-size:14px;">Joël Prieur<br>Formateur KPE</p>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">KPE Formation – Kinésiologie Professionnelle et Énergétique</p>
      </div>`
    },
    {
      id: 'promo',
      name: 'Offre promotionnelle',
      subject: 'Offre spéciale KPE : -50% cette semaine uniquement',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#0d4f4f;font-size:24px;">Bonjour {{name}},</h1>
        <p style="font-size:16px;line-height:1.6;color:#333;">Pour une durée limitée, profitez d'une <strong>réduction exceptionnelle</strong> sur la formation KPE en ligne.</p>
        <div style="background:#0d4f4f;color:white;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
          <p style="font-size:32px;font-weight:bold;margin:0;">-50%</p>
          <p style="margin:8px 0 0;font-size:16px;opacity:0.8;">Avec le code promo fourni</p>
        </div>
        <p style="font-size:16px;line-height:1.6;color:#333;">Cette offre est valable jusqu'à dimanche minuit. Ne laissez pas passer cette opportunité de vous former à la kinésiologie psycho-énergétique.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="https://kpe-formation-site.netlify.app/achat/" style="background:#c8a44e;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">Profiter de l'offre</a>
        </div>
        <p style="color:#666;font-size:14px;">Joël Prieur<br>Formateur KPE</p>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">KPE Formation – Kinésiologie Professionnelle et Énergétique</p>
      </div>`
    },
    {
      id: 'custom',
      name: 'Email personnalisé (vide)',
      subject: '',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#0d4f4f;font-size:24px;">Bonjour {{name}},</h1>
        <p style="font-size:16px;line-height:1.6;color:#333;">Votre contenu ici...</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="https://kpe-formation-site.netlify.app/espace-eleve/" style="background:#c8a44e;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">Accéder à mon espace</a>
        </div>
        <p style="color:#666;font-size:14px;">Joël Prieur<br>Formateur KPE</p>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">KPE Formation – Kinésiologie Professionnelle et Énergétique</p>
      </div>`
    }
  ];

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.students) setStudents(data.students);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredStudents = students.filter(s => {
    if (filter === 'online') return s.product_type === 'online';
    if (filter === 'presentiel') return s.product_type === 'presentiel';
    return true;
  });

  const applyTemplate = (templateId) => {
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setSubject(t.subject);
      setHtmlContent(t.html);
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = async () => {
    if (!subject || !htmlContent) return;
    if (!confirm(`Envoyer cet email à ${filteredStudents.length} élève(s) ?`)) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          subject,
          htmlContent,
          recipients: filteredStudents.map(s => ({ email: s.email, name: s.full_name || '' }))
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Erreur lors de l\'envoi.' });
    }
    setSending(false);
  };

  return (
    <div>
      <div style={styles.kpiGrid}>
        <KpiCard label="Total élèves" value={students.length} />
        <KpiCard label="En ligne" value={students.filter(s => s.product_type === 'online').length} />
        <KpiCard label="Présentiel" value={students.filter(s => s.product_type === 'presentiel').length} />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Choisir un template</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {templates.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t.id)} style={{
              ...styles.btn,
              ...(selectedTemplate === t.id ? styles.btnPrimary : styles.btnSecondary),
              fontSize: '13px', padding: '8px 16px'
            }}>{t.name}</button>
          ))}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Destinataires</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setFilter('all')} style={{ ...styles.btn, ...(filter === 'all' ? styles.btnPrimary : styles.btnSecondary), fontSize: '13px', padding: '6px 14px' }}>Tous ({students.length})</button>
            <button onClick={() => setFilter('online')} style={{ ...styles.btn, ...(filter === 'online' ? styles.btnPrimary : styles.btnSecondary), fontSize: '13px', padding: '6px 14px' }}>En ligne ({students.filter(s => s.product_type === 'online').length})</button>
            <button onClick={() => setFilter('presentiel')} style={{ ...styles.btn, ...(filter === 'presentiel' ? styles.btnPrimary : styles.btnSecondary), fontSize: '13px', padding: '6px 14px' }}>Présentiel ({students.filter(s => s.product_type === 'presentiel').length})</button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Objet de l'email</label>
          <input style={{ ...styles.input, marginBottom: 0 }} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Objet de votre email..." />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Contenu HTML (utilisez {"{{name}}"} pour le prénom)</label>
          <textarea style={{ ...styles.input, marginBottom: 0, minHeight: '200px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', lineHeight: '1.5' }} value={htmlContent} onChange={e => setHtmlContent(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowPreview(!showPreview)} style={{ ...styles.btn, ...styles.btnSecondary }}>
            {showPreview ? 'Masquer l\'aperçu' : 'Voir l\'aperçu'}
          </button>
          <button onClick={handleSend} disabled={sending || !subject || !htmlContent || filteredStudents.length === 0} style={{ ...styles.btn, ...styles.btnPrimary, opacity: (sending || !subject || !htmlContent) ? 0.5 : 1 }}>
            {sending ? 'Envoi en cours...' : `Envoyer à ${filteredStudents.length} élève(s)`}
          </button>
        </div>

        {result && !result.error && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#ecfdf5', borderRadius: '8px', color: '#059669', fontSize: '14px' }}>
            ✅ {result.sent} email(s) envoyé(s) avec succès.{result.failed > 0 && ` ${result.failed} échec(s).`}
          </div>
        )}
        {result?.error && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
            ❌ {result.error}
          </div>
        )}
      </div>

      {showPreview && htmlContent && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Aperçu de l'email</h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }} dangerouslySetInnerHTML={{ __html: htmlContent.replace(/\{\{name\}\}/g, 'Jean Dupont') }} />
        </div>
      )}
    </div>
  );
}

// MAIN ADMIN DASHBOARD
// ============================================
export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  // Check session on mount
  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role === 'admin') {
          setUser(session.user);
          setSession(session);
        }
      }
      setLoading(false);
    });
  }, []);

  // Load data when logged in
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const supabase = getSupabase();

    // Fetch all profiles (students)
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'student');

    // Fetch all enrollments with profiles
    const { data: enr } = await supabase.from('enrollments').select('*, profiles(full_name, email)').order('enrolled_at', { ascending: false });

    // Fetch all progress
    const { data: prog } = await supabase.from('progress').select('*');

    // Count total lessons
    const { count } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

    // Build students list with enrollment data
    const studentList = (profiles || []).map(p => {
      const enrollment = (enr || []).find(e => e.user_id === p.id);
      return { ...p, enrolled_at: enrollment?.enrolled_at, amount_paid: enrollment?.amount_paid, product_type: enrollment?.product_type };
    });

    const revenue = (enr || []).reduce((sum, e) => sum + (e.amount_paid || 0), 0);

    // Recent activity (enrollments with name)
    const recent = (enr || []).map(e => ({
      full_name: e.profiles?.full_name,
      email: e.profiles?.email,
      enrolled_at: e.enrolled_at,
      amount_paid: e.amount_paid
    }));

    setStudents(studentList);
    setEnrollments(enr || []);
    setProgress(prog || []);
    setTotalLessons(count || 0);
    setTotalRevenue(revenue);
    setRecentActivity(recent);
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 20px', color: '#9ca3af' }}>Chargement...</div>;
  }

  if (!user) {
    return <AdminLogin onLogin={(u, s) => { setUser(u); setSession(s); }} />;
  }

  const tabList = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'students', label: `Eleves (${students.length})` },
    { id: 'payments', label: 'Paiements' },
    { id: 'revenue', label: 'Revenus' },
    { id: 'chat', label: 'Chat' },
    { id: 'promo', label: 'Codes promo' },
    { id: 'email', label: 'Email Marketing' },
  ];

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,3vw,32px)', color: '#111', marginBottom: '4px' }}>Dashboard Administration</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>KPE Formation</p>
        </div>
        <button onClick={handleLogout} style={{ ...styles.btn, ...styles.btnSecondary }}>Deconnexion</button>
      </div>

      <div style={styles.tabs}>
        {tabList.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={activeTab === t.id ? styles.tabActive : styles.tab}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab students={students} enrollments={enrollments} totalRevenue={totalRevenue} recentActivity={recentActivity} />}
      {activeTab === 'students' && <StudentsTab students={students} progress={progress} totalLessons={totalLessons} session={session} />}
      {activeTab === 'payments' && <PaymentsTab enrollments={enrollments} />}
      {activeTab === 'revenue' && <RevenueChart enrollments={enrollments} />}
      {activeTab === 'chat' && <ChatTab students={students} session={session} adminId={user.id} />}
      {activeTab === 'promo' && <PromoCodesTab session={session} />}
      {activeTab === 'email' && <EmailMarketingTab session={session} />}
    </div>
  );
}
