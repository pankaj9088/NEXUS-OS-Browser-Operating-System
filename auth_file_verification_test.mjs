// Verification test for BUG 1 (Upload Auth) and BUG 2 (File Deletion)
const BASE = 'http://127.0.0.1:3000';

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name} - ${details}`);
    failed++;
  }
}

async function run() {
  console.log('===============================================================');
  console.log('🧪 VERIFYING UPLOAD AUTH & FILE DELETION BUG FIXES');
  console.log('===============================================================\n');

  // --- TEST 1: Unauthenticated upload is rejected with 401 ---
  console.log('1. Testing unauthenticated upload rejection...');
  const formUnauth = new FormData();
  formUnauth.append('file', new Blob(['unauthenticated upload test'], { type: 'text/plain' }), 'unauth.txt');
  const resUnauthUp = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    body: formUnauth,
  });
  const dataUnauthUp = await resUnauthUp.json();
  assert(
    resUnauthUp.status === 401 && dataUnauthUp.error === 'Authentication required. No token provided.',
    'Unauthenticated upload returns HTTP 401 with "Authentication required. No token provided."',
    `Status: ${resUnauthUp.status}, Error: ${dataUnauthUp.error}`
  );

  // --- TEST 2: Unauthenticated delete is rejected with 401 ---
  console.log('2. Testing unauthenticated delete rejection...');
  const resUnauthDel = await fetch(`${BASE}/api/files/file-1792388935205-2325`, {
    method: 'DELETE',
  });
  const dataUnauthDel = await resUnauthDel.json();
  assert(
    resUnauthDel.status === 401 && dataUnauthDel.error === 'Authentication required. No token provided.',
    'Unauthenticated delete returns HTTP 401 with "Authentication required. No token provided."',
    `Status: ${resUnauthDel.status}, Error: ${dataUnauthDel.error}`
  );

  // --- TEST 3: User registration and token acquisition ---
  console.log('3. Registering primary user...');
  const ts = Date.now();
  const userEmail = `explorer_owner_${ts}@nexus.os`;
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: 'password123', displayName: 'Explorer Owner' }),
  });
  const regData = await regRes.json();
  const ownerToken = regData.token;
  assert(regRes.status === 201 && !!ownerToken, 'Primary user registered and token issued', `Token: ${!!ownerToken}`);

  // --- TEST 4: Authenticated upload of small TXT file ---
  console.log('4. Uploading small text file with session token...');
  const formAuth = new FormData();
  formAuth.append('file', new Blob(['Hello NEXUS OS Virtual Filesystem!'], { type: 'text/plain' }), 'test_notes.txt');
  const upRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: formAuth,
  });
  const upData = await upRes.json();
  const fileId = upData.file?.id;
  assert(upRes.status === 201 && !!fileId, 'Upload succeeded with HTTP 201 and valid file ID', `File ID: ${fileId}`);

  // --- TEST 5: Authenticated upload of small JPG image file ---
  console.log('5. Uploading small JPG image file with session token...');
  const formJpg = new FormData();
  // Minimal valid 1x1 JPG bytes
  const jpgBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xBF, 0x00, 0xFF, 0xD9]);
  formJpg.append('file', new Blob([jpgBytes], { type: 'image/jpeg' }), 'IMG-sample.jpg');
  const upJpgRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: formJpg,
  });
  const upJpgData = await upJpgRes.json();
  const jpgFileId = upJpgData.file?.id;
  assert(upJpgRes.status === 201 && !!jpgFileId, 'JPG upload succeeded with HTTP 201', `JPG ID: ${jpgFileId}`);

  // --- TEST 6: Unauthorized user attempts to delete owner\'s file (Cross-user access rejection) ---
  console.log('6. Registering secondary user for cross-user isolation test...');
  const rogueEmail = `explorer_rogue_${ts}@nexus.os`;
  const rogueReg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: rogueEmail, password: 'password789', displayName: 'Explorer Rogue' }),
  }).then((r) => r.json());
  const rogueToken = rogueReg.token;

  const rogueDelRes = await fetch(`${BASE}/api/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${rogueToken}` },
  });
  const rogueDelData = await rogueDelRes.json();
  assert(
    rogueDelRes.status === 403 && rogueDelData.error.includes('Forbidden'),
    'Cross-user deletion attempt blocked with HTTP 403 Forbidden',
    `Status: ${rogueDelRes.status}, Error: ${rogueDelData.error}`
  );

  // --- TEST 7: Owner deletes uploaded file ---
  console.log('7. Owner deleting uploaded file...');
  const ownerDelRes = await fetch(`${BASE}/api/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const ownerDelData = await ownerDelRes.json();
  assert(
    ownerDelRes.status === 200 && ownerDelData.success === true,
    'Owner deletion returns HTTP 200 and success: true',
    `Status: ${ownerDelRes.status}, Msg: ${ownerDelData.message}`
  );

  // --- TEST 8: Re-fetch files to confirm deleted file remains deleted ---
  console.log('8. Re-fetching file list to verify persistence of deletion...');
  const listRes = await fetch(`${BASE}/api/files`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const listData = await listRes.json();
  const exists = (listData.files || []).some((f) => f.id === fileId);
  assert(!exists, 'Deleted file no longer appears in GET /api/files (persistence verified)', `Files count: ${listData.files?.length}`);

  // --- TEST 9: Owner deletes JPG file ---
  console.log('9. Owner deleting JPG file...');
  const delJpgRes = await fetch(`${BASE}/api/files/${jpgFileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(delJpgRes.status === 200, 'JPG deletion returns HTTP 200', `Status: ${delJpgRes.status}`);

  // --- TEST 10: GET /api/auth/me returns fresh token for session continuation ---
  console.log('10. Verifying GET /api/auth/me returns token and refreshes session...');
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const meData = await meRes.json();
  assert(
    meRes.status === 200 && !!meData.token && meData.user?.email === userEmail,
    'GET /api/auth/me returns user profile and fresh JWT token for Bearer authentication',
    `Has token: ${!!meData.token}`
  );

  // --- TEST 11: Guest Explorer endpoint POST /api/auth/guest ---
  console.log('11. Verifying POST /api/auth/guest issues valid guest token...');
  const guestRes = await fetch(`${BASE}/api/auth/guest`, { method: 'POST' });
  const guestData = await guestRes.json();
  assert(
    guestRes.status === 200 && !!guestData.token && guestData.user?.role === 'guest',
    'POST /api/auth/guest returns valid guest token and profile',
    `Role: ${guestData.user?.role}`
  );

  // --- TEST 12: Guest user attempting to delete another user\'s file is 403 Forbidden ---
  console.log('12. Guest attempting to delete another user\'s file...');
  const guestDelRes = await fetch(`${BASE}/api/files/file-1792388935205-2325`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${guestData.token}` },
  });
  const guestDelData = await guestDelRes.json();
  assert(
    guestDelRes.status === 403 && guestDelData.error.includes('Forbidden'),
    'Guest user cannot delete another user\'s file (403 Forbidden)',
    `Status: ${guestDelRes.status}, Error: ${guestDelData.error}`
  );

  console.log('\n===============================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
