import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProjectListPage } from '@/pages/ProjectListPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { StatesPage } from '@/pages/StatesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MaterialsPage } from '@/pages/MaterialsPage'
import { NotesPage } from '@/pages/NotesPage'
import { TaskLearningPage } from '@/pages/TaskLearningPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: ProjectListPage,
})

const projectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/project/$projectId',
  component: ProjectDetailPage,
})

const taskLearningRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/project/$projectId/task/$taskId/learn',
  component: TaskLearningPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: SettingsPage,
})

const materialsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/materials',
  component: MaterialsPage,
})

const notesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/notes',
  component: NotesPage,
})

const statesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/states',
  component: StatesPage,
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
})

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([indexRoute, projectRoute, taskLearningRoute, materialsRoute, notesRoute, settingsRoute, statesRoute]),
  onboardingRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
