/**
 * Dynamic Room Router Catalog Generator
 * 
 * Memindai direktori .agents/skills secara dinamis, mengkategorikan setiap skill
 * ke dalam 5 Virtual Rooms (termasuk 832 otomasi SaaS di saas-automations),
 * dan memperbarui katalog acuan secara otomatis kapan pun ada penambahan/perubahan komponen.
 */

const fs = require('fs');
const path = require('path');

const skillsDir = path.resolve(__dirname, '../skills');
const saasDir = path.join(skillsDir, 'saas-automations');
const outputDir = path.join(skillsDir, 'room-router/references');

const ROOM_NAMES = {
  ROOM_1: 'Room 1: Core Architecture & Backend',
  ROOM_2: 'Room 2: Frontend & UI Vibes',
  ROOM_3: 'Room 3: Testing, Quality & Reliability',
  ROOM_4: 'Room 4: Document Engine & Productivity',
  ROOM_5: 'Room 5: 1000+ SaaS & External Automations',
  ROOM_6: 'Room 6: Custom & Workspace Skills'
};

function classifySkill(name) {
  const n = name.toLowerCase();

  // Room 1: Core Architecture & Backend
  if (/api-scaffold|db-migration|devops|event-driven|legacy-refactor|senior-pr|system-design|architect/.test(n) && !/frontend/.test(n)) {
    return ROOM_NAMES.ROOM_1;
  }

  // Room 2: Frontend, UI & Creative Vibes
  if (/frontend|ui|theme|canvas|design|brand|artifact|image|video|gif/.test(n)) {
    return ROOM_NAMES.ROOM_2;
  }

  // Room 3: Testing, Quality & Reliability
  if (/test|e2e|debug|profil|sre|observab|secur|audit|trace|root-cause/.test(n)) {
    return ROOM_NAMES.ROOM_3;
  }

  // Room 4: Document Engine & Workflow Productivity
  if (/docx|pdf|pptx|xlsx|changelog|invoice|file-organizer|content-research|meeting|resume|internal-comms|explainer|langsmith|lead-research|domain-name|raffle|twitter/.test(n)) {
    return ROOM_NAMES.ROOM_4;
  }

  // Room 6: Custom & Project-Specific (Fallback fleksibel)
  return ROOM_NAMES.ROOM_6;
}

function generateCatalog() {
  if (!fs.existsSync(skillsDir)) {
    console.error(`Skills directory not found at: ${skillsDir}`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  
  const rooms = {
    [ROOM_NAMES.ROOM_1]: [],
    [ROOM_NAMES.ROOM_2]: [],
    [ROOM_NAMES.ROOM_3]: [],
    [ROOM_NAMES.ROOM_4]: [],
    [ROOM_NAMES.ROOM_5]: [],
    [ROOM_NAMES.ROOM_6]: []
  };

  // 1. Scan Top-Level Skills
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'saas-automations' || entry.name === 'room-router') {
        continue;
      }
      const room = classifySkill(entry.name);
      rooms[room].push(entry.name);
    }
  }

  // 2. Scan SaaS Automations (Room 5)
  if (fs.existsSync(saasDir)) {
    const saasEntries = fs.readdirSync(saasDir, { withFileTypes: true });
    for (const entry of saasEntries) {
      if (entry.isDirectory()) {
        rooms[ROOM_NAMES.ROOM_5].push(entry.name);
      }
    }
  }

  // 3. Write JSON Catalog
  const jsonPath = path.join(outputDir, 'rooms-catalog.json');
  fs.writeFileSync(jsonPath, JSON.stringify(rooms, null, 2), 'utf-8');

  // 4. Write Markdown Summary
  const mdLines = [
    '# 🧭 Dynamic Skill Rooms Catalog',
    '',
    `> Otomatis diperbarui: ${new Date().toISOString()}`,
    '',
    '## 📊 Ringkasan Kapasitas Ruang',
    `- **${ROOM_NAMES.ROOM_1}:** ${rooms[ROOM_NAMES.ROOM_1].length} skills`,
    `- **${ROOM_NAMES.ROOM_2}:** ${rooms[ROOM_NAMES.ROOM_2].length} skills`,
    `- **${ROOM_NAMES.ROOM_3}:** ${rooms[ROOM_NAMES.ROOM_3].length} skills`,
    `- **${ROOM_NAMES.ROOM_4}:** ${rooms[ROOM_NAMES.ROOM_4].length} skills`,
    `- **${ROOM_NAMES.ROOM_5}:** ${rooms[ROOM_NAMES.ROOM_5].length} apps (tersimpan di \`saas-automations/\`)`,
    `- **${ROOM_NAMES.ROOM_6}:** ${rooms[ROOM_NAMES.ROOM_6].length} skills`,
    '',
    '---',
    '',
    '## 📁 Direktori per Room',
    ''
  ];

  for (const [roomName, list] of Object.entries(rooms)) {
    mdLines.push(`### ${roomName} (${list.length} items)`);
    if (roomName === ROOM_NAMES.ROOM_5) {
      mdLines.push(`*Seluruh 832 otomasi SaaS tersimpan di folder \`.agents/skills/saas-automations/<nama-aplikasi>/SKILL.md\`.*`);
      mdLines.push(`Contoh aplikasi siap pakai: \`slack-automation\`, \`notion-automation\`, \`github-automation\`, \`google-docs-automation\`, \`gmail-automation\`, \`airtable-automation\`, \`discordbot-automation\`, dll.`);
    } else {
      list.forEach(item => mdLines.push(`- \`${item}\``));
    }
    mdLines.push('');
  }

  const mdPath = path.join(outputDir, 'rooms-catalog.md');
  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf-8');

  console.log(`[SUCCESS] Room catalog updated successfully:`);
  for (const [r, l] of Object.entries(rooms)) {
    console.log(`- ${r}: ${l.length}`);
  }
}

generateCatalog();
