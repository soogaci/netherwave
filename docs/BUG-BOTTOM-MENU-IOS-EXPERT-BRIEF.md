# Баг нижнего меню на iPhone (PWA) — бриф для эксперта

**Контекст:** Next.js приложение (FeelReal), PWA. Нижнее меню (таб-бар) на **iPhone 16 Pro Max, iOS 26**, при открытии **с ярлыка на рабочем столе** (standalone, полноэкранный режим без интерфейса Safari) ведёт себя некорректно. На ПК и Android всё в порядке.

---

## 1. Как проблема проявлялась (хронология из чата)

1. **Старт:** Под нижним меню оставалась «заплатка» — незаполненное место другого цвета; из‑за этого блок меню визуально оказывался выше, чем нужно.
2. **После правок с safe-area:** При **появлении клавиатуры** (поле ввода в чате) меню «сползало» вверх, под ним снова появлялся кусок; после свайпа вниз по этой зоне всё возвращалось на место.
3. **Переход на 100vh / -webkit-fill-available для iOS 26:** На сплэше текст «FeelReal» и полоска загрузки были **выше центра**; на ленте — **чёрный зазор** между контентом и нижним меню.
4. **Фиксированное меню (position: fixed):** «Заплатка» под меню вернулась; при этом **меню стало можно тянуть вниз** — оно слегка двигалось и возвращалось (похоже на участие в overscroll).
5. **Меню снова в потоке (не fixed):** Пустота под меню вроде ушла, но **что-то перекрывало нижнюю половину иконок** (как будто элемент цвета фона наехал сверху). Этот «элемент» тоже **тянулся вниз/вверх** при свайпе.
6. **Ограничение высоты скролл-контейнера (max-height под нав):** Перекрытие иконок и «тягу» пытались убрать ограничением высоты контента; снова появилась **пустота под меню**, меню визуально поднималось вверх.
7. **Контейнер через inset: 0 без vh:** Пытались убрать зависимость от высоты; пользователь уточнил: приложение **всегда открывается с ярлыка**, полноэкранный PWA **без** интерфейса Safari; зазор по высоте похож на **высоту поисковой строки** — расчёт явно шёл под обычную вкладку Safari.
8. **Высота из JS (--app-height), панель absolute внутри viewport:** Панель привязали к низу контейнера с `height: var(--app-height)`. Зазор уменьшился, но **панель всё ещё «высоко»**. Добавили учёт safe-area и буфер для iOS (50px) — панель опустилась, но снова **что-то перекрывало половину кнопок**.
9. **Панель fixed + z-index 2147483647:** Ожидали, что панель будет поверх всего. Вместо этого: **панель по-прежнему перекрыта**, плюс **скролл перестал работать на всех устройствах**, **кнопки меню не нажимаются** (реагируют только верхние части иконок).
10. **Рендер панели через Portal в `document.body`:** Панель вынесли из дерева приложения в `body`. Цель — убрать перекрытие и восстановить скролл/клики. После этого **вернулось «прошлое» состояние: меню снова очень высоко** (пустота под ним).
11. **Полная замена:** Удалили всё, связанное с нижним меню (старый BottomNav, классы, портал), написали новый компонент **TabBar** и один класс **.tab-bar** без портала, с `z-index: 50`. Проблема **не исчезла** — меню по-прежнему высоко / с перекрытием (в зависимости от варианта).

**Итог:** Либо под меню пустота и оно «всплывает» вверх, либо что-то перекрывает нижнюю половину иконок и перехватывает тач; при агрессивном z-index и Portal ломались скролл и клики по всему приложению.

---

## 2. Текущее состояние кода (всё, что связано с меню и перекрытиями)

### 2.1. Root layout — скрипты высоты и атрибуты

**Файл:** `app/layout.tsx`

- В **`<head>`** один инлайн-скрипт:
  - тема, `data-ios26` (если в User-Agent есть `OS 26` / `OS_26`), `data-standalone` (если PWA);
  - **`--app-height`** задаётся из `window.innerHeight` (в px), один раз при загрузке.

```tsx
// app/layout.tsx — фрагмент <head>
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){var t=localStorage.getItem("feelreal-theme");...;var h=window.innerHeight||0;if(h>0){document.documentElement.style.setProperty("--app-height",Math.round(h)+"px");}})();`,
  }}
/>
```

- В **`<body>`** второй скрипт:
  - пересчёт **`--app-height`**: `max(visualViewport.height, innerHeight)` + замеренный safe-area снизу; на iOS добавляется буфер `Math.max(sab, 50)`;
  - **не** трогает `document.documentElement.style.height` и `document.body.style.height` (чтобы не было hydration mismatch);
  - подписки: resize, orientationchange, visualViewport resize/scroll; вызовы сразу, в rAF, и по таймерам 100/400/800 ms.

```tsx
// app/layout.tsx — фрагмент скрипта в body
__html: `(function(){if(typeof window==='undefined'||typeof document==='undefined')return;var v=window.visualViewport;var isIOS=...;function getSafeBottom(){...}function setH(){var a=v&&v.height?v.height:0;var b=window.innerHeight||0;var base=Math.max(a,b);...;var sab=getSafeBottom();var extra=isIOS?Math.max(sab,50):sab;var h=Math.round(base+extra);document.documentElement.style.setProperty('--app-height',h+'px');}setH();requestAnimationFrame(setH);setTimeout(setH,100);...})();`
```

### 2.2. Глобальные стили — viewport, таб-бар, контент

**Файл:** `app/globals.css`

```css
:root {
  --radius: 1.25rem;
  --app-height: 100dvh;
  --tab-bar-height: 49px;
  --tab-bar-safe: env(safe-area-inset-bottom, 0px);
}

.app-viewport {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--app-height, 100dvh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--background);
}
.app-viewport > * {
  min-height: 0;
  flex: 1 1 0%;
}

.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  height: var(--tab-bar-height);
  padding-bottom: var(--tab-bar-safe);
  box-sizing: content-box;
  background: var(--background);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 768px) {
  .tab-bar { display: none; }
}

.has-tab-bar {
  padding-bottom: calc(var(--tab-bar-height) + var(--tab-bar-safe));
}
@media (min-width: 768px) {
  .has-tab-bar { padding-bottom: 0; }
}

html {
  -webkit-text-size-adjust: 100%;
  height: 100%;
  overflow: hidden;
}
body {
  overflow: hidden;
  min-height: 100%;
  height: 100%;
}
```

### 2.3. Компонент нижнего меню (TabBar)

**Файл:** `components/app/TabBar.tsx`

- Один корневой элемент: `<nav className="tab-bar ...">`.
- 5 пунктов: Главная, Feels, Добавить, Чаты, Профиль.
- Стили: `paddingLeft/Right: env(safe-area-inset-left/right)`; высота строки иконок через `min-h-[var(--tab-bar-height)]`.

```tsx
return (
  <nav
    className="tab-bar max-w-md mx-auto w-full flex flex-row items-stretch"
    style={{
      paddingLeft: "env(safe-area-inset-left)",
      paddingRight: "env(safe-area-inset-right)",
    }}
    aria-label="Нижнее меню"
  >
    {ITEMS.map(({ href, label, Icon, isAdd }) => (
      <TabBarLink key={href} href={href} label={label} active={isActive(href)} isAdd={isAdd}>
        <Icon className={isAdd ? "h-7 w-7" : "h-6 w-6"} strokeWidth={...} />
      </TabBarLink>
    ))}
  </nav>
);
```

### 2.4. AppReadyProvider — контент и рендер TabBar

**Файл:** `components/providers/AppReadyProvider.tsx`

- Один flex-контейнер: первый ребёнок — скролл-область с классом `has-tab-bar` при `padBottomForNav`; второй — `TabBar` при `mounted && ready && showBottomBar`.
- TabBar **не** в портале, sibling скролл-области.

```tsx
const CONTENT_WRAPPER_BASE =
  "flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain";

const contentClass = [CONTENT_WRAPPER_BASE, padBottomForNav ? "has-tab-bar" : ""].filter(Boolean).join(" ");

return (
  <AppReadyContext.Provider value={ready}>
    <div className="flex flex-col flex-1 min-h-0 w-full relative">
      <div className={contentClass} style={{ WebkitOverflowScrolling: "touch" }}>
        <AnimatePresence mode="wait">
          {!ready ? <SplashScreen key="splash" /> : null}
        </AnimatePresence>
        {ready ? children : null}
      </div>
      {mounted && ready && showBottomBar ? <TabBar /> : null}
    </div>
  </AppReadyContext.Provider>
);
```

### 2.5. LayoutContent — где вешается viewport и провайдер

**Файл:** `components/app/LayoutContent.tsx`

```tsx
return (
  <RefreshProvider>
    <AppShell>
      <div className="app-viewport md:!relative md:!h-screen md:!min-h-screen md:!max-h-none">
        <AppReadyProvider padBottomForNav={!isChatPage} showBottomBar={!isChatPage}>
          <BackgroundRefresh />
          <PageLayout>{children}</PageLayout>
        </AppReadyProvider>
      </div>
    </AppShell>
  </RefreshProvider>
);
```

- На чат-странице (`isChatPage`) таб-бар не показывается и отступ не даётся.

### 2.6. Элементы с высоким z-index (могут перекрывать или влиять на слои)

- **SplashScreen:** `fixed inset-0 z-[10100]` — выше таб-бара при загрузке.
- **Onboarding:** `fixed inset-0 z-[10100]`.
- **CommentSection (оверлей/меню):** `z-[9998]` / `z-[9999]`.
- **PhotoViewer:** `z-[200]`, `z-[210]`, `z-[220]`.
- **LikersPopover:** `z-[100]`.
- **ToastProvider:** `fixed bottom-28 ... z-[100]`.
- **MiniPlayer:** `fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] ... z-40` — над таб-баром по вертикали, не перекрывает по z (50 > 40).

Текущий таб-бар: **z-index: 50**, не в портале.

### 2.7. ErrorBoundary

**Файл:** `components/ErrorBoundary.tsx`

- Страница ошибки с классом `has-tab-bar` и рендером `<TabBar />` внизу (тот же компонент, без обёртки).

---

## 3. Что уже пробовали (краткий список)

- Разные значения и источники высоты: `100vh`, `100dvh`, `--vvh` из VisualViewport, `--app-height` из JS (innerHeight, visualViewport.height, + safe-area, + буфер 50px для iOS).
- Меню в потоке vs `position: fixed` vs `position: absolute` внутри viewport.
- Один контейнер с `inset: 0` без явной высоты.
- Фиксированная высота html/body в px (отказались из‑за hydration).
- Разные z-index (50, 100, 10000, 2147483647), `isolation: isolate`, `transform: translateZ(0)` на панели.
- Ограничение высоты скролл-контейнера `max-height: calc(var(--app-height) - 49px - env(safe-area-inset-bottom))`.
- Рендер панели через **Portal в `document.body`**.
- Отдельные хаки для iOS 26: `data-ios26`, фиксированный `--sab: 34px`, `-webkit-fill-available`, `body { position: fixed }`, обёртка `.app-root`.
- Полная замена старого BottomNav на новый TabBar без портала, один класс `.tab-bar`, без привязки панели к `--app-height`.

Ни один из вариантов не дал стабильного результата на iPhone 16 Pro Max, iOS 26, PWA с ярлыка: либо зазор/«меню высоко», либо перекрытие иконок и/или поломка скролла и кликов.

---

## 4. Просьба к эксперту

Нужно решение, которое на **iPhone в PWA (standalone)** даёт:

- Нижнее меню **строго у физического низа экрана**, без пустоты/зазора под ним.
- Ничего не перекрывает иконки меню и не перехватывает тач по ним.
- Скролл контента и остальные клики работают.

**Формат ответа, который удобен для внедрения:**

- Нумерованный список изменений.
- Для каждого пункта: **файл** (путь), **что сделать** (заменить/добавить/удалить) и **полный фрагмент кода** (можно кусками по 10–30 строк).
- Если решение зависит от условия (только PWA / только iOS) — явно указать, где и как это проверять (CSS-атрибут, JS, media query и т.д.).

Пример формата:

```
1. app/globals.css
   - В :root заменить/добавить: ...
   [код]

2. app/layout.tsx
   - В <head> убрать установку --app-height / заменить скрипт на: ...
   [код]
...
```

Так можно будет пошагово применить правки без двусмысленности. Спасибо.
