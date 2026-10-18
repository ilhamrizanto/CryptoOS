/**
 * Stop Quality Gatekeeper Hook (Stop Hook)
 * 
 * Berjalan ketika agen ingin menyelesaikan percakapan/berhenti:
 * Memastikan tidak ada background task yang tertinggal atau kegagalan yang belum diselesaikan.
 */

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function stopGatekeeper() {
  const inputRaw = readStdin();
  if (!inputRaw || !inputRaw.trim()) {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  try {
    const payload = JSON.parse(inputRaw);

    // Jika sistem berhenti karena error kritis yang belum tertangani
    if (payload.error && payload.terminationReason === 'error') {
      console.log(JSON.stringify({
        decision: 'continue',
        reason: `[QUALITY GATE] Eksekusi terhenti akibat error: ${payload.error}. Harap periksa dan selesaikan akar masalahnya.`
      }));
      return;
    }

    // Jika background task penting belum selesai
    if (payload.fullyIdle === false) {
      console.log(JSON.stringify({
        decision: 'continue',
        reason: "[QUALITY GATE] Background tasks/pengujian masih berjalan di latar belakang. Tunggu hingga proses selesai."
      }));
      return;
    }
  } catch {
    // Default allow jika parsing gagal
  }

  // Izinkan agen berhenti normal
  console.log(JSON.stringify({ decision: 'allow' }));
}

stopGatekeeper();
