# Immergo - Immersive Language Learning with Live API

[![GitHub stars](https://img.shields.io/github/stars/ZackAkil/immersive-language-learning-with-live-api?style=social)](https://github.com/ZackAkil/immersive-language-learning-with-live-api/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ZackAkil/immersive-language-learning-with-live-api?style=social)](https://github.com/ZackAkil/immersive-language-learning-with-live-api/network/members)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini Live API](https://img.shields.io/badge/Google%20Gemini%20Live%20API-8E75B2?style=flat&logo=google&logoColor=white)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api)
[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/ZackAkil/immersive-language-learning-with-live-api)


## **[Try it now at immergo.app](https://immergo.app/)**

Immergo is an immersive language learning application powered by the Google Gemini Live SDK. It simulates real-world roleplay scenarios (e.g., buying a bus ticket, ordering coffee) to help users practice speaking in various languages with an AI that acts as a native speaker.


![Immergo Screenshot](screenshot.png)

## Features

-   **Missions & Roleplay**: Choose from structured scenarios with specific objectives.
-   **Learning Modes**:
    -   **Teacher Mode**: Get helpful explanations and translations in your native language.
    -   **Immersive Mode**: Strict "No Free Rides" policy where you must speak the target language to proceed.
-   **Native Language Support**: Select your native language for tailored feedback and assistance.
-   **Proactive AI Persona**: The AI adopts a specific role (e.g., "Bus Driver", "Friendly Neighbor"). And will only speak when necessary.
-   **Real-time Multimodal Interaction**: Speak naturally with the AI, which responds with low-latency audio.
-   **Performance Scoring**: Get graded on your fluency (Tiro, Proficiens, Peritus) with actionable feedback (Immersive Mode).

## Tech Stack

-   **Frontend**: Vanilla JavaScript, Vite, Web Audio API, WebSocket.
-   **Backend**: Python, FastAPI, `google-genai` SDK.
-   **Communication**: WebSocket for full-duplex audio streaming.

## Prerequisites

-   Node.js (v18+)
-   Python (v3.10+)
-   Google Cloud Project with Vertex AI enabled.
-   Google Cloud Application Default Credentials configured.

## Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd immersive-language-learning-with-live-api
```

### 2. Quick Install
Run the installation script to set up both backend (Python venv) and frontend (Node modules) dependencies:
```bash
./install.sh
```

### 3. Environment Config
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Update `.env` with your Google Cloud details if necessary.

## Running the Application

### Development (Hot-Reload)
Start both the backend server and frontend development server with a single command:
```bash
./dev.sh
```
This will:
- Start the Python backend on port 8000.
- Start the Vite frontend dev server (usually port 5173).
- Enable `DEV_MODE` (bypassing Redis/ReCAPTCHA).
- Allow you to access the app at `http://localhost:5173`.

### Production Build
To serve the built frontend via the Python server:

1.  **Build**:
    ```bash
    npm run build
    ```
2.  **Run Server**:
    ```bash
    python3 server/main.py
    ```
3.  Access at `http://localhost:8000`.

### Production Deployment (Google Cloud Run)

To deploy this application to Google Cloud Run, you can use the provided `deploy.sh` script as a clear reference for the necessary `gcloud` commands and environment configurations.

1.  **Configure `deploy.sh`**:
    Open `deploy.sh` and update the configuration variables at the top of the file to match your Google Cloud project details:
    ```bash
    PROJECT_ID="your-project-id"
    REGION="us-central1"
    SERVICE_NAME="your-service-name"
    # ... update other variables as needed
    ```

2.  **Deploy**:
    Run the script to build the frontend and deploy the service:
    ```bash
    ./deploy.sh
    ```


### Advanced Configuration

To enable production features like metrics, bot protection, and scalable rate limiting, configure the following environment variables (defined in `server/simple_tracker.py` and `server/main.py`):

#### 1. BigQuery Metrics
To track session start and page view events in BigQuery:
-   `BQ_DATASET`: Your BigQuery Dataset ID.
-   `BQ_TABLE`: Your BigQuery Table ID.
-   `DEMO_NAME`: (Optional) Name to identify this app in the metrics (default: `your-app-name`).

#### 2. reCAPTCHA v3
To protect against bots:
-   `RECAPTCHA_SITE_KEY`: Your Google reCAPTCHA v3 site key.
    -   *Note: Ensure your Cloud Run URL is added to the allowed domains in the reCAPTCHA console.*

#### 3. Redis (Rate Limiting)
For scalable rate limiting across multiple container instances:
-   `REDIS_URL`: The URL of your Redis instance (e.g., `redis://10.0.0.1:6379/0`).
    -   *Note: If using Memorystore for Redis, ensure your Cloud Run service is connected to the same VPC network.*



