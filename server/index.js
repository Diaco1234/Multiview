import express from 'express';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/transcript/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript) {
      return res.status(404).json({ error: 'No transcript found' });
    }

    // Convert transcript array to a single string
    const transcriptText = transcript
      .map(item => item.text)
      .join(' ');

    res.json({ 
      captions: JSON.stringify({ 
        playerCaptionsTracklistRenderer: {
          captionTracks: [{
            baseUrl: '',
            name: { simpleText: 'English' },
            languageCode: 'en',
            kind: 'asr',
          }]
        }
      }), 
      transcript: transcriptText 
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
