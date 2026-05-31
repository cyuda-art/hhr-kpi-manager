import { redirect } from 'next/navigation';

export default async function ProjectDashboardPage({ params }: { params: Promise<{ orgId: string, projectId: string }> }) {
  const { orgId, projectId } = await params;
  // プロジェクトのトップページへのアクセスを、自動的にKPIツリーページへリダイレクトする
  redirect(`/${orgId}/p/${projectId}/kpi-tree`);
}
