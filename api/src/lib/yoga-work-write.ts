import type { PoolClient } from 'pg';
import { createServerClient } from './db';

export const yogaModuleId = 'interactive-yoga';
export const previewYogaWrites = () => process.env.WELLBEING_PREVIEW_YOGA_WRITES === 'true';

export async function withYogaWorkWrite<T>(write: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await createServerClient().connect();
  let discard = false;
  try {
    await client.query(previewYogaWrites() ? 'BEGIN READ WRITE' : 'BEGIN');
    const result = await write(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => { discard = true; });
    throw error;
  } finally {
    client.release(discard);
  }
}
