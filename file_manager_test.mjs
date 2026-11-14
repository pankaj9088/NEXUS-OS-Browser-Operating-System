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

function getCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  const match = setCookie.match(/nexus_token=([^;]+)/);
  return match ? `nexus_token=${match[1]}` : '';
}

async function run() {
  console.log('=== Windows-Style Virtual File Manager Verification Suite ===\n');

  const ts = Date.now();
  const userA_email = `explorer_user_a_${ts}@example.com`;
  const userA_password = 'Password123!';
  const userA_name = 'Explorer Admin';

  const userB_email = `explorer_user_b_${ts}@example.com`;
  const userB_password = 'Password123!';
  const userB_name = 'Explorer Hacker';

  // 1. Register User A
  const regARes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_email, password: userA_password, displayName: userA_name }),
  });
  const cookieA = getCookie(regARes);
  record('1. User A registration & cookie auth', regARes.status === 201 && !!cookieA);

  // 2. Create standard and custom nested folders
  // Folder 1: Photos
  const fPhotosRes = await fetch(`${BASE}/api/files/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ name: 'Photos', parentFolderId: null }),
  });
  const fPhotosData = await fPhotosRes.json();
  const photosFolderId = fPhotosData.folder?.id;
  record('2a. Create "Photos" root folder returns 201', fPhotosRes.status === 201 && !!photosFolderId, `ID: ${photosFolderId}`);

  // Folder 2: Vacation inside Photos (Nested folder)
  const fVacationRes = await fetch(`${BASE}/api/files/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ name: 'Vacation 2026', parentFolderId: photosFolderId }),
  });
  const fVacationData = await fVacationRes.json();
  const vacationFolderId = fVacationData.folder?.id;
  record('2b. Create nested folder inside Photos returns 201', fVacationRes.status === 201 && fVacationData.folder?.parentFolderId === photosFolderId);

  // Folder 3: Videos
  const fVideosRes = await fetch(`${BASE}/api/files/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ name: 'Videos', parentFolderId: null }),
  });
  const fVideosData = await fVideosRes.json();
  const videosFolderId = fVideosData.folder?.id;
  record('2c. Create "Videos" folder returns 201', fVideosRes.status === 201 && !!videosFolderId);

  // 3. Upload multiple file types into nested folder
  // 3a. Upload Image (.png)
  const boundary = '----WebKitFormBoundaryNexusFiles';
  // Small 1x1 png base64
  const pngBinary = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const imgBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parentFolderId"\r\n\r\n${vacationFolderId}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sunset.png"\r\nContent-Type: image/png\r\n\r\n`),
    pngBinary,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const upImgRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: cookieA,
    },
    body: imgBody,
  });
  const upImgData = await upImgRes.json();
  const imgFileId = upImgData.file?.id;
  record('3a. Upload Image (.png) into nested folder returns 201', upImgRes.status === 201 && !!imgFileId, `ID: ${imgFileId}`);

  // 3b. Upload PDF (.pdf)
  const pdfContent = '%PDF-1.4\n%Nexus OS Virtual PDF Document\n%%EOF';
  const pdfBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parentFolderId"\r\n\r\n${vacationFolderId}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="itinerary.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    Buffer.from(pdfContent),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const upPdfRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: cookieA,
    },
    body: pdfBody,
  });
  const upPdfData = await upPdfRes.json();
  const pdfFileId = upPdfData.file?.id;
  record('3b. Upload PDF (.pdf) returns 201', upPdfRes.status === 201 && !!pdfFileId);

  // 3c. Upload Audio (.mp3)
  const audioContent = 'ID3\x03\x00\x00\x00\x00\x00#TIT2Nexus Ambient';
  const audioBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="ambient.mp3"\r\nContent-Type: audio/mp3\r\n\r\n`),
    Buffer.from(audioContent),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const upAudioRes = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: cookieA,
    },
    body: audioBody,
  });
  const upAudioData = await upAudioRes.json();
  const audioFileId = upAudioData.file?.id;
  record('3c. Upload Audio (.mp3) returns 201', upAudioRes.status === 201 && !!audioFileId);

  // 4. Test View/Preview endpoint for inline streaming
  const viewImgRes = await fetch(`${BASE}/api/files/${imgFileId}/view`, {
    headers: { Cookie: cookieA },
  });
  const imgContentType = viewImgRes.headers.get('content-type');
  record('4a. Preview Image via GET /api/files/:id/view returns 200 and image/png', viewImgRes.status === 200 && imgContentType === 'image/png');

  const viewPdfRes = await fetch(`${BASE}/api/files/${pdfFileId}/view`, {
    headers: { Cookie: cookieA },
  });
  const pdfContentType = viewPdfRes.headers.get('content-type');
  record('4b. Preview PDF via GET /api/files/:id/view returns 200 and application/pdf', viewPdfRes.status === 200 && pdfContentType === 'application/pdf');

  const viewAudioRes = await fetch(`${BASE}/api/files/${audioFileId}/view`, {
    headers: { Cookie: cookieA },
  });
  const audioContentType = viewAudioRes.headers.get('content-type');
  record('4c. Stream Audio via GET /api/files/:id/view returns 200 and audio/mp3', viewAudioRes.status === 200 && audioContentType?.includes('audio'));

  // 5. Download file
  const downloadRes = await fetch(`${BASE}/api/files/${pdfFileId}/download`, {
    headers: { Cookie: cookieA },
  });
  const downloadedBody = await downloadRes.text();
  record('5. Download file returns 200 with matching bytes', downloadRes.status === 200 && downloadedBody === pdfContent);

  // 6. Rename file and folder
  const renameRes = await fetch(`${BASE}/api/files/${imgFileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ name: 'sunset_golden_hour.png' }),
  });
  const renameData = await renameRes.json();
  record('6a. Rename file returns 200 with new name', renameRes.status === 200 && renameData.file?.name === 'sunset_golden_hour.png');

  const renameFolderRes = await fetch(`${BASE}/api/files/${photosFolderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ name: 'All Photos Archive' }),
  });
  const renameFolderData = await renameFolderRes.json();
  record('6b. Rename folder returns 200 with new name', renameFolderRes.status === 200 && renameFolderData.file?.name === 'All Photos Archive');

  // 7. Move file between folders (move audioFileId into videosFolderId)
  const moveRes = await fetch(`${BASE}/api/files/${audioFileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ parentFolderId: videosFolderId }),
  });
  const moveData = await moveRes.json();
  record('7. Move file to different folder returns 200 and updates parentFolderId', moveRes.status === 200 && moveData.file?.parentFolderId === videosFolderId);

  // 8. Refresh persistence: list files and verify hierarchy
  const listRes = await fetch(`${BASE}/api/files`, {
    headers: { Cookie: cookieA },
  });
  const listData = await listRes.json();
  const foundMoved = listData.files?.find((f) => f.id === audioFileId);
  const foundImage = listData.files?.find((f) => f.id === imgFileId);
  record('8. GET /api/files confirms persistent folder hierarchy and relationships', listRes.status === 200 && foundMoved?.parentFolderId === videosFolderId && foundImage?.parentFolderId === vacationFolderId);

  // 9. Cross-user isolation: User B attempt on User A files
  const regBRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userB_email, password: userB_password, displayName: userB_name }),
  });
  const cookieB = getCookie(regBRes);

  const bViewRes = await fetch(`${BASE}/api/files/${imgFileId}/view`, {
    headers: { Cookie: cookieB },
  });
  record('9a. User B preview on User A file is 403 Forbidden', bViewRes.status === 403);

  const bDownloadRes = await fetch(`${BASE}/api/files/${pdfFileId}/download`, {
    headers: { Cookie: cookieB },
  });
  record('9b. User B download on User A file is 403 Forbidden', bDownloadRes.status === 403);

  const bPatchRes = await fetch(`${BASE}/api/files/${imgFileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieB },
    body: JSON.stringify({ name: 'Hacked.png' }),
  });
  record('9c. User B rename on User A file is 403 Forbidden', bPatchRes.status === 403);

  const bDeleteRes = await fetch(`${BASE}/api/files/${imgFileId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieB },
  });
  record('9d. User B delete on User A file is 403 Forbidden', bDeleteRes.status === 403);

  // 10. Recursive folder deletion: deleting parent folder deletes nested items
  const delPhotosRes = await fetch(`${BASE}/api/files/${photosFolderId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  record('10a. Delete parent folder returns 200', delPhotosRes.status === 200);

  // Verify child folder and child file were recursively cleaned up
  const verifyListRes = await fetch(`${BASE}/api/files`, {
    headers: { Cookie: cookieA },
  });
  const verifyListData = await verifyListRes.json();
  const hasChildFolder = verifyListData.files?.some((f) => f.id === vacationFolderId);
  const hasChildFile = verifyListData.files?.some((f) => f.id === imgFileId);
  record('10b. Recursive deletion cleaned up descendant folder and files', !hasChildFolder && !hasChildFile);

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('====================================================');

  if (results.failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
