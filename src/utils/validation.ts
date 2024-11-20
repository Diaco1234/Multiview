export interface VideoUrlInfo {
  embedUrl: string;
  originalUrl: string;
}

export const validateVideoUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check for supported video platforms
    const supportedPlatforms = [
      'youtube.com',
      'youtu.be'
    ];

    return supportedPlatforms.some(platform => hostname.includes(platform));
  } catch {
    return false;
  }
};

export const getVideoUrls = (url: string): VideoUrlInfo => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    let embedUrl = '';
    let originalUrl = url;

    // YouTube
    if (hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
        originalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
    
    // YouTube Short URL
    if (hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
        originalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    if (!embedUrl) {
      throw new Error('Unsupported video URL format');
    }

    return { embedUrl, originalUrl };
  } catch (error) {
    console.error('Error processing video URL:', error);
    throw error;
  }
};