/**
 * src/modules/dashboard/dashboard.service.ts
 */

import { prisma } from '../../config/db';

export async function getKPIs() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    totalActiveClients,
    totalActiveProjects,
    projectsByStatus,
    projectsDueSoon,
    recentClients,
    totalLeads,
  ] = await Promise.all([
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.project.count({ where: { status: { in: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'] } } }),
    prisma.project.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.project.findMany({
      where: {
        endDate: { gte: now, lte: thirtyDaysFromNow },
        status:  { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      select: {
        id: true, name: true, status: true, endDate: true,
        client:      { select: { id: true, companyName: true } },
        assignments: { select: { user: { select: { id: true, name: true } } }, take: 3 },
      },
      orderBy: { endDate: 'asc' },
    }),
    prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, companyName: true, contactName: true, status: true, createdAt: true },
    }),
    prisma.client.count({ where: { status: 'LEAD' } }),
  ]);

  const statusBreakdown = Object.fromEntries(
    projectsByStatus.map((g) => [g.status, g._count.status]),
  ) as Record<string, number>;

  const allStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  allStatuses.forEach((s) => { if (!(s in statusBreakdown)) statusBreakdown[s] = 0; });

  return {
    summary: { totalActiveClients, totalLeads, totalActiveProjects },
    projectsByStatus: statusBreakdown,
    projectsDueSoon,
    recentClients,
    generatedAt: now.toISOString(),
  };
}
