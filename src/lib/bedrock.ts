import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk'

/**
 * Claude via AWS Bedrock (2026-08-18). Replaces the direct Anthropic API key
 * (ANTHROPIC_API_KEY_SPORTSGPT2) everywhere in this app.
 *
 * AnthropicBedrock is a drop-in for the Anthropic client — same messages.create /
 * messages.stream — that signs requests with AWS_ACCESS_KEY_ID /
 * AWS_SECRET_ACCESS_KEY / AWS_REGION from env (an IAM user scoped to
 * bedrock:Invoke and Converse actions). Model ids on Bedrock are inference profiles, so the
 * short ids the UI uses are mapped here; anything unmapped falls back to Haiku.
 */
export const BEDROCK_MODELS: Record<string, string> = {
  'claude-haiku-4-5-20251001': 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-haiku':              'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-sonnet-4-6':         'us.anthropic.claude-sonnet-4-6',
  'claude-sonnet':             'us.anthropic.claude-sonnet-4-6',
}
export const BEDROCK_HAIKU = BEDROCK_MODELS['claude-haiku-4-5-20251001']

export function bedrockConfigured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim())
}

export function bedrockModel(id: string): string {
  return BEDROCK_MODELS[id] ?? (id.startsWith('us.anthropic.') ? id : BEDROCK_HAIKU)
}

export function bedrockClient(): AnthropicBedrock {
  return new AnthropicBedrock({ awsRegion: process.env.AWS_REGION || 'us-east-1' })
}
