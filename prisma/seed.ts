/**
 * prisma/seed.ts
 *
 * Seed script for odkon-foundation development database.
 * Run with: npm run db:seed
 *
 * Demo credentials after seed:
 *   Admin:   admin@odkon.com   / Admin@1234
 *   Manager: manager@odkon.com / Manager@1234
 *   Staff:   staff@odkon.com   / Staff@1234
 */

import { PrismaClient, Role, ClientStatus, ProjectStatus, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  // ── Cleanup (order matters: respect FK constraints) ───────────────
  await prisma.activityLog.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing records\n');

  // ── Users ─────────────────────────────────────────────────────────
  const [adminHash, managerHash, staffHash] = await Promise.all([
    bcrypt.hash('Admin@1234', BCRYPT_ROUNDS),
    bcrypt.hash('Manager@1234', BCRYPT_ROUNDS),
    bcrypt.hash('Staff@1234', BCRYPT_ROUNDS),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@odkon.com',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });
  console.log(`  ✅ Admin    → ${admin.email}`);

  const manager = await prisma.user.create({
    data: {
      name: 'Jane Manager',
      email: 'manager@odkon.com',
      passwordHash: managerHash,
      role: Role.MANAGER,
    },
  });
  console.log(`  ✅ Manager  → ${manager.email}`);

  const staff = await prisma.user.create({
    data: {
      name: 'John Staff',
      email: 'staff@odkon.com',
      passwordHash: staffHash,
      role: Role.STAFF,
    },
  });
  console.log(`  ✅ Staff    → ${staff.email}`);

  // ── Clients ───────────────────────────────────────────────────────
  console.log('');
  const acme = await prisma.client.create({
    data: {
      companyName:  'Acme Corp',
      contactName:  'Alice Johnson',
      contactEmail: 'alice@acmecorp.com',
      contactPhone: '+1-555-0100',
      notes:  'Key enterprise client. Requires weekly progress updates and NDA in place.',
      status: ClientStatus.ACTIVE,
    },
  });
  console.log(`  ✅ Client   → ${acme.companyName} (ACTIVE)`);

  const globex = await prisma.client.create({
    data: {
      companyName:  'Globex Industries',
      contactName:  'Bob Smith',
      contactEmail: 'bob@globex.com',
      contactPhone: '+1-555-0200',
      notes:  'Mid-size manufacturing firm. ERP integration pending.',
      status: ClientStatus.ACTIVE,
    },
  });
  console.log(`  ✅ Client   → ${globex.companyName} (ACTIVE)`);

  const initech = await prisma.client.create({
    data: {
      companyName:  'Initech Solutions',
      contactName:  'Carol Williams',
      contactEmail: 'carol@initech.com',
      status: ClientStatus.LEAD,
      notes:  'Inbound lead from conference. Follow-up scheduled.',
    },
  });
  console.log(`  ✅ Client   → ${initech.companyName} (LEAD)`);

  // ── Projects ──────────────────────────────────────────────────────
  console.log('');
  const project1 = await prisma.project.create({
    data: {
      name: 'Acme Website Redesign',
      description:
        'Complete overhaul of the Acme Corp public-facing website including new brand identity, ' +
        'responsive design, and CMS integration.',
      status:    ProjectStatus.IN_PROGRESS,
      startDate: new Date('2026-06-01'),
      endDate:   new Date('2026-08-31'),
      budget:    25000,
      clientId:    acme.id,
      createdById: admin.id,
    },
  });
  console.log(`  ✅ Project  → ${project1.name} (IN_PROGRESS)`);

  const project2 = await prisma.project.create({
    data: {
      name: 'Globex ERP Integration',
      description:
        'Integrate Globex Industries existing systems with their new ERP platform via REST API. ' +
        'Includes data migration and staff training.',
      status:    ProjectStatus.PLANNING,
      startDate: new Date('2026-08-01'),
      endDate:   new Date('2026-12-31'),
      budget:    75000,
      clientId:    globex.id,
      createdById: manager.id,
    },
  });
  console.log(`  ✅ Project  → ${project2.name} (PLANNING)`);

  const project3 = await prisma.project.create({
    data: {
      name: 'Acme Mobile App (Phase 1)',
      description: 'Native mobile application for Acme Corp field staff — iOS and Android.',
      status:    ProjectStatus.ON_HOLD,
      startDate: new Date('2026-09-01'),
      budget:    40000,
      clientId:    acme.id,
      createdById: admin.id,
    },
  });
  console.log(`  ✅ Project  → ${project3.name} (ON_HOLD)`);

  // ── Project Assignments ───────────────────────────────────────────
  console.log('');
  await prisma.projectAssignment.createMany({
    data: [
      { projectId: project1.id, userId: manager.id, roleOnProject: 'Project Lead' },
      { projectId: project1.id, userId: staff.id,   roleOnProject: 'Front-end Developer' },
      { projectId: project2.id, userId: manager.id, roleOnProject: 'Solutions Architect' },
    ],
  });
  console.log(`  ✅ Assignments created for ${project1.name} and ${project2.name}`);

  // ── Activity Logs ─────────────────────────────────────────────────
  console.log('');
  await prisma.activityLog.createMany({
    data: [
      { type: ActivityType.USER_ADDED,      relatedId: admin.id,    relatedType: 'User' },
      { type: ActivityType.USER_ADDED,      relatedId: manager.id,  relatedType: 'User' },
      { type: ActivityType.USER_ADDED,      relatedId: staff.id,    relatedType: 'User' },
      { type: ActivityType.CLIENT_ADDED,    relatedId: acme.id,     relatedType: 'Client' },
      { type: ActivityType.CLIENT_ADDED,    relatedId: globex.id,   relatedType: 'Client' },
      { type: ActivityType.CLIENT_ADDED,    relatedId: initech.id,  relatedType: 'Client' },
      { type: ActivityType.PROJECT_CREATED, relatedId: project1.id, relatedType: 'Project' },
      { type: ActivityType.PROJECT_CREATED, relatedId: project2.id, relatedType: 'Project' },
      { type: ActivityType.PROJECT_CREATED, relatedId: project3.id, relatedType: 'Project' },
    ],
  });
  console.log('  ✅ Activity logs seeded');

  // ── Summary ───────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────');
  console.log('🎉 Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Admin:   admin@odkon.com   / Admin@1234');
  console.log('  Manager: manager@odkon.com / Manager@1234');
  console.log('  Staff:   staff@odkon.com   / Staff@1234');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
