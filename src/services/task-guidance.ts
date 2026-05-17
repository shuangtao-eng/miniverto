import type { Task } from '@/types'

export function getTaskGuidance(task: Task): string {
  if (task.description?.trim()) return task.description

  if (task.kind === 'reading') {
    return `Miniverto 建议：完成「${task.title}」时，先快速浏览结构，再带着 2-3 个问题精读。阅读中记录关键概念、例子、反例和不理解的点，结束前合上资料复述一遍。`
  }

  if (task.kind === 'practice') {
    return `Miniverto 建议：把「${task.title}」当成一次可验收练习。先写下输入、约束和成功标准，再独立完成；卡住超过 10 分钟时只查看最小提示，完成后记录错因和可复用步骤。`
  }

  if (task.kind === 'reflection') {
    return `Miniverto 建议：完成「${task.title}」时，用自己的话解释今天学到的关键概念，写出一个例子、一个反例、一个仍不确定的问题。`
  }

  return `Miniverto 建议：把「${task.title}」作为阶段收束任务。对照学习目标检查产出，列出已掌握、未掌握和下一步需要加强的部分。`
}

export function getTaskAcceptanceCriteria(task: Task): string {
  if (task.acceptanceCriteria?.trim()) return task.acceptanceCriteria

  if (task.kind === 'reading') {
    return '完成后应能不看资料说清 3 个关键点，并给出一个例子和一个反例。'
  }

  if (task.kind === 'practice') {
    return '完成一个可检查产出；至少记录 2 个错误或卡点，并写出下次遇到同类问题的处理步骤。'
  }

  if (task.kind === 'reflection') {
    return '写出不少于 5 行复盘：已掌握内容、薄弱内容、一个反例、一个下一步问题和一个可执行改进动作。'
  }

  return '形成一份简短结论：是否继续、加强哪一部分、下一轮学习计划需要如何调整。'
}
