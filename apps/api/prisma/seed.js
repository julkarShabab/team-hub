const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('Demo1234!', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.com' },
    update: {},
    create: {
      email: 'alice@demo.com',
      name: 'Alice Johnson',
      password: hashedPassword,
      avatarUrl: null,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: {
      email: 'bob@demo.com',
      name: 'Bob Smith',
      password: hashedPassword,
      avatarUrl: null,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@demo.com' },
    update: {},
    create: {
      email: 'carol@demo.com',
      name: 'Carol Williams',
      password: hashedPassword,
      avatarUrl: null,
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'FredoCloud Engineering',
      description: 'Main engineering team workspace',
      accentColor: '#6366f1',
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: carol.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create goals
  const goal1 = await prisma.goal.create({
    data: {
      workspaceId: workspace.id,
      ownerId: alice.id,
      title: 'Launch v2.0 Platform',
      description: 'Complete the redesign and launch the new platform version',
      status: 'ON_TRACK',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      milestones: {
        create: [
          { title: 'Design mockups approved', progress: 100, completed: true },
          { title: 'Backend API complete', progress: 75, completed: false },
          { title: 'Frontend implementation', progress: 40, completed: false },
          { title: 'QA & testing', progress: 0, completed: false },
        ],
      },
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      workspaceId: workspace.id,
      ownerId: bob.id,
      title: 'Improve API Performance',
      description: 'Reduce average response time by 40%',
      status: 'AT_RISK',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      milestones: {
        create: [
          { title: 'Profile slow queries', progress: 100, completed: true },
          { title: 'Add database indexes', progress: 60, completed: false },
          { title: 'Implement caching layer', progress: 20, completed: false },
        ],
      },
    },
  });

  // Create action items
  await prisma.actionItem.createMany({
    data: [
      {
        workspaceId: workspace.id,
        goalId: goal1.id,
        assigneeId: alice.id,
        title: 'Set up CI/CD pipeline',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        workspaceId: workspace.id,
        goalId: goal1.id,
        assigneeId: bob.id,
        title: 'Write API documentation',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        workspaceId: workspace.id,
        goalId: goal2.id,
        assigneeId: carol.id,
        title: 'Add Redis caching',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        workspaceId: workspace.id,
        assigneeId: carol.id,
        title: 'Update team onboarding docs',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Create announcements
  await prisma.announcement.create({
    data: {
      workspaceId: workspace.id,
      authorId: alice.id,
      title: '🚀 Welcome to Team Hub!',
      content: 'We are excited to launch our new collaborative workspace. Use this space to track goals, manage action items, and stay aligned as a team.',
      pinned: true,
    },
  });

  await prisma.announcement.create({
    data: {
      workspaceId: workspace.id,
      authorId: alice.id,
      title: 'Q1 Planning Session',
      content: 'Join us this Friday at 2pm for our Q1 planning session. Please review the current goals before the meeting.',
      pinned: false,
    },
  });

  // Add progress updates
  await prisma.progressUpdate.createMany({
    data: [
      {
        goalId: goal1.id,
        userId: alice.id,
        content: 'Design mockups have been approved by stakeholders. Moving to implementation phase.',
      },
      {
        goalId: goal1.id,
        userId: bob.id,
        content: 'Backend API endpoints for auth and workspaces are complete. Working on goals endpoints next.',
      },
      {
        goalId: goal2.id,
        userId: bob.id,
        content: 'Identified 3 slow queries causing bottlenecks. Adding indexes this week.',
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  alice@demo.com / Demo1234! (Admin)');
  console.log('  bob@demo.com   / Demo1234! (Member)');
  console.log('  carol@demo.com / Demo1234! (Member)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
