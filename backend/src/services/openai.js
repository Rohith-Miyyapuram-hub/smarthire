const OpenAI = require('openai')

// Singleton OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Chat completion returning parsed JSON object
async function chatJSON(systemPrompt, userPrompt, model = 'gpt-4o-mini') {
  const response = await openai.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    temperature: 0.3,
  })
  return JSON.parse(response.choices[0].message.content)
}

// Chat completion returning plain text
async function chatText(systemPrompt, userPrompt, model = 'gpt-4o-mini') {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    temperature: 0.6,
  })
  return response.choices[0].message.content.trim()
}

module.exports = { openai, chatJSON, chatText }
