import { config } from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAI } from 'openai';

config({ path: '../.env' });

const client = new OpenAI();

const chat = async () => {
	const userQuery = 'Explain scope and scope chain in JavaScript';

	const embeddings = new OpenAIEmbeddings({
		model: 'text-embedding-3-small',
	});

	const vectorStore = await QdrantVectorStore.fromExistingCollection(
		embeddings,
		{
			url: process.env.QDRANT_URL,
			collectionName: 'rag-application',
		}
	);

	const retriever = vectorStore.asRetriever(3);

	const relevantDocs = await retriever.invoke(userQuery);

	const SYSTEM_PROMPT = `
    You are an AI assistant who helps users find information in a PDF document.
    Your task is to provide concise and accurate answers based on the content of the document with the content and the page number.
    Only answer based on the available context from file only.
    context: ${JSON.stringify(relevantDocs)}`;

	const response = await client.chat.completions.create({
		model: 'gpt-4.1-mini',
		messages: [
			{
				role: 'system',
				content: SYSTEM_PROMPT,
			},
			{
				role: 'user',
				content: userQuery,
			},
		],
	});

	console.log(response.choices[0].message.content);
};

chat();
