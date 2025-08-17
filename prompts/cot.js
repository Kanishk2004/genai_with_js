import 'dotenv/config';
import { OpenAI } from 'openai';
import { GoogleGenAI } from '@google/genai';

const openaiClient = new OpenAI();
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(text) {
	// Remove markdown code blocks if present
	let cleanText = text.trim();
	
	// Remove ```json and ``` markers
	if (cleanText.startsWith('```json')) {
		cleanText = cleanText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
	} else if (cleanText.startsWith('```')) {
		cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '');
	}
	
	return cleanText.trim();
}

async function judgeThinkingStep(
	originalQuery,
	conversationHistory,
	finalOutput
) {
	const JUDGE_PROMPT = `
	You are an AI judge evaluating the quality of a final answer in a chain-of-thought reasoning process.
	
	Original User Query: ${originalQuery}
	
	Conversation History: ${JSON.stringify(conversationHistory, null, 2)}
	
	Final Output: ${finalOutput}
	
	Your task is to evaluate if the final output:
	1. Correctly and completely answers the original query
	2. Is based on the logical reasoning shown in the conversation history
	3. Is practical and actionable (if applicable)
	4. Is clear and well-structured
	5. Contains accurate information
	
	Provide feedback in JSON format:
	{
		"evaluation": "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "POOR",
		"feedback": "Your detailed feedback on the final answer",
		"accuracy_score": "1-10 scale for accuracy",
		"suggestions": "Any suggestions for improvement (optional)"
	}
	`;

	try {
		const result = await geminiClient.models.generateContent({
			model: 'gemini-1.5-flash',
			contents: [{ parts: [{ text: JUDGE_PROMPT }] }],
		});

		// Fix: Access candidates directly from result, not result.response
		const rawResponse = result.candidates[0].content.parts[0].text;
		const cleanedResponse = extractJsonFromMarkdown(rawResponse);
		const judgeResponse = JSON.parse(cleanedResponse);

		return {
			step: 'EVALUATE',
			content: `Final Answer Judge: ${judgeResponse.evaluation} (Accuracy: ${judgeResponse.accuracy_score}/10) - ${judgeResponse.feedback}${
				judgeResponse.suggestions
					? '. Suggestions: ' + judgeResponse.suggestions
					: ''
			}`,
		};
	} catch (error) {
		console.error('Judge evaluation failed:', error);
		// Fallback to simple evaluation
		return {
			step: 'EVALUATE',
			content: 'Nice, You are going on correct path',
		};
	}
}

async function main() {
	const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK, EVALUATE and OUTPUT format.
    For a given user query, first think and breakdown the problem into smaller sub-problems.
    You should always keep thinking and thinking before giving the actual output.
    Also, before outputting the final answer, make sure to validate it against the original question.

    Rules:
    - Strictly follow the JSON format for output.
    - Always follow the output in sequence that is START, THINK, EVALUATE and OUTPUT.
    - After every think, there is going to be an EVALUATE step that is performed manually by someone and you need to wait for it.
    - Always perform only one step at a time and wait for other step.
    - Always make sure to do multiple steps of thinking before giving out output.

    Output JSON Format:
    { "step": "START | THINK | EVALUATE | OUTPUT", "content": "string" }

    Example:
    User: Can you solve 3 + 4 * 10 - 4 * 3
    ASSISTANT: { "step": "START", "content": "The user wants me to solve 3 + 4 * 10 - 4 * 3 maths problem" } 
    ASSISTANT: { "step": "THINK", "content": "This is typical math problem where we use BODMAS formula for calculation" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "Lets breakdown the problem step by step" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "As per bodmas, first lets solve all multiplications and divisions" }
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" }  
    ASSISTANT: { "step": "THINK", "content": "So, first we need to solve 4 * 10 that is 40" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "Great, now the equation looks like 3 + 40 - 4 * 3" }
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "Now, I can see one more multiplication to be done that is 4 * 3 = 12" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "Great, now the equation looks like 3 + 40 - 12" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "As we have done all multiplications lets do the add and subtract" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "so, 3 + 40 = 43" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "new equations look like 43 - 12 which is 31" } 
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" } 
    ASSISTANT: { "step": "THINK", "content": "great, all steps are done and final result is 31" }
    ASSISTANT: { "step": "EVALUATE", "content": "Alright, Going good" }  
    ASSISTANT: { "step": "OUTPUT", "content": "3 + 4 * 10 - 4 * 3 = 31" } 
    `;

	const messages = [
		{
			role: 'system',
			content: SYSTEM_PROMPT,
		},
		{
			role: 'user',
			content: 'Help me plan by trek to himalayas in nepal',
		},
	];

	const originalQuery = 'Help me plan by trek to himalayas in nepal';

	while (true) {
		const response = await openaiClient.chat.completions.create({
			model: 'gpt-4.1-mini',
			messages: messages,
		});

		const rawContent = response.choices[0].message.content;
		const parsedContent = JSON.parse(rawContent);

		messages.push({
			role: 'assistant',
			content: JSON.stringify(parsedContent),
		});

		if (parsedContent.step === 'START') {
			console.log(`🔥`, parsedContent.content);
			continue;
		}

		if (parsedContent.step === 'THINK') {
			console.log(`\t🧠`, parsedContent.content);

			// Simple evaluation for THINK steps (no judge needed)
			messages.push({
				role: 'user',
				content: JSON.stringify({
					step: 'EVALUATE',
					content: 'Nice, You are going on correct path',
				}),
			});

			continue;
		}

		if (parsedContent.step === 'OUTPUT') {
			console.log(`🤖`, parsedContent.content);

			// LLM as a judge technique - using Gemini to evaluate the final output
			console.log(`\t⚖️ Evaluating final answer...`);
			const judgeEvaluation = await judgeThinkingStep(
				originalQuery,
				messages.slice(0, -1), // Exclude the current assistant message
				parsedContent.content
			);

			console.log(`\t⚖️`, judgeEvaluation.content);
			break;
		}
	}

	console.log('All steps completed successfully!');
}

main();
