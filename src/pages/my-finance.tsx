import { DashboardLayout } from '@/components/dashboard-layout';
import { FinancePageView } from '@/components/finance/finance-page-view';

export default function MyFinancePage() {
  return (
    <DashboardLayout>
      <FinancePageView />
    </DashboardLayout>
  );
}

