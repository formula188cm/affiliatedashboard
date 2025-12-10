"use client"

import type React from "react"
import { Sidebar } from "./sidebar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 bg-background pt-16 md:pt-0">{children}</main>
    </div>
  )
}
