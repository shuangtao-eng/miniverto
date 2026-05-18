import { create } from 'zustand'
import type { Project, Task, TaskAssessmentRecord } from '@/types'

const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    emoji: 'ML',
    title: 'Machine Learning Foundations',
    goalSummary: 'Build a practical foundation in machine learning, from probability basics to supervised models, and ship a small end-to-end project.',
    status: 'active',
    milestoneList: [
      {
        id: 'm1',
        title: 'Math Foundations',
        successCriteria: 'Explain gradients, probability, and matrix operations well enough to debug a basic model.',
        tasks: [
          { id: 't1', kind: 'reading', title: 'Refresh linear algebra', estimatedMinutes: 60, status: 'completed' },
          { id: 't2', kind: 'practice', title: 'Practice matrix operations', estimatedMinutes: 45, status: 'completed' },
          {
            id: 't3',
            kind: 'reading',
            title: 'Probability and statistics basics',
            description: 'Understand the probability ideas that show up in model evaluation, uncertainty, and simple classifiers.',
            estimatedMinutes: 90,
            status: 'in_progress',
            acceptanceCriteria: 'Write a one-page note explaining distributions, expectation, variance, and Bayes rule with one machine-learning example.',
            learningContent: {
              overview: 'This session connects probability vocabulary to the decisions you make while building and evaluating machine-learning models.',
              prerequisites: [
                'You can read basic algebra notation.',
                'You know what a dataset, feature, and label mean.',
              ],
              keyPoints: [
                'Probability describes uncertainty before and after seeing evidence.',
                'Expected value and variance summarize what a random variable tends to do.',
                'Bayes rule updates a belief when new evidence arrives.',
              ],
              steps: [
                'Map each probability term to a concrete machine-learning example.',
                'Work through one small distribution by hand.',
                'Use Bayes rule to update a simple classifier-style belief.',
              ],
              exercises: [
                'Compute the expectation of a small discrete distribution.',
                'Explain why class imbalance changes a baseline accuracy number.',
                'Write one question you would ask before trusting a metric.',
              ],
              reviewPrompt: 'Tomorrow, explain Bayes rule without notes and connect it to a model decision.',
              lessonBlocks: [
                {
                  id: 't3-concept',
                  type: 'concept',
                  title: 'Probability as uncertainty',
                  body: 'Treat probability as a disciplined way to describe incomplete information. A model prediction is useful only when you understand what uncertainty remains.',
                  bullets: [
                    'Random variables represent unknown outcomes.',
                    'Distributions show possible values and their likelihood.',
                    'Metrics summarize performance under uncertainty.',
                  ],
                },
                {
                  id: 't3-example',
                  type: 'example',
                  title: 'A classifier example',
                  body: 'Imagine a spam filter with many normal messages and a few spam messages. Accuracy alone can look high even when the model misses the rare class.',
                  bullets: [
                    'Compare the class prior before seeing the message.',
                    'Add evidence from words in the message.',
                    'Update the decision using the new evidence.',
                  ],
                },
                {
                  id: 't3-quiz',
                  type: 'quiz',
                  title: 'Quick check',
                  body: 'Use these questions to test whether the ideas are usable, not just familiar.',
                  bullets: [
                    'What does variance tell you that the mean does not?',
                    'Why can 95% accuracy be misleading?',
                    'What changes after new evidence is observed?',
                  ],
                },
              ],
              quickCheck: [
                'What does variance tell you that the mean does not?',
                'Why can 95% accuracy be misleading?',
                'What changes after new evidence is observed?',
              ],
              deliverable: {
                title: 'Probability concept note',
                format: 'Short note with one worked example',
                acceptanceCheck: 'The note explains expectation, variance, and Bayes rule in plain language.',
              },
            },
          },
        ],
      },
      {
        id: 'm2',
        title: 'Supervised Learning',
        successCriteria: 'Implement and compare three classifiers with scikit-learn.',
        tasks: [
          { id: 't4', kind: 'reading', title: 'Linear regression and gradient descent', estimatedMinutes: 60, status: 'pending' },
          { id: 't5', kind: 'practice', title: 'Implement linear regression by hand', estimatedMinutes: 90, status: 'pending' },
          { id: 't6', kind: 'reflection', title: 'Compare where algorithms fit', estimatedMinutes: 30, status: 'pending' },
        ],
      },
    ],
    completedTasks: 2,
    totalTasks: 6,
    criticScore: 8.5,
    criticDimensions: [
      { label: 'Structure', score: 9, maxScore: 10 },
      { label: 'Feasibility', score: 8, maxScore: 10 },
      { label: 'Completeness', score: 8, maxScore: 10 },
    ],
    lastActive: '2 hours ago',
  },
  {
    id: '2',
    emoji: 'PM',
    title: 'PMP Exam Sprint',
    goalSummary: 'Prepare for the PMP exam in 30 days with focused reading, scenario drills, and weekly mock review.',
    status: 'active',
    milestoneList: [
      {
        id: 'm3',
        title: 'Process Groups and Principles',
        successCriteria: 'Explain each process group and apply it to exam scenarios.',
        tasks: [
          { id: 't7', kind: 'reading', title: 'Map PMP process groups', estimatedMinutes: 20, status: 'completed' },
          { id: 't8', kind: 'practice', title: 'Practice stakeholder scenarios', estimatedMinutes: 30, status: 'completed' },
          { id: 't9', kind: 'practice', title: 'Review risk management questions', estimatedMinutes: 30, status: 'completed' },
          { id: 't10', kind: 'practice', title: 'Timed mock-question drill', estimatedMinutes: 30, status: 'in_progress' },
        ],
      },
    ],
    completedTasks: 3,
    totalTasks: 4,
    criticScore: 7.2,
    lastActive: 'yesterday',
  },
  {
    id: '3',
    emoji: 'TS',
    title: 'Advanced React and TypeScript',
    goalSummary: 'Study React 18 patterns and TypeScript advanced types, then refactor a real production-style project.',
    status: 'completed',
    milestoneList: [],
    completedTasks: 12,
    totalTasks: 12,
    criticScore: 9.1,
    lastActive: '3 days ago',
  },
  {
    id: '4',
    emoji: '5K',
    title: 'Half Marathon Training Plan',
    goalSummary: 'Move from a 5K base to a half marathon in 12 weeks with interval, long-run, and recovery sessions.',
    status: 'paused',
    milestoneList: [],
    completedTasks: 8,
    totalTasks: 48,
    lastActive: '2 weeks ago',
  },
]

interface ProjectState {
  projects: Project[]
  selectedProjectId: string | null

  selectProject: (id: string | null) => void
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void
  updateTaskProgress: (
    taskId: string,
    patch: { status?: Task['status']; userNote?: string; assessmentRecord?: TaskAssessmentRecord },
  ) => void
  getProject: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: DEMO_PROJECTS,
  selectedProjectId: null,

  selectProject: (id) => set({ selectedProjectId: id }),
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects.filter((p) => p.id !== project.id)] })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((project) => project.id !== id),
    selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
  })),
  updateTaskProgress: (taskId, patch) => set((state) => ({
    projects: state.projects.map((project) => {
      let touched = false
      const milestoneList = project.milestoneList.map((milestone) => ({
        ...milestone,
        tasks: milestone.tasks.map((task) => {
          if (task.id !== taskId) return task
          touched = true
          return {
            ...task,
            status: patch.status ?? task.status,
            userNote: patch.userNote ?? task.userNote,
            assessmentHistory: patch.assessmentRecord
              ? [...(task.assessmentHistory ?? []), patch.assessmentRecord]
              : task.assessmentHistory,
          }
        }),
      }))

      if (!touched) return project
      const tasks = milestoneList.flatMap((milestone) => milestone.tasks)
      return {
        ...project,
        milestoneList,
        completedTasks: tasks.filter((task) => task.status === 'completed').length,
        totalTasks: tasks.length,
      }
    }),
  })),
  getProject: (id) => get().projects.find((p) => p.id === id),
}))
