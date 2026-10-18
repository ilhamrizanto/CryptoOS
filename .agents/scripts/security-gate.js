/**
 * Resilient & Adaptive Security Gate Hook (PreToolUse)
 * 
 * Melindungi mesin dari perintah destruktif fatal, namun dirancang
 * adaptif, non-blocking, dan fail-safe agar tidak menghambat kreativitas AI.
 */

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function evaluateSafety() {
  const inputRaw = readStdin();
  if (!inputRaw || !inputRaw.trim()) {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(inputRaw);
  } catch {
    // Fail-safe: Jika parsing error, izinkan eksekusi agar alur tidak macet
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const toolCall = payload.toolCall || {};
  const toolName = toolCall.name || '';
  const args = toolCall.args || {};

  try {
    // 1. Audit Terminal Commands (run_command)
    if (toolName === 'run_command' && args.CommandLine) {
      const cmd = args.CommandLine.toLowerCase();

      // Hanya blokir perintah yang 100% destruktif fatal pada OS / Root
      const fatalPatterns = [
        /\brm\s+-rf\s+[\/\\](?:\s|$)/i,           // rm -rf /
        /\brmdir\s+\/s\s+\/q\s+[c-z]:\\(?:\s|$)/i, // rmdir /s /q C:\
        /\bformat\s+[c-z]:/i,                     // format C:
        /\bdrop\s+database\b/i,                   // DROP DATABASE
      ];

      for (const pattern of fatalPatterns) {
        if (pattern.test(cmd)) {
          console.log(JSON.stringify({
            decision: 'deny',
            reason: `[FATAL SAFETY BLOCK] Perintah sangat destruktif terdeteksi (${pattern.toString()}).`
          }));
          return;
        }
      }
    }

    // 2. Audit File Overwriting (write_to_file)
    if (toolName === 'write_to_file' && args.TargetFile) {
      const target = args.TargetFile.toLowerCase();
      
      // Lindungi hanya private key ssh dan credentials produksi murni
      const protectedFiles = ['id_rsa', 'id_ed25519', '.env.production'];
      const isProtected = protectedFiles.some(f => target.endsWith(f.toLowerCase()));
      
      if (isProtected) {
        console.log(JSON.stringify({
          decision: 'deny',
          reason: `[SECURITY GUARD] File kunci/kredensial produksi (${args.TargetFile}) terlindungi.`
        }));
        return;
      }
    }
  } catch (err) {
    // Fail-safe fallback: jangan pernah memblokir proses hanya karena error script
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  // Default: Izinkan eksekusi berjalan bebas
  console.log(JSON.stringify({ decision: 'allow' }));
}

evaluateSafety();
