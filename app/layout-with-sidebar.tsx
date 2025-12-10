import type { ReactNode } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"

export function LayoutWithSidebar({ children }: { children: ReactNode }) {
  return <LayoutWrapper>{children}</LayoutWrapper>
}
