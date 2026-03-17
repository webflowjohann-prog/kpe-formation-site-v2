import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.PUBLIC_SUPABASE_URL || 'https://xiglhxtsukjgkgfkqlnp.supabase.co';
const supabaseAnonKey = import.meta.env?.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZ2xoeHRzdWtqZ2tnZmtxbG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjQ1NDcsImV4cCI6MjA4OTI0MDU0N30.WXu8utUbq0iptHW2eaH43ws2UO-BbRU0mCibm5YfdlY';

function getSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// ============================================
// LOGIN FORM
// ============================================
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // login | reset
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = getSupabase();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }

    onLogin(data.user, data.session);
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const supabase = getSupabase();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/espace-eleve`,
    });

    if (resetError) {
      setError('Erreur lors de l\'envoi du lien.');
    } else {
      setMessage('Un email de réinitialisation vous a été envoyé.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <img src="/images/logo-teal.png" alt="KPE" width="48" height="48" style={{ margin: '0 auto 16px', display: 'block' }} />
        <h2 style={styles.loginTitle}>
          {mode === 'login' ? 'Accéder à ma formation' : 'Réinitialiser mon mot de passe'}
        </h2>
        <p style={styles.loginSub}>
          {mode === 'login'
            ? 'Connectez-vous avec vos identifiants KPE.'
            : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
        </p>

        <form onSubmit={mode === 'login' ? handleLogin : handleReset}>
          <input
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          {mode === 'login' && (
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          )}

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Envoyer le lien'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(''); setMessage(''); }}
          style={styles.linkBtn}
        >
          {mode === 'login' ? 'Mot de passe oublié ?' : '← Retour à la connexion'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// MODULE CARD
// ============================================
function ModuleCard({ module, lessons, progress, isEnrolled, onSelectModule }) {
  const moduleLessons = lessons.filter((l) => l.module_id === module.id);
  const completedLessons = moduleLessons.filter((l) =>
    progress.some((p) => p.lesson_id === l.id && p.completed)
  ).length;
  const totalLessons = moduleLessons.length;
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div
      onClick={() => isEnrolled && onSelectModule(module)}
      style={{
        ...styles.moduleCard,
        cursor: isEnrolled ? 'pointer' : 'default',
        opacity: isEnrolled ? 1 : 0.5,
      }}
    >
      <div style={styles.moduleNum}>{String(module.sort_order).padStart(2, '0')}</div>
      <h3 style={styles.moduleTitle}>{module.title}</h3>
      <p style={styles.moduleDesc}>{module.description}</p>
      {isEnrolled && totalLessons > 0 && (
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${percent}%` }} />
        </div>
      )}
      <div style={styles.moduleMeta}>
        {isEnrolled ? (
          <span>{completedLessons}/{totalLessons} leçons · {percent}%</span>
        ) : (
          <span style={{ color: '#9ca3af' }}>🔒 Accès après inscription</span>
        )}
      </div>
    </div>
  );
}

// ============================================
// MODULE VIEW (lessons list + video player)
// ============================================
function ModuleView({ module, lessons, progress, session, onBack }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const moduleLessons = lessons
    .filter((l) => l.module_id === module.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const isCompleted = (lessonId) =>
    progress.some((p) => p.lesson_id === lessonId && p.completed);

  const markComplete = async (lessonId) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ lesson_id: lessonId, completed: true }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Error marking complete:', err);
    }
  };

  return (
    <div>
      <button onClick={onBack} style={styles.backBtn}>← Retour aux modules</button>
      <h2 style={styles.moduleViewTitle}>
        Module {module.sort_order} : {module.title}
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '15px' }}>{module.description}</p>

      <div style={styles.lessonsGrid}>
        <div style={styles.lessonsList}>
          {moduleLessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              style={{
                ...styles.lessonItem,
                background: activeLesson?.id === lesson.id ? '#e0f7f7' : '#f9fafb',
                borderColor: activeLesson?.id === lesson.id ? '#04BFBF' : '#e5e7eb',
              }}
            >
              <div style={styles.lessonCheck}>
                {isCompleted(lesson.id) ? '✓' : lesson.sort_order}
              </div>
              <div>
                <div style={styles.lessonTitle}>{lesson.title}</div>
                {lesson.duration_minutes > 0 && (
                  <div style={styles.lessonDuration}>{lesson.duration_minutes} min</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.videoArea}>
          {activeLesson ? (
            <div>
              <div style={styles.videoPlaceholder}>
                {activeLesson.video_url ? (
                  <div dangerouslySetInnerHTML={{
                    __html: `<iframe src="${activeLesson.video_url}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:none;" />`
                  }} />
                ) : (
                  <div style={styles.noVideo}>
                    <p>Vidéo bientôt disponible</p>
                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>La vidéo de cette leçon sera ajoutée prochainement.</p>
                  </div>
                )}
              </div>
              <div style={styles.lessonActions}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{activeLesson.title}</h3>
                {activeLesson.pdf_url && (
                  <a href={activeLesson.pdf_url} target="_blank" rel="noopener" style={styles.pdfLink}>
                    📄 Télécharger le support PDF
                  </a>
                )}
                {!isCompleted(activeLesson.id) && (
                  <button onClick={() => markComplete(activeLesson.id)} style={styles.completeBtn}>
                    ✓ Marquer comme terminé
                  </button>
                )}
                {isCompleted(activeLesson.id) && (
                  <span style={styles.completedBadge}>✓ Terminé</span>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.noVideo}>
              <p>Sélectionnez une leçon</p>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Cliquez sur une leçon dans la liste pour la visionner.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN ESPACE ÉLÈVE COMPONENT
// ============================================
export default function EspaceEleve() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = getSupabase();
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    if (currentSession) {
      setUser(currentSession.user);
      setSession(currentSession);
      await loadData(currentSession);
    }
    setLoading(false);
  };

  const loadData = async (sess) => {
    const supabase = getSupabase();

    const [modulesRes, lessonsRes, progressRes, enrollmentsRes] = await Promise.all([
      supabase.from('modules').select('*').order('sort_order'),
      supabase.from('lessons').select('*').order('sort_order'),
      supabase.from('progress').select('*').eq('user_id', sess.user.id),
      supabase.from('enrollments').select('*').eq('user_id', sess.user.id),
    ]);

    setModules(modulesRes.data || []);
    setLessons(lessonsRes.data || []);
    setProgress(progressRes.data || []);
    setEnrollments(enrollmentsRes.data || []);
  };

  const handleLogin = async (user, session) => {
    setUser(user);
    setSession(session);
    await loadData(session);
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const isEnrolled = enrollments.some((e) => e.status === 'active');

  const totalLessons = lessons.length;
  const completedLessons = progress.filter((p) => p.completed).length;
  const globalPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <div style={styles.dashHeader}>
        <div>
          <h1 style={styles.dashTitle}>Mon espace formation</h1>
          <p style={styles.dashSub}>
            Bienvenue {user.user_metadata?.full_name || user.email}
          </p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Déconnexion</button>
      </div>

      {/* Global progress */}
      {isEnrolled && (
        <div style={styles.globalProgress}>
          <div style={styles.globalProgressBar}>
            <div style={{ ...styles.globalProgressFill, width: `${globalPercent}%` }} />
          </div>
          <span style={styles.globalProgressText}>
            {completedLessons}/{totalLessons} leçons terminées · {globalPercent}%
          </span>
        </div>
      )}

      {!isEnrolled && (
        <div style={styles.notEnrolled}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1f2937' }}>Vous n'êtes pas encore inscrit</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>Inscrivez-vous à la formation KPE pour accéder aux modules vidéo.</p>
          <a href="/formation-en-ligne" style={styles.btnPrimary}>Découvrir la formation →</a>
        </div>
      )}

      {/* Module grid or module view */}
      {activeModule ? (
        <ModuleView
          module={activeModule}
          lessons={lessons}
          progress={progress}
          session={session}
          onBack={() => setActiveModule(null)}
        />
      ) : (
        <div style={styles.modulesGrid}>
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              lessons={lessons}
              progress={progress}
              isEnrolled={isEnrolled}
              onSelectModule={setActiveModule}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// STYLES
// ============================================
const styles = {
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' },
  spinner: { width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#025159', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  loginContainer: { display: 'flex', justifyContent: 'center', padding: '40px 20px' },
  loginCard: { background: '#f9fafb', borderRadius: '20px', padding: '48px 40px', maxWidth: '420px', width: '100%', border: '1px solid #e5e7eb' },
  loginTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: '600', color: '#1f2937', textAlign: 'center', marginBottom: '8px' },
  loginSub: { fontSize: '14px', color: '#9ca3af', textAlign: 'center', marginBottom: '28px' },
  input: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '15px', marginBottom: '12px', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  error: { color: '#ef6461', fontSize: '13px', marginBottom: '12px' },
  success: { color: '#10b981', fontSize: '13px', marginBottom: '12px' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px 24px', background: '#025159', color: 'white', borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' },
  linkBtn: { display: 'block', textAlign: 'center', marginTop: '16px', background: 'none', border: 'none', color: '#038C8C', fontSize: '13px', cursor: 'pointer' },

  dashboard: { maxWidth: '1140px', margin: '0 auto', padding: '0 24px' },
  dashHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' },
  dashTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '600', color: '#1f2937' },
  dashSub: { fontSize: '15px', color: '#9ca3af' },
  logoutBtn: { padding: '8px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: 'white', fontSize: '13px', color: '#6b7280', cursor: 'pointer' },

  globalProgress: { background: '#f9fafb', borderRadius: '14px', padding: '20px 24px', marginBottom: '30px', border: '1px solid #e5e7eb' },
  globalProgressBar: { height: '8px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden', marginBottom: '10px' },
  globalProgressFill: { height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #025159, #04BFBF)', transition: 'width 0.6s ease' },
  globalProgressText: { fontSize: '13px', color: '#6b7280' },

  notEnrolled: { background: '#f0fbfb', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '30px', border: '1px solid #e0f7f7' },

  modulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' },
  moduleCard: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', transition: 'all 0.25s' },
  moduleNum: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '36px', fontWeight: '700', color: '#04BFBF', opacity: '0.4', lineHeight: '1', marginBottom: '8px' },
  moduleTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' },
  moduleDesc: { fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginBottom: '16px' },
  progressBar: { height: '4px', borderRadius: '2px', background: '#e5e7eb', overflow: 'hidden', marginBottom: '8px' },
  progressFill: { height: '100%', borderRadius: '2px', background: '#025159', transition: 'width 0.4s ease' },
  moduleMeta: { fontSize: '12px', color: '#038C8C', fontWeight: '500' },

  backBtn: { background: 'none', border: 'none', color: '#038C8C', fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: '0' },
  moduleViewTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: '600', color: '#1f2937', marginBottom: '8px' },

  lessonsGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' },
  lessonsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  lessonItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' },
  lessonCheck: { width: '32px', height: '32px', borderRadius: '50%', background: '#e0f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#025159', flexShrink: '0' },
  lessonTitle: { fontSize: '14px', fontWeight: '500', color: '#1f2937' },
  lessonDuration: { fontSize: '12px', color: '#9ca3af' },

  videoArea: { borderRadius: '16px', overflow: 'hidden' },
  videoPlaceholder: { background: '#111827', borderRadius: '16px', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  noVideo: { textAlign: 'center', color: '#6b7280', padding: '40px' },
  lessonActions: { padding: '20px 0', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  pdfLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#038C8C', fontSize: '14px', textDecoration: 'none' },
  completeBtn: { padding: '10px 20px', background: '#025159', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  completedBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '14px', fontWeight: '600' },
};
