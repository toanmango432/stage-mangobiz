const fs = require('fs');
const path = require('path');

console.log('🔄 Merging reference design into ServiceTicketCard...\n');

// Read the reference file
const refPath = path.join(__dirname, 'src/components/tickets/ServiceTicketCard_REF.tsx');
const refContent = fs.readFileSync(refPath, 'utf8');

// Read current file to extract business logic
const currentPath = path.join(__dirname, 'src/components/tickets/ServiceTicketCard.tsx');
const currentContent = fs.readFileSync(currentPath, 'utf8');

// Extract the header (imports + interface + component start + state + useEffect + helpers)
const headerMatch = currentContent.match(/(import[\s\S]*?const hasNote = !!ticket\.notes;)/);
const header = headerMatch ? headerMatch[1] : '';

// Extract view modes from reference and adapt them
let listCompact = refContent.match(/\/\/ List View Layout[\s\S]*?(?=\/\/ Grid Normal View)/)[0];
let gridNormal = refContent.match(/\/\/ Grid Normal View[\s\S]*?(?=\/\/ Grid Compact View)/)[0];
let gridCompact = refContent.match(/\/\/ Grid Compact View[\s\S]*$/)[0];

// Property name mappings
const mappings = {
  'card.ticketNumber': 'ticket.number',
  'card.customerName': 'ticket.clientName', 
  'card.serviceName': 'ticket.service',
  'card.percentage': 'progress',
  'card.isFirstVisit': 'isFirstVisit',
  'card.hasStar': 'hasStar',
  'card.hasNote': 'hasNote',
  'card.staff': 'staffList',
  'card.timeLeft': 'formatTime(timeRemaining)',
  '{card.id}': '{ticket.id}'
};

// Apply mappings
function applyMappings(code) {
  let result = code;
  for (const [oldProp, newProp] of Object.entries(mappings)) {
    result = result.split(oldProp).join(newProp);
  }
  return result;
}

// Adapt view modes
listCompact = applyMappings(listCompact);
gridNormal = applyMappings(gridNormal);
gridCompact = applyMappings(gridCompact);

// Split list compact into compact and normal (reference has both in one section)
const listNormal = listCompact.replace(/size === 'compact'/g, "viewMode === 'normal'");
listCompact = listCompact.split('// List Normal')[0] + `
    return null; // Placeholder for list normal
  }`;

// Build the final file
const output = `${header}

  // LIST COMPACT VIEW
  if (viewMode === 'compact') {
${listCompact}
  }

  // LIST NORMAL VIEW  
  if (viewMode === 'normal') {
${listNormal}
  }

${gridNormal}

${gridCompact}

  return null;
}
`;

// Write the output
const outputPath = path.join(__dirname, 'src/components/tickets/ServiceTicketCard_MERGED.tsx');
fs.writeFileSync(outputPath, output, 'utf8');

console.log('✅ Merge complete!');
console.log(`📄 Output: src/components/tickets/ServiceTicketCard_MERGED.tsx`);
console.log('\n🧪 Next steps:');
console.log('1. Review the merged file');
console.log('2. Run: npm run build');
console.log('3. If successful: mv src/components/tickets/ServiceTicketCard_MERGED.tsx src/components/tickets/ServiceTicketCard.tsx');
