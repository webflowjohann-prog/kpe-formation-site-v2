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
        <KpiCard label="Revenus totaux" value={`${(totalRevenue / 100).toLocaleString('fr-FR')} \u20ac`} />
        <KpiCard label="Inscriptions ce mois" value={thisMonth} />
        <KpiCard label="Note Google" value="5.0 \u2605" sub="59 avis" />
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
function StudentsTab({ students, progress, totalLessons }) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filtered = students.filter(s =>
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
      s.amount_paid ? `${s.amount_paid / 100}\u20ac` : '0\u20ac',
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
                  <td style={styles.td}>{s.amount_paid ? `${(s.amount_paid / 100).toLocaleString('fr-FR')} \u20ac` : '-'}</td>
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
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Detail : {selectedStudent.full_name || selectedStudent.email}</h4>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Progression : {getProgress(selectedStudent.id)}% ({progress.filter(p => p.user_id === selectedStudent.id && p.completed).length} / {totalLessons} lecons)
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
        <KpiCard label="Total encaisse" value={`${(totalRevenue / 100).toLocaleString('fr-FR')} \u20ac`} />
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
                <td style={styles.td}><strong>{e.amount_paid ? `${(e.amount_paid / 100).toLocaleString('fr-FR')} \u20ac` : '-'}</strong></td>
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
        setMessage(`${data.quantity} code(s) Stripe cr\u00e9\u00e9(s) avec ${data.discount} de r\u00e9duction.`);
        loadCodes(); // Refresh the list
      }
    } catch (err) {
      setError('Erreur lors de la cr\u00e9ation des codes.');
    }
    setGenerating(false);
    setTimeout(() => { setMessage(''); setError(''); }, 5000);
  };

  const exportCodes = () => {
    const headers = ['Code', 'R\u00e9duction', 'Cr\u00e9\u00e9 le', 'Utilis\u00e9', 'Max utilisations'];
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
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>G\u00e9n\u00e9rer des codes promo Stripe</h3>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>Les codes sont cr\u00e9\u00e9s directement dans Stripe et utilisables sur la page d'achat.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>R\u00e9duction (%)</label>
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
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Quantit\u00e9</label>
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
            {generating ? 'Cr\u00e9ation en cours...' : `G\u00e9n\u00e9rer ${quantity} code(s)`}
          </button>
        </div>
        {message && <p style={{ marginTop: '12px', color: '#059669', fontSize: '14px', fontWeight: '500' }}>\u2705 {message}</p>}
        {error && <p style={{ marginTop: '12px', color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>\u274c {error}</p>}
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
                  <th style={styles.th}>R\u00e9duction</th>
                  <th style={styles.th}>Cr\u00e9\u00e9 le</th>
                  <th style={styles.th}>Utilis\u00e9</th>
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
          <p style={{ fontSize: '14px' }}>Utilisez le formulaire ci-dessus pour cr\u00e9er vos codes de r\u00e9duction.</p>
        </div>
      )}
    </div>
  );
}
// ============================================
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
    { id: 'promo', label: 'Codes promo' },
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
      {activeTab === 'students' && <StudentsTab students={students} progress={progress} totalLessons={totalLessons} />}
      {activeTab === 'payments' && <PaymentsTab enrollments={enrollments} />}
      {activeTab === 'promo' && <PromoCodesTab session={session} />}
    </div>
  );
}
