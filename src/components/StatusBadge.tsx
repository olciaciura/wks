import type { ReactNode } from "react";

type StatusBadgeProps = {
   tone: string;
   children: ReactNode;
};

export default function StatusBadge({ tone, children }: StatusBadgeProps) {
   return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}
