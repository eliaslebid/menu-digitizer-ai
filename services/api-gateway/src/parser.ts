import { MenuItem } from '@menu-ai/shared-types';

export function parseMenuText(text: string): MenuItem[] {
  const lines = text.split('\n');
  const items: MenuItem[] = [];

  // Price at the end of line
  const pricePattern = /(\d+)\s*$/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;
    
    // Skip headers (all caps, short lines)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 30) continue;
    
    // Skip lines starting with special chars
    if (trimmed.startsWith('*') || trimmed.startsWith('"')) continue;
    
    // Look for price at the end
    const priceMatch = trimmed.match(pricePattern);
    if (priceMatch) {
      const price = parseInt(priceMatch[1], 10);
      
      // Get everything before the price
      let fullText = trimmed.substring(0, priceMatch.index).trim();
      
      // Remove the portion/weight numbers (e.g., "180" in "Карпачо лосось 180 680")
      // Pattern: keep text, remove trailing numbers
      const parts = fullText.split(/\s+/);
      
      // Find where numbers start at the end
      let nameEndIndex = parts.length;
      for (let i = parts.length - 1; i >= 0; i--) {
        if (!/^\d+$/.test(parts[i]) && !/^\d+\/\d+$/.test(parts[i])) {
          nameEndIndex = i + 1;
          break;
        }
      }
      
      const name = parts.slice(0, nameEndIndex).join(' ');
      
      if (name.length > 2) {
        items.push({
          name,
          price,
          raw_text: trimmed
        });
      }
    }
  }

  return items;
}
