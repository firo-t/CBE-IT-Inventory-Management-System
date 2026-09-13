'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportPage from '@/components/ui/ReportPage';
import DashboardLayout2 from '@/components/layout/DashboardLayout';

export default function AssignmentReport() {
  return (
    <DashboardLayout>
      <ReportPage title="Assignment Report" endpoint="/reports/assignments" />
    </DashboardLayout>
  );
}
