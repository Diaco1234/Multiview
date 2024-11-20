import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/youtube/transcript/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log('Fetching transcript for video:', videoId);
    
    // First, get the video page to find the captions track
    const videoPage = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = videoPage.data;

    // Extract caption track URL from the page
    const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
    if (!captionMatch) {
      console.log('No captions found for video:', videoId);
      return res.status(404).json({ error: 'No captions available' });
    }

    const captionData = JSON.parse(`[${captionMatch[1]}]`);
    const englishTrack = captionData.find(track => 
      track.languageCode === 'en' || track.languageCode === 'en-US'
    ) || captionData[0];

    if (!englishTrack || !englishTrack.baseUrl) {
      console.log('No suitable caption track found for video:', videoId);
      return res.status(404).json({ error: 'No suitable caption track found' });
    }

    console.log('Found caption track:', englishTrack.languageCode);

    // Fetch the actual captions
    const captionResponse = await axios.get(englishTrack.baseUrl);
    const captionXml = captionResponse.data;

    // Parse the XML to extract text
    const textSegments = captionXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    const transcript = textSegments
      .map(segment => {
        const text = segment.replace(/<[^>]*>/g, '');
        return decodeURIComponent(text.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
      })
      .join(' ');

    console.log('Successfully extracted transcript of length:', transcript.length);
    res.json({ transcript, language: englishTrack.languageCode });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
