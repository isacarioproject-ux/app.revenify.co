import { DashboardLayout } from '@/components/dashboard-layout';
import { BudgetManagerPage } from '@/components/budget-manager';

export default function MyBudgetPage() {
  return (
    <DashboardLayout>
      <BudgetManagerPage />
    </DashboardLayout>
  );
}
