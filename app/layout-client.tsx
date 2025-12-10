"use client"

import type { ReactNode } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"

export function LayoutClient({ children }: { children: ReactNode }) {
  return <LayoutWrapper>{children}</LayoutWrapper>
}
