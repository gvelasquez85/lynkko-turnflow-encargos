'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'https://encargos.turnflow.com.co',
})

export const { signIn, signUp, signOut, useSession } = authClient
