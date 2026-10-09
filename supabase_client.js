/**
 * ============================================================================
 * SUPABASE BULUT SENKRONİZASYON MOTORU
 * 7. Sınıf Haftalık Gelişim & Takip Portalı
 * ============================================================================
 * Bu dosya masaüstü ve mobil takip arayüzleri için
 * Supabase PostgreSQL veritabanı bağlantısını, gerçek zamanlı (realtime)
 * veri senkronizasyonunu ve bulut yedeklemeyi yönetir.
 */

const SUPABASE_STORAGE_URL_KEY = "gelisim_supabase_url";
const SUPABASE_STORAGE_KEY_KEY = "gelisim_supabase_anon_key";

// Varsayılan Supabase proje bilgileri (Gelişim Takip Sistemi Veritabanı)
const DEFAULT_SUPABASE_CONFIG = {
  url: "https://gkkgtihqfihkeooiqoja.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2d0aWhxZmloa2Vvb2lxb2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NTY0MjEsImV4cCI6MjEwNjEzMjQyMX0.WS6LwCf2FsEqpndvgtBmg6kVZ6LKfCiof4v6x_KjCrI"
};

let _supabaseClientInstance = null;
let _supabaseDebounceTimer = null;
let _isRealtimeSubscribed = false;

/**
 * Mevcut kayıtlı Supabase yapılandırmasını döndürür.
 */
function getSupabaseConfig() {
  let storedUrl = localStorage.getItem(SUPABASE_STORAGE_URL_KEY) || localStorage.getItem("arif_said_supabase_url");
  let storedKey = localStorage.getItem(SUPABASE_STORAGE_KEY_KEY) || localStorage.getItem("arif_said_supabase_anon_key");

  if (!storedUrl || typeof storedUrl !== 'string' || !storedUrl.startsWith("http")) {
    storedUrl = DEFAULT_SUPABASE_CONFIG.url;
  }
  if (!storedKey || typeof storedKey !== 'string' || storedKey.length < 20) {
    storedKey = DEFAULT_SUPABASE_CONFIG.anonKey;
  }

  return {
    url: storedUrl.trim(),
    anonKey: storedKey.trim()
  };
}

/**
 * Supabase yapılandırmasını kaydeder ve istemciyi yeniden başlatır.
 */
function saveSupabaseConfig(url, anonKey) {
  localStorage.setItem(SUPABASE_STORAGE_URL_KEY, (url || "").trim());
  localStorage.setItem(SUPABASE_STORAGE_KEY_KEY, (anonKey || "").trim());
  _supabaseClientInstance = null;
  _isRealtimeSubscribed = false;
  return getSupabaseClient();
}

/**
 * Supabase JS istemcisini oluşturur veya önbellekten getirir.
 */
function getSupabaseClient() {
  if (_supabaseClientInstance) return _supabaseClientInstance;
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.anonKey && window.supabase && typeof window.supabase.createClient === "function") {
    try {
      _supabaseClientInstance = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: false }
      });
      return _supabaseClientInstance;
    } catch (e) {
      console.warn("[Supabase] JS SDK Başlatma Hatası:", e);
      return null;
    }
  }
  return null;
}

/**
 * Supabase bağlantısının geçerli olup olmadığını test eder.
 * Hem Supabase JS SDK hem de doğrudan yerel REST API (fetch) ile test eder.
 */
async function testSupabaseConnection() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    return { success: false, connected: false, message: "Supabase URL veya Anon Key eksik." };
  }

  // 1. Supabase JS Client ile dene
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('student_records')
        .select('student_name, updated_at')
        .limit(1);

      if (!error) {
        return { success: true, connected: true, message: "Supabase bulut bağlantısı başarılı! Tablo ve yetkiler çalışıyor. ✓" };
      }
      if (error && error.code === '42P01') {
        return { 
          success: false, 
          connected: false,
          message: "Bağlantı sağlandı ancak 'student_records' tablosu bulunamadı. Lütfen SQL kurulum scriptini çalıştırın.", 
          code: 'TABLE_NOT_FOUND' 
        };
      }
    } catch (e) {
      console.warn("[Supabase JS Client Test Hatası, REST API denenecek]:", e);
    }
  }

  // 2. Doğrudan PostgREST REST API ile dene (SDK'sız hızlı ve bağımsız)
  try {
    const res = await fetch(`${cfg.url}/rest/v1/student_records?select=student_name,updated_at&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`
      }
    });

    if (res.ok) {
      return { success: true, connected: true, message: "Supabase bulut bağlantısı başarılı! Tablo ve yetkiler çalışıyor. ✓" };
    }
    const errText = await res.text();
    return { success: false, connected: false, message: `Supabase Bağlantı Hatası (${res.status}): ${errText}` };
  } catch (err) {
    return { success: false, connected: false, message: "Ağ veya bağlantı hatası: " + (err.message || err) };
  }
}

/**
 * Buluttan öğrenci verisini çeker (SDK + REST Fallback).
 */
async function fetchStudentFromSupabase(studentName) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return { success: false, error: "Supabase bağlı değil" };

  // 1. JS Client ile dene
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('student_records')
        .select('student_name, state_data, updated_at')
        .eq('student_name', studentName)
        .maybeSingle();

      if (!error) {
        if (!data) return { success: true, notFound: true, data: null };
        return { 
          success: true, 
          data: data.state_data, 
          updatedAt: data.updated_at 
        };
      }
    } catch (err) {
      console.warn("[Supabase Fetch SDK Hatası, REST deneniyor]:", err);
    }
  }

  // 2. REST API fallback
  try {
    const encName = encodeURIComponent(studentName);
    const res = await fetch(`${cfg.url}/rest/v1/student_records?student_name=eq.${encName}&select=student_name,state_data,updated_at`, {
      method: 'GET',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (!rows || rows.length === 0) return { success: true, notFound: true, data: null };
      return { success: true, data: rows[0].state_data, updatedAt: rows[0].updated_at };
    }
    return { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    console.error("[Supabase Fetch REST Hatası]:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Öğrenci verisini Supabase PostgreSQL tablosuna kaydeder (Upsert: SDK + REST Fallback).
 * useKeepAlive: sayfa kapanırken veya acil durumlarda tarayıcının isteği yarıda kesmemesi için keepalive bayrağı.
 */
async function saveStudentToSupabase(studentName, stateData, useKeepAlive = false) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !studentName) return { success: false, error: "Supabase bağlı değil veya öğrenci adı eksik" };

  updateSupabaseStatusBadge("syncing");

  const payload = {
    student_name: studentName,
    state_data: stateData,
    updated_at: new Date().toISOString()
  };

  // 1. JS Client ile dene (eğer keepalive gerektirmiyorsa ve client hazırsa)
  if (!useKeepAlive) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('student_records')
          .upsert(payload, { onConflict: 'student_name' });

        if (!error) {
          updateSupabaseStatusBadge("synced");
          return { success: true };
        }
      } catch (err) {
        console.warn("[Supabase Save SDK Hatası, REST deneniyor]:", err);
      }
    }
  }

  // 2. REST API fallback (veya keepalive modu)
  try {
    const res = await fetch(`${cfg.url}/rest/v1/student_records`, {
      method: 'POST',
      keepalive: useKeepAlive,
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok || res.status === 201 || res.status === 204) {
      updateSupabaseStatusBadge("synced");
      return { success: true };
    }
    const errText = await res.text();
    updateSupabaseStatusBadge("error");
    return { success: false, error: errText };
  } catch (err) {
    console.error("[Supabase Save REST Hatası]:", err);
    updateSupabaseStatusBadge("error");
    return { success: false, error: err.message };
  }
}

/**
 * Değişiklik olduğunda sunucuya yüklemeyi tetikler.
 * immediate = true ise gecikmeksizin hemen kaydeder.
 */
function queueSupabaseSave(studentName, stateData, immediate = false) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !studentName) {
    updateSupabaseStatusBadge("unconfigured");
    return;
  }

  // Global referansı güncelle (sayfa kapanırken otomatik flush için)
  if (typeof window !== "undefined") {
    window._currentActiveStudentName = studentName;
    window._currentActiveStudentState = stateData;
  }

  updateSupabaseStatusBadge("pending");
  if (_supabaseDebounceTimer) clearTimeout(_supabaseDebounceTimer);

  if (immediate) {
    saveStudentToSupabase(studentName, stateData);
  } else {
    _supabaseDebounceTimer = setTimeout(() => {
      saveStudentToSupabase(studentName, stateData);
    }, 250); // 250ms: Hızlı ve kesintisiz eşzamanlı kayıt
  }
}

/**
 * Gerçek zamanlı değişiklikleri dinler (Supabase Realtime).
 */
function setupSupabaseRealtime(studentName, onRemoteUpdateCallback) {
  const client = getSupabaseClient();
  if (!client || _isRealtimeSubscribed) return;

  try {
    const channel = client
      .channel(`student-records-channel-${studentName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_records', filter: `student_name=eq.${studentName}` },
        (payload) => {
          if (payload && payload.new && payload.new.state_data && onRemoteUpdateCallback) {
            console.log("[Supabase Realtime] Buluttan güncel veri geldi.");
            onRemoteUpdateCallback(payload.new.state_data, payload.new.updated_at);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          _isRealtimeSubscribed = true;
          updateSupabaseStatusBadge("connected");
        }
      });
  } catch (e) {
    console.warn("[Supabase Realtime Setup Warning]:", e);
  }
}

/**
 * UI üzerindeki Supabase durum rozetini günceller.
 */
function updateSupabaseStatusBadge(status, customMsg) {
  const dots = document.querySelectorAll(".supabase-status-dot");
  const texts = document.querySelectorAll(".supabase-status-text");

  let dotColor = "bg-amber-400";
  let statusText = "Bulut: Bağlı Değil";

  if (status === "connected" || status === "synced") {
    dotColor = "bg-emerald-500 animate-pulse";
    statusText = "Bulut: Canlı (Supabase)";
  } else if (status === "syncing" || status === "pending") {
    dotColor = "bg-blue-500 animate-spin";
    statusText = "Buluta Kaydediliyor...";
  } else if (status === "error") {
    dotColor = "bg-rose-500";
    statusText = "Bulut: Hata!";
  } else if (status === "unconfigured") {
    dotColor = "bg-slate-300";
    statusText = "Bulut: Ayarlanmadı";
  }

  dots.forEach(d => {
    d.className = `w-2.5 h-2.5 rounded-full inline-block ${dotColor} supabase-status-dot`;
  });
  texts.forEach(t => {
    t.textContent = customMsg || statusText;
  });
}

const CENTRAL_STUDENTS_RECORD_NAME = "__central_registered_students__";
const ADMIN_STORAGE_USER_KEY = "fen_admin_username";
const ADMIN_STORAGE_PASS_KEY = "fen_admin_password";

/**
 * Yönetici kullanıcı adı ve şifresini yerel depolamadan getirir.
 */
function getAdminCredentials() {
  return {
    username: localStorage.getItem(ADMIN_STORAGE_USER_KEY) || "admin",
    password: localStorage.getItem(ADMIN_STORAGE_PASS_KEY) || "admin123"
  };
}

/**
 * Yönetici kullanıcı adı ve şifresini günceller.
 */
function saveAdminCredentials(username, password) {
  if (username && username.trim()) {
    localStorage.setItem(ADMIN_STORAGE_USER_KEY, username.trim());
  }
  if (password && password.trim()) {
    localStorage.setItem(ADMIN_STORAGE_PASS_KEY, password.trim());
  }
}

/**
 * Supabase Merkezi Havuz: Buluttaki kayıtlı öğrencileri ve şifrelerini çeker.
 */
async function fetchCentralStudentsFromSupabase() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return { success: false, error: "Supabase bağlı değil" };

  // 1. JS Client ile dene
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('student_records')
        .select('student_name, state_data, updated_at')
        .eq('student_name', CENTRAL_STUDENTS_RECORD_NAME)
        .maybeSingle();

      if (!error && data && data.state_data && Array.isArray(data.state_data.students)) {
        return { success: true, students: data.state_data.students, updatedAt: data.updated_at };
      }
    } catch (e) {
      console.warn("[Supabase] Central students fetch SDK hatası:", e);
    }
  }

  // 2. REST API ile dene
  try {
    const encName = encodeURIComponent(CENTRAL_STUDENTS_RECORD_NAME);
    const res = await fetch(`${cfg.url}/rest/v1/student_records?student_name=eq.${encName}&select=student_name,state_data,updated_at`, {
      method: 'GET',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].state_data && Array.isArray(rows[0].state_data.students)) {
        return { success: true, students: rows[0].state_data.students, updatedAt: rows[0].updated_at };
      }
      return { success: true, notFound: true, students: [] };
    }
  } catch (err) {
    console.warn("[Supabase] Central students fetch REST hatası:", err);
  }

  return { success: false, error: "Buluttan veri alınamadı" };
}

/**
 * Supabase Merkezi Havuz: Kayıtlı öğrencilerin ve şifrelerinin listesini buluta kaydeder.
 */
async function saveCentralStudentsToSupabase(studentsList) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !Array.isArray(studentsList)) return { success: false };

  // Her öğrencinin username ve password'e sahip olduğundan emin ol
  const sanitizedList = studentsList.map(st => ({
    id: st.id || ('std_' + (Date.now() + Math.random().toString(36).substr(2, 4))),
    name: (st.name || '').trim(),
    username: (st.username || st.name || '').trim(),
    password: (st.password || '1234').trim(),
    sube: st.sube || '7. Sınıf',
    avatar: st.avatar || '🌟',
    target: st.target || '',
    title: st.title || `${st.sube || '7. Sınıf'} Öğrencisi`,
    registeredAt: st.registeredAt || new Date().toLocaleDateString('tr-TR')
  }));

  const payload = {
    student_name: CENTRAL_STUDENTS_RECORD_NAME,
    state_data: {
      students: sanitizedList,
      version: 6,
      updated_at: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  };

  // 1. JS Client ile dene
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('student_records')
        .upsert(payload, { onConflict: 'student_name' });
      if (!error) return { success: true };
    } catch(e) {}
  }

  // 2. REST API ile dene
  try {
    const res = await fetch(`${cfg.url}/rest/v1/student_records`, {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
    return { success: (res.ok || res.status === 201 || res.status === 204) };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

/**
 * Tek bir öğrenciyi ve tüm verilerini hem student_records tablosundan hem de merkezi havuzdan siler.
 */
async function deleteStudentFromSupabase(studentName) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !studentName) return { success: false };

  // 1. student_records tablosundan öğrenci satırını sil
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('student_records').delete().eq('student_name', studentName);
    } catch(e) {}
  }

  // REST API ile de garanti sil
  try {
    const encName = encodeURIComponent(studentName);
    await fetch(`${cfg.url}/rest/v1/student_records?student_name=eq.${encName}`, {
      method: 'DELETE',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`
      }
    });
  } catch(e) {}

  // 2. Merkezi havuz kaydından da bu öğrenciyi çıkar
  try {
    const cloudRes = await fetchCentralStudentsFromSupabase();
    if (cloudRes.success && Array.isArray(cloudRes.students)) {
      const updated = cloudRes.students.filter(s => s.name.toLocaleLowerCase('tr-TR') !== studentName.toLocaleLowerCase('tr-TR'));
      await saveCentralStudentsToSupabase(updated);
    }
  } catch(e) {}

  return { success: true };
}

/**
 * Sistemdeki TÜM kayıtlı öğrencileri ve tüm verilerini hem Supabase'den hem de yerel depolamadan tamamen temizler.
 */
async function deleteAllStudentsFromSupabase() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return { success: false };

  // 1. student_records tablosundaki tüm öğrenci satırlarını sil (__central_registered_students__ hariç)
  try {
    const encCentral = encodeURIComponent(CENTRAL_STUDENTS_RECORD_NAME);
    await fetch(`${cfg.url}/rest/v1/student_records?student_name=neq.${encCentral}`, {
      method: 'DELETE',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`
      }
    });
  } catch(e) {
    console.warn("[Supabase WIPE] Satır silme hatası:", e);
  }

  // 2. Merkezi havuzu boş bir dizi ile güncelle ve wipedAt zaman damgası ekle
  const payload = {
    student_name: CENTRAL_STUDENTS_RECORD_NAME,
    state_data: {
      students: [],
      version: 6,
      wipedAt: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  };

  try {
    await fetch(`${cfg.url}/rest/v1/student_records`, {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
  } catch(e) {}

  // 3. Yerel depolamadaki tüm öğrenci anahtarlarını temizle
  purgeLegacyStudentStorage();
  localStorage.setItem("fen_deneme_registered_students_v6", JSON.stringify([]));
  localStorage.removeItem("fen_deneme_current_student_v6");

  return { success: true };
}

/**
 * Buluttaki tüm öğrenci çalışma verilerini (student_records) çeker.
 */
async function fetchAllStudentRecordsFromSupabase() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return { success: false, error: "Supabase bağlı değil" };

  try {
    const encCentral = encodeURIComponent(CENTRAL_STUDENTS_RECORD_NAME);
    const res = await fetch(`${cfg.url}/rest/v1/student_records?student_name=neq.${encCentral}&select=student_name,state_data,updated_at`, {
      method: 'GET',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      return { success: true, records: rows || [] };
    }
  } catch(e) {
    console.warn("[Supabase] fetchAllStudentRecords REST hatası:", e);
  }

  return { success: false, error: "Bulut verileri alınamadı" };
}

/**
 * Eski versiyon veya çerez kalıntısı öğrenci verilerini temizler.
 */
function purgeLegacyStudentStorage() {
  try {
    const legacyKeys = [
      "fen_deneme_registered_students_v5",
      "fen_deneme_current_student_v5",
      "fen_current_active_student_v5",
      "fen_deneme_registered_students_v4",
      "fen_deneme_current_student_v4",
      "fen_haftalik_data_arif_said_ilkbahar",
      "fen_haftalik_data_arif_said",
      "arif_said_weekly_data",
      "arif_said_data",
      "fen_haftalik_data_ogrenci"
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  } catch(e) {}
}

// Otomatik eski anahtar temizliği
purgeLegacyStudentStorage();

/**
 * Merkezi Havuzu Yerel ve Bulut Arasında Senkronize Eder.
 */
async function syncCentralStudentsWithCloud(localStudentsList = null) {
  purgeLegacyStudentStorage();
  const STORAGE_KEY = "fen_deneme_registered_students_v6";
  let localList = localStudentsList;
  if (!Array.isArray(localList)) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      localList = raw ? JSON.parse(raw) : [];
    } catch(e) {
      localList = [];
    }
  }

  // Buluttan öğrencileri çek
  const cloudRes = await fetchCentralStudentsFromSupabase();
  if (cloudRes.success) {
    const cloudStudents = Array.isArray(cloudRes.students) ? cloudRes.students : [];

    // Eğer bulut temizlenmişse (boşsa), yerel veriyi de sıfırla (eski öğrencileri diriltme!)
    if (cloudStudents.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    // Buluttaki listeyi esas al
    const map = new Map();
    cloudStudents.forEach(st => {
      const key = (st.name || '').toLocaleLowerCase('tr-TR').trim();
      if (key) {
        if (!st.username) st.username = st.name;
        if (!st.password) st.password = "1234";
        map.set(key, st);
      }
    });

    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } else {
    // Buluta ulaşılamadıysa yereldeki listeyi döndür
    const sanitized = (localList || []).map(st => ({
      ...st,
      username: st.username || st.name,
      password: st.password || "1234"
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return sanitized;
  }
}

// Sayfa kapanırken veya arka plana geçerken kuyruktaki veriyi keepalive ile hemen buluta gönder
if (typeof window !== "undefined") {
  const flushSupabasePendingSave = () => {
    if (window._currentActiveStudentName && window._currentActiveStudentState) {
      saveStudentToSupabase(window._currentActiveStudentName, window._currentActiveStudentState, true);
    }
  };
  window.addEventListener("beforeunload", flushSupabasePendingSave);
  window.addEventListener("pagehide", flushSupabasePendingSave);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSupabasePendingSave();
    }
  });
}

/**
 * Supabase SQL Kurulum Komutları
 */
const SUPABASE_SETUP_SQL = `-- ============================================================
-- 1. Öğrenci Gelişim ve Takip Tablosu Oluşturma
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_records (
    student_name TEXT PRIMARY KEY,
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Güvenlik (Row Level Security - RLS) Etkinleştirme
-- ============================================================
ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Web ve Mobil Uygulama için Okuma ve Yazma İzni
-- ============================================================
DROP POLICY IF EXISTS "Public Anon Full Access" ON public.student_records;
CREATE POLICY "Public Anon Full Access" 
ON public.student_records 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- ============================================================
-- 4. Gerçek Zamanlı Senkronizasyon (Realtime) Açma
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_records;
`;
