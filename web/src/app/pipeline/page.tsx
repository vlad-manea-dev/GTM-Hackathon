import Sidebar from "@/components/sidecar/Sidebar";
import TopBar from "@/components/sidecar/TopBar";
import KpiRow from "@/components/sidecar/KpiRow";
import FunnelHero from "@/components/sidecar/FunnelHero";
import PipelineSection from "@/components/sidecar/PipelineSection";
import styles from "./page.module.css";

export default function PipelinePage() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <KpiRow />
          <FunnelHero />
          <PipelineSection />
        </main>
      </div>
    </div>
  );
}
