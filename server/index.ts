import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/youtube/transcript/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    
    // First, get the video page to find the captions track
    const videoPage = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = videoPage.data;

    // Extract caption track URL from the page
    const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
    if (!captionMatch) {
      return res.status(404).json({ error: 'No captions available' });
    }

    const captionData = JSON.parse(`[${captionMatch[1]}]`);
    const englishTrack = captionData.find((track: { languageCode: string }) => 
      track.languageCode === 'en' || track.languageCode === 'en-US'
    ) || captionData[0];

    if (!englishTrack || !englishTrack.baseUrl) {
      return res.status(404).json({ error: 'No suitable caption track found' });
    }

    // Fetch the actual captions
    const captionResponse = await axios.get(englishTrack.baseUrl);
    const captionXml = captionResponse.data;

    // Parse the XML to extract text
    const textSegments = captionXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    const transcript = textSegments
      .map((segment: string) => {
        const text = segment.replace(/<[^>]*>/g, '');
        return decodeURIComponent(text.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
      })
      .join(' ');

    res.json({ transcript, language: englishTrack.languageCode });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
