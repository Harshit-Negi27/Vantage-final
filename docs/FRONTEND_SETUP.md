# Frontend Setup Guide

The frontend is a Next.js 16 application with React 19, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

## Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:5050
NEXT_PUBLIC_AI_URL=http://localhost:8000

# Optional: Analytics, monitoring, etc.
# NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API server URL (default: http://localhost:5050)
- `NEXT_PUBLIC_AI_URL`: AI server URL (default: http://localhost:8000)

Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Development Features

- Hot module replacement (HMR)
- Fast refresh for React components
- TypeScript type checking
- ESLint for code quality

## Building for Production

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── home/              # Home page (whiteboard list)
│   ├── chats/             # Chat history page
│   └── whiteboard/        # Whiteboard pages
│       ├── page.tsx       # Whiteboard list
│       ├── new/           # Create new whiteboard
│       └── [id]/          # Individual whiteboard
├── components/            # React components
│   ├── home/             # Home page components
│   ├── whiteboard/       # Whiteboard components
│   ├── icons/            # Icon components
│   └── MarkdownText.tsx  # Markdown renderer
├── lib/                  # Utilities
│   ├── api.ts           # API client functions
│   ├── types.ts         # TypeScript types
│   └── time.ts          # Time utilities
├── public/              # Static assets
└── package.json         # Dependencies
```

## Key Components

### Whiteboard Components

- `LeftPanel`: Sidebar with node list and controls
- `RightPanel`: AI chat interface
- `Toolbar`: Top toolbar with actions
- `CompanyCard`: Financial company display
- `InteractiveChart`: Stock price charts
- `MetricDisplay`: Financial metrics
- `MasterPrompt`: Global AI chat

### API Integration

The `lib/api.ts` file contains all API client functions:

```typescript
// Example usage
import { createWhiteboard, getWhiteboard } from '@/lib/api';

const board = await createWhiteboard('My Research');
const data = await getWhiteboard(board.id);
```

## Styling

The project uses Tailwind CSS 4 with a custom design system:

- Color palette: Stone (dark theme) with Orange accents
- Typography: System fonts with custom sizing
- Components: Utility-first approach
- Responsive: Mobile-first design

### Custom Styles

Global styles are in `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities and component styles */
```

## TypeScript

The project is fully typed with TypeScript. Key type definitions are in `lib/types.ts`:

```typescript
export interface Whiteboard {
  id: string;
  title: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

export interface Node {
  id: string;
  title: string;
  type: NodeType;
  x: number;
  y: number;
  data: any;
  messages?: Message[];
}
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel deploy --prod
```

3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - `NEXT_PUBLIC_AI_URL`: Your AI server URL

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Railway
- Render

Build command: `npm run build`
Start command: `npm start`
Output directory: `.next`

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
```

### Build Errors

Clear Next.js cache:

```bash
rm -rf .next
npm run build
```

### Type Errors

Regenerate TypeScript declarations:

```bash
npm run build
```

### Module Not Found

Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

- Images are optimized with Next.js Image component
- Code splitting is automatic with App Router
- CSS is optimized and minified in production
- API calls are cached where appropriate

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
