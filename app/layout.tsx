import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Personal Bonus Hub — Live Sync', description: 'A live, verified view of every connected bonus destination.' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }
