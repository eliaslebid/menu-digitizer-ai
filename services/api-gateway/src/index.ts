import { MenuProcessingResult } from '@menu-ai/shared-types';
import cors from 'cors';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { cleanOCRText } from './ocr-cleanup.ts';
import { extractTextFromImage } from './ocr.ts';
import { parseMenuText } from './parser.ts';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup (memory storage for now)
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Process Menu Endpoint
app.post('/process-menu', upload.array('files', 5), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  console.log(`[${requestId}] Received ${files.length} files for processing`);

  // Perform OCR on all files in parallel
  const ocrPromises = files.map(async (file) => {
    try {
      const text = await extractTextFromImage(file.buffer, file.mimetype);
      console.log(`[${requestId}] OCR completed for file ${file.originalname}`);
      return text;
    } catch (error) {
      console.error(`[${requestId}] OCR failed for file ${file.originalname}:`, error);
      return '';
    }
  });

  const extractedTexts = await Promise.all(ocrPromises);
  const combinedText = extractedTexts.join('\n\n');
  
  console.log(`\n[${requestId}] ===== RAW OCR OUTPUT =====`);
  console.log(combinedText);
  console.log(`[${requestId}] ===== END RAW OCR =====\n`);
  
  // Clean OCR text with LLM
  const cleanedText = await cleanOCRText(combinedText);
  console.log(`\n[${requestId}] ===== CLEANED OCR OUTPUT =====`);
  console.log(cleanedText);
  console.log(`[${requestId}] ===== END CLEANED OCR =====\n`);
  
  // Parse cleaned text into structured items
  const menuItems = parseMenuText(cleanedText);
  console.log(`[${requestId}] Parsed ${menuItems.length} items from text`);
  console.log(`[${requestId}] Items:`, JSON.stringify(menuItems, null, 2));

  // Call MCP Agent for classification
  let mcpResult;
  try {
    const mcpResponse = await fetch('http://localhost:3001/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: menuItems, request_id: requestId })
    });
    
    if (!mcpResponse.ok) {
      throw new Error(`MCP responded with ${mcpResponse.status}`);
    }
    
    mcpResult = await mcpResponse.json();
    console.log(`[${requestId}] MCP classification complete`);
  } catch (error) {
    console.error(`[${requestId}] MCP call failed:`, error);
    // Fallback if MCP is down
    mcpResult = { classified_items: [], total_sum: 0 };
  }

  const response: MenuProcessingResult = {
    vegetarian_items: mcpResult.classified_items.filter((i: any) => i.classification?.is_vegetarian),
    total_sum: mcpResult.total_sum,
    request_id: requestId,
    // @ts-ignore: Temporary field for debugging
    debug_text: combinedText,
    // @ts-ignore: Temporary field for debugging
    debug_cleaned_text: cleanedText,
    // @ts-ignore: Temporary field for debugging
    debug_items: menuItems
  };

  res.json(response);
});

// Start server
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
