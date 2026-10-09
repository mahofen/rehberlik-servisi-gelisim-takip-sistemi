# 🌟 Rehberlik Servisi Gelişim Takip Sistemi

> **"Şehit Gökhan Uzun İmam Hatip Ortaokulu Rehberlik Servisi • 7. Sınıf Gelişim, Soru & Deneme Portalı"**  
> *28 Eylül 2026 – 30 Haziran 2027 • 40 Hafta • MEB Konu Havuzu • Manuel Soru Girişi • 90 Soruluk LGS Denemeleri*

Bu proje; 2026-2027 eğitim-öğretim yılı boyunca Şehit Gökhan Uzun İmam Hatip Ortaokulu Rehberlik Servisi koordinasyonunda öğrencilerin akademik gelişimini, günlük ders konu çalışmalarını, manuel soru çözümlerini, LGS denemelerini ve pedagojik yapay zeka koçluk projeksiyonlarını takip etmek için tasarlanmıştır.

**Önemli Özellikler:** Merkezi öğrenci havuzu, kullanıcı adı ve şifreli güvenli giriş sistemi, bağımsız yönetici kontrol merkezi ve Supabase bulut senkronizasyonu mevcuttur.

---

## 📋 7. Sınıf Konu Seçimi & Açılır Pencere (Modal)

- **Doğrudan Açılır Liste (Dropdown):** Günlük 3 ders konu çalışması satırında seçilen dersin (Matematik, Fen, Türkçe vb.) tüm 7. sınıf MEB üniteleri ve konuları anında açılır listeden doğrudan seçilebilir.
- **Açılır Pencere (Modal) ile İnceleme:** İstenildiğinde "Tüm Konular / Gözat 📋" butonuna tıklanarak 7. sınıf konuları detaylı incelenebilir ve arama çubuğuyla saniyeler içinde filtrelenebilir.
- **6 Temel Branş:** Matematik, Fen Bilimleri, Türkçe, Sosyal Bilgiler, Din Kültürü ve İngilizce.

---

## 📅 40 Haftalık Yıllık Takvim & Haftalık Raporlama

- **Kapsam:** 28 Eylül 2026 Pazartesi gününden 30 Haziran 2027 Çarşamba gününe kadar tam **40 Hafta**.
- **Haftalık Gezinme:** 40 haftalık yatay seçim çubuğu, açılır hafta listesi ve *"Bu Haftaya Git"* hızlı butonu.
- **Haftalık Raporlama:**
  - Bu hafta tamamlanan 7. sınıf konu sayısı (Hedef: 21 Konu)
  - Günlük soru sayıları toplamı (manuel girişler)
  - Hafta sonu deneme sınavı branş netleri ve toplam başarı skoru
  - Haftalık öz değerlendirme ve çalışma notu

---

## 📝 Günlük Görevler & Manuel Soru Sayısı Takibi

Her gün için karşınıza çıkan iki ana görev bölümü:
1. **📚 Günlük 3 Ders 7. Sınıf Konu Çalışması:**
   - Açılır listeden veya modal pencereden konu seçimi ve tek tıkla "Çalışıldı ✓" durumu.
2. **✍️ Günlük 3 Ders Soru Çözümü (Manuel Soru Sayısı):**
   - Çözülen soru sayısı doğrudan klavye ile yazılabilir veya `+5 / -5` hızlı butonlarıyla ayarlanabilir.
   - Günlük toplam soru sayısı ve haftalık kümülatif soru sayısı anında hesaplanır.

---

## 🎯 7. Sınıf Hafta Sonu Genel Deneme Sınavı (20'şer Soru / Toplam 120 Soru)

Her hafta sonu (Cumartesi / Pazar) 7. sınıfın 6 temel branşından 20'şer soruluk genel deneme sınavı takip edilir:
- **Türkçe (20 Soru):** Doğru (D), Yanlış (Y), Boş (B), Net
- **Matematik (20 Soru):** Doğru (D), Yanlış (Y), Boş (B), Net
- **Fen Bilimleri (20 Soru):** Doğru (D), Yanlış (Y), Boş (B), Net
- **Sosyal Bilgiler (20 Soru):** Doğru (D), Yanlış (Y), Boş (B), Net
- **Din Kültürü ve Ahlak Bilgisi (20 Soru):** Doğru (D), Yanlış (Y), Boş (B), Net
- **Yabancı Dil (İngilizce) (20 Soru):** Doğru (D), Yanlış (Y), Boş (B), Net
- **Otomatik Net ve Başarı:** Formül `Net = D - (Y / 3)` ile hesaplanır, 120 soru üzerinden başarı yüzdesi ve grafikler anlık oluşturulur.

---

## 📊 Haftalık Karne & Öğretmen Rapor Paneli

- Üst menüdeki **"Haftalık Karne & Rapor"** butonuna basarak seçilen haftanın detaylı dökümü incelenebilir:
  - Arif Said İlkbahar'ın çözdüğü toplam soru adedi
  - Tamamlanan 7. sınıf konu sayısı
  - 120 soru üzerinden deneme net skoru ve başarı yüzdesi
  - Haftalık yansıma notları
  - **"Öğrenci Karnesini Yazdır / PDF":** Tek tıkla çıktı alınabilir veya PDF olarak kaydedilebilir.

---

## 🚀 Canlı Bağlantılar
 
* 🌐 **Canlı Web Portalı:** [https://mahofen.github.io/rehberlik-servisi-gelisim-takip-sistemi/](https://mahofen.github.io/rehberlik-servisi-gelisim-takip-sistemi/)
* 📱 **Canlı Mobil Portalı:** [https://mahofen.github.io/rehberlik-servisi-gelisim-takip-sistemi/mobile_app.html](https://mahofen.github.io/rehberlik-servisi-gelisim-takip-sistemi/mobile_app.html)
* 🛡️ **Yönetici Kontrol Merkezi:** [https://mahofen.github.io/rehberlik-servisi-gelisim-takip-sistemi/admin.html](https://mahofen.github.io/rehberlik-servisi-gelisim-takip-sistemi/admin.html)
* 📦 **GitHub Deposu:** [https://github.com/mahofen/rehberlik-servisi-gelisim-takip-sistemi](https://github.com/mahofen/rehberlik-servisi-gelisim-takip-sistemi)

---

## 📄 Lisans
Bu proje açık kaynaklı olup MIT lisansı altındadır.
