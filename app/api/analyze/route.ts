import { NextResponse } from "next/server";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not defined in environment variables');
}

if (!process.env.TOGETHER_API_KEY) {
  throw new Error('TOGETHER_API_KEY is not defined in environment variables');
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

async function callAnthropicAPI(prompt: string) {
  try {
    console.log('Sending request to Anthropic API...');
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Check if it's a credit-related error
      if (response.status === 402 || errorText.includes('credit') || errorText.includes('quota')) {
        throw new Error('CREDIT_ERROR');
      }
      
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Anthropic API Response:', data);

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Invalid response format from Anthropic API:', data);
      throw new Error('Invalid response format from Anthropic API');
    }

    return data.content[0].text;
  } catch (error) {
    if (error instanceof Error && error.message === 'CREDIT_ERROR') {
      throw error;
    }
    console.error('Error calling Anthropic API:', error);
    throw new Error('Failed to call Anthropic API');
  }
}

async function callTogetherAPI(prompt: string) {
  try {
    console.log('Calling Together API...');
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Together API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Together API Response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message.content) {
      console.error('Invalid response format from Together API:', data);
      throw new Error('Invalid response format from Together API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Together API:', error);
    throw new Error('Failed to call Together API');
  }
}

export async function POST(request: Request) {
  try {
    const { url, keyword } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Main analysis prompt for Claude
    const mainPrompt = `
    Analyze the website ${url}${keyword ? ` focusing on the keyword "${keyword}"` : ""} and provide a detailed SEO analysis in the following format:

    Here's a detailed SEO analysis for **${url.replace(/^(https?:\/\/)?(www\.)?/, '')}**${keyword ? ` with the keyword **"${keyword}"**` : ''}:

    ---

    ### **🔍 SEO Analysis Report**  
    **URL:** [${url.replace(/^(https?:\/\/)?(www\.)?/, '')}](${url})  
    ${keyword ? `**Target Keyword:** "${keyword}"  
  
    **Keyword Optimization Opportunities:**
    - Analyze current keyword density and placement
    - Check keyword variations and LSI keywords
    - Evaluate keyword competitiveness
    - Suggest long-tail keyword opportunities` : ''}  

    ---

    ### **1. Content Depth and Quality**  
    **Assessment:**  
    - Analyze content comprehensiveness${keyword ? `\n  - Check keyword usage in main content\n  - Evaluate semantic relevance to "${keyword}"\n  - Review competitor content for this keyword` : ''}
    - Check for user-generated content
    - Evaluate content update frequency
    
    **Action Items:**  
    ✅ List specific content improvements${keyword ? `\n✅ Suggest keyword-optimized content sections\n✅ Recommend content clusters around "${keyword}"` : ''}
    ✅ Suggest content additions
    ✅ Recommend content strategy changes

    ---

    ### **2. URL Structure**  
    **Assessment:**  
    - Evaluate current URL structure${keyword ? `\n  - Check keyword presence in URLs\n  - Analyze URL optimization for "${keyword}"` : ''}
    - Check for keyword inclusion
    - Analyze subpage naming conventions
    
    **Action Items:**  
    ✅ Suggest URL optimizations${keyword ? ` incorporating "${keyword}"\n✅ Recommend URL structure for topic clusters` : ''}
    ✅ Recommend structure improvements
    
    ---

    ### **3. H1 Title Tag**  
    **Assessment:**  
    - Review current H1 usage
    - Check keyword placement
    - Evaluate title effectiveness
    
    **Action Items:**  
    ✅ Provide specific title improvements${keyword ? ` with "${keyword}" placement\n✅ Suggest H1 variations using keyword modifiers` : ''}
    ✅ Suggest alternative formats
    
    ---

    ### **4. Internal Links**  
    **Assessment:**  
    - Analyze internal linking structure${keyword ? `\n  - Check keyword usage in anchor text\n  - Evaluate topic cluster linking` : ''}
    - Check anchor text usage
    - Evaluate link relevance
    
    **Action Items:**  
    ✅ Suggest new internal links${keyword ? ` for "${keyword}" topic cluster` : ''}
    ✅ Recommend anchor text improvements${keyword ? ` using keyword variations` : ''}
    
    ---

    ### **5. Meta Description**  
    **Assessment:**  
    - Review current meta description${keyword ? `\n  - Check keyword placement in meta\n  - Analyze click-through potential for "${keyword}"` : ''}
    - Check for keywords and CTAs
    - Evaluate effectiveness
    
    **Action Items:**  
    ✅ Provide optimized meta description${keyword ? ` incorporating "${keyword}"\n✅ Suggest compelling CTAs for search intent` : ''}
    ✅ Include clear CTAs
    
    ---

    ### **6. Readability**  
    **Assessment:**  
    - Evaluate content structure${keyword ? `\n  - Check keyword context and flow\n  - Analyze readability for search intent` : ''}
    - Check formatting
    - Review paragraph length
    
    **Action Items:**  
    ✅ Suggest structural improvements${keyword ? ` for better keyword context` : ''}
    ✅ Recommend formatting changes
    
    ---

    ${keyword ? `
    **Search Intent Analysis:**  
    - Identify primary search intent for "${keyword}"
    - Analyze competitor keyword usage
    - Check keyword difficulty and volume
    
    **Content Opportunities:**  
    ✅ Suggest content types matching search intent
    ✅ Recommend related keywords to target
    ✅ Outline topic cluster strategy
    
    ---` : ''}

    ### **🚀 Top 3 Priority Fixes**  
    1. List the most critical fix${keyword ? ` for "${keyword}" optimization` : ''}
    2. Second most important improvement
    3. Third key optimization

    **Tools to Help:**  
    - Suggest relevant SEO tools${keyword ? `\n  - Recommend keyword research tools\n  - Suggest content optimization tools` : ''}
    - Include specific tool recommendations

    Note: Be specific and actionable in your analysis. Include real examples from the website where possible.${keyword ? ' Focus on optimizing for the target keyword while maintaining natural content flow.' : ''}
    `;

    // Additional insights prompt for Mixtral
    const additionalPrompt = `
    Based on the following website analysis, provide additional technical SEO insights and recommendations that complement the main analysis:

    Website: ${url}
    ${keyword ? `Target Keyword: ${keyword}` : ''}

    Please focus on:
    1. Technical SEO aspects not covered in the main analysis
    2. Advanced optimization opportunities
    3. Specific implementation details for the recommendations
    4. Emerging SEO trends that could be relevant
    5. Competitive analysis insights
    6. Performance optimization suggestions

    Format your response as a detailed technical supplement to the main analysis.
    `;

    let mainAnalysis;
    let additionalInsights;

    try {
      // Get main analysis from Claude
      mainAnalysis = await callAnthropicAPI(mainPrompt);
      
      // Get additional insights from Mixtral
      additionalInsights = await callTogetherAPI(additionalPrompt);
      
      // Combine the results
      const combinedResult = `${mainAnalysis}\n\n---\n\n### **🔧 Additional Technical Insights**\n\n${additionalInsights}`;
      
      return NextResponse.json({ result: combinedResult });
    } catch (error) {
      if (error instanceof Error && error.message === 'CREDIT_ERROR') {
        // If Claude fails due to credit issues, use Mixtral for both
        console.log('Falling back to Together API for both analyses...');
        mainAnalysis = await callTogetherAPI(mainPrompt);
        additionalInsights = await callTogetherAPI(additionalPrompt);
        
        const combinedResult = `${mainAnalysis}\n\n---\n\n### **🔧 Additional Technical Insights**\n\n${additionalInsights}`;
        
        return NextResponse.json({ result: combinedResult });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in analyze route:', error);
    return NextResponse.json({ 
      error: "API Error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 