/**
 * src/modules/projects/projects.service.ts
 */

import { Request } from 'express';
import { ProjectStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/response';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import type { CreateProjectInput, UpdateProjectInput, AssignUserInput } from './projects.schema';

const PROJECT_INCLUDE = {
  client:    { select: { id: true, companyName: true, status: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  assignments: {
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { assignedAt: 'asc' as const },
  },
} as const;

export async function listProjects(req: Request) {
  const { page, limit, skip, sort } = parsePagination(req);
  const search   = req.query.search   as string | undefined;
  const status   = req.query.status   as ProjectStatus | undefined;
  const clientId = req.query.clientId as string | undefined;

  const where = {
    ...(status   ? { status }   : {}),
    ...(clientId ? { clientId } : {}),
    ...(search ? {
      OR: [
        { name:        { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  };

  const orderBy = sort ? { [sort.field]: sort.order } : { createdAt: 'desc' as const };
  const [projects, total] = await Promise.all([
    prisma.project.findMany({ where, skip, take: limit, orderBy, include: PROJECT_INCLUDE }),
    prisma.project.count({ where }),
  ]);
  return { projects, meta: buildPaginationMeta(total, page, limit) };
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({ where: { id }, include: PROJECT_INCLUDE });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
  return project;
}

export async function createProject(input: CreateProjectInput, createdById: string) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  const project = await prisma.project.create({
    data: {
      name: input.name, description: input.description, status: input.status,
      startDate: new Date(input.startDate),
      endDate:   input.endDate ? new Date(input.endDate) : undefined,
      budget: input.budget, clientId: input.clientId, createdById,
    },
    include: PROJECT_INCLUDE,
  });

  prisma.activityLog
    .create({ data: { type: 'PROJECT_CREATED', relatedId: project.id, relatedType: 'Project' } })
    .catch((e) => console.error('[ActivityLog] PROJECT_CREATED:', e));

  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  await getProjectById(id);
  if (input.clientId) {
    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate:   input.endDate   ? new Date(input.endDate)   : undefined,
    },
    include: PROJECT_INCLUDE,
  });

  const logType = input.status === ProjectStatus.COMPLETED
    ? ('PROJECT_COMPLETED' as const)
    : ('PROJECT_UPDATED' as const);

  prisma.activityLog
    .create({ data: { type: logType, relatedId: id, relatedType: 'Project' } })
    .catch((e) => console.error('[ActivityLog] project update:', e));

  return project;
}

export async function deleteProject(id: string) {
  await getProjectById(id);
  await prisma.project.delete({ where: { id } });
}

export async function assignUser(projectId: string, input: AssignUserInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  if (!user.isActive) throw new AppError('Cannot assign an inactive user', 400, 'BAD_REQUEST');

  const existing = await prisma.projectAssignment.findUnique({
    where: { projectId_userId: { projectId, userId: input.userId } },
  });
  if (existing) throw new AppError('User is already assigned to this project', 409, 'CONFLICT');

  const assignment = await prisma.projectAssignment.create({
    data: { projectId, userId: input.userId, roleOnProject: input.roleOnProject },
    include: {
      user:    { select: { id: true, name: true, email: true, role: true } },
      project: { select: { id: true, name: true } },
    },
  });

  prisma.activityLog
    .create({ data: { type: 'ASSIGNMENT_CREATED', relatedId: assignment.id, relatedType: 'ProjectAssignment' } })
    .catch((e) => console.error('[ActivityLog] ASSIGNMENT_CREATED:', e));

  return assignment;
}

export async function unassignUser(projectId: string, userId: string) {
  const assignment = await prisma.projectAssignment.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!assignment) throw new AppError('Assignment not found', 404, 'NOT_FOUND');

  await prisma.projectAssignment.delete({ where: { projectId_userId: { projectId, userId } } });

  prisma.activityLog
    .create({ data: { type: 'ASSIGNMENT_REMOVED', relatedId: assignment.id, relatedType: 'ProjectAssignment' } })
    .catch((e) => console.error('[ActivityLog] ASSIGNMENT_REMOVED:', e));
}
