/**
 * Post-Tool Audit & Quality Logger Hook (PostToolUse)
 * Standard Senior Fullstack Observability
 * 
 * Mencatat riwayat eksekusi tool ke dalam file audit log terstruktur (JSONL)
 * untuk tujuan debugging, transparansi, dan post-mortem audit.
 */

const fs = require('fs');
const path = require('path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function logAuditTrail() {
  const inputRaw = readStdin();
  if (!inputRaw || !inputRaw.trim()) {
    console.log(JSON.stringify({}));
    return;
  }

  try {
    const payload = JSON.parse(inputRaw);
    const logEntry = {
      timestamp: new Date().toISOString(),
      conversationId: payload.conversationId || 'unknown',
      stepIdx: payload.stepIdx,
      hasError: !!payload.error,
      errorDetails: payload.error || null,
    };

    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFilePath = path.join(logDir, 'agent-audit.log');
    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n', 'utf-8');
  } catch (err) {
    // Non-blocking, jangan gagalkan eksekusi jika logging gagal
  }

  // Sesuai kontrak PostToolUse, kembalikan objek JSON kosong {}
  console.log(JSON.stringify({}));
}

logAuditTrail();
