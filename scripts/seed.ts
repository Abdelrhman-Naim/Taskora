import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { ensureUserProfile } from '../src/services/auth';
import { createProject } from '../src/services/projects';
import { addMember } from '../src/services/members';
import { createTask, updateTask } from '../src/services/tasks';
import { addComment } from '../src/services/comments';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

process.env.WRITE_TIMEOUT = '30000';

interface SeedConfig {
  useEmulator: boolean;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'fake-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-taskflow.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-taskflow',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-taskflow.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

async function getOrCreateUser(
  auth: ReturnType<typeof getAuth>,
  db: ReturnType<typeof getFirestore>,
  email: string,
  pass: string,
  displayName: string
) {
  let uid = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    uid = cred.user.uid;
    await updateProfile(cred.user, { displayName });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'auth/email-already-in-use'
    ) {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      uid = cred.user.uid;
    } else {
      throw err;
    }
  }

  await ensureUserProfile(db, { uid, email, displayName });
  return { uid, displayName, email: email.toLowerCase().trim() };
}

export async function runSeed(config: SeedConfig) {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (config.useEmulator) {
    console.log('Connecting seed runner to Firebase Emulators...');
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
  }

  console.log('Seeding demo users...');
  const member = await getOrCreateUser(
    auth,
    db,
    'member@example.test',
    'Password123!',
    'Member User'
  );
  console.log(`Member created: ${member.email} (${member.uid})`);

  const owner = await getOrCreateUser(
    auth,
    db,
    'owner@example.test',
    'Password123!',
    'Owner User'
  );
  console.log(`Owner created: ${owner.email} (${owner.uid})`);

  // Sign back in as owner to perform project & task creation
  await signInWithEmailAndPassword(auth, owner.email, 'Password123!');

  console.log('Seeding project "Website Redesign"...');
  const projectId = await createProject(
    db,
    { uid: owner.uid, displayName: owner.displayName },
    {
      name: 'Website Redesign',
      description: 'Redesign company website with modern responsive UI and team collaboration',
    }
  );
  console.log(`Project created with ID: ${projectId}`);

  console.log('Adding member to project...');
  await addMember(db, projectId, member.email, {
    actor: { uid: owner.uid, displayName: owner.displayName },
  });

  console.log('Seeding Appendix A tasks with Phase 6 enhancements...');

  // Task 1: Build navbar (todo, high, assigned to member, weekly recurring, checklist & labels)
  const task1Input = {
    title: 'Build navbar',
    description: 'Create responsive top navbar component',
    priority: 'high' as const,
    assigneeId: member.uid,
    dueDate: '2026-10-25',
    labels: ['Frontend', 'UI'],
    recurrence: 'weekly' as const,
    checklist: [
      { id: 'chk-1', text: 'Design mobile drawer', done: true },
      { id: 'chk-2', text: 'Implement accessible keyboard navigation', done: false },
      { id: 'chk-3', text: 'Verify dark mode contrast', done: false },
    ],
  };
  const task1Id = await createTask(
    db,
    projectId,
    owner.uid,
    task1Input,
    { actor: { uid: owner.uid, displayName: owner.displayName } }
  );

  // Add a comment on Task 1 from owner
  await addComment(
    db,
    projectId,
    task1Id,
    {
      actor: { uid: owner.uid, displayName: owner.displayName },
      task: {
        id: task1Id,
        projectId,
        createdBy: owner.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'todo',
        ...task1Input,
      },
      projectName: 'Website Redesign',
    },
    'Please verify that all focus rings meet WCAG 2.2 AA contrast!'
  );

  // Task 2: Fix overdue bug (todo, high, assigned to member, due yesterday)
  await createTask(
    db,
    projectId,
    owner.uid,
    {
      title: 'Fix overdue bug',
      description: 'Critical authentication bug in navbar',
      priority: 'high',
      assigneeId: member.uid,
      dueDate: '2026-10-16',
      labels: ['Bug', 'Auth'],
      checklist: [],
      recurrence: 'none',
    },
    { actor: { uid: owner.uid, displayName: owner.displayName } }
  );

  // Task 3: Setup Database (in_progress, medium, assigned to member)
  const task3Input = {
    title: 'Setup Database',
    description: 'Configure Firestore collections',
    priority: 'medium' as const,
    assigneeId: member.uid,
    dueDate: '2026-10-30',
    labels: ['Backend'],
    checklist: [
      { id: 'chk-31', text: 'Review security rules', done: true },
      { id: 'chk-32', text: 'Deploy indexes', done: true },
    ],
    recurrence: 'none' as const,
  };
  const task3Id = await createTask(
    db,
    projectId,
    owner.uid,
    task3Input,
    { actor: { uid: owner.uid, displayName: owner.displayName } }
  );

  // Switch to member to update status of Task 3 and add a comment
  await signInWithEmailAndPassword(auth, member.email, 'Password123!');
  await updateTask(
    db,
    projectId,
    task3Id,
    { status: 'in_progress' },
    {
      actor: { uid: member.uid, displayName: member.displayName },
      task: {
        id: task3Id,
        projectId,
        createdBy: owner.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'todo',
        ...task3Input,
      },
    }
  );

  await addComment(
    db,
    projectId,
    task3Id,
    {
      actor: { uid: member.uid, displayName: member.displayName },
      task: {
        id: task3Id,
        projectId,
        createdBy: owner.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'in_progress',
        ...task3Input,
      },
      projectName: 'Website Redesign',
    },
    'Collections initialized in emulator, progressing smoothly.'
  );

  // Task 4: Write Documentation (done, low, unassigned)
  await signInWithEmailAndPassword(auth, owner.email, 'Password123!');
  const task4Input = {
    title: 'Write Documentation',
    description: 'API and system architecture docs',
    priority: 'low' as const,
    assigneeId: null,
    dueDate: '2026-10-10',
    labels: ['Docs'],
    checklist: [],
    recurrence: 'none' as const,
  };
  const task4Id = await createTask(
    db,
    projectId,
    owner.uid,
    task4Input,
    { actor: { uid: owner.uid, displayName: owner.displayName } }
  );
  await updateTask(
    db,
    projectId,
    task4Id,
    { status: 'done' },
    {
      actor: { uid: owner.uid, displayName: owner.displayName },
      task: {
        id: task4Id,
        projectId,
        createdBy: owner.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'todo',
        ...task4Input,
      },
    }
  );

  console.log('Seed completed successfully with Phase 6 features!');
  return { projectId, owner, member };
}

if (process.argv[1]?.includes('seed.ts')) {
  const isEmulator =
    process.argv.includes('--emulator') ||
    process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' ||
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  runSeed({ useEmulator: isEmulator })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
