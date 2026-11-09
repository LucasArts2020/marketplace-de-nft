import axios from 'axios'

export const http = axios.create({ timeout: 10_000 })

export function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? fallback
  return fallback
}
