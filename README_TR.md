# Monofactor

Next.js, Convex ve özel bir canlı görsel editör ile inşa edilmiş portföy web sitesi ve CMS platformu. Tiptap tabanlı blok blog motoru ile herhangi bir içerik bloğuna Tailwind class ataması yapılabilir.

## Teknoloji Stack

- **Framework:** Next.js (App Router, standalone çıktı)
- **Backend:** [Convex](https://convex.dev) (self-hosted uyumlu)
- **Stil:** Tailwind CSS v4
- **İçerik Editörü:** Tiptap (blok tabanlı, özel uzantılarla)
- **UI Primitifleri:** @base-ui/react, lucide-react
- **Animasyonlar:** Anime.js, Three.js (WebGL shader'lar)
- **Carousel:** Embla Carousel

---

## Başlangıç

### Ön Koşullar

- Node.js 18+
- Bir Convex instance'ı (bulut veya [self-hosted](https://docs.convex.dev/self-hosting))

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Ortam değişkenlerini yapılandır

`.env.local.example` dosyasını kopyala (veya `.env.local` oluştur):

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-convex-instance.example.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-convex-site.example.com
CONVEX_SELF_HOSTED_URL=https://your-convex-instance.example.com    # sadece self-hosted için
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key                        # sadece self-hosted için

# Site
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# İletişim formu (Brevo / Sendinblue)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=you@example.com
BREVO_RECIPIENT_EMAIL=inbox@example.com
```

**Convex ortam değişkeni (sunucu tarafı):**

CMS kimlik doğrulaması için Convex instance'ında admin şifresini ayarla:

```bash
npx convex env set ADMIN_PASSWORD your-secure-password
```

### 3. Convex'i başlat

```bash
npx convex dev
```

Bu komut `convex/` fonksiyonlarını ve şemayı Convex instance'ına senkronize eder.

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

`predev` scripti başlamadan önce yayınlanmış blog yazılarından Tailwind safelist'i otomatik oluşturur.

### 5. Production build

```bash
npm run build
npm start
```

---

## CMS / Convex Kurulumu

### Şema Genel Bakışı

`convex/schema.ts` dosyasında tanımlı:

| Tablo | Amaç |
|-------|------|
| **posts** | Tiptap JSON içeriği, kapak görselleri, SEO alanları, etiketler, taslak/yayınlanmış durumu ile blog yazıları |
| **files** | Dosya kütüphanesi — Convex storage'da saklanan yüklenmiş görseller ve varlıklar |
| **sessions** | Admin kimlik doğrulama oturumları (7 günlük süre) |

### Kimlik Doğrulama

CMS basit bir şifre tabanlı kimlik doğrulama akışı kullanır (`convex/auth.ts`):

1. Admin `/nexus/login` adresine gider
2. Şifre, Convex sunucusundaki `ADMIN_PASSWORD` ortam değişkenine karşı doğrulanır
3. Bir oturum token'ı oluşturulur (7 gün geçerli) ve `localStorage`'a kaydedilir
4. Tüm admin mutation/query'leri geçerli bir oturum token'ı gerektirir

### Convex Fonksiyonları

**`convex/posts.ts`** — Blog yazısı CRUD:

| Fonksiyon | Tip | Yetki | Açıklama |
|-----------|-----|-------|----------|
| `list` | query | public | Tüm yayınlanmış yazılar |
| `listRecent` | query | public | Son yazılar (varsayılan 6) |
| `getBySlug` | query | public | URL slug'a göre tekil yazı |
| `listAll` | query | admin | Tüm yazılar (taslak + yayınlanmış) |
| `getById` | query | admin | ID'ye göre tekil yazı |
| `create` | mutation | admin | Yeni taslak yazı oluştur |
| `update` | mutation | admin | Yazı içeriğini/meta verilerini güncelle |
| `publish` | mutation | admin | Yazı durumunu yayınlanmış olarak ayarla |
| `unpublish` | mutation | admin | Taslağa geri al |
| `remove` | mutation | admin | Yazıyı ve kapak görselini sil |
| `generateUploadUrl` | mutation | admin | Convex storage yükleme URL'i al |
| `allUsedClasses` | query | public | Tüm yazılardan Tailwind class'larını topla (safelist için) |

**`convex/files.ts`** — Dosya kütüphanesi yönetimi

**`convex/auth.ts`** — Giriş, oturum doğrulama, çıkış

### Tailwind Safelist Oluşturma

Blog yazıları herhangi bir içerik bloğunda keyfi Tailwind class'ları kullanabilir. Bu class'ların production CSS build'ine dahil edilmesini sağlamak için:

```bash
npm run generate:safelist
```

Bu script (`scripts/generate-safelist.mjs`) `allUsedClasses` üzerinden tüm yayınlanmış yazıları sorgular, Tiptap JSON'dan her Tailwind class'ını çıkarır ve Tailwind'in build sırasında aldığı bir safelist dosyası yazar. `dev` ve `build` öncesinde otomatik çalışır.

---

## CMS Admin Paneli (`/nexus`)

Admin arayüzü `/nexus` adresinde bulunur ve şunları sağlar:

- **Dashboard** — Durum göstergeleriyle tüm yazıların listesi
- **Yazı Editörü** — Tam Tiptap blok editörü:
  - Blok eklemek için slash komut menüsü (`/`)
  - Çok sütunlu düzenleme
  - Keyfi Tailwind class'ları ile stillendirilmiş konteynerler
  - Dosya seçici ile görsel ve video yerleştirme
  - Söz dizimi vurgulmalı kod blokları
  - Sürükle-bırak blok yeniden sıralama
  - Herhangi bir bloğa Tailwind class atamak için node inspector
- **Dosya Kütüphanesi** (`/nexus/files`) — Medya varlıklarını yükle ve yönet
- **SEO Alanları** — Yazı başına başlık ve meta açıklaması (karakter sayacı ile)
- **Etiketler** — Çoklu etiket sistemi
- **Taslak/Yayın akışı** — Yayına almadan önce taslakları önizle

---

## Canlı Görsel Editör (`src/editor/`)

İki modlu özel bir geliştirme aracı — DOM yamaları uygulamak için **Edit** modu ve Claude agent'larının otonom olarak çözümlediği görsel geri bildirim bırakmak için **Annotate** modu. Bu blog içerik editörü **değildir** — sitenin kendi UI'ını düzenlemek için bir geliştirici aracıdır.

### Modlar

| Kısayol | Mod | Amaç |
|---------|-----|------|
| `E` `E` — İki kez E tuşuna basarak aktif edilir. | Edit | Element seç, class/stil/prop/metin düzenle, yamaları kaydet |
| `A` `A` — İki kez A tuşuna basarak aktif edilir. | Annotate | Herhangi bir elemente tıkla, geri bildirim bırak — Claude agent'ları alıp değişiklikleri uygular |

### Edit Modu

1. **Seç**: Sayfadaki herhangi bir elemente tıkla
2. **Düzenle**: Inspector panelini kullanarak class, stil, prop veya metin değiştir
3. **Kaydet**: Yamalar `localStorage`'a kaydedilir ve API üzerinden JSON dosyasına senkronize edilir
4. **Commit**: İsteğe bağlı olarak yamaları doğrudan kaynak dosyalara commit et (`ts-morph` ile AST manipülasyonu)

#### Yama İşlemleri

Editör geri alınabilir "yamalar" oluşturur — her biri belirli bir sayfadaki CSS seçiciyi hedefler ve bir veya daha fazla işlem uygular:

| İşlem | Açıklama |
|-------|----------|
| `text` | Metin içeriğini değiştir |
| `addClass` | CSS/Tailwind class ekle |
| `removeClass` | Class kaldır |
| `setStyle` | Satır içi CSS özelliği ayarla |
| `removeStyle` | Satır içi CSS özelliğini kaldır |
| `hide` | `display: none` ayarla |
| `show` | `display: none` kaldır |
| `setProp` | JSX prop değerini değiştir |

### Annotate Modu

1. Herhangi bir elemente **tıkla** — niyet seçici (düzelt / değiştir / soru / onayla) ile bir popup belirir
2. İstediğin değişikliği doğal dilde **açıkla**
3. Anotasyon yerel anotasyon sunucusuna (port 4747) senkronize edilir
4. **Orkestratör** otomatik olarak izole bir git worktree'de Claude agent'ı başlatır
5. Agent kaynak dosyayı okur, değişikliği uygular ve commit eder
6. İlerleme ve agent yanıtları SSE üzerinden tarayıcıya gerçek zamanlı olarak akar
7. Takip talimatları vermek için anotasyon konuşmasına **yanıt ver** — agent yeni bağlamla yeniden başlatılır

Anotasyonlar zengin element bağlamı içerir: kaynak dosya konumu (React fiber traversal ile), CSS class'ları, hesaplanmış stiller, yakın metin, erişilebilirlik bilgisi ve React bileşen yığını.

### Mimari

```
src/editor/
├── index.tsx                # DevEditor giriş noktası & yükleyici
├── DevEditorLoader.tsx      # Dinamik import koruması (sadece dev)
├── EditorProvider.tsx       # React context — durum, modlar, yama/anotasyon yönetimi, SSE
├── EditorPanel.tsx          # Inspector paneli (class, stil, prop, metin, meta)
├── EditorOverlay.tsx        # Görsel seçim kaplaması & sınır kutusu (capture-phase listener'lar)
├── EditorToolbar.tsx        # Alt HUD — mod geçişleri, yama sayacı, anotasyon kontrolleri
├── AnnotationOverlay.tsx    # Anotasyon UI — hover vurgulama, oluştur/yanıtla popup'ları, işaretler
├── types.ts                 # Patch, Annotation, ThreadMessage, Intent, Severity, Status tipleri
├── constants.ts             # Paylaşılan sabitler (data attribute'lar, API yolları, debounce değerleri)
├── editor.raw.css           # Ham string olarak enjekte edilen editör stilleri (Tailwind çatışmasını önler)
│
├── engine/
│   ├── fiber.ts             # Kaynak konumları & bileşen prop'ları için React fiber traversal
│   ├── selector.ts          # CSS seçici oluşturma & doğrulama
│   ├── patches.ts           # PatchStore — çift katmanlı kalıcılık (localStorage + dosya API)
│   ├── applicator.ts        # PatchApplicator — yamaları uygula/geri al, MutationObserver ile yeniden uygula
│   ├── annotations.ts       # Anotasyon kalıcılığı, element tanımlama yardımcıları
│   ├── output.ts            # Markdown çıktı oluşturucu (compact/standard/detailed/forensic)
│   └── sync.ts              # HTTP istemci — anotasyonları port 4747'ye senkronize et, SSE aboneliği
│
├── panels/
│   ├── ClassEditor.tsx      # Otomatik tamamlamalı Tailwind class editörü
│   ├── StyleEditor.tsx      # Satır içi stil editörü
│   ├── TextEditor.tsx       # Metin içerik editörü
│   ├── PropsEditor.tsx      # React props editörü
│   └── MetaInfo.tsx         # Element meta veri gösterimi
│
├── tailwind/
│   └── class-index.ts       # Çalışma zamanı Tailwind class arama & otomatik tamamlama indeksi
│
└── server/                  # Anotasyon sunucusu (bağımsız Node.js süreci)
    ├── index.ts             # Giriş noktası — HTTP + MCP + orkestratör başlatır
    ├── http.ts              # REST API + SSE sunucu (port 4747)
    ├── store.ts             # Bellek içi anotasyon deposu + EventBus (1000 olay tekrarı)
    ├── mcp.ts               # MCP sunucu (stdio) — editor_watch, editor_resolve, vb.
    ├── orchestrator.ts      # Çoklu agent orkestratör — anotasyon başına otomatik Claude başlatır
    ├── prompt.ts            # Agent prompt oluşturucular (ilk + takip)
    └── agent-types.ts       # AgentInfo arayüzü
```

### Anotasyon Sunucusu

Anotasyon sunucusu (`src/editor/server/`) geliştirme sırasında Next.js ile birlikte çalışan bağımsız bir Node.js sürecidir. Üç katmanı vardır:

#### HTTP API (port 4747)

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/sessions` | POST | Oturum oluştur (sayfa URL'ine bağlı) |
| `/sessions/:id/annotations` | POST | Anotasyon ekle |
| `/annotations/:id` | PATCH | Anotasyon durumunu/niyetini güncelle |
| `/annotations/:id/thread` | POST | Konuşma mesajı ekle |
| `/pending` | GET | Tüm çözülmemiş anotasyonları listele |
| `/sessions/:id/pending` | GET | Oturuma ait çözülmemiş anotasyonlar |
| `/events` | GET | SSE akışı (tüm olaylar) |
| `/sessions/:id/events` | GET | SSE akışı (oturum kapsamlı) |
| `/agents` | GET | Çalışan agent'ları listele |
| `/agents/:id/abort` | POST | Çalışan agent'ı iptal et |
| `/annotations/:id/respawn` | POST | Anotasyon için agent'ı yeniden tetikle |

#### MCP Sunucu (stdio)

Claude Code entegrasyonu için `editor-annotations` MCP sunucusunu sunar. Araçlar:

| Araç | Açıklama |
|------|----------|
| `editor_list_sessions` | Aktif anotasyon oturumlarını listele |
| `editor_get_pending` | Çözülmemiş/sahiplenilmemiş anotasyonları al |
| `editor_acknowledge` | Anotasyonu onaylanmış olarak işaretle |
| `editor_resolve` | Özet ile çözülmüş olarak işaretle |
| `editor_dismiss` | Neden belirterek reddet |
| `editor_reply` | Konuşmaya agent mesajı ekle |
| `editor_watch` | Yeni anotasyonlar veya yanıtlar gelene kadar bekle (döngü tabanlı) |

`--no-agents` modunda Claude Code, anotasyonları `editor_watch` döngüsü aracılığıyla doğrudan MCP araçlarıyla manuel olarak işler.

#### Çoklu Agent Orkestratör

Yeni bir anotasyon geldiğinde orkestratör otomatik olarak:

1. `.claude/worktrees/agent/{annotationId}` konumunda yeni bir dal üzerinde **git worktree** oluşturur
2. `@anthropic-ai/claude-agent-sdk` üzerinden bir Claude agent'ı başlatır (`claude-sonnet-4-6`, maks 50 tur)
3. Agent kaynak dosyayı okur, istenen değişikliği uygular ve commit eder
4. İlerleme SSE üzerinden akar — tarayıcı canlı "Claude düşünüyor..." göstergesi gösterir
5. Başarılı olursa anotasyon `resolved` olarak işaretlenir ve konuşmaya bir özet gönderilir

Limitler: maks 6 eş zamanlı agent. Takip konuşma yanıtları mevcut agent'ı iptal eder ve güncellenmiş bağlamla yeniden başlatır.

#### Sunucu Başlama Modları

```bash
npx tsx src/editor/server/index.ts              # HTTP + MCP + agent'lar (varsayılan)
npx tsx src/editor/server/index.ts --mcp-only   # Sadece MCP (Claude Code için)
npx tsx src/editor/server/index.ts --no-agents  # HTTP + MCP, otomatik başlatma yok
npx tsx src/editor/server/index.ts --port 5000  # Özel port
```

### Yama API Endpoint'leri

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/editor-patches` | GET | Tüm yamaları getir |
| `/api/editor-patches` | POST | Yama oluştur veya güncelle |
| `/api/editor-patches/commit` | POST | Yamayı AST üzerinden kaynak dosyaya commit et |

### Önemli Notlar

- Canlı editör **sadece geliştirme** aracıdır — production build'lerde devre dışıdır
- Yamalar JSON dosyasında ve `localStorage`'da yaşarlar; kaynağa commit edilene kadar production build'i etkilemezler
- "Kaynağa Commit Et" özelliği `ts-morph` kullanarak gerçek `.tsx` dosyalarını değiştirir, doğrudan AST'de class ekler/kaldırır veya prop'ları değiştirir
- Anotasyonlar geçicidir (sunucuda bellek içi, tarayıcıda 7 günlük saklama süreli localStorage) — geliştirici geri bildirimidir, kalıcı veri değildir
- Orkestratörün başlattığı agent'lara `editor-annotations` MCP araçlarını kullanmaları açıkça yasaklanmıştır — özyinelemeli anotasyon döngülerine karşı önlem

---

## Kod Yapısı

```
├── convex/                          # Convex backend
│   ├── schema.ts                    # Veritabanı şeması (posts, files, sessions)
│   ├── posts.ts                     # Yazı CRUD fonksiyonları
│   ├── files.ts                     # Dosya kütüphanesi fonksiyonları
│   └── auth.ts                      # Kimlik doğrulama (giriş, oturumlar)
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Kök layout
│   │   ├── page.tsx                 # Anasayfa
│   │   ├── (convex)/                # Convex provider kullanan rotalar
│   │   │   ├── blog/                # Herkese açık blog
│   │   │   │   ├── page.tsx         # Blog listesi
│   │   │   │   └── [slug]/          # Dinamik blog yazısı sayfaları
│   │   │   └── nexus/               # Admin CMS
│   │   │       ├── login/           # Admin girişi
│   │   │       ├── page.tsx         # Dashboard
│   │   │       ├── posts/           # Yazı editörü (yeni, düzenle, önizle)
│   │   │       └── files/           # Dosya kütüphanesi
│   │   ├── work/                    # Portföy proje sayfaları
│   │   │   ├── solitonic/
│   │   │   ├── flux/
│   │   │   ├── postlight/
│   │   │   ├── airbit/
│   │   │   └── wadi-grocery/
│   │   ├── api/
│   │   │   ├── editor-patches/      # Canlı editör yama API
│   │   │   └── og/                  # Dinamik OG görsel oluşturma
│   │   ├── actions/
│   │   │   └── contact.ts           # İletişim formu server action
│   │   ├── robots.ts                # robots.txt oluşturma
│   │   └── sitemap.ts               # sitemap.xml oluşturma
│   │
│   ├── components/
│   │   ├── ui/                      # Yeniden kullanılabilir UI bileşenleri (Button, Input, Dialog, vb.)
│   │   ├── admin/                   # CMS admin bileşenleri
│   │   │   ├── PostForm.tsx         # Blog yazısı editör formu
│   │   │   ├── PostList.tsx         # Yazılar dashboard'u
│   │   │   ├── FileLibrary.tsx      # Dosya yöneticisi
│   │   │   └── editor/              # Tiptap editör & uzantılar
│   │   │       ├── TiptapEditor.tsx
│   │   │       └── extensions/      # Özel Tiptap uzantıları
│   │   │           ├── ColumnsExtension.ts
│   │   │           ├── StyledBlockExtension.ts
│   │   │           ├── ImageExtension.ts
│   │   │           ├── VideoExtension.ts
│   │   │           ├── LogoDividerExtension.ts
│   │   │           ├── StylableNodesExtension.ts
│   │   │           └── SlashCommand.ts
│   │   ├── cms/                     # Blog gösterimi
│   │   │   ├── TiptapRenderer.tsx   # Tiptap JSON → React
│   │   │   └── renderers/           # Bloğa özel renderer'lar
│   │   ├── home/                    # Anasayfa bölümleri
│   │   └── blog/                    # Blog bileşenleri
│   │
│   ├── editor/                      # Canlı görsel editör & anotasyon sistemi (geliştirici aracı)
│   │   ├── index.tsx                # Giriş noktası
│   │   ├── EditorProvider.tsx       # Durum yönetimi (edit + annotate modları)
│   │   ├── EditorPanel.tsx          # Inspector paneli
│   │   ├── EditorOverlay.tsx        # Seçim kaplaması
│   │   ├── AnnotationOverlay.tsx    # Anotasyon UI (oluştur, yanıtla, işaretler)
│   │   ├── EditorToolbar.tsx        # Alt HUD
│   │   ├── engine/                  # Çekirdek motor (fiber, selector, patches, applicator, annotations, sync)
│   │   ├── panels/                  # Editör panel alt bileşenleri
│   │   ├── tailwind/                # Tailwind class indeksi
│   │   └── server/                  # Anotasyon sunucusu (HTTP + MCP + orkestratör)
│   │
│   ├── hooks/                       # Özel React hook'lar
│   │   ├── useAdminSession.ts       # Admin yetki durumu
│   │   └── useTheme.ts              # Karanlık/aydınlık mod
│   │
│   └── lib/                         # Yardımcı araçlar
│       ├── convex.ts                # Convex istemci kurulumu
│       ├── admin-auth.ts            # Token yönetimi
│       ├── tw-classes.ts            # Tailwind class yardımcıları
│       ├── tw-arbitrary.ts          # Keyfi class CSS oluşturma
│       └── utils.ts                 # Genel yardımcılar
│
├── scripts/
│   └── generate-safelist.mjs        # Tailwind safelist oluşturucu
│
├── public/                          # Statik varlıklar
├── next.config.ts                   # Next.js yapılandırması (standalone, görsel remote'lar)
├── postcss.config.mjs               # PostCSS yapılandırması (Tailwind v4)
├── tsconfig.json                    # TypeScript yapılandırması
└── package.json
```

---

## Scriptler

| Script | Açıklama |
|--------|----------|
| `npm run dev` | Next.js geliştirme sunucusu + anotasyon sunucusu başlat (Tailwind safelist otomatik oluşturulur) |
| `npm run build` | Production build (build öncesi safelist otomatik oluşturulur) |
| `npm start` | Production sunucuyu çalıştır |
| `npm run generate:safelist` | Yayınlanmış yazılardan Tailwind safelist'i manuel olarak yeniden oluştur |
| `npx convex dev` | Convex geliştirme senkronizasyonunu başlat |

---

## Veri Akışı

### Anotasyon İş Akışı

```
Tarayıcı                        Anotasyon Sunucusu (4747)             Git / Claude Agent
────────                        ─────────────────────────             ──────────────────
AA'ya bas → annotate modu
Elemente tıkla → popup
Yorum gönder ─────────────────→ POST /sessions/:id/annotations
                                    │
                                    ├─→ EventBus annotation.created olayını yayar
                                    │
                                    └─→ Orkestratör olayı alır
                                            │
                                            ├─→ Git worktree oluşturur
                                            │   (.claude/worktrees/agent/{id})
                                            │
                                            └─→ Claude agent başlatır (sonnet) ──→ Kaynak dosyayı okur
                                                    │                              Değişikliği uygular
                                                    │                              Dal'a commit eder
                                                    │
SSE ← agent.progress ←─────── EventBus ←────── Agent ilerleme aktarır
SSE ← thread.message ←─────── EventBus ←────── Agent özet gönderir
SSE ← annotation.updated ←─── EventBus ←────── Çözülmüş olarak işaretler
```

### Yama İş Akışı (Edit Modu)

```
Elemente tıkla → EditorPanel açılır
Class/stil/metin değiştir
    │
    ├─→ Canlı DOM önizleme (PatchApplicator)
    ├─→ localStorage (anında)
    └─→ /api/editor-patches (500ms debounce) → JSON dosyası

"Kaynağa Commit Et" → /api/editor-patches/commit → ts-morph AST düzenleme → .tsx dosyası güncellenir
```

---

## Lisans

MIT
