# خطة تنفيذ نظام غرف المحادثات والمكالمات ومشاركة الشاشة (Project Chat & Huddles Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**الهدف:** بناء نظام متكامل للتواصل داخل كل مشروع يضم غرف دردشة عامة، رسائل خاصة (DMs)، ومكالمات صوت وفيديو حية مع مشاركة الشاشة (Native WebRTC + Firebase) ضمن لوحة جانبية عائمة (Floating Drawer & Huddle Dock) ودعم كامل للـ PWA و RTL.

---

### تقنيات وملفات العمل (Architecture & File Mapping)

```
src/
├── types/
│   └── chat.ts                     # أنواع الرسائل، المكالمات، وإشارات WebRTC
├── services/
│   ├── chat.ts                     # خدمات إرسال وقراءة رسائل القنوات والرسائل الخاصة
│   └── huddle.ts                   # خدمات إدارة جلسات الاتصال وإشارات WebRTC وحالة التواجد
├── hooks/
│   ├── useWebRTC.ts                # هوك إدارة المايك، الكاميرا، مشاركة الشاشة، واتصال الأقران
│   └── useProjectChat.ts           # هوك الاشتراك اللحظي برسائل المشروع والقنوات
├── components/
│   └── chat/
│       ├── ProjectChatDrawer.tsx   # اللوحة الجانبية الذكية للدردشة العامة والخاصة
│       ├── ProjectHuddleDock.tsx   # غرفة وشريط أدوات المكالمة العائم (كاميرات وشاشة)
│       └── MessageToTaskModal.tsx  # نافذة تحويل الرسالة إلى مهمة بضغطة زر
├── app/(dashboard)/projects/[id]/
│   └── page.tsx                    # دمج زر الغرفة واللوحة العائمة بصفحة المشروع
└── i18n/locales/
    ├── ar.json                     # النصوص والترجمات العربية الكاملة
    └── en.json                     # النصوص والترجمات الإنجليزية الكاملة
```

---

### المهام المجدولة خطوة بخطوة (Step-by-Step Tasks)

- [x] **المهمة 1: نموذج البيانات وخدمات المحادثة والاتصال (Types & Service Layer)**
  - إنشاء ملف الأنواع `src/types/chat.ts` لتعريف `ChatMessage`, `HuddleSession`, `HuddleParticipant`, `UserPresence`.
  - إنشاء ملف اختبارات الوحدة `tests/unit/chat-service.test.ts` واختبار عمليات إرسال الرسائل، قراءة المحادثة، وإدارة جلسة المكالمة.
  - إنشاء خدمة `src/services/chat.ts` للتعامل مع Firestore (إرسال، استماع بالـ snapshot، فرز القنوات والرسائل الخاصة).
  - إنشاء خدمة `src/services/huddle.ts` لإدارة حالة المكالمة وتبادل إشارات WebRTC وحالة التواجد (Presence).
  - التحقق من نجاح الاختبارات بنسبة 100%.

- [x] **المهمة 2: هوك التحكم بالوسائط واتصال الأقران (useWebRTC Hook)**
  - إنشاء ملف اختبار `tests/unit/useWebRTC.test.ts` (مع محاكاة `getUserMedia` و `getDisplayMedia` و `RTCPeerConnection`).
  - إنشاء `src/hooks/useWebRTC.ts` لإدارة:
    - تشغيل/كتم الميكروفون (`toggleAudio`).
    - تشغيل/إيقاف الكاميرا (`toggleVideo`).
    - تشغيل/إنهاء مشاركة الشاشة (`toggleScreenShare`).
    - إدارة تدفقات الفيديو والصوت المحلية والبعيدة (`localStream`, `remoteStreams`).
    - تعامل آمن مع أخطاء الأذونات (Graceful Permission Fallback) وفق معايير PWA.
  - التأكد من اجتياز جميع اختبارات الهوك.

- [x] **المهمة 3: نافذة تحويل الرسالة إلى مهمة فوراً (MessageToTaskModal)**
  - إنشاء مكون `src/components/chat/MessageToTaskModal.tsx` لفتح نافذة ملء سريعة عند النقر على خيار "تحويل لمهمة" في أي رسالة.
  - تعبئة العنوان والوصف بنص الرسالة، وإتاحة اختيار الأولوية، المكلف، والتاريخ.
  - كتابة اختبار `tests/unit/MessageToTaskModal.test.tsx` للتأكد من حفظ المهمة وربطها بالمشروع.

- [x] **المهمة 4: اللوحة الجانبية الذكية للدردشة (ProjectChatDrawer)**
  - إنشاء `src/components/chat/ProjectChatDrawer.tsx`:
    - تبديل سلس بين الغرفة العامة `# عامة` والقنوات الخاصة `💬 الخاص` مع كل عضو.
    - دعم الإشارة للمهام `#task-id` وعرض كرت تفاعلي مصغر بحالة المهمة.
    - زر لبدء أو الانضمام لمكالمة الفريق الحية `📞 بدء مكالمة الفريق`.
    - مراعاة معايير الـ PWA، اتجاه RTL/LTR المنطقي، وأحجام لمس $\ge 44\text{px}$.
  - كتابة اختبارات `tests/unit/ProjectChatDrawer.test.tsx`.

- [x] **المهمة 5: شاشة وغرفة المكالمات العائمة (ProjectHuddleDock)**
  - إنشاء `src/components/chat/ProjectHuddleDock.tsx`:
    - شبكة كاميرات مربعة مع إبراز المتحدث الحالي بمؤشر متوهج ذهبي.
    - عرض الشاشة المشتركة بالحجم الكامل تلقائياً عند قيام أي عضو بمشاركتها.
    - شريط أدوات تحكم الوسائط (كتم الصوت 🎙️، الكاميرا 📹، مشاركة الشاشة 🖥️، تصغير نافذة عائمة PiP 🗗، مغادرة المكالمة 📞❌).
  - كتابة اختبارات `tests/unit/ProjectHuddleDock.test.tsx`.

- [x] **المهمة 6: دمج النظام بصفحة المشروع والترجمة (Page Integration & i18n)**
  - تعديل `src/app/(dashboard)/projects/[id]/page.tsx` لإضافة زر فتح الغرفة `💬 محادثات واجتماعات المشروع` بجانب كروت الأعضاء وفي رأس الصفحة.
  - ربط فتح وإغلاق الدرج العائم `ProjectChatDrawer` والمكالمة `ProjectHuddleDock`.
  - إضافة كافة الترجمات في `src/i18n/ar.ts` و `src/i18n/en.ts`.
  - التحقق من سلامة الترجمة عبر `tests/unit/i18n-parity.test.ts` و `tests/unit/i18n-hygiene.test.ts`.

- [x] **المهمة 7: الفحص الشامل ورفع التحديثات (QA, Typecheck & Deployment)**
  - تشغيل فحص الأنواع الصارم: `npx tsc --noEmit` (0 أخطاء).
  - تشغيل الـ Linter: `npx eslint` للتأكد من نظافة الكود بنسبة 100%.
  - تشغيل حزمة الاختبارات الشاملة للمشروع بالكامل: `npm run test:unit`.
  - رفع الكود إلى فرع `main` على GitHub ليتم النشر التلقائي على Vercel.
