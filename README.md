# 🚀 Blueprint AI (WebCraft)

> An intelligent, full-stack AI-powered website builder that generates, previews, versions, and exports modern React web applications using cutting-edge LLMs.

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Configuration](#2-backend-configuration)
  - [3. Frontend Configuration](#3-frontend-configuration)
- [API Reference](#-api-reference)
- [Supported AI Models](#-supported-ai-models)
- [Security & Environment Variables](#-security--environment-variables)
- [Contributing & License](#-license)

---

## 🌟 Overview

**Blueprint AI** is an end-to-end platform enabling users to describe websites via natural language prompts and instantly generate functional React code with live previewing, version history, in-browser code editing, and GitHub repository export.

---

## ✨ Key Features

- **Multi-Model AI Generation**: Supports Google Gemini, Anthropic Claude, OpenAI GPT, DeepSeek, and Grok.
- **Interactive Code Editor & Live Preview**: Real-time sandboxed preview alongside Monaco/CodeMirror code editor.
- **Granular Version Control**: Every prompt generation or manual edit creates an immutable project snapshot (`v0`, `v1`, etc.) with 1-click rollback.
- **Credit & Tier System**: Tiered access (Free vs. Pro) with credit deduction per model generation.
- **GitHub Integration**: Direct OAuth connection to push generated projects straight to GitHub repositories.
- **Responsive Device Switcher**: Test generated apps instantly across Mobile, Tablet, and Desktop viewports.

---

## 🏗️ System Architecture

```text
[ Browser / React 19 Frontend ]
             |
             v  HTTP / REST (Port 3000 -> 8080)
[ Spring Boot 3.4.5 Backend ]
       |         |         |
       v         v         v
 [ MySQL 8 ] [ Disk Storage ] [ AI Providers ]
 (Users/Proj) (Project Files) (Gemini / Claude / GPT)
```

---

## 📁 Repository Structure

```text
Major_Project/
├── backend/                  # Spring Boot 3.4.5, Java 21, MySQL backend
│   ├── src/                  # Main and test source code
│   ├── pom.xml               # Maven project object model
│   ├── .env.example          # Template for backend secrets
│   └── .gitignore            # Backend ignore rules
├── frontend/                 # React 19, Vite 6, Tailwind CSS frontend
│   ├── src/                  # React components, pages, hooks, state
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies and scripts
│   ├── vite.config.js        # Vite build configuration
│   ├── .env.example          # Template for frontend environment
│   └── .gitignore            # Frontend ignore rules
├── .gitignore                # Global workspace gitignore
├── README.md                 # Project documentation
└── TESTING_README.md         # Detailed testing & verification guide
```

---

## 🛠️ Tech Stack

### Backend
- **Language**: Java 21
- **Framework**: Spring Boot 3.4.5
- **Security**: Spring Security 6 with JWT (JSON Web Tokens)
- **Database**: MySQL 8+ with Spring Data JPA / Hibernate
- **AI Integration**: Custom HTTP Clients for Gemini, Anthropic, OpenAI, DeepSeek, and Grok

### Frontend
- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS + Radix UI primitives
- **Icons**: Lucide React
- **HTTP Client**: Axios with custom auth interceptors
- **Theme**: Light & Dark mode support

---

## 📋 Prerequisites

Before running the project locally, ensure you have installed:
- **Java 21 JDK** (e.g., Eclipse Temurin, Oracle JDK)
- **Maven 3.9+**
- **Node.js 20+** and **npm**
- **MySQL 8.0+**
- At least one AI Provider API Key (Google AI recommended: [Google AI Studio](https://aistudio.google.com/))

---

## 🚀 Getting Started

### 1. Database Setup

Ensure MySQL is running, then create the database:

```sql
CREATE DATABASE IF NOT EXISTS blueprint_ai 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

---

### 2. Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and fill in your database credentials and API key:
   ```env
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=your_minimum_32_characters_random_secret_key
   GOOGLE_AI_API_KEY=your_gemini_api_key
   ```

4. Run the backend server:
   ```bash
   mvn spring-boot:run
   ```
   *The backend will start at `http://localhost:8080`.*

---

### 3. Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the sample environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:3000` (or `http://localhost:5173`).*

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login and obtain JWT | ❌ |
| `GET` | `/api/auth/me` | Current authenticated user profile | ✅ |
| `GET` | `/api/credits` | Check current user credits & plan | ✅ |
| `GET` | `/api/projects` | List all projects for user | ✅ |
| `POST` | `/api/projects` | Create a new project | ✅ |
| `GET` | `/api/projects/{id}/files` | Get project files at current version | ✅ |
| `GET` | `/api/projects/{id}/versions` | List all versions for project | ✅ |
| `POST` | `/api/projects/{id}/versions` | Save a manual or AI project version | ✅ |
| `POST` | `/api/chat` | Send prompt to AI and stream/generate code | ✅ |
| `GET` | `/health` | Health check probe | ❌ |

---

## 🤖 Supported AI Models

| Model | Provider | Tier | Default Credit Cost |
|---|---|---|---|
| `gemini-3.1-flash` | Google AI | Free / Pro | 1 credit |
| `claude-3-7-sonnet` | Anthropic | Pro | 3 credits |
| `gpt-4o` | OpenAI | Pro | 3 credits |
| `deepseek-chat` | DeepSeek | Pro | 2 credits |
| `grok-2` | xAI | Pro | 2 credits |

---

## 🔐 Security & Environment Variables

> [!IMPORTANT]
> Never commit actual `.env` or `.env.local` files to version control. They are strictly ignored via `.gitignore`. Always use `.env.example` as a template for team members and deployment pipelines.

---

## 📄 License

This project is created for academic and educational purposes under the Major Project curriculum. All rights reserved.
