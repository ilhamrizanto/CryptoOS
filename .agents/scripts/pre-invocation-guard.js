/**
 * Architecture & Clean Code Reminder (PreInvocation Hook)
 * 
 * Berjalan sebelum model AI berpikir, menyuntikkan instruksi ephemeral
 * agar AI selalu mengingat standar clean code dan tidak menghasilkan kode spaghetti.
 */

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

function preInvocationGuard() {
  readStdin(); // consume stdin

  const payload = {
    injectSteps: [
      {
        ephemeralMessage: "[SYSTEM QUALITY GUARD] Ingat: Terapkan Clean Architecture, batasi fungsi maks 40 baris, zero `any`, explicit return types, dan pastikan error handling terstruktur sesuai .agents/rules/coding-style.md."
      }
    ]
  };

  console.log(JSON.stringify(payload));
}

preInvocationGuard();
