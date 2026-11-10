# SarifUi

# Transparency in Coverage Explorer – Frontend

## Overview

This project is the React frontend for the Transparency in Coverage (TiC) Explorer application.

It provides an interface for users to:

- Browse available healthcare insurance plans.
- Select a plan and load its associated in-network pricing data.
- Monitor the data ingestion status.
- Search healthcare pricing records by billing code and description.
- View negotiated rates, billing classes, and pricing information.
- Compare negotiated prices across providers and billing categories.

The frontend communicates with a Django backend API that handles machine-readable file processing, caching, and search functionality.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Fetch API

## Requirements

Make sure you have the following installed:

- Node.js 22 LTS or newer supported LTS version
- npm

Check your installed versions:

```bash
node -v
npm -v
```

## 1. Clone the repository

```bash
git clone https://github.com/kbrien11/SarifUi.git
cd SarifUi
```

## 2. Install dependencies

Install the required Node.js packages:

```bash
npm install
```

## 3. Configure the backend API URL

The frontend needs to communicate with the Django backend.

In `src/components/TransparencyExplorer.tsx`, configure the API URL:

```tsx
const API_URL = "http://127.0.0.1:8001/api";
```

Make sure the Django backend is running on port `8001`.

If you deploy the backend, update this URL to point to the deployed API.

## 4. Start the development server

Run:

```bash
npm run dev
```

Vite will start the frontend development server.

By default, the application will be available at:

```text
http://localhost:5173
```

## 5. Running the application locally

Both the frontend and backend need to be running.

Open two terminal windows.

**Terminal 1 – Django backend**

Navigate to the Django backend directory, activate its virtual environment, and run:

```bash
source venv/bin/activate
python manage.py runserver 8001
```

**Terminal 2 – React frontend**

Navigate to the `