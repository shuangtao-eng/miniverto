import { create } from 'zustand'
import type { Project, Task, TaskAssessmentRecord } from '@/types'

const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    emoji: '🧠',
    title: '机器学习基础入门',
    goalSummary: '从零开始学习机器学习，掌握线性回归、决策树、SVM 等基础算法，并完成一个端到端项目。',
    status: 'active',
    milestoneList: [
      {
        id: 'm1',
        title: '数学基础',
        successCriteria: '能独立推导线性回归的损失函数梯度',
        tasks: [
          { id: 't1', kind: 'reading', title: '线性代数复习', estimatedMinutes: 60, status: 'completed' },
          { id: 't2', kind: 'practice', title: '矩阵运算练习', estimatedMinutes: 45, status: 'completed' },
          { id: 't3', kind: 'reading', title: '概率统计基础', estimatedMinutes: 90, status: 'in_progress' },
        ],
      },
      {
        id: 'm2',
        title: '监督学习算法',
        successCriteria: '能用 scikit-learn 实现并评估三种分类器',
        tasks: [
          { id: 't4', kind: 'reading', title: '线性回归与梯度下降', estimatedMinutes: 60, status: 'pending' },
          { id: 't5', kind: 'practice', title: '手写线性回归', estimatedMinutes: 90, status: 'pending' },
          { id: 't6', kind: 'reflection', title: '对比不同算法的适用场景', estimatedMinutes: 30, status: 'pending' },
        ],
      },
    ],
    completedTasks: 2,
    totalTasks: 6,
    criticScore: 8.5,
    criticDimensions: [
      { label: '结构性', score: 9, maxScore: 10 },
      { label: '可行性', score: 8, maxScore: 10 },
      { label: '完整性', score: 8, maxScore: 10 },
    ],
    lastActive: '2 小时前',
  },
  {
    id: '2',
    emoji: '🎸',
    title: '吉他弹唱 30 天速成',
    goalSummary: '零基础学吉他，30 天内能弹唱 3 首完整歌曲。每天练习 30 分钟。',
    status: 'active',
    milestoneList: [
      {
        id: 'm3',
        title: '基础和弦',
        successCriteria: '能流畅切换 C-Am-F-G 四个和弦',
        tasks: [
          { id: 't7', kind: 'reading', title: '认识吉他结构与调音', estimatedMinutes: 20, status: 'completed' },
          { id: 't8', kind: 'practice', title: 'C 和弦按法练习', estimatedMinutes: 30, status: 'completed' },
          { id: 't9', kind: 'practice', title: 'Am 和弦按法练习', estimatedMinutes: 30, status: 'completed' },
          { id: 't10', kind: 'practice', title: '和弦切换练习', estimatedMinutes: 30, status: 'in_progress' },
        ],
      },
    ],
    completedTasks: 3,
    totalTasks: 4,
    criticScore: 7.2,
    lastActive: '昨天',
  },
  {
    id: '3',
    emoji: '📐',
    title: 'React + TypeScript 深入',
    goalSummary: '系统学习 React 18 新特性和 TypeScript 高级类型，重构一个真实项目。',
    status: 'completed',
    milestoneList: [],
    completedTasks: 12,
    totalTasks: 12,
    criticScore: 9.1,
    lastActive: '3 天前',
  },
  {
    id: '4',
    emoji: '🏃',
    title: '半马训练计划',
    goalSummary: '12 周从 5km 到半马。每周 4 次训练，含间歇跑、长距离和恢复跑。',
    status: 'paused',
    milestoneList: [],
    completedTasks: 8,
    totalTasks: 48,
    lastActive: '2 周前',
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
