# Tale and Trail Web Application

A comprehensive web application for managing and playing Tale and Trail games. Features a themed player interface with time-limited access codes and a full administrative dashboard.

## Features

### Player Experience
- **Unique Access Codes**: Each player receives a unique code valid for 12 hours from first use
- **Sequential Puzzle Progression**: Players must complete puzzles in order to advance
- **Progressive Clue System**: Wrong answers reveal helpful clues progressively
- **Session Management**: Players can resume their game within the 12-hour window
- **Responsive Design**: Optimized for both mobile and desktop play
- **Themed Interface**: Dark pub crawl aesthetic with gold accents

### Admin Dashboard
- **Game Management**: Create, edit, and delete games with themes
- **Puzzle Management**: Add puzzles with riddles, clues, and answers in sequence
- **Access Code Generation**: Generate unique, time-limited codes for players
- **Usage Analytics**: Track code usage and game completion rates
- **Secure Authentication**: Password-protected admin access

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom pub theme
- **State Management**: Zustand with persistence
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account and project

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd pub-puzzle-crawl
   npm install
   ```

2. **Setup Supabase**
   - Create a new Supabase project
   - Click "Connect to Supabase" in the top right of the development environment
   - The database schema will be automatically applied

3. **Create Admin Account**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Users
   - Create a new user with email: `contact@taleandtrail.games`
   - Set a secure password for admin access

4. **Start Development**
   ```bash
   npm run dev
   ```

## Usage Guide

### For Administrators

1. **Access Admin Panel**
   - Navigate to `/admin`
   - Login with the admin credentials

2. **Create Games**
   - Go to "Games" section
   - Click "New Game" and fill in details
   - Choose appropriate theme (mystery, adventure, etc.)

3. **Add Puzzles**
   - Go to "Puzzles" section
   - Select a game and create puzzles in sequence
   - Add progressive clues that help players when they're stuck
   - Set the correct answer for each puzzle

4. **Generate Access Codes**
   - Go to "Access Codes" section
   - Select a game and generate codes
   - Each code is unique and valid for 12 hours from first use
   - Share codes with players

### For Players

1. **Start Playing**
   - Visit the main page
   - Enter your unique access code
   - Begin the puzzle adventure

2. **Solve Puzzles**
   - Read the riddle carefully
   - Submit your answer
   - Wrong answers reveal progressive clues
   - Complete puzzles to advance

3. **Resume Anytime**
   - Your progress is saved automatically
   - Return within 12 hours to continue where you left off

## Database Schema

The application uses the following main tables:

- **games**: Store game information and themes
- **puzzles**: Individual puzzles with clues and answers
- **access_codes**: Time-limited player access codes
- **player_sessions**: Track player progress and state
- **code_usage_logs**: Monitor code usage and analytics

## Customization

### Themes
Edit the Tailwind classes in components to change the visual theme:
- Primary colors: `amber-*` classes for pub theme
- Admin colors: `slate-*` classes for professional look

### Game Logic
Modify puzzle progression logic in `src/stores/gameStore.ts`:
- Change time limits
- Adjust clue revelation rules
- Customize completion criteria

### Content Management
All game content is managed through the admin interface:
- No code changes needed for new games/puzzles
- Visual themes can be selected per game
- Clues and answers are fully customizable

## Deployment

The application is ready for deployment to any static hosting service:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting service

3. **Environment Variables**
   - Supabase URL and keys are configured automatically
   - No additional environment setup required

## Security Features

- **Row Level Security**: Database access is properly secured
- **Time-based Expiration**: Access codes automatically expire
- **Admin Authentication**: Secure password protection
- **Session Management**: Proper user session handling
- **Input Validation**: All user inputs are validated

## Support

For issues or questions:
1. Check the admin dashboard for usage analytics
2. Review the code comments for customization guidance
3. Check Supabase logs for any database issues

## License

This project is ready for commercial use with proper attribution.