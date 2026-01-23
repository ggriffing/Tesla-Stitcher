# Local Setup Guide - Tesla Sentry Viewer

This guide explains how to set up and run the Tesla Sentry Viewer application on your local machine using IntelliJ IDEA, Node.js, PostgreSQL, and Python.

## Prerequisites

- **Node.js**: v20+ (You have v25.2.1)
- **PostgreSQL**: v15+ (You have v18.1)
- **Python**: v3.11+ (You have /opt/homebrew/bin/python3)
- **IntelliJ IDEA** (Ultimate recommended for better TypeScript/Database support)

## 1. Database Setup

Create a new PostgreSQL database for the project:

```bash
createdb tesla_viewer
```

Note your database connection string, which typically looks like:
`postgresql://USER:PASSWORD@localhost:5432/tesla_viewer`

## 2. Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/tesla_viewer
SESSION_SECRET=your_generated_secret_here
NODE_ENV=development
```

To test postgres access:

```shell
psql postgres
```

To generate a secure `SESSION_SECRET` on your Mac, you can run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it into your `.env` file.

## 3. Installation

Install Node.js dependencies:

```bash
npm install
```

Install Python dependencies for the SEI extractor:

```bash
pip3 install protobuf
```

## 4. Database Schema

Sync the database schema using Drizzle:

```bash
npx drizzle-kit push
```

## 5. Running the Application

### Option A: From Terminal (Recommended)

Start the development server (runs both backend and frontend):

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

### Option B: In IntelliJ IDEA

1. **Open Project**: File > Open > [Select the cloned directory]
2. **Setup Node.js Interpreter**: Settings > Languages & Frameworks > Node.js and NPM (Ensure it points to your v25.2.1)
3. **Run Configuration**:
   - Go to `Run` > `Edit Configurations...`
   - Click `+` and select `npm`
   - Set **Command** to `run`
   - Set **Scripts** to `dev`
   - Add the environment variables from your `.env` file to the "Environment" field.
   - Click `OK` and press the green Play button.

## 6. Troubleshooting

- **Metadata Extraction**: Note that when running locally, selecting a file through the browser does not automatically upload it to the server (to protect your bandwidth/storage). The SEI extractor requires the file to be present in the `attached_assets` directory. To process your own videos:
  1. Copy your `front.mp4` video to the `attached_assets` folder.
  2. The app will then be able to extract the telemetry successfully.
- **Python Path**: If the app can't find Python, ensure `python3` is in your system PATH.
- **PostgreSQL**: Ensure the service is running (`brew services start postgresql@18`).
- **FFmpeg**: The export feature requires FFmpeg. Install it via Homebrew: `brew install ffmpeg`.
