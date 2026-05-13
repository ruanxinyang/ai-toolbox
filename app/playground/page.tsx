import type { Metadata } from "next"

import { getServerMessages } from "@/lib/i18n/server"

import { PlaygroundClient } from "./playground-client"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerMessages()
  return {
    title: t.playground.title,
    description: t.playground.description,
  }
}

export default function Page() {
  return <PlaygroundClient />
}
