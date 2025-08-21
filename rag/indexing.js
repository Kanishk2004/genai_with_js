import { config } from 'dotenv';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

config({ path: '../.env' });
// const client = new OpenAI();

const docIndexing = async () => {
	const pdfPath = './jsCheatsheet.pdf';
	const loader = new PDFLoader(pdfPath);

	// page by page load the pdf
	const docs = await loader.load();

	// ready the client openAI embedding model
	const embeddings = new OpenAIEmbeddings({
		model: 'text-embedding-3-small',
	});

	const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
		url: process.env.QDRANT_URL,
		collectionName: 'rag-application',
	});

	console.log('Indexing of PDF documents completed.');
};

docIndexing();
// const textSplitter = new RecursiveCharacterTextSplitter({
// 	chunkSize: 100,
// 	chunkOverlap: 0,
// });
// const texts = await textSplitter.splitText(docs[0].pageContent);

// const SYSTEM_PROMPT = `You are a helpful assistant.`;
