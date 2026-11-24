import { createHmac } from 'node:crypto';

export function signSessionToken(user, secret) {
  const { id, username, role, name, organizationId } = user;
  const timestamp = Date.now();
  const signature = createHmac('sha256', secret)
    .update(`${id}:${role}:${timestamp}`)
    .digest('hex')
    .slice(0, 32);
  const payload = Buffer.from(JSON.stringify({
    id, username, role, name, organizationId, timestamp, signature,
  })).toString('base64');
  return `pg_token_${payload}`;
}
