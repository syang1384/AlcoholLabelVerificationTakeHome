// src/utils/visionClient.ts

import { ImageAnnotatorClient } from '@google-cloud/vision';

let cachedClient: ImageAnnotatorClient | null = null;

export function getVisionClient() {
  if (cachedClient) return cachedClient;

  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const projectId = process.env.GOOGLE_PROJECT_ID;

  if (!credsJson || !projectId) {
    throw new Error(
      'Google Vision not configured: missing GOOGLE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS_JSON'
    );
  }

  const credentials = JSON.parse(credsJson);

  cachedClient = new ImageAnnotatorClient({
    projectId,
    credentials,
  });

  return cachedClient;
}
