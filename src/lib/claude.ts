import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getClaudeClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: import.meta.env.ANTHROPIC_API_KEY as string,
    })
  }
  return _client
}

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
