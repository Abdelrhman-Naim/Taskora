// ============================================================================
// 1. IMPORTS
// ============================================================================
import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  deleteField,
  collection,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  HuddleParticipant,
  HuddleSession,
  UserPresence,
  WebRTCSignalData,
} from '@/types/chat';

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
export const HUDDLE_DOC_ID = 'active-huddle';

// ============================================================================
// 3. HUDDLE SESSION SERVICES
// ============================================================================

interface HuddleInjections {
  docFn?: typeof doc;
  setDocFn?: typeof setDoc;
  updateDocFn?: typeof updateDoc;
  deleteFieldFn?: typeof deleteField;
  nowFn?: () => Date;
}

/**
 * Joins or initiates a huddle room for a given project.
 */
export async function joinHuddleSession(
  db: Firestore,
  projectId: string,
  participant: HuddleParticipant,
  injections: HuddleInjections = {}
): Promise<void> {
  const docFn = injections.docFn || doc;
  const setDocFn = injections.setDocFn || setDoc;
  const nowFn = injections.nowFn || (() => new Date());

  const huddleRef = docFn(db, 'projects', projectId, 'huddles', HUDDLE_DOC_ID);
  const now = nowFn().toISOString();

  await setDocFn(
    huddleRef,
    {
      id: HUDDLE_DOC_ID,
      projectId,
      active: true,
      updatedAt: now,
      [`participants.${participant.uid}`]: {
        ...participant,
        joinedAt: now,
      },
    },
    { merge: true }
  );
}

/**
 * Updates an existing participant's audio, video, or screen sharing state.
 */
export async function updateMediaState(
  db: Firestore,
  projectId: string,
  uid: string,
  patch: Partial<Pick<HuddleParticipant, 'audioEnabled' | 'videoEnabled' | 'screenSharing'>>,
  injections: HuddleInjections = {}
): Promise<void> {
  const docFn = injections.docFn || doc;
  const updateDocFn = injections.updateDocFn || updateDoc;

  const huddleRef = docFn(db, 'projects', projectId, 'huddles', HUDDLE_DOC_ID);
  const updatePayload: Record<string, unknown> = {};

  if (patch.audioEnabled !== undefined) {
    updatePayload[`participants.${uid}.audioEnabled`] = patch.audioEnabled;
  }
  if (patch.videoEnabled !== undefined) {
    updatePayload[`participants.${uid}.videoEnabled`] = patch.videoEnabled;
  }
  if (patch.screenSharing !== undefined) {
    updatePayload[`participants.${uid}.screenSharing`] = patch.screenSharing;
  }

  await updateDocFn(huddleRef, updatePayload);
}

/**
 * Removes a participant from an active huddle.
 */
export async function leaveHuddleSession(
  db: Firestore,
  projectId: string,
  uid: string,
  injections: HuddleInjections = {}
): Promise<void> {
  const docFn = injections.docFn || doc;
  const updateDocFn = injections.updateDocFn || updateDoc;
  const deleteFieldFn = injections.deleteFieldFn || deleteField;

  const huddleRef = docFn(db, 'projects', projectId, 'huddles', HUDDLE_DOC_ID);

  await updateDocFn(huddleRef, {
    [`participants.${uid}`]: deleteFieldFn(),
  });
}

/**
 * Listens to active huddle session changes in Firestore.
 */
export function subscribeToHuddle(
  db: Firestore,
  projectId: string,
  onUpdate: (session: HuddleSession | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const huddleRef = doc(db, 'projects', projectId, 'huddles', HUDDLE_DOC_ID);

  return onSnapshot(
    huddleRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate(snapshot.data() as HuddleSession);
    },
    (err) => {
      onError?.(err);
    }
  );
}

// ============================================================================
// 4. PRESENCE SERVICES
// ============================================================================

export async function updateUserPresence(
  db: Firestore,
  projectId: string,
  presence: UserPresence
): Promise<void> {
  const presenceRef = doc(db, 'projects', projectId, 'presence', presence.uid);
  await setDoc(presenceRef, presence, { merge: true });
}

export function subscribeToPresence(
  db: Firestore,
  projectId: string,
  onUpdate: (presences: Record<string, UserPresence>) => void
): Unsubscribe {
  const presenceCol = collection(db, 'projects', projectId, 'presence');

  return onSnapshot(presenceCol, (snapshot) => {
    const presences: Record<string, UserPresence> = {};
    snapshot.forEach((d) => {
      presences[d.id] = d.data() as UserPresence;
    });
    onUpdate(presences);
  });
}

// ============================================================================
// 5. WEBRTC SIGNALING SERVICES
// ============================================================================

export async function sendWebRTCSignal(
  db: Firestore,
  projectId: string,
  signal: WebRTCSignalData
): Promise<void> {
  const signalsCol = collection(
    db,
    'projects',
    projectId,
    'huddles',
    HUDDLE_DOC_ID,
    'signals'
  );
  const newRef = doc(signalsCol);
  await setDoc(newRef, signal);
}

export function subscribeToSignals(
  db: Firestore,
  projectId: string,
  myUid: string,
  onSignal: (signal: WebRTCSignalData) => void
): Unsubscribe {
  const signalsCol = collection(
    db,
    'projects',
    projectId,
    'huddles',
    HUDDLE_DOC_ID,
    'signals'
  );

  return onSnapshot(signalsCol, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as WebRTCSignalData;
        if (data.toUid === myUid && data.fromUid !== myUid) {
          onSignal(data);
        }
      }
    });
  });
}
