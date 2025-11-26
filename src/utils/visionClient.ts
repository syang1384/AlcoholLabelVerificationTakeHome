import vision from '@google-cloud/vision';

let cachedClient: vision.ImageAnnotatorClient | null = null;

export function getVisionClient() {
  if (cachedClient) return cachedClient;

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const projectId = process.env.GOOGLE_PROJECT_ID;

  if (!credentialsJson || !projectId) {
    throw new Error(
      'Google Vision not configured: missing GOOGLE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS_JSON'
    );
  }

  const credentials = JSON.parse(credentialsJson);

  cachedClient = new vision.ImageAnnotatorClient({
    projectId,
    credentials,
  });

  return cachedClient;
}
