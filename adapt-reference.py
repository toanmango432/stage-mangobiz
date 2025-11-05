#!/usr/bin/env python3
import re

# Read files
with open('src/components/tickets/ServiceTicketCard.tsx', 'r') as f:
    current = f.read()

with open('src/components/tickets/ServiceTicketCard_REF.tsx', 'r') as f:
    ref = f.read()

# Extract header from current (lines 1-126: imports + interface + helpers)
header_match = re.search(r'(import[\s\S]*?const hasNote = !!ticket\.notes;)', current)
header = header_match.group(1) if header_match else ''

# Extract the 4 view mode sections from reference
# List compact/normal (lines 81-505)
list_section = ref[ref.find('// List View Layout'):ref.find('// Grid View Layout')]

# Grid normal (lines 506-750)
grid_section = ref[ref.find('// Grid View Layout'):]

# Split list section into compact and normal
list_parts = list_section.split('isCompact ? ')

# Property mappings
mappings = {
    'card.ticketNumber': 'ticket.number',
    'card.customerName': 'ticket.clientName',
    'card.serviceName': 'ticket.service',
    'card.percentage': 'progress',
    'card.isFirstVisit': 'isFirstVisit',
    'card.hasStar': 'hasStar',
    'card.hasNote': 'hasNote',
    'card.staff': 'staffList',
    'card.timeLeft': 'formatTime(timeRemaining)',
    'card.id': 'ticket.id',
    'layout === \'list\'': 'viewMode === \'compact\' || viewMode === \'normal\'',
    'size === \'compact\'': 'viewMode === \'compact\'',
    'isCompact': '(viewMode === \'compact\')',
}

def apply_mappings(code):
    for old, new in mappings.items():
        code = code.replace(old, new)
    return code

# Apply mappings
list_adapted = apply_mappings(list_section)
grid_adapted = apply_mappings(grid_section)

# Build compact view
compact_view = list_adapted.replace('layout === \'list\'', 'viewMode === \'compact\'')
compact_view = compact_view.replace('(viewMode === \'compact\')', 'true')

# Build normal view
normal_view = list_adapted.replace('layout === \'list\'', 'viewMode === \'normal\'')
normal_view = normal_view.replace('(viewMode === \'compact\')', 'false')

# Build grid normal
grid_normal = grid_adapted.replace('return (', 'if (viewMode === \'grid-normal\') {\n  return (')
grid_normal += '\n  }'

# Build grid compact (use same grid but with compact sizing)
grid_compact = grid_adapted.replace('return (', 'if (viewMode === \'grid-compact\') {\n  return (')
grid_compact = grid_compact.replace('min-w-[280px]', 'min-w-[240px]')
grid_compact = grid_compact.replace('w-11 sm:w-14', 'w-9 sm:w-11')
grid_compact = grid_compact.replace('text-lg sm:text-2xl', 'text-base sm:text-xl')
grid_compact += '\n  }'

# Assemble final file
output = f'''{header}

  // LIST COMPACT VIEW
  if (viewMode === 'compact') {{
    return (
{compact_view.split('return (')[1] if 'return (' in compact_view else compact_view}
  }}

  // LIST NORMAL VIEW
  if (viewMode === 'normal') {{
    return (
{normal_view.split('return (')[1] if 'return (' in normal_view else normal_view}
  }}

{grid_normal}

{grid_compact}

  return null;
}}
'''

# Write output
with open('src/components/tickets/ServiceTicketCard.tsx', 'w') as f:
    f.write(output)

print('✅ Reference design applied successfully!')
print('📝 File: src/components/tickets/ServiceTicketCard.tsx')
print('\n🧪 Next: Run npm run build to verify')
