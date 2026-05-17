import { describe, expect, test, vi } from 'vitest'
import { deletePersistedProject, listPersistedProjects } from './project-library'

describe('project library persistence service', () => {
  test('returns an empty list without Tauri invoke', async () => {
    await expect(listPersistedProjects(undefined)).resolves.toEqual([])
  })

  test('maps persisted project records to frontend projects', async () => {
    const invoke = vi.fn().mockResolvedValue([
      {
        id: 'p1',
        emoji: 'R',
        title: 'Learn Rust',
        goal_summary: 'Build a CLI',
        status: 'active',
        completed_tasks: 0,
        total_tasks: 1,
        critic_score: 8.5,
        last_active: 'today',
        milestones: [
          {
            id: 'm1',
            project_id: 'p1',
            title: 'Basics',
            success_criteria: 'Explain ownership',
            ordinal: 0,
            tasks: [
              {
                id: 't1',
                milestone_id: 'm1',
                kind: 'reading',
                title: 'Read chapter',
                description: null,
                estimated_minutes: 60,
                status: 'pending',
                suggested_date: null,
                acceptance_criteria: null,
                learning_content_json: JSON.stringify({
                  overview: 'Miniverto guide',
                  keyPoints: ['A', 'B', 'C'],
                  steps: ['Step 1'],
                  exercises: ['Exercise 1'],
                  reviewPrompt: 'Review',
                }),
                recommended_references_json: JSON.stringify([
                  {
                    id: 'ref-1',
                    type: 'book',
                    title: 'Reference',
                    reason: 'Good fit',
                    difficulty: 'beginner',
                  },
                ]),
                assessment_history_json: JSON.stringify([
                  {
                    id: 'record-1',
                    taskId: 't1',
                    createdAt: '2026-04-28T00:00:00.000Z',
                    scorePct: 80,
                  },
                ]),
                user_note: null,
                ordinal: 0,
              },
            ],
          },
        ],
      },
    ])

    const projects = await listPersistedProjects(invoke)

    expect(invoke).toHaveBeenCalledWith('list_projects')
    expect(projects[0]).toMatchObject({
      id: 'p1',
      goalSummary: 'Build a CLI',
      completedTasks: 0,
      totalTasks: 1,
      milestoneList: [
        {
          id: 'm1',
          successCriteria: 'Explain ownership',
          tasks: [
            {
              id: 't1',
              estimatedMinutes: 60,
              learningContent: expect.objectContaining({ overview: 'Miniverto guide' }),
              recommendedReferences: [expect.objectContaining({ title: 'Reference' })],
              assessmentHistory: [expect.objectContaining({ scorePct: 80 })],
            },
          ],
        },
      ],
    })
  })

  test('deletes a persisted project through invoke', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined)

    await deletePersistedProject('p1', invoke)

    expect(invoke).toHaveBeenCalledWith('delete_project', { projectId: 'p1' })
  })
})
