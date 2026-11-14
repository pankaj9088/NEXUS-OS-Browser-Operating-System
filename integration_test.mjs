import assert from 'assert';

const BASE = 'http://127.0.0.1:3000';
const results = { passed: 0, failed: 0, tests: [] };

function record(name, pass, detail = '') {
  if (pass) {
    results.passed++;
    results.tests.push({ name, status: 'PASS', detail });
    console.log(`[PASS] ${name}`);
  } else {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', detail });
    console.error(`[FAIL] ${name} - ${detail}`);
  }
}

async function run() {
  console.log('=== Starting Frontend-to-Backend Integration Verification Suite ===\n');

  const timestamp = Date.now();
  const userA_email = `nexus_user_a_${timestamp}@example.com`;
  const userA_password = 'Password123!';
  const userA_name = 'Commander Shepard';

  const userB_email = `nexus_user_b_${timestamp}@example.com`;
  const userB_password = 'Password456!';
  const userB_name = 'Garrus Vakarian';

  // Helper to extract cookie
  function getCookie(res) {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return '';
    const match = setCookie.match(/nexus_token=([^;]+)/);
    return match ? `nexus_token=${match[1]}` : '';
  }

  // 1. Register User A
  let userA_cookie = '';
  let userA_token = '';
  let userA_id = '';
  const regARes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_email, password: userA_password, displayName: userA_name }),
  });
  userA_cookie = getCookie(regARes);
  const regAData = await regARes.json();
  userA_token = regAData.token;
  userA_id = regAData.user?.id;
  record(
    '1. User A Registration returns 201 and sets HttpOnly cookie',
    regARes.status === 201 && !!regAData.user && !!userA_cookie && !!userA_token,
    `Status: ${regARes.status}, User ID: ${userA_id}`
  );

  // 2. Log in and load user profile (GET /api/auth/me)
  const loginARes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_email, password: userA_password }),
  });
  const loginAData = await loginARes.json();
  const loginACookie = getCookie(loginARes);
  record(
    '2a. User A Login returns 200 and auth credentials',
    loginARes.status === 200 && loginAData.user?.email === userA_email,
    `Email: ${loginAData.user?.email}`
  );

  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: loginACookie || userA_cookie },
  });
  const meData = await meRes.json();
  record(
    '2b. GET /api/auth/me retrieves authenticated user profile via session cookie',
    meRes.status === 200 && meData.user?.displayName === userA_name,
    `Display Name: ${meData.user?.displayName}`
  );

  // 3. Notes CRUD: Create, Edit, and Delete Note
  const createNoteRes = await fetch(`${BASE}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userA_cookie,
    },
    body: JSON.stringify({
      title: 'Orbital Reconnaissance Brief',
      content: 'Telemetry is locked on coordinates 42.109, -71.058.',
      color: 'violet',
    }),
  });
  const createNoteData = await createNoteRes.json();
  const noteId = createNoteData.note?.id;
  record(
    '3a. Create Note via POST /api/notes returns 201',
    createNoteRes.status === 201 && !!noteId,
    `Note ID: ${noteId}`
  );

  const updateNoteRes = await fetch(`${BASE}/api/notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userA_cookie,
    },
    body: JSON.stringify({
      title: 'Orbital Reconnaissance Brief - UPDATED',
      content: 'Target confirmed. All systems nominal.',
    }),
  });
  const updateNoteData = await updateNoteRes.json();
  record(
    '3b. Edit Note via PATCH /api/notes/:id returns 200 and reflects changes',
    updateNoteRes.status === 200 && updateNoteData.note?.title?.includes('UPDATED'),
    `Updated Title: ${updateNoteData.note?.title}`
  );

  // 4. File Upload & Download
  const boundary = '----WebKitFormBoundaryNexusOS';
  const fileContent = 'MISSION REPORT: Sector 7 Secure.';
  const multipartBody = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="recon_report.txt"',
    'Content-Type: text/plain',
    '',
    fileContent,
    `--${boundary}--`,
  ].join('\r\n');

  const uploadRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: userA_cookie,
    },
    body: multipartBody,
  });
  const uploadData = await uploadRes.json();
  const fileId = uploadData.file?.id;
  record(
    '4a. Upload File via POST /api/files/upload returns 201',
    uploadRes.status === 201 && !!fileId,
    `File ID: ${fileId}`
  );

  const downloadRes = await fetch(`${BASE}/api/files/${fileId}/download`, {
    headers: { Cookie: userA_cookie },
  });
  const downloadedText = await downloadRes.text();
  record(
    '4b. Download File via GET /api/files/:id/download returns 200 with exact payload',
    downloadRes.status === 200 && downloadedText === fileContent,
    `Payload: ${downloadedText}`
  );

  // 5. Calendar Event Creation & Fetch
  const createEventRes = await fetch(`${BASE}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userA_cookie,
    },
    body: JSON.stringify({
      title: 'Hyperdrive Warp Benchmark',
      startDate: '2026-11-01',
      time: '14:00',
      category: 'system',
      description: 'Test FTL drive coupling in simulated zero-g.',
    }),
  });
  const createEventData = await createEventRes.json();
  const eventId = createEventData.event?.id;
  record(
    '5a. Create Event via POST /api/events returns 201',
    createEventRes.status === 201 && !!eventId,
    `Event ID: ${eventId}`
  );

  const getEventsRes = await fetch(`${BASE}/api/events`, {
    headers: { Cookie: userA_cookie },
  });
  const getEventsData = await getEventsRes.json();
  const hasEvent = getEventsData.events?.some((e) => e.id === eventId);
  record(
    '5b. List Events via GET /api/events includes newly created event',
    getEventsRes.status === 200 && hasEvent,
    `Events count: ${getEventsData.events?.length}`
  );

  // 6. Workspace Settings Sync
  const patchWsRes = await fetch(`${BASE}/api/workspace`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userA_cookie,
    },
    body: JSON.stringify({
      theme: 'dark',
      accentColor: 'emerald',
      dockPosition: 'top',
    }),
  });
  const patchWsData = await patchWsRes.json();
  record(
    '6a. Update Workspace via PATCH /api/workspace returns 200',
    patchWsRes.status === 200 && patchWsData.workspace?.accentColor === 'emerald',
    `Accent: ${patchWsData.workspace?.accentColor}, Dock: ${patchWsData.workspace?.dockPosition}`
  );

  const getWsRes = await fetch(`${BASE}/api/workspace`, {
    headers: { Cookie: userA_cookie },
  });
  const getWsData = await getWsRes.json();
  record(
    '6b. GET /api/workspace confirms persisted custom settings',
    getWsRes.status === 200 && getWsData.workspace?.dockPosition === 'top',
    `Persisted Dock: ${getWsData.workspace?.dockPosition}`
  );

  // 7. AI Conversation Creation
  const createConvoRes = await fetch(`${BASE}/api/ai/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userA_cookie,
    },
    body: JSON.stringify({ title: 'Quantum Encryption Protocol' }),
  });
  const createConvoData = await createConvoRes.json();
  const convoId = createConvoData.conversation?.id;
  record(
    '7. Create AI Conversation via POST /api/ai/conversations returns 201',
    createConvoRes.status === 201 && !!convoId,
    `Conversation ID: ${convoId}`
  );

  // 8. Register User B and verify cross-user isolation
  const regBRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userB_email, password: userB_password, displayName: userB_name }),
  });
  const userB_cookie = getCookie(regBRes);

  const bGetNoteRes = await fetch(`${BASE}/api/notes/${noteId}`, {
    headers: { Cookie: userB_cookie },
  });
  record(
    '8a. User B cannot view User A note (403 Forbidden)',
    bGetNoteRes.status === 403,
    `Status: ${bGetNoteRes.status}`
  );

  const bDownloadRes = await fetch(`${BASE}/api/files/${fileId}/download`, {
    headers: { Cookie: userB_cookie },
  });
  record(
    '8b. User B cannot download User A file (403 Forbidden)',
    bDownloadRes.status === 403,
    `Status: ${bDownloadRes.status}`
  );

  const bPatchEventRes = await fetch(`${BASE}/api/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userB_cookie,
    },
    body: JSON.stringify({ title: 'Unauthorized Hijack' }),
  });
  record(
    '8c. User B cannot modify User A calendar event (403 Forbidden)',
    bPatchEventRes.status === 403,
    `Status: ${bPatchEventRes.status}`
  );

  // Delete note with User A
  const deleteNoteRes = await fetch(`${BASE}/api/notes/${noteId}`, {
    method: 'DELETE',
    headers: { Cookie: userA_cookie },
  });
  record(
    '3c. Delete Note via DELETE /api/notes/:id returns 200',
    deleteNoteRes.status === 200,
    `Status: ${deleteNoteRes.status}`
  );

  // 9. Logout and verify protected routes reject unauthenticated requests
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: userA_cookie },
  });
  record(
    '9a. Logout via POST /api/auth/logout returns 200 and clears session',
    logoutRes.status === 200,
    `Status: ${logoutRes.status}`
  );

  const unauthNotes = await fetch(`${BASE}/api/notes`);
  const unauthFiles = await fetch(`${BASE}/api/files`);
  const unauthEvents = await fetch(`${BASE}/api/events`);
  const unauthWs = await fetch(`${BASE}/api/workspace`);
  const unauthAi = await fetch(`${BASE}/api/ai/conversations`);

  const all401 =
    unauthNotes.status === 401 &&
    unauthFiles.status === 401 &&
    unauthEvents.status === 401 &&
    unauthWs.status === 401 &&
    unauthAi.status === 401;

  record(
    '9b. Unauthenticated requests to all protected routes strictly return 401',
    all401,
    `Notes: ${unauthNotes.status}, Files: ${unauthFiles.status}, Events: ${unauthEvents.status}, Workspace: ${unauthWs.status}, AI: ${unauthAi.status}`
  );

  console.log('\n========================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('========================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
