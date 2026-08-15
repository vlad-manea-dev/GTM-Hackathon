import styles from "./TopBar.module.css";

export default function TopBar() {
  return (
    <header className={styles.bar}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>Pipeline</h1>
        <p className={styles.subtitle}>
          17 calls ingested · 10 deals live · nobody typed a note
        </p>
      </div>

      <label className={styles.search}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input type="search" placeholder="Search deals, buyers, companies…" aria-label="Search" />
      </label>

      <div className={styles.actions}>
        <button type="button" className={styles.ghostBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </svg>
          Sync now
        </button>
        <button type="button" className={styles.primaryBtn}>New deal</button>
      </div>
    </header>
  );
}
