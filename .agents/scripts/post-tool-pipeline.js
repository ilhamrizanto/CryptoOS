/**
 * Universal Post-Tool Code Cleaner & Telemetry Pipeline
 * 
 * Merapikan whitespace tanpa merusak format spesifik bahasa,
 * dan fail-safe 100% agar tidak pernah menghentikan alur kerja AI.
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

function cleanAndFormatCode(filePath) {
  if (!fs.existsSync(filePath)) return;

  const ext = path.extname(filePath).toLowerCase();
  const codeExts = ['.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.scss', '.html', '.md', '.py', '.go', '.rs', '.sql', '.yaml', '.yml'];
  if (!codeExts.includes(ext)) return;

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. Trim trailing whitespace di ujung setiap baris
    let lines = content.split(/\r?\n/).map(line => line.trimEnd());
    
    // 2. Cegah akumulasi baris kosong liar (> 3 baris kosong berturut-turut)
    let cleanedLines = [];
    let consecutiveEmpty = 0;
    for (const line of lines) {
      if (line === '') {
        consecutiveEmpty++;
        if (consecutiveEmpty <= 2) {
          cleanedLines.push(line);
        }
      } else {
        consecutiveEmpty = 0;
        cleanedLines.push(line);
      }
    }
    
    let finalContent = cleanedLines.join('\n');
    if (!finalContent.endsWith('\n')) {
      finalContent += '\n';
    }

    if (finalContent !== content) {
      fs.writeFileSync(filePath, finalContent, 'utf-8');
    }
  } catch {
    // Non-blocking fail-safe
  }
}

function runPostToolPipeline() {
  const inputRaw = readStdin();
  if (!inputRaw || !inputRaw.trim()) {
    console.log(JSON.stringify({}));
    return;
  }

  try {
    const payload = JSON.parse(inputRaw);
    const toolCall = payload.toolCall || {};
    const args = toolCall.args || {};

    if (args.TargetFile) {
      cleanAndFormatCode(args.TargetFile);
    }

    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      tool: toolCall.name || 'unknown',
      hasError: !!payload.error
    };
    fs.appendFileSync(path.join(logDir, 'agent-audit.log'), JSON.stringify(logEntry) + '\n', 'utf-8');
  } catch {
    // Fail-safe
  }

  console.log(JSON.stringify({}));
}

runPostToolPipeline();
