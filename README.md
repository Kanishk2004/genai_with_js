# AI Mini Projects

A collection of mini projects where I explore and implement different AI concepts.
Each project is built with the goal of learning by doing — experimenting, breaking, and understanding how AI actually works in practice.

## 🎯 What's Inside

- **Hands-on implementations** of core AI concepts
- **Small, focused projects** instead of theory dumps  
- **A growing collection** as I keep learning

## 🚀 Projects

### 🤖 AI Agents
**Location:** `agents/`
- Implementation of AI agents using OpenAI and Google's Gemini
- Explores autonomous decision-making and task execution

### 💬 Prompt Engineering  
**Location:** `prompts/`
- Chain of Thought (CoT) prompting techniques
- Advanced prompting strategies and patterns

### 📚 RAG (Retrieval-Augmented Generation)
**Location:** `rag/`
- PDF document processing and indexing
- Vector database integration with Qdrant
- Chat interface for document Q&A
- Includes JavaScript cheatsheet as sample data

## 🛠️ Tech Stack

- **Runtime:** Node.js with ES Modules
- **AI Models:** OpenAI GPT, Google Gemini
- **Framework:** LangChain
- **Vector Database:** Qdrant
- **Document Processing:** PDF parsing capabilities

## 📦 Dependencies

```json
{
  "@google/genai": "^1.14.0",
  "@langchain/community": "^0.3.53", 
  "@langchain/core": "^0.3.72",
  "@langchain/openai": "^0.6.9",
  "@langchain/qdrant": "^0.1.3",
  "openai": "^5.12.2",
  "pdf-parse": "^1.1.1"
}
```

## ⚙️ Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kanishk2004/genai_with_js.git
   cd genai_with_js
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_google_api_key_here
   ```

4. **Run Projects**
   Navigate to any project directory and run:
   ```bash
   # For agents
   cd agents && node agent.js
   
   # For prompts  
   cd prompts && node cot.js
   
   # For RAG
   cd rag && node chat.js
   ```

## 🎯 Goals

- ✅ **Strengthen fundamentals** in AI and machine learning
- 📝 **Document my learning journey** through practical implementations  
- 🏗️ **Build a solid foundation** for larger AI projects in the future
- 🔬 **Experiment with different AI concepts** in a hands-on manner

## 🚧 Work in Progress

This repository is actively growing as I continue learning and exploring new AI concepts. Each project is a stepping stone toward building more complex AI applications.

## 📖 Learning Resources

- OpenAI API Documentation
- LangChain Documentation  
- Google AI Documentation
- Vector Database Concepts

## 🤝 Contributing

This is a personal learning repository, but feel free to:
- Open issues for suggestions
- Share ideas for new mini-projects
- Provide feedback on implementations

## 📄 License

ISC License - Feel free to learn from and adapt these implementations for your own learning journey.

---

**Author:** Kanishk Chandna  
**Focus:** Learning AI through practical implementation
