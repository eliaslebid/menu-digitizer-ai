import { MenuItem } from '@menu-ai/shared-types';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { classifyItem } from './agent.ts';

const app = express();
const port = process.env.PORT || 3001; // MCP runs on 3001

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Classification Endpoint
app.post('/classify', async (req: Request, res: Response) => {
  const { items, request_id } = req.body as { items: MenuItem[], request_id: string };

  console.log(`[${request_id}] MCP received ${items.length} items for classification`);

  // Run classification in parallel
  const classificationPromises = items.map(async (item) => {
    const classification = await classifyItem(item, request_id);
    return {
      ...item,
      classification
    };
  });

  const classifiedItems = await Promise.all(classificationPromises);

  const totalSum = classifiedItems
    .filter(i => i.classification?.is_vegetarian)
    .reduce((sum, i) => sum + i.price, 0);

  res.json({
    classified_items: classifiedItems,
    total_sum: totalSum
  });
});

app.listen(port, () => {
  console.log(`MCP Agent running on port ${port}`);
});
