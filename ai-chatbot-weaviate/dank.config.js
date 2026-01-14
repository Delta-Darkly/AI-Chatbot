/**
 * Dank Agent Configuration
 * 
 * This file defines your AI agents and their configurations.
 * Run 'dank run' to start all defined agents.
 * 
 * IMPORTANT: Agent IDs (UUIDv4)
 * ==============================
 * Each agent has a unique UUIDv4 identifier that is generated when you initialize
 * your project. These IDs are used to identify and track your agents.
 * 
 * - You can generate new UUIDv4s if needed (use: require('uuid').v4())
 * - Once agents register with Dank Cloud services using these IDs, they become
 *   locked in and owned by your account
 */

// Import npm packages at the top - they'll be available in handlers
const dotenv = require('dotenv').config();
const weaviate = require('weaviate-ts-client');

const { createAgent } = require('dank-ai');

// Agent IDs - Generated UUIDv4 identifiers for each agent
// These IDs are used to uniquely identify your agents across deployments
const AGENT_IDS = {
  PROMPT_AGENT: '7b01b739-ed8b-4a8b-aa0c-20979858eeb5'
};

module.exports = {
  // Project configuration
  name: 'ai-chatbot-weaviate',
  
  // Define your agents
  // Each agent can have custom Docker image configuration for production builds
  agents: [
    // Example 1: Direct Prompting Agent with Event Handlers
    createAgent('prompt-agent')
      .setId(AGENT_IDS.PROMPT_AGENT) // Required: Unique UUIDv4 identifier (make this changeable before publishing)
      .setLLM('openai', {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      })
      .setPrompt(`You are a knowledgeable and helpful AI assistant. Default to concise, to‑the‑point answers unless the user explicitly asks for more detail. When they request depth, provide thorough, structured explanations.

Communication Style:
- Be conversational, friendly, and approachable
- Provide succinct answers by default; add detail only when the user asks for it
- When asked for details or elaboration, expand on your previous response with new information
- Avoid repeating information you've already provided in the conversation
- If you need to reference something you said earlier, do so briefly and then add new details
- Use clear, well-structured explanations with examples when helpful
- Break down complex topics into digestible parts

Response Guidelines:
- Match the depth of your response to the user's question and follow-up requests
- If a user asks for more detail, provide substantially more information, not just a rephrasing
- If the user does NOT ask for detail, keep the response brief and focused
- When uncertain, acknowledge it and provide the best information you can
- If the conversation history is relevant, reference it naturally without repeating verbatim

FORMATTING RULES:
- You may use numbered lists (1. 2. 3.) and bullet points with dashes (-) for clarity
- You can use use bold (**text**), but no other markdown formatting
- Write in plain text with regular paragraphs separated by blank lines
- Use simple line breaks between paragraphs for readability

Remember: Your responses should be informative, helpful, and tailored to what the user is actually asking for.`)
      .setBaseImage('nodejs-20')
      .setPromptingServer({
        port: 3000
      })
      .setInstanceType('small')
      // Event handlers for prompt modification and response enhancement
      .addHandler('request_output:start', async (data) => {
        const { handleRequestOutputStart } = require('./weaviate-handlers');
        console.log('[Prompt Agent] request_output:start data:', data);
        return await handleRequestOutputStart(data);
      })
      .addHandler('request_output', (data) => {
        console.log('\n[Prompt Agent] Prompt received:\n', data.prompt);
        console.log('\n[Prompt Agent] Prompt actually used by LLM:\n', data.finalPrompt);
        console.log('\n[Prompt Agent] LLM Response:\n', data.response);
      })
      .addHandler('request_output:end', async (data) => {
        const { handleRequestOutputEnd } = require('./weaviate-handlers');
        return await handleRequestOutputEnd(data);
      })
      .addHandler('request_output:error', (data) => {
        console.error('[Prompt Agent] Error processing prompt:', data.error);
      })
      .addHandler('output', (data) => {
        console.log('[Prompt Agent] System output:', data);
      })
      .addHandler('error', (error) => {
        console.error('[Prompt Agent] System error:', error);
      })
  ]
};
