'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportPage from '@/components/ui/ReportPage';

export default function MaintenanceReport() {
  return (
    <DashboardLayout>
      <ReportPage title="Maintenance Report" endpoint="/reports/maintenance" />
    </DashboardLayout>
  );
}
