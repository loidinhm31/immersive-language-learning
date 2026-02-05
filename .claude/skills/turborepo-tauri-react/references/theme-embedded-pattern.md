# Theme Management & Embedded Mode Pattern

When embedding multiple apps in a parent application (like qm-center-app), theme management requires special handling to prevent conflicts between apps sharing the same DOM.

## Problem

Multiple embedded apps sharing `document.documentElement` for theme state causes conflicts:

- App A sets theme to "dark" → modifies `document.documentElement`
- App B sets theme to "simple" → overwrites App A's theme
- Both apps' ShadowWrappers see the same root element state

## Solution: Isolated Theme Management

### Key Principles

1. **`embedded` prop controls theme isolation only** - NOT navigation visibility
2. When `embedded=true`, apps dispatch custom events instead of modifying `document.documentElement`
3. Each app uses its own localStorage key and event name
4. ShadowWrapper listens for app-specific events

## Implementation

### 1. ThemeContext with Embedded Support

```typescript
// packages/ui/src/contexts/ThemeContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "chameleon" | "simple";

// Custom event name for theme changes (used by ShadowWrapper in parent app)
export const APP_THEME_EVENT = "my-app-theme-change";
export const APP_THEME_STORAGE_KEY = "my-app-theme";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * When true, the app is embedded in another app (e.g., qm-center).
   * In embedded mode, theme changes are dispatched via custom events
   * instead of modifying document.documentElement directly.
   * This prevents theme conflicts between multiple embedded apps.
   */
  embedded?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  embedded = false,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(APP_THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark" ||
        savedTheme === "chameleon" || savedTheme === "simple") {
      return savedTheme;
    }
    return "light";
  });

  useEffect(() => {
    // Save to localStorage (always)
    localStorage.setItem(APP_THEME_STORAGE_KEY, theme);

    if (embedded) {
      // In embedded mode, dispatch custom event for ShadowWrapper to handle
      // This avoids modifying document.documentElement which would affect other apps
      window.dispatchEvent(
        new CustomEvent(APP_THEME_EVENT, {
          detail: { theme },
        })
      );
    } else {
      // In standalone mode, apply theme to document element directly
      const root = window.document.documentElement;
      root.setAttribute("data-theme", theme);
      root.classList.remove("dark", "chameleon", "simple");
      if (theme !== "light") {
        root.classList.add(theme);
      }
    }
  }, [theme, embedded]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
```

### 2. App Entry Point - Pass embedded to ThemeProvider

```typescript
// packages/ui/src/embed/MyApp.tsx

import { ThemeProvider } from "../contexts/ThemeContext";

export interface MyAppProps {
  embedded?: boolean;
  // ... other props
}

export function MyApp({ embedded = false, ...props }: MyAppProps) {
  return (
    <PlatformProvider>
      <ThemeProvider embedded={embedded}>
        <AppShell {...props} />
      </ThemeProvider>
    </PlatformProvider>
  );
}
```

### 3. ShadowWrapper in Parent App

```typescript
// Parent app: src/components/ShadowWrapper.tsx

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Theme = "dark" | "light" | "chameleon" | "simple";

interface ShadowWrapperProps {
  children: React.ReactNode;
  styles?: string;
  className?: string;
  /**
   * localStorage key to read theme from. Each embedded app should use its own key.
   * This enables independent theme control per app.
   */
  storageKey?: string;
  /**
   * Custom event name to listen for theme changes from the embedded app.
   * When the app dispatches this event, ShadowWrapper will update theme.
   */
  themeEventName?: string;
}

const getThemeFromStorage = (storageKey: string): Theme => {
  const savedTheme = localStorage.getItem(storageKey);
  if (savedTheme === "light" || savedTheme === "dark" ||
      savedTheme === "chameleon" || savedTheme === "simple") {
    return savedTheme;
  }
  return "light";
};

export const ShadowWrapper: React.FC<ShadowWrapperProps> = ({
  children,
  styles,
  className,
  storageKey,
  themeEventName,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const [theme, setTheme] = useState<Theme>(() =>
    storageKey ? getThemeFromStorage(storageKey) : "light"
  );

  // Create shadow root
  useEffect(() => {
    if (hostRef.current) {
      const existingRoot = hostRef.current.shadowRoot;
      if (existingRoot) {
        setShadowRoot(existingRoot);
      } else {
        const root = hostRef.current.attachShadow({
          mode: "open",
          delegatesFocus: true,
        });
        setShadowRoot(root);
      }
    }
  }, []);

  // Apply theme classes to host element
  useEffect(() => {
    if (hostRef.current) {
      hostRef.current.setAttribute("data-theme", theme);
      hostRef.current.classList.remove("dark", "chameleon", "simple");
      if (theme !== "light") {
        hostRef.current.classList.add(theme);
      }
    }
  }, [theme]);

  // Listen for custom theme events from embedded apps
  useEffect(() => {
    if (!themeEventName) return;

    const handleThemeChange = (event: CustomEvent<{ theme: Theme }>) => {
      if (event.detail?.theme) {
        setTheme(event.detail.theme);
      }
    };

    window.addEventListener(themeEventName, handleThemeChange as EventListener);
    return () => {
      window.removeEventListener(themeEventName, handleThemeChange as EventListener);
    };
  }, [themeEventName]);

  // Fallback: observe document.documentElement if no storageKey provided
  useEffect(() => {
    if (storageKey) return;

    const syncTheme = () => {
      const root = document.documentElement;
      const dataTheme = root.getAttribute("data-theme");
      // ... sync logic
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, [storageKey]);

  return (
    <div ref={hostRef} className={className}>
      {shadowRoot &&
        createPortal(
          <>
            {styles && <style>{styles}</style>}
            <div className={`shadow-body h-full w-full overflow-auto ${theme}`} data-theme={theme}>
              {children}
            </div>
          </>,
          shadowRoot as unknown as Element,
        )}
    </div>
  );
};

// Theme storage keys and event names for each embedded app
export const THEME_STORAGE_KEYS = {
  APP_A: "app-a-theme",
  APP_B: "app-b-theme",
  // ... add more apps
} as const;

export const THEME_EVENT_NAMES = {
  APP_A: "app-a-theme-change",
  APP_B: "app-b-theme-change",
  // ... add more apps
} as const;
```

### 4. Embed Wrapper Usage

```typescript
// Parent app: src/components/SubApps/MyAppEmbed.tsx

import { MyApp } from "@my-app/ui/embed";
import embedStyles from "@my-app/ui/styles?inline";
import {
  ShadowWrapper,
  THEME_STORAGE_KEYS,
  THEME_EVENT_NAMES,
} from "@/components/ShadowWrapper";

export function MyAppEmbed() {
  const processedStyles = typeof embedStyles === "string"
    ? embedStyles
        .replace(/:root/g, ":host")
        .replace(/html/g, ":host")
        .replace(/body/g, ".shadow-body")
    : "";

  return (
    <ShadowWrapper
      className="fixed inset-0 z-50 h-screen w-screen"
      styles={processedStyles}
      storageKey={THEME_STORAGE_KEYS.APP_A}
      themeEventName={THEME_EVENT_NAMES.APP_A}
    >
      <MyApp
        embedded={true}  // IMPORTANT: Enable theme isolation
        // ... other props
      />
    </ShadowWrapper>
  );
}
```

## Important: `embedded` Prop Usage

### What `embedded` Controls

| Aspect        | `embedded=false`                  | `embedded=true`       |
| ------------- | --------------------------------- | --------------------- |
| Theme changes | Modify `document.documentElement` | Dispatch custom event |
| Navigation    | **Always shown**                  | **Always shown**      |
| localStorage  | Uses app-specific key             | Uses app-specific key |

### What `embedded` Does NOT Control

- **Navigation visibility** - Sidebar and BottomNav should ALWAYS be shown
- **Auth flow** - Handled separately via `skipAuth` prop
- **Routing** - Handled via `useRouter` and `basePath` props

### AppShell Pattern

```typescript
// packages/ui/src/components/templates/AppShell.tsx

export function AppShell({ embedded = false, skipAuth = false, onLogoutRequest }: AppShellProps) {
  // Always show navigation - embedded prop is only for theme isolation
  const showNavigation = true;

  return (
    <div className="min-h-screen">
      {/* Sidebar - always shown when authenticated */}
      {showNavigation && isAuthenticated && (
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggle} />
      )}

      {/* Content - always apply margins for sidebar */}
      <div className={`transition-all ${isCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        <Routes>...</Routes>
      </div>

      {/* BottomNav - always shown on mobile when authenticated */}
      {showNavigation && isAuthenticated && (
        <BottomNav />
      )}
    </div>
  );
}
```

## Theme Toggle Components

All theme toggle components should use the `useTheme` hook:

```typescript
// packages/ui/src/components/organisms/Sidebar.tsx

import { useTheme } from "@my-app/ui/contexts";

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <aside>
      {/* ... */}
      <button onClick={toggleTheme}>
        {isDark ? <Sun /> : <Moon />}
      </button>
    </aside>
  );
}
```

```typescript
// packages/ui/src/components/molecules/BottomNav.tsx

import { useTheme } from '@my-app/ui/contexts';

export function BottomNav() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // ... same pattern
}
```

## Anti-Patterns to Avoid

### Direct DOM Manipulation

```typescript
// BAD - bypasses ThemeContext, causes conflicts when embedded
const toggleTheme = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
};

// GOOD - uses ThemeContext
const { toggleTheme } = useTheme();
```

### Using Generic localStorage Key

```typescript
// BAD - conflicts with other apps
localStorage.setItem('theme', 'dark');

// GOOD - app-specific key
localStorage.setItem('my-app-theme', 'dark');
```

### Hiding Navigation Based on `embedded`

```typescript
// BAD - embedded should only control theme isolation
const showNavigation = !embedded;

// GOOD - always show navigation
const showNavigation = true;
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Parent App (qm-center)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ShadowWrapper (storageKey="app-a-theme",                   │ │
│  │               themeEventName="app-a-theme-change")         │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ App A (embedded=true)                                │ │ │
│  │  │                                                      │ │ │
│  │  │  ThemeProvider ──► dispatchEvent("app-a-theme-change")│ │ │
│  │  │       │                        │                     │ │ │
│  │  │       ▼                        ▼                     │ │ │
│  │  │  localStorage              ShadowWrapper listens     │ │ │
│  │  │  ["app-a-theme"]           and updates Shadow DOM    │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ShadowWrapper (storageKey="app-b-theme",                   │ │
│  │               themeEventName="app-b-theme-change")         │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ App B (embedded=true)                                │ │ │
│  │  │                                                      │ │ │
│  │  │  ThemeProvider ──► dispatchEvent("app-b-theme-change")│ │ │
│  │  │       │                        │                     │ │ │
│  │  │       ▼                        ▼                     │ │ │
│  │  │  localStorage              ShadowWrapper listens     │ │ │
│  │  │  ["app-b-theme"]           and updates Shadow DOM    │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ► Each app's theme is completely independent                    │
│  ► No conflicts on document.documentElement                      │
└─────────────────────────────────────────────────────────────────┘
```

## Checklist

- [ ] ThemeProvider accepts `embedded` prop
- [ ] When `embedded=true`, ThemeProvider dispatches custom event
- [ ] App uses unique localStorage key (e.g., `"my-app-theme"`)
- [ ] App uses unique event name (e.g., `"my-app-theme-change"`)
- [ ] All theme toggles use `useTheme()` hook (no direct DOM manipulation)
- [ ] AppShell always shows navigation (`showNavigation = true`)
- [ ] Embed wrapper passes `embedded={true}` to the app
- [ ] ShadowWrapper configured with `storageKey` and `themeEventName`
