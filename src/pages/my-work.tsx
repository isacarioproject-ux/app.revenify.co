import { DashboardLayout } from '@/components/dashboard-layout';
import { TasksPageView } from '@/components/tasks/tasks-page-view';

export default function MyWorkPage() {
  return (
    <DashboardLayout>
      <TasksPageView />
    </DashboardLayout>
  );
}
