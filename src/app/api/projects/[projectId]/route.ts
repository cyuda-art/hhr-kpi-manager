import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, hasPermission } from '@/lib/auth-server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'DELETE')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete project' }, { status: 403 });
    }

    const { projectId } = await params;

    // 他組織のプロジェクトを削除できないよう所有確認
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not Found or Forbidden' }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'WRITE')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to update project' }, { status: 403 });
    }

    const { projectId } = await params;

    // 他組織のプロジェクトを更新できないよう所有確認
    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject || existingProject.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not Found or Forbidden' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error: any) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
