import { successResponse, errorResponse } from './utils/response.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    const platforms = [
      {
        id: 'facebook',
        name: 'Facebook Ads',
        icon: 'facebook',
        color: '#1877F2',
        available: true
      },
      {
        id: 'google',
        name: 'Google Ads',
        icon: 'google',
        color: '#4285F4',
        available: true
      },
      {
        id: 'tiktok',
        name: 'TikTok Ads',
        icon: 'tiktok',
        color: '#000000',
        available: true
      }
    ];

    return successResponse(platforms);
  } catch (error) {
    return errorResponse(error);
  }
};