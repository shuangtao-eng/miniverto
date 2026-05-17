import { PROVIDER_CONFIGS, type ProviderId } from './provider-config'

export interface ModelOption {
  id: string
  providerId: ProviderId
  providerName: string
  modelName: string
  label: string
  planningScore: number
  freeTier: boolean
  privacy: 'cloud' | 'local' | 'proxy'
  badges: Array<'best-planning' | 'free-friendly' | 'local-private' | 'bring-your-own-quota'>
  bestFor: string
  caution: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'openai-gpt-4o',
    providerId: 'openai',
    providerName: PROVIDER_CONFIGS.openai.label,
    modelName: PROVIDER_CONFIGS.openai.defaultModel,
    label: 'GPT-4o',
    planningScore: 98,
    freeTier: false,
    privacy: 'cloud',
    badges: ['best-planning'],
    bestFor: '复杂长期学习计划、资料总结、结构化输出和中文规划质量',
    caution: '需要用户自己的 API key，会消耗付费额度。',
  },
  {
    id: 'openrouter-free-router',
    providerId: 'openrouter',
    providerName: PROVIDER_CONFIGS.openrouter.label,
    modelName: PROVIDER_CONFIGS.openrouter.defaultModel,
    label: 'OpenRouter free router',
    planningScore: 78,
    freeTier: true,
    privacy: 'cloud',
    badges: ['free-friendly'],
    bestFor: '试用、轻量计划、预算敏感场景',
    caution: '免费模型和限额会变化，复杂计划建议切换更强模型。',
  },
  {
    id: 'openrouter-qwen-free',
    providerId: 'openrouter',
    providerName: 'OpenRouter',
    modelName: 'qwen/qwen3-coder:free',
    label: 'Qwen free variant',
    planningScore: 74,
    freeTier: true,
    privacy: 'cloud',
    badges: ['free-friendly'],
    bestFor: '技术学习计划和代码学习路径试用',
    caution: '免费路由可用性取决于 OpenRouter 当前模型池和速率限制。',
  },
  {
    id: 'openrelay-local-proxy',
    providerId: 'openrelay',
    providerName: PROVIDER_CONFIGS.openrelay.label,
    modelName: PROVIDER_CONFIGS.openrelay.defaultModel,
    label: 'OpenRelay 本地聚合',
    planningScore: 72,
    freeTier: true,
    privacy: 'proxy',
    badges: ['free-friendly', 'bring-your-own-quota'],
    bestFor: '把用户已有账号或本地可用额度聚合成 OpenAI-compatible 入口',
    caution: '免费能力取决于用户本机账号、Cookie 或额度，Miniverto 不承诺稳定免费额度。',
  },
  {
    id: 'ollama-qwen',
    providerId: 'ollama',
    providerName: PROVIDER_CONFIGS.ollama.label,
    modelName: PROVIDER_CONFIGS.ollama.defaultModel,
    label: 'Ollama local model',
    planningScore: 66,
    freeTier: true,
    privacy: 'local',
    badges: ['local-private'],
    bestFor: '隐私优先、本地离线草案、资料不出设备',
    caution: '计划质量取决于本机模型能力和硬件性能。',
  },
  {
    id: 'custom-openai-compatible',
    providerId: 'custom',
    providerName: PROVIDER_CONFIGS.custom.label,
    modelName: PROVIDER_CONFIGS.custom.defaultModel,
    label: '自定义 OpenAI-compatible',
    planningScore: 70,
    freeTier: false,
    privacy: 'cloud',
    badges: [],
    bestFor: '高级用户接入公司或自建模型服务',
    caution: 'Miniverto 无法预先判断模型质量，需要用户测试。',
  },
]

export function getBestPlanningModel() {
  return [...MODEL_OPTIONS].sort((a, b) => b.planningScore - a.planningScore)[0]!
}

export function getFreeFriendlyModels() {
  return MODEL_OPTIONS.filter((model) => model.freeTier)
}

export function getModelsByProvider(providerId: ModelOption['providerId']) {
  return MODEL_OPTIONS.filter((model) => model.providerId === providerId)
}
