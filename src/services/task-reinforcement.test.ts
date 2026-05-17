import { describe, expect, test } from 'vitest'
import type { Project } from '@/types'
import type { ReviewTrigger } from './assessment-insights'
import { addReinforcementTaskToProject } from './task-reinforcement'

const trigger: ReviewTrigger = {
  taskId: 't1',
  taskTitle: 'Ownership basics',
  scorePct: 70,
  focus: ['Concept', 'Application'],
  action: 'Redo ownership explanation',
}

const project: Project = {
  id: 'p1',
  emoji: 'R',
  title: 'Learn Rust',
  goalSummary: 'Build a CLI',
  status: 'active',
  completedTasks: 1,
  totalTasks: 1,
  lastActive: 'today',
  milestoneList: [
    {
      id: 'm1',
      title: 'Basics',
      successCriteria: 'Explain ownership',
      tasks: [
        {
          id: 't1',
          kind: 'reading',
          title: 'Ownership basics',
          estimatedMinutes: 30,
          status: 'completed',
          learningContent: {
            overview: 'Learn ownership.',
            keyPoints: ['Owner', 'Move', 'Borrow'],
            steps: ['Read', 'Recall'],
            exercises: ['Explain a move'],
            reviewPrompt: 'Explain ownership transfer.',
          },
        },
      ],
    },
  ],
}

describe('task reinforcement', () => {
  test('adds a pending reinforcement task after the weak source task', () => {
    const updated = addReinforcementTaskToProject(project, trigger, { nowLabel: 'today' })
    const tasks = updated.milestoneList[0]?.tasks ?? []

    expect(updated.totalTasks).toBe(2)
    expect(updated.completedTasks).toBe(1)
    expect(tasks.map((task) => task.id)).toEqual(['t1', 't1-reinforce'])
    expect(tasks[1]).toMatchObject({
      id: 't1-reinforce',
      kind: 'practice',
      status: 'pending',
      title: expect.stringContaining('Ownership basics'),
      acceptanceCriteria: expect.stringContaining('70%'),
      learningContent: expect.objectContaining({
        practiceSet: expect.arrayContaining([
          expect.objectContaining({ level: 'foundation' }),
          expect.objectContaining({ level: 'application' }),
          expect.objectContaining({ level: 'challenge' }),
        ]),
      }),
    })
  })

  test('does not add a duplicate reinforcement task for the same trigger', () => {
    const once = addReinforcementTaskToProject(project, trigger)
    const twice = addReinforcementTaskToProject(once, trigger)

    expect(twice.totalTasks).toBe(2)
    expect(twice.milestoneList[0]?.tasks.filter((task) => task.id === 't1-reinforce')).toHaveLength(1)
  })
})
