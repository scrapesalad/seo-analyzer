export async function callTogetherAPI(prompt: string) {
  if (!process.env.TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY is not defined in environment variables');
  }

  // Define our model preferences in order
  const modelPreferences = [
    "mistralai/Mixtral-8x7B-Instruct-v0.1",
    "meta-llama/Llama-2-70b-chat-hf",
    "meta-llama/Llama-2-13b-chat-hf",
    "togethercomputer/llama-2-70b",
    "togethercomputer/llama-2-13b"
  ];

  let selectedModel = modelPreferences[0]; // Default to first preference

  // Test the API key and get available models
  try {
    console.log('Testing Together API key and fetching models...');
    const testResponse = await fetch("https://api.together.xyz/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('API key test failed:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        error: errorText
      });
      throw new Error(`API key test failed: ${testResponse.status} ${testResponse.statusText} - ${errorText}`);
    }

    const models = await testResponse.json();
    
    // Validate models response
    if (!Array.isArray(models)) {
      console.warn('Unexpected models response format:', typeof models);
    } else {
      const modelNames = models
        .filter((m: any) => m && typeof m === 'object' && typeof m.name === 'string')
        .map((m: any) => m.name);
      
      if (modelNames.length === 0) {
        console.warn('No valid models found in response, using default model');
      } else {
        console.log('Available models:', modelNames.join(', '));
        
        // Find the first available model from our preferences
        selectedModel = modelPreferences.find(model => modelNames.includes(model)) || selectedModel;
        console.log('Selected model:', selectedModel);
      }
    }
  } catch (error) {
    console.error('Error fetching models list:', error);
    console.log('Proceeding with default model:', selectedModel);
  }

  // Helper function to parse rate limit headers
  const parseRateLimitHeaders = (headers: Headers) => {
    return {
      remaining: parseInt(headers.get('x-ratelimit-remaining') || '0'),
      remainingTokens: parseInt(headers.get('x-ratelimit-remaining-tokens') || '0'),
      reset: parseInt(headers.get('x-ratelimit-reset') || '0'),
      retryAfter: parseInt(headers.get('retry-after') || '0')
    };
  };

  // Helper function to wait with exponential backoff
  const wait = async (attempt: number, rateLimitInfo?: { reset?: number, retryAfter?: number }) => {
    const baseDelay = rateLimitInfo?.retryAfter ? rateLimitInfo.retryAfter * 1000 : 1000;
    const maxDelay = 30000; // Maximum delay of 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    console.log(`Waiting ${delay/1000} seconds before retry ${attempt}...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  };

  try {
    // Log the prompt structure
    console.log('Analyzing prompt structure:', {
      length: prompt.length,
      hasURL: prompt.includes('http'),
      sections: prompt.split('\n').length,
      preview: prompt.substring(0, 100) + '...'
    });

    const requestBody = {
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: `You are an SEO expert. Provide detailed SEO analysis in a clear, structured markdown format.

Format your response EXACTLY as follows:

# SEO Analysis for [URL]

[2-3 sentence introduction about the analysis scope]

## Content Depth and Quality
**Analysis:**
- [Point about content comprehensiveness]
- [Point about content freshness]
- [Point about user engagement elements]

**Action Items:**
- ✅ [Specific, actionable recommendation]
- ✅ [Specific, actionable recommendation]
- ✅ [Specific, actionable recommendation]

## URL Structure
**Analysis:**
- [Point about URL format]
- [Point about keyword usage in URLs]

**Action Items:**
- ✅ [Specific, actionable recommendation]
- ✅ [Specific, actionable recommendation]

## H1 Title Tag
**Analysis:**
- [Point about current title tags]
- [Point about keyword optimization]

**Action Items:**
- ✅ [Specific, actionable recommendation]
- ✅ [Specific, actionable recommendation]

## Internal Links
**Analysis:**
- [Point about internal linking structure]
- [Point about navigation hierarchy]

**Action Items:**
- ✅ [Specific, actionable recommendation]
- ✅ [Specific, actionable recommendation]

## Meta Description
**Analysis:**
- [Point about current meta descriptions]
- [Point about click-through potential]

**Action Items:**
- ✅ [Specific, actionable recommendation]
- ✅ [Specific, actionable recommendation]

## Readability
**Analysis:**
- [Point about content structure]
- [Point about reading level]

**Action Items:**
- ✅ [Specific, actionable recommendation]
- ✅ [Specific, actionable recommendation]

## Priority Recommendations
1. 🚀 [High-impact recommendation]
2. 🚀 [High-impact recommendation]
3. 🚀 [High-impact recommendation]

Each section must:
- Start with clear analysis points
- Include specific, actionable recommendations
- Use bullet points for better readability
- Include relevant emojis for visual hierarchy`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
      top_p: 0.9,
      repetition_penalty: 1.1,
      stop: ["</s>", "###"]
    };

    console.log('Request configuration:', {
      model: requestBody.model,
      maxTokens: requestBody.max_tokens,
      temperature: requestBody.temperature,
      systemPromptLength: requestBody.messages[0].content.length,
      userPromptLength: requestBody.messages[1].content.length
    });

    // Add retry logic for API calls with exponential backoff
    let retries = 5; // Increased retries
    let lastError = null;
    let rateLimitInfo = null;

    while (retries > 0) {
      try {
        const response = await fetch("https://api.together.xyz/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        });

        // Parse rate limit information
        rateLimitInfo = parseRateLimitHeaders(response.headers);
        console.log('Rate limit info:', rateLimitInfo);

        // Log response headers
        console.log('API Response headers:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Check if we're rate limited
          if (response.status === 429) {
            console.log('Rate limited, will retry after delay');
            await wait(6 - retries, rateLimitInfo);
            retries--;
            continue;
          }
          
          throw new Error(`Together API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format: not a valid JSON object');
        }

        if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
          throw new Error('Invalid response format: missing or empty choices array');
        }

        const firstChoice = data.choices[0];
        if (!firstChoice?.message?.content) {
          throw new Error('Invalid response format: missing content in response');
        }

        const content = firstChoice.message.content.trim();
        
        // Log content structure with improved section detection
        const sections = content.match(/(?:^|\n)#+\s+.*$/gm) || [];
        const numberedSections = content.match(/(?:^|\n)\d+\.\s+\*\*.*\*\*$/gm) || [];
        const boldSections = content.match(/(?:^|\n)\*\*.*\*\*$/gm) || [];
        
        const contentStats = {
          length: content.length,
          hasMarkdown: content.includes('#') || content.includes('**'),
          sections: sections.length,
          numberedSections: numberedSections.length,
          boldSections: boldSections.length,
          totalSections: sections.length + numberedSections.length + boldSections.length,
          bulletPoints: content.split('\n-').length - 1,
          firstLine: content.split('\n')[0],
        };

        console.log('Content structure analysis:', {
          ...contentStats,
          sectionHeaders: [...sections, ...numberedSections, ...boldSections].slice(0, 5),
          preview: content.substring(0, 200) + '...'
        });

        // Check if we got a partial response with more flexible section detection
        const hasMinimumContent = 
          contentStats.length >= 1000 && // Minimum length
          contentStats.hasMarkdown && // Has markdown formatting
          contentStats.totalSections >= 3 && // Has multiple sections (any format)
          contentStats.bulletPoints >= 10 && // Has sufficient bullet points
          content.toLowerCase().includes('seo analysis'); // Has proper title

        if (!hasMinimumContent) {
          console.log('Received partial or incomplete response:', contentStats);
          if (retries > 0) {
            await wait(6 - retries, rateLimitInfo);
            retries--;
            continue;
          }
        }

        return content;
      } catch (error) {
        lastError = error;
        console.error('API call attempt failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          retriesLeft: retries - 1
        });
        
        retries--;
        if (retries > 0) {
          await wait(6 - retries, rateLimitInfo);
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Failed to get response from Together API after multiple attempts');
  } catch (error) {
    console.error('Error in Together API call:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    throw error;
  }
}

export async function analyzeSEO(url: string, keyword?: string): Promise<string> {
  try {
    const prompt = `Analyze the SEO of the following URL: ${url}${keyword ? `\nTarget keyword: ${keyword}` : ''}

Please provide a comprehensive SEO analysis in the following format:

# SEO Analysis for ${url}

This analysis evaluates the website's SEO performance, focusing on content quality, technical SEO, and user experience.

## Content Depth and Quality
- Comprehensiveness: The website provides information about the Cold Turkey Run event, but lacks depth in topics such as history, past results, and training tips.
- User Engagement: There is room for improvement in adding user engagement elements like comments or social sharing buttons.
- Update Frequency: The website appears to have static content with no recent updates.

Action Items:
✅ Add in-depth content about the event history, past results, and training tips
✅ Implement user engagement elements like comments or social sharing buttons
✅ Regularly update the website with new blog posts or news related to the event

## URL Structure
- The URL structure is simple and easy to understand, but it does not include any target keywords.

Action Items:
✅ Incorporate target keywords in the URLs where appropriate

## H1 Title Tag
- The website has a clear and descriptive title tag, but there is room for improvement in keyword optimization.

Action Items:
✅ Optimize the title tag by including target keywords at the beginning

## Internal Links
- [Analysis of internal linking structure]
- [Analysis of navigation hierarchy]

Action Items:
✅ [Specific action item for internal linking]
✅ [Specific action item for navigation]

## Meta Description
- [Analysis of current meta descriptions]
- [Analysis of click-through potential]

Action Items:
✅ [Specific action item for meta description]
✅ [Specific action item for CTR improvement]

## Readability
- [Analysis of content structure]
- [Analysis of reading level]

Action Items:
✅ [Specific action item for readability]
✅ [Specific action item for content structure]

## Priority Recommendations
1. [High-impact recommendation]
2. [High-impact recommendation]
3. [High-impact recommendation]

## Semantic Keywords
Based on the content and target keyword, here are recommended semantic keywords:
- [Semantic keyword 1]
- [Semantic keyword 2]
- [Semantic keyword 3]
- [Semantic keyword 4]
- [Semantic keyword 5]

Final Verdict:
[Summary of key findings and priority recommendations]`;

    return await callTogetherAPI(prompt);
  } catch (error) {
    console.error('Error in SEO analysis:', error);
    throw error;
  }
} 