import styles from "./Sidebar.module.css";

const nav = [
  { label: "Pipeline", active: true, icon: <path d="M3 6h18M3 12h12M3 18h7" /> },
  { label: "Deals", active: false, icon: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 4v16M16 4v16" /></> },
  { label: "Calls", active: false, icon: <><path d="M12 3v10" /><rect x="9" y="3" width="6" height="10" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></> },
  { label: "Artefacts", active: false, icon: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></> },
  { label: "Settings", active: false, icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></> },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.brandName}>Sidecar</span>
      </div>

      <nav className={styles.nav} aria-label="Main">
        {nav.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`${styles.navItem} ${item.active ? styles.navActive : ""}`}
            aria-current={item.active ? "page" : undefined}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {item.icon}
            </svg>
            {item.label}
          </a>
        ))}
      </nav>

      <div className={styles.sourceCard}>
        <div className={styles.sourceLabel}>Transcript sources</div>
        <div className={styles.sourceRow}>
          <span className={`${styles.statusDot} ${styles.dotLive}`} aria-hidden="true" />
          Fireflies
          <span className={styles.sourceMeta}>12 calls</span>
        </div>
        <div className={styles.sourceRow}>
          <span className={`${styles.statusDot} ${styles.dotLive}`} aria-hidden="true" />
          Granola
          <span className={styles.sourceMeta}>5 calls</span>
        </div>
      </div>

      <div className={styles.user}>
        <span className={styles.avatar} aria-hidden="true" />
        <div className={styles.userText}>
          <div className={styles.userName}>Liam Power</div>
          <div className={styles.userRole}>Mailscale</div>
        </div>
      </div>
    </aside>
  );
}
