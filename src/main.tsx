import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Migration: Reset locale to use browser detection (v2.0)
// This runs once to ensure users get the correct default language
const LOCALE_MIGRATION_KEY = 'revenify:locale_migrated_v2'
if (!localStorage.getItem(LOCALE_MIGRATION_KEY)) {
  localStorage.removeItem('revenify:locale')
  localStorage.setItem(LOCALE_MIGRATION_KEY, 'true')
}

// DOM Protection Patch (React issue #17256)
// Browser extensions (e.g. CSS Peeper, Grammarly, ad blockers) inject/modify
// DOM nodes that React manages. When React tries to removeChild/insertBefore
// on nodes the extension has already moved or removed, React crashes with
// "NotFoundError: The node to be removed is not a child of this node".
// This patch catches those errors gracefully so the app doesn't crash.
// Warnings are silenced as they are harmless and fill the console with noise.
if (typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child
    }
    // eslint-disable-next-line prefer-rest-params
    return originalRemoveChild.apply(this, arguments as any) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode
    }
    // eslint-disable-next-line prefer-rest-params
    return originalInsertBefore.apply(this, arguments as any) as T
  }
}

// Note: React.StrictMode removed intentionally.
// next-themes injects DOM nodes outside React's control, and StrictMode's
// double mount/unmount causes 'removeChild' errors when React tries to
// clean up nodes that next-themes already removed.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />,
)
