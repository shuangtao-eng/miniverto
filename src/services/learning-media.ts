import type { MediaSuggestion } from '@/types'

export interface LearningMediaCard {
  id: string
  title: string
  purpose: string
  placement: string
  promptOrQuery: string
  visualKind: MediaSuggestion['type']
  actionKind: 'external-link' | 'copy-prompt'
  actionLabel: string
  actionUrl?: string
  copyText?: string
  searchProviderLabel?: string
  previewNodes: string[]
  usageSteps: string[]
}

export function buildLearningMediaCard(media: MediaSuggestion): LearningMediaCard {
  const actionKind = media.type === 'video' ? 'external-link' : 'copy-prompt'

  return {
    id: media.id,
    title: media.title,
    purpose: media.purpose,
    placement: media.placement,
    promptOrQuery: media.promptOrQuery,
    visualKind: media.type,
    actionKind,
    actionLabel: actionLabelFor(media.type),
    actionUrl: media.type === 'video' ? videoSearchUrl(media.promptOrQuery) : undefined,
    copyText: media.type === 'video' ? undefined : copyPromptFor(media),
    searchProviderLabel: media.type === 'video' ? 'YouTube' : undefined,
    previewNodes: previewNodesFor(media),
    usageSteps: usageStepsFor(media.type),
  }
}

function actionLabelFor(type: MediaSuggestion['type']) {
  if (type === 'video') return '搜索视频'
  if (type === 'diagram') return '复制图解提示词'
  return '复制配图提示词'
}

function copyPromptFor(media: MediaSuggestion) {
  if (media.type === 'diagram') {
    return `请根据以下学习目标生成概念图：${media.promptOrQuery}`
  }
  return `请根据以下学习场景生成清晰配图：${media.promptOrQuery}`
}

function usageStepsFor(type: MediaSuggestion['type']) {
  if (type === 'video') {
    return [
      '先看 5-12 分钟，暂停后复述关键步骤。',
      '把视频里的一个例子改写成本节自己的练习。',
      '回到 Miniverto 完成快速自测和笔记。',
    ]
  }
  if (type === 'diagram') {
    return [
      '先看节点关系，再用自己的话解释每条连接。',
      '标出一个最容易混淆的概念或步骤。',
      '把图解转成 3 个主动回忆问题。',
    ]
  }
  return [
    '先观察画面里的对象、动作和结果。',
    '说明它对应本节哪个真实使用场景。',
    '用这张图写一个自己的例子。',
  ]
}

function videoSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

function previewNodesFor(media: MediaSuggestion) {
  if (media.type === 'video') return ['观看演示', '暂停复述', '回到练习']
  if (media.type === 'diagram') return ['核心概念', '关键步骤', '常见误区']
  return ['场景', '对象', '操作']
}
