import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function callTogetherAPI(prompt: string) {
  if (!process.env.TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY is not defined in environment variables');
  }

  // Test the API key with a simple request
  try {
    console.log('Testing Together API key...');
    const testResponse = await fetch("https://api.together.xyz/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
      },
    });

    if (!testResponse.ok) {
      throw new Error(`API key test failed: ${testResponse.status} ${testResponse.statusText}`);
    }

    const models = await testResponse.json();
    console.log('Available models:', models);
  } catch (error) {
    console.error('Error testing Together API key:', error);
    throw new Error('Invalid Together API key or API service unavailable');
  }

  try {
    console.log('Calling Together API...');
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1", // Default model
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
      }),
    });

    let responseText;
    try {
      responseText = await response.text();
      console.log('Raw Together API response:', responseText);
    } catch (e) {
      console.error('Failed to read response text:', e);
      throw new Error('Failed to read API response');
    }

    if (!response.ok) {
      console.error('Together API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseText
      });
      throw new Error(`Together API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed Together API response:', data);
    } catch (e) {
      console.error('Failed to parse API response as JSON:', e);
      throw new Error('Invalid JSON response from Together API');
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message.content) {
      console.error('Invalid response format from Together API:', data);
      throw new Error('Invalid response format from Together API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Together API:', error);
    throw error;
  }
}

export async function analyzeSEO(url: string, keyword?: string): Promise<string> {
  try {
    const prompt = `Analyze the SEO of the following URL: ${url}${keyword ? `\nTarget keyword: ${keyword}` : ''}

Please provide a comprehensive SEO analysis including:
1. Technical SEO assessment
2. Content quality and relevance
3. On-page optimization
4. Mobile-friendliness
5. Page speed and performance
6. URL structure
7. Meta tags and descriptions
8. Heading structure
9. Image optimization
10. Internal linking
11. Social media integration
12. Priority fixes and recommendations

Format the response in markdown with clear sections and bullet points.`;

    return await callTogetherAPI(prompt);
  } catch (error) {
    console.error('Error in SEO analysis:', error);
    throw error;
  }
} 