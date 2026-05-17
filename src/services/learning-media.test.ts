import { describe, expect, test } from 'vitest'
import { buildLearningMediaCard } from './learning-media'
import type { MediaSuggestion } from '@/types'

describe('learning media cards', () => {
  test('turns video suggestions into searchable video links', () => {
    const media: MediaSuggestion = {
      id: 'video-1',
      type: 'video',
      title: '实操演示',
      purpose: '看一遍完整流程。',
      promptOrQuery: 'Rust ownership tutorial 10 minutes',
      placement: '示例演练',
    }

    const card = buildLearningMediaCard(media)

    expect(card.actionKind).toBe('external-link')
    expect(card.actionLabel).toBe('搜索视频')
    expect(card.searchProviderLabel).toBe('YouTube')
    expect(card.actionUrl).toContain('youtube.com/results')
    expect(card.copyText).toBeUndefined()
    expect(card.visualKind).toBe('video')
    expect(card.usageSteps).toEqual([
      '先看 5-12 分钟，暂停后复述关键步骤。',
      '把视频里的一个例子改写成本节自己的练习。',
      '回到 Miniverto 完成快速自测和笔记。',
    ])
  })

  test('turns diagram suggestions into in-app visual prompts', () => {
    const media: MediaSuggestion = {
      id: 'diagram-1',
      type: 'diagram',
      title: '概念关系图',
      purpose: '看清关键概念关系。',
      promptOrQuery: '生成概念图',
      placement: '核心概念',
    }

    const card = buildLearningMediaCard(media)

    expect(card.actionKind).toBe('copy-prompt')
    expect(card.actionLabel).toBe('复制图解提示词')
    expect(card.actionUrl).toBeUndefined()
    expect(card.copyText).toContain('生成概念图')
    expect(card.visualKind).toBe('diagram')
    expect(card.previewNodes).toHaveLength(3)
    expect(card.usageSteps).toEqual([
      '先看节点关系，再用自己的话解释每条连接。',
      '标出一个最容易混淆的概念或步骤。',
      '把图解转成 3 个主动回忆问题。',
    ])
  })

  test('turns image suggestions into copyable visual prompts', () => {
    const media: MediaSuggestion = {
      id: 'image-1',
      type: 'image',
      title: '场景配图',
      purpose: '帮助用户建立真实应用画面。',
      promptOrQuery: 'Python data analysis dashboard screenshot',
      placement: '导入',
    }

    const card = buildLearningMediaCard(media)

    expect(card.actionKind).toBe('copy-prompt')
    expect(card.actionLabel).toBe('复制配图提示词')
    expect(card.copyText).toContain('Python data analysis dashboard screenshot')
    expect(card.previewNodes).toEqual(['场景', '对象', '操作'])
    expect(card.usageSteps).toEqual([
      '先观察画面里的对象、动作和结果。',
      '说明它对应本节哪个真实使用场景。',
      '用这张图写一个自己的例子。',
    ])
  })
})
