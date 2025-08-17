import 'dotenv/config';
import { OpenAI } from 'openai';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const client = new OpenAI();

const getWeatherDetailsByCity = async (cityname) => {
	const result = await fetch(
		`https://wttr.in/${cityname.toLowerCase()}?format=%C+%t`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
	const data = await result.text();
	return data;
};

const executeCmd = async (cmd) => {
	return new Promise((res, rej) => {
		// For Windows, use PowerShell for better compatibility
		exec(cmd, { shell: 'powershell.exe' }, (error, data) => {
			if (error) {
				return res(`Error running command: ${error.message}`);
			} else {
				res(data);
			}
		});
	});
};

const createFileWithContent = async (filePath, content) => {
	return new Promise((resolve, reject) => {
		try {
			const fullPath = path.resolve(filePath);
			const dir = path.dirname(fullPath);
			
			// Create directory if it doesn't exist
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			
			fs.writeFileSync(fullPath, content, 'utf8');
			resolve(`File created successfully at: ${fullPath}`);
		} catch (error) {
			resolve(`Error creating file: ${error.message}`);
		}
	});
};

const TOOL_MAP = {
	getWeatherDetailsByCity: getWeatherDetailsByCity,
	executeCmd: executeCmd,
	createFileWithContent: createFileWithContent,
};

async function main() {
	const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK, and OUTPUT formats.
    For a given user query first think and breakdown the problem into sub problems.
    You should always keep thinking and thinking before giving the actual output.
    
    Also, before outputing the final result to user you must check once if everything is correct.
    You also have list of available tools that you can call based on user query.
    
    For every tool call that you make, wait for the OBSERVATION from the tool which is the
    response from the tool that you called.

    Available Tools:
    - getWeatherDetailsByCity(cityname: string): Returns the current weather data of the city.
    - executeCmd(command: string): Executes a PowerShell command on user's Windows machine and returns the output.
    - createFileWithContent(filePath: string, content: string): Creates a file with the specified content at the given path.
      For this tool, use JSON input format: {"filePath": "path/to/file", "content": "file content here"}

    Important Notes:
    - You are running on a Windows system with PowerShell
    - Use PowerShell commands (not Linux/bash commands)
    - For creating files with content, use createFileWithContent tool instead of complex shell commands
    - File paths should use forward slashes or double backslashes

    Rules:
    - Strictly follow the output JSON format
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Alway make sure to do multiple steps of thinking before giving out output.
    - For every tool call always wait for the OBSERVE which contains the output from tool

    Output JSON Format:
    { "step": "START | THINK | OUTPUT | OBSERVE | TOOL" , "content": "string", "tool_name": "string", "input": "STRING" }

    Example:
    User: Hey, can you tell me weather of Patiala?
    ASSISTANT: { "step": "START", "content": "The user is intertested in the current weather details about Patiala" } 
    ASSISTANT: { "step": "THINK", "content": "Let me see if there is any available tool for this query" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available getWeatherDetailsByCity which returns current weather data" } 
    ASSISTANT: { "step": "THINK", "content": "I need to call getWeatherDetailsByCity for city patiala to get weather details" }
    ASSISTANT: { "step": "TOOL", "input": "patiala", "tool_name": "getWeatherDetailsByCity" }
    DEVELOPER: { "step": "OBSERVE", "content": "The weather of patiala is cloudy with 27 Cel" }
    ASSISTANT: { "step": "THINK", "content": "Great, I got the weather details of Patiala" }
    ASSISTANT: { "step": "OUTPUT", "content": "The weather in Patiala is 27 C with little cloud. Please make sure to carry an umbrella with you. ☔️" }`;

	const messages = [
		{ role: 'system', content: SYSTEM_PROMPT },
		{ role: 'user', content: 'Inside the folder named weather-app, create an index.html file with a beautiful weather application UI.' },
	];

	while (true) {
		const response = await client.chat.completions.create({
			model: 'gpt-4.1-mini',
			messages: messages,
		});

		const rawResponse = response.choices[0].message.content;
		const parsedResponse = JSON.parse(rawResponse);

		messages.push({
			role: 'assistant',
			content: JSON.stringify(parsedResponse),
		});

		if (parsedResponse.step === 'START') {
			console.log(`🔥`, parsedResponse.content);
			continue;
		}

		if (parsedResponse.step === 'THINK') {
			console.log(`\t🧠`, parsedResponse.content);
			continue;
		}

		if (parsedResponse.step === 'TOOL') {
			const toolToCall = parsedResponse.tool_name;
			if (!TOOL_MAP[toolToCall]) {
				messages.push({
					role: 'developer',
					content: `There is no such tool as ${toolToCall}`,
				});
				continue;
			}

			let responseFromTool;
			
			// Handle tools with different parameter structures
			if (toolToCall === 'createFileWithContent') {
				// Parse input as JSON for tools that need multiple parameters
				try {
					const params = JSON.parse(parsedResponse.input);
					responseFromTool = await TOOL_MAP[toolToCall](params.filePath, params.content);
				} catch (error) {
					responseFromTool = `Error parsing tool input: ${error.message}`;
				}
			} else {
				// Single parameter tools
				responseFromTool = await TOOL_MAP[toolToCall](parsedResponse.input);
			}
			
			console.log(
				`🛠️: ${toolToCall}(${typeof parsedResponse.input === 'object' ? JSON.stringify(parsedResponse.input) : parsedResponse.input}) = `,
				responseFromTool
			);
			messages.push({
				role: 'developer',
				content: JSON.stringify({ step: 'OBSERVE', content: responseFromTool }),
			});
			continue;
		}

		if (parsedResponse.step === 'OUTPUT') {
			console.log(`🤖`, parsedResponse.content);
			break;
		}
	}
	console.log('Done...');
}

main();
