"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links=[["/","Overview"],["/sources","01 · Sources"],["/transform","02 · Transform"],["/game","03 · Game output"]] as const;
export function PipelineNav(){const path=usePathname();return <nav className="pipelineNav">{links.map(([href,label])=><Link href={href} className={path===href?"active":""} key={href}>{label}</Link>)}</nav>}
