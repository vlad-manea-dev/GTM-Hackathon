import scope from "./sidecar-scope.module.css";

export const metadata = {
  title: "Pipeline · Sidecar",
  description: "RevOps agent dashboard — pipeline, funnel, and per-deal artefacts.",
};

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return <div className={scope.scope}>{children}</div>;
}
