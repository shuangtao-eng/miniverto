import { createProjectFromPlanInput, createProjectFromPlanResponse } from './create-plan'
import { parsePlanJsonResponse, type buildPlanPromptPayload } from './plan-prompt'
import {
  parseFinalAssessmentJsonResponse,
  type FinalAssessment,
  type FinalAssessmentPromptPayload,
} from './final-assessment'
import type { Project } from '@/types'

type PromptPayload = ReturnType<typeof buildPlanPromptPayload>

export interface OpenAICompatibleConfig {
  baseUrl: string
  apiKey: string
  model: string
}

type Fetcher = (input: string, init?: RequestInit) => Promise<{
  ok: boolean
  status?: number
  text?: () => Promise<string>
  json: () => Promise<unknown>
}>

interface GeneratePlanArgs {
  config: OpenAICompatibleConfig
  promptPayload: PromptPayload
  fetcher?: Fetcher
}

export interface GeneratePlanResult {
  source: 'model' | 'fallback'
  plan: Project
  error?: string
}

interface GenerateFinalAssessmentArgs {
  config: OpenAICompatibleConfig
  promptPayload: FinalAssessmentPromptPayload
  fallbackAssessment: FinalAssessment
  fetcher?: Fetcher
}

export interface GenerateFinalAssessmentResult {
  source: 'model' | 'fallback'
  assessment: FinalAssessment
  error?: string
}

export async function generatePlanWithModel(args: GeneratePlanArgs): Promise<GeneratePlanResult> {
  const fetcher = args.fetcher ?? fetch
  try {
    const response = await fetcher(`${trimTrailingSlash(args.config.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.config.apiKey}`,
      },
      body: JSON.stringify({
        model: args.config.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: args.promptPayload.system },
          { role: 'user', content: JSON.stringify({
            input: args.promptPayload.input,
            responseSchema: args.promptPayload.responseSchema,
          }) },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`model request failed: ${response.status ?? 'unknown'}`)
    }

    const json = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) throw new Error('model response missing content')

    const parsed = parsePlanJsonResponse(content)
    return {
      source: 'model',
      plan: createProjectFromPlanResponse(parsed),
    }
  } catch (error) {
    return {
      source: 'fallback',
      plan: createProjectFromPlanInput(args.promptPayload.input),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function generateFinalAssessmentWithModel(
  args: GenerateFinalAssessmentArgs,
): Promise<GenerateFinalAssessmentResult> {
  const fetcher = args.fetcher ?? fetch
  try {
    const response = await fetcher(`${trimTrailingSlash(args.config.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.config.apiKey}`,
      },
      body: JSON.stringify({
        model: args.config.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: args.promptPayload.system },
          { role: 'user', content: JSON.stringify({
            input: args.promptPayload.input,
            responseSchema: args.promptPayload.responseSchema,
          }) },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`model request failed: ${response.status ?? 'unknown'}`)
    }

    const json = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) throw new Error('model response missing content')

    return {
      source: 'model',
      assessment: parseFinalAssessmentJsonResponse(
        args.fallbackAssessment.projectId,
        args.fallbackAssessment.title,
        content,
      ),
    }
  } catch (error) {
    return {
      source: 'fallback',
      assessment: args.fallbackAssessment,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}
