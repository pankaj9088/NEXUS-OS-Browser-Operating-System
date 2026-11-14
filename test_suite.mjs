// Automated Security & API Regression Test Suite for NEXUS OS
const BASE = 'http://127.0.0.1:3000';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 NEXUS OS BACKEND AUDIT & REGRESSION TEST SUITE');
  console.log('====================================================\n');

  // --- SETUP: Create two distinct users ---
  const timestamp = Date.now();
  const u1Email = `sec_user1_${timestamp}@nexus.os`;
  const u2Email = `sec_user2_${timestamp}@nexus.os`;

  const reg1 = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: u1Email, password: 'password123', displayName: 'Security Tester 1' }),
  }).then((r) => r.json());
  const token1 = reg1.token;

  const reg2 = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: u2Email, password: 'password456', displayName: 'Security Tester 2' }),
  }).then((r) => r.json());
  const token2 = reg2.token;

  assert(!!token1 && !!token2, 'User Registration & Token Issuance', `Token1: ${!!token1}, Token2: ${!!token2}`);

  // ==========================================
  // SECTION 1: FILE SECURITY & ISOLATION TESTS
  // ==========================================
  console.log('\n--- [STEP 1] File Upload Security & Download Authorization ---');

  // 1.1 Upload valid text file by User 1
  const form1 = new FormData();
  form1.append('file', new Blob(['Top Secret User 1 Document Content'], { type: 'text/plain' }), 'user1_confidential.txt');

  const upload1Res = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: form1,
  });
  const upload1Data = await upload1Res.json();
  const file1Id = upload1Data.file?.id;

  assert(upload1Res.status === 201 && !!file1Id, 'User 1 valid file upload returns 201', `Status: ${upload1Res.status}`);

  // 1.2 User 1 can download own file
  const dl1Res = await fetch(`${BASE}/api/files/${file1Id}/download`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const dl1Text = await dl1Res.text();
  assert(dl1Res.status === 200 && dl1Text.includes('Top Secret'), 'User 1 can download own file', `Status: ${dl1Res.status}`);

  // 1.3 User 2 CANNOT download User 1's file (Strict ownership verification)
  const dl2Res = await fetch(`${BASE}/api/files/${file1Id}/download`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  assert(dl2Res.status === 403, 'User 2 download attempt on User 1 file returns 403 Forbidden', `Status: ${dl2Res.status}`);

  // 1.4 User 2 CANNOT delete User 1's file
  const del2Res = await fetch(`${BASE}/api/files/${file1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token2}` },
  });
  assert(del2Res.status === 403, 'User 2 delete attempt on User 1 file returns 403 Forbidden', `Status: ${del2Res.status}`);

  // 1.5 Banned executable upload rejected (.exe)
  const exeForm = new FormData();
  exeForm.append('file', new Blob(['MZ\x90\x00executable_bytes'], { type: 'application/octet-stream' }), 'malware.exe');
  const exeRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: exeForm,
  });
  const exeData = await exeRes.json();
  assert(exeRes.status === 400 && exeData.error.includes('blocked'), 'Executable upload (.exe) blocked with 400 Bad Request', `Status: ${exeRes.status}`);

  // 1.6 Banned script upload rejected (.sh)
  const shForm = new FormData();
  shForm.append('file', new Blob(['#!/bin/bash\necho dangerous'], { type: 'text/x-shellscript' }), 'script.sh');
  const shRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: shForm,
  });
  assert(shRes.status === 400, 'Shell script upload (.sh) blocked with 400 Bad Request', `Status: ${shRes.status}`);

  // 1.7 Enforce 10MB upload limit with HTTP 413
  const oversizedBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'text/plain' });
  const overForm = new FormData();
  overForm.append('file', oversizedBlob, 'huge_document.txt');
  const overRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: overForm,
  });
  const overData = await overRes.json();
  assert(overRes.status === 413, 'Oversized upload (>10MB) returns HTTP 413 Payload Too Large', `Status: ${overRes.status}, Error: ${overData.error}`);

  // ==========================================
  // SECTION 2: FOLDER MANAGEMENT & FILE PATCH
  // ==========================================
  console.log('\n--- [STEP 2A] Folder Creation and File Patching ---');

  // 2.1 POST /api/files/folders
  const folderRes = await fetch(`${BASE}/api/files/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ name: 'Projects' }),
  });
  const folderData = await folderRes.json();
  const folderId = folderData.folder?.id;
  assert(folderRes.status === 201 && folderData.folder?.isFolder === true, 'Create virtual folder returns 201 Created', `Status: ${folderRes.status}`);

  // 2.2 PATCH /api/files/:id (User 1 renames file)
  const patchRes = await fetch(`${BASE}/api/files/${file1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ name: 'renamed_document.txt', parentFolderId: folderId }),
  });
  const patchData = await patchRes.json();
  assert(patchRes.status === 200 && patchData.file?.name === 'renamed_document.txt' && patchData.file?.parentFolderId === folderId, 'User 1 can rename and move file (PATCH returns 200)', `Status: ${patchRes.status}`);

  // 2.3 User 2 CANNOT patch User 1's file
  const patch2Res = await fetch(`${BASE}/api/files/${file1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
    body: JSON.stringify({ name: 'hijacked.txt' }),
  });
  assert(patch2Res.status === 403, 'User 2 patch attempt on User 1 file returns 403 Forbidden', `Status: ${patch2Res.status}`);

  // ==========================================
  // SECTION 3: WORKSPACE PREFERENCES APIS
  // ==========================================
  console.log('\n--- [STEP 2B] Workspace Endpoints (GET, PATCH) ---');

  // 3.1 GET /api/workspace
  const wsGetRes = await fetch(`${BASE}/api/workspace`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const wsGetData = await wsGetRes.json();
  assert(wsGetRes.status === 200 && wsGetData.workspace?.theme === 'dark', 'GET /api/workspace returns user workspace', `Status: ${wsGetRes.status}`);

  // 3.2 PATCH /api/workspace
  const wsPatchRes = await fetch(`${BASE}/api/workspace`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      theme: 'light',
      accentColor: '#10b981',
      dockPosition: 'top',
      soundEnabled: false,
    }),
  });
  const wsPatchData = await wsPatchRes.json();
  assert(
    wsPatchRes.status === 200 &&
    wsPatchData.workspace?.theme === 'light' &&
    wsPatchData.workspace?.accentColor === '#10b981' &&
    wsPatchData.workspace?.dockPosition === 'top',
    'PATCH /api/workspace updates preferences',
    `Status: ${wsPatchRes.status}`
  );

  // 3.3 Confirm persistence for User 1 vs User 2 isolation
  const wsUser2Get = await fetch(`${BASE}/api/workspace`, {
    headers: { Authorization: `Bearer ${token2}` },
  }).then((r) => r.json());
  assert(wsUser2Get.workspace?.theme === 'dark', 'User 2 workspace is unaffected by User 1 updates (Isolation)', `Theme: ${wsUser2Get.workspace?.theme}`);

  // ==========================================
  // SECTION 4: EVENTS / CALENDAR APIS
  // ==========================================
  console.log('\n--- [STEP 2C] Calendar & Events Endpoints (GET, POST, PATCH, DELETE) ---');

  // 4.1 POST /api/events
  const eventCreateRes = await fetch(`${BASE}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      title: 'Architectural Review',
      description: 'Discuss full stack OS design',
      startDate: '2026-11-01',
      time: '14:30',
      category: 'work',
    }),
  });
  const eventCreateData = await eventCreateRes.json();
  const eventId = eventCreateData.event?.id;
  assert(eventCreateRes.status === 201 && !!eventId, 'POST /api/events creates new event', `Status: ${eventCreateRes.status}`);

  // 4.2 GET /api/events
  const eventListRes = await fetch(`${BASE}/api/events`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const eventListData = await eventListRes.json();
  assert(eventListRes.status === 200 && eventListData.events.some((e) => e.id === eventId), 'GET /api/events lists user events', `Count: ${eventListData.events.length}`);

  // 4.3 User 2 cannot see User 1's events
  const eventList2 = await fetch(`${BASE}/api/events`, {
    headers: { Authorization: `Bearer ${token2}` },
  }).then((r) => r.json());
  assert(!eventList2.events.some((e) => e.id === eventId), 'User 2 cannot see User 1 events (Calendar Isolation)');

  // 4.4 PATCH /api/events/:id
  const eventPatchRes = await fetch(`${BASE}/api/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ title: 'Architectural Review (Rescheduled)', time: '16:00' }),
  });
  const eventPatchData = await eventPatchRes.json();
  assert(eventPatchRes.status === 200 && eventPatchData.event?.time === '16:00', 'PATCH /api/events/:id updates event', `Status: ${eventPatchRes.status}`);

  // 4.5 User 2 cannot modify User 1's event
  const eventPatch2 = await fetch(`${BASE}/api/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
    body: JSON.stringify({ title: 'Hijacked Event' }),
  });
  assert(eventPatch2.status === 403, 'User 2 PATCH on User 1 event returns 403 Forbidden', `Status: ${eventPatch2.status}`);

  // 4.6 DELETE /api/events/:id
  const eventDelRes = await fetch(`${BASE}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(eventDelRes.status === 200, 'DELETE /api/events/:id deletes event', `Status: ${eventDelRes.status}`);

  // ==========================================
  // SECTION 5: AI CONVERSATIONS APIS
  // ==========================================
  console.log('\n--- [STEP 2D] AI Conversations Endpoints ---');

  // 5.1 POST /api/ai/chat with tracking
  const chatRes = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      messages: [{ sender: 'user', text: 'List top features of Nexus OS' }],
      stream: false,
    }),
  });
  const chatData = await chatRes.json();
  assert(chatRes.status === 200 && !!chatData.text, 'POST /api/ai/chat returns AI response', `Status: ${chatRes.status}`);

  // 5.2 Create conversation directly in store to test GET & DELETE
  const testConvoId = `convo-${timestamp}`;
  const convoRes = await fetch(`${BASE}/api/ai/conversations`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const convoData = await convoRes.json();
  assert(convoRes.status === 200 && Array.isArray(convoData.conversations), 'GET /api/ai/conversations returns conversation list', `Status: ${convoRes.status}`);

  // ==========================================
  // SECTION 6: NOTES CRUD & GET /api/notes/:id
  // ==========================================
  console.log('\n--- [STEP 2E] Notes CRUD and Specific Note Retrieval ---');

  // 6.1 POST note
  const notePostRes = await fetch(`${BASE}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ title: 'System Kernel Note', content: 'Architecture v2 verified', color: 'cyan' }),
  });
  const notePostData = await notePostRes.json();
  const testNoteId = notePostData.note?.id;
  assert(notePostRes.status === 201 && !!testNoteId, 'POST /api/notes creates note', `Status: ${notePostRes.status}`);

  // 6.2 GET note by ID
  const noteGetOneRes = await fetch(`${BASE}/api/notes/${testNoteId}`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const noteGetOneData = await noteGetOneRes.json();
  assert(noteGetOneRes.status === 200 && noteGetOneData.note?.title === 'System Kernel Note', 'GET /api/notes/:id returns note', `Status: ${noteGetOneRes.status}`);

  // 6.3 User 2 cannot GET User 1's note by ID
  const noteGetOneU2 = await fetch(`${BASE}/api/notes/${testNoteId}`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  assert(noteGetOneU2.status === 403, 'User 2 GET /api/notes/:id returns 403 Forbidden (Note Privacy)', `Status: ${noteGetOneU2.status}`);

  // 6.4 Clean up note
  const noteDelRes = await fetch(`${BASE}/api/notes/${testNoteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(noteDelRes.status === 200, 'DELETE /api/notes/:id deletes note', `Status: ${noteDelRes.status}`);

  // Clean up User 1 file
  await fetch(`${BASE}/api/files/${file1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });

  // ==========================================
  // SUMMARY RESULTS
  // ==========================================
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
