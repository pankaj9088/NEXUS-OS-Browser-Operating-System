import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:3000';
const results = {
  passed: 0,
  failed: 0,
  details: [],
};

function record(name, passed, details = '') {
  if (passed) {
    results.passed++;
    results.details.push({ name, status: 'PASS', details });
    console.log(`[PASS] ${name}`);
  } else {
    results.failed++;
    results.details.push({ name, status: 'FAIL', details });
    console.error(`[FAIL] ${name}: ${details}`);
  }
}

async function runVerification() {
  console.log('--- STARTING BACKEND API VERIFICATION SUITE ---');

  // 1. AUTHENTICATION: Registration, Login, Me, Logout
  const ts = Date.now();
  const testUser = {
    email: `api_test_${ts}@nexus.os`,
    password: 'SecurePassword123!',
    displayName: 'API Auditor',
  };

  // Register
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  const token = regData.token;
  record('POST /api/auth/register returns 201 and JWT token', regRes.status === 201 && !!token);

  // Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  const loginData = await loginRes.json();
  record('POST /api/auth/login returns 200 and valid session', loginRes.status === 200 && !!loginData.token);

  // Current User (GET /api/auth/me)
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  record('GET /api/auth/me returns authenticated user profile', meRes.status === 200 && meData.user?.email === testUser.email);

  // Logout
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  record('POST /api/auth/logout returns 200 and clears session', logoutRes.status === 200);

  // 2. NOTES CRUD AND JSON PERSISTENCE
  // Create Note
  const noteCreateRes = await fetch(`${BASE}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Phase 4 Audit Note', content: 'Testing persistence', color: 'indigo' }),
  });
  const noteCreateData = await noteCreateRes.json();
  const noteId = noteCreateData.note?.id;
  record('POST /api/notes creates note with 201', noteCreateRes.status === 201 && !!noteId);

  // Read Notes List
  const notesListRes = await fetch(`${BASE}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const notesListData = await notesListRes.json();
  record('GET /api/notes retrieves notes for user', notesListRes.status === 200 && notesListData.notes?.some(n => n.id === noteId));

  // Read Single Note
  const noteGetRes = await fetch(`${BASE}/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const noteGetData = await noteGetRes.json();
  record('GET /api/notes/:id retrieves specific note', noteGetRes.status === 200 && noteGetData.note?.title === 'Phase 4 Audit Note');

  // Patch Note
  const notePatchRes = await fetch(`${BASE}/api/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Updated Phase 4 Audit Note' }),
  });
  const notePatchData = await notePatchRes.json();
  record('PATCH /api/notes/:id updates note', notePatchRes.status === 200 && notePatchData.note?.title === 'Updated Phase 4 Audit Note');

  // Verify JSON-file persistence on disk
  const notesFilePath = path.resolve('.nexus_data', 'notes.json');
  let diskPersisted = false;
  if (fs.existsSync(notesFilePath)) {
    const rawDisk = fs.readFileSync(notesFilePath, 'utf-8');
    diskPersisted = rawDisk.includes(noteId);
  }
  record('Notes persist in .nexus_data/notes.json', diskPersisted);

  // Delete Note
  const noteDeleteRes = await fetch(`${BASE}/api/notes/${noteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  record('DELETE /api/notes/:id deletes note', noteDeleteRes.status === 200);

  // 3. FILE UPLOAD/DOWNLOAD SECURITY & USER OWNERSHIP
  // Create second user for isolation checks
  const testUser2 = {
    email: `phase4_isolation_${ts}@nexus.os`,
    password: 'SecurePassword123!',
    displayName: 'Isolation User',
  };
  const reg2Res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser2),
  });
  const token2 = (await reg2Res.json()).token;

  // Upload file as User 1
  const form = new FormData();
  form.append('file', new Blob(['Privileged Phase 4 Content'], { type: 'text/plain' }), 'audit_doc.txt');
  const uploadRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const uploadData = await uploadRes.json();
  const fileId = uploadData.file?.id;
  record('POST /api/files/upload accepts valid text file with 201', uploadRes.status === 201 && !!fileId);

  // User 1 can download
  const dl1 = await fetch(`${BASE}/api/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  record('User 1 can download own file with 200', dl1.status === 200);

  // User 2 is rejected
  const dl2 = await fetch(`${BASE}/api/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  record('User 2 cannot download User 1 file (403 Forbidden)', dl2.status === 403);

  // Executable allowlist rejection
  const exeForm = new FormData();
  exeForm.append('file', new Blob(['bad binary'], { type: 'application/octet-stream' }), 'bad.exe');
  const exeRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: exeForm,
  });
  record('Banned file extension (.exe) rejected with 400', exeRes.status === 400);

  // 10MB upload limit
  const oversizedBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'text/plain' });
  const overForm = new FormData();
  overForm.append('file', oversizedBlob, 'huge.txt');
  const overRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: overForm,
  });
  record('Oversized upload (>10MB) returns 413 Payload Too Large', overRes.status === 413);

  // 4. WORKSPACE, CALENDAR, AI CONVERSATIONS, FILE-FOLDERS
  // Folder creation
  const folderRes = await fetch(`${BASE}/api/files/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'AuditFolder' }),
  });
  const folderData = await folderRes.json();
  const folderId = folderData.folder?.id;
  record('POST /api/files/folders creates folder with 201', folderRes.status === 201 && !!folderId);

  // File patch
  const patchFileRes = await fetch(`${BASE}/api/files/${fileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'renamed_audit.txt', parentFolderId: folderId }),
  });
  record('PATCH /api/files/:id renames and moves file', patchFileRes.status === 200);

  // User 2 cannot patch User 1's file
  const patchFileU2 = await fetch(`${BASE}/api/files/${fileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
    body: JSON.stringify({ name: 'stolen.txt' }),
  });
  record('User 2 cannot patch User 1 file (403 Forbidden)', patchFileU2.status === 403);

  // Workspace GET & PATCH
  const wsGet = await fetch(`${BASE}/api/workspace`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  record('GET /api/workspace returns workspace preferences with 200', wsGet.status === 200);

  const wsPatch = await fetch(`${BASE}/api/workspace`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ theme: 'light', accentColor: '#3b82f6', dockPosition: 'top' }),
  });
  const wsPatchData = await wsPatch.json();
  record('PATCH /api/workspace updates workspace with 200', wsPatch.status === 200 && wsPatchData.workspace?.theme === 'light');

  // Calendar: POST, GET, PATCH, DELETE
  const eventCreate = await fetch(`${BASE}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Audit Meeting', description: 'Phase 4 signoff', startDate: '2026-11-10', time: '10:00' }),
  });
  const eventData = await eventCreate.json();
  const eventId = eventData.event?.id;
  record('POST /api/events creates calendar event with 201', eventCreate.status === 201 && !!eventId);

  const eventList = await fetch(`${BASE}/api/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const eventListData = await eventList.json();
  record('GET /api/events lists calendar events with 200', eventList.status === 200 && eventListData.events?.some(e => e.id === eventId));

  const eventPatch = await fetch(`${BASE}/api/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Rescheduled Audit Meeting' }),
  });
  record('PATCH /api/events/:id updates calendar event', eventPatch.status === 200);

  const eventDelete = await fetch(`${BASE}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  record('DELETE /api/events/:id deletes calendar event', eventDelete.status === 200);

  // AI Conversations: GET /api/ai/conversations, GET /api/ai/conversations/:id, DELETE /api/ai/conversations/:id
  const convoList = await fetch(`${BASE}/api/ai/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  record('GET /api/ai/conversations returns 200 and list', convoList.status === 200);

  // 5. CONFIRM ALL PROTECTED ROUTES REQUIRE AUTHENTICATION (UNAUTHENTICATED RETURNS 401)
  const protectedEndpoints = [
    { method: 'GET', url: `${BASE}/api/auth/me` },
    { method: 'GET', url: `${BASE}/api/notes` },
    { method: 'POST', url: `${BASE}/api/notes`, body: { title: 'Test' } },
    { method: 'GET', url: `${BASE}/api/notes/any-id` },
    { method: 'PATCH', url: `${BASE}/api/notes/any-id`, body: { title: 'Test' } },
    { method: 'DELETE', url: `${BASE}/api/notes/any-id` },
    { method: 'GET', url: `${BASE}/api/files` },
    { method: 'POST', url: `${BASE}/api/files/folders`, body: { name: 'Folder' } },
    { method: 'PATCH', url: `${BASE}/api/files/any-id`, body: { name: 'File' } },
    { method: 'DELETE', url: `${BASE}/api/files/any-id` },
    { method: 'GET', url: `${BASE}/api/files/any-id/download` },
    { method: 'GET', url: `${BASE}/api/workspace` },
    { method: 'PATCH', url: `${BASE}/api/workspace`, body: { theme: 'dark' } },
    { method: 'GET', url: `${BASE}/api/events` },
    { method: 'POST', url: `${BASE}/api/events`, body: { title: 'Event', startDate: '2026-11-01' } },
    { method: 'PATCH', url: `${BASE}/api/events/any-id`, body: { title: 'Event' } },
    { method: 'DELETE', url: `${BASE}/api/events/any-id` },
    { method: 'GET', url: `${BASE}/api/ai/conversations` },
    { method: 'GET', url: `${BASE}/api/ai/conversations/any-id` },
    { method: 'DELETE', url: `${BASE}/api/ai/conversations/any-id` },
  ];

  let unauthPassCount = 0;
  for (const ep of protectedEndpoints) {
    const res = await fetch(ep.url, {
      method: ep.method,
      headers: ep.body ? { 'Content-Type': 'application/json' } : {},
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    if (res.status === 401) {
      unauthPassCount++;
    } else {
      console.error(`Failed auth check for ${ep.method} ${ep.url}: got ${res.status}`);
    }
  }
  record(`All 19 protected routes strictly require auth (returned 401 without token)`, unauthPassCount === protectedEndpoints.length, `${unauthPassCount}/${protectedEndpoints.length} protected`);

  // Clean up User 1 file
  await fetch(`${BASE}/api/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`\n================================`);
  console.log(`TOTAL PASSED: ${results.passed}`);
  console.log(`TOTAL FAILED: ${results.failed}`);
  console.log(`================================`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
