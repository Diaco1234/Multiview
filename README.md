# Multiview - Intelligent Video Transcript Analyzer

A multi-video platform with AI-powered transcript highlighting and intelligent timeline management.

## Features

- Multi-video viewing and analysis
- Real-time transcript loading and synchronization
- AI-powered moment detection using Google Gemini AI
- Interactive timeline management
- Socket.IO-based real-time updates

## Tech Stack

- Frontend: React, TypeScript
- Backend: Node.js, Express
- Real-time Communication: Socket.IO
- AI Integration: Google Gemini AI

## Prerequisites

- Node.js >= 16
- npm or yarn
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd Multiview
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../
npm install
```

3. Set up environment variables:
Create a `.env` file in the server directory with:
```
GEMINI_API_KEY=your_api_key_here
```

## Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Development

- Frontend runs on port 5173
- Backend runs on port 3001
- WebSocket connection is automatically established
- Transcript loading is event-driven
- AI analysis runs asynchronously

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
