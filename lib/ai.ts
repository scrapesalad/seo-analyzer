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
      const errorText = await testResponse.text();
      throw new Error(`API key test failed: ${testResponse.status} ${testResponse.statusText} - ${errorText}`);
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
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
        response_format: { type: "text" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Together API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw Together API response:', JSON.stringify(data, null, 2));

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('Invalid response format: missing choices array');
      throw new Error('Invalid response format: missing choices array');
    }

    const firstChoice = data.choices[0];
    if (!firstChoice.message || typeof firstChoice.message.content !== 'string') {
      console.error('Invalid response format: missing or invalid message content');
      throw new Error('Invalid response format: missing or invalid message content');
    }

    const content = firstChoice.message.content.trim();
    console.log('Extracted content:', content.substring(0, 100) + '...');

    // Validate the response format
    if (!content.includes('### **SEO Analysis for')) {
      console.error('Invalid response format: missing SEO Analysis section');
      throw new Error('Invalid response format: missing SEO Analysis section');
    }

    if (!content.includes('### **Final Verdict**')) {
      console.error('Invalid response format: missing Final Verdict section');
      throw new Error('Invalid response format: missing Final Verdict section');
    }

    return content;
  } catch (error) {
    console.error('Error calling Together API:', error);
    throw error;
  }
}

export async function analyzeSEO(url: string, keyword?: string): Promise<string> {
  try {
    const prompt = `Analyze the SEO of the following URL: ${url}${keyword ? `\nTarget keyword: ${keyword}` : ''}

Please provide a comprehensive SEO analysis in the following format:

### **SEO Analysis for [URL] – Keyword: "[keyword]"**

This analysis evaluates the website's SEO performance, focusing on content quality, technical SEO, and user experience.

---

## **1. Content Depth and Quality** 📝
### **Analysis:**
- **Comprehensiveness:** [analysis of content depth]
- **User Engagement:** [analysis of user engagement elements]
- **Update Frequency:** [analysis of content freshness]

### **Action Items:**
✅ [specific action item 1]
✅ [specific action item 2]
✅ [specific action item 3]

---

## **2. URL Structure** 🔗
### **Analysis:**
- [analysis of URL structure]
- [analysis of URL optimization]

### **Action Items:**
✅ [specific action item 1]
✅ [specific action item 2]

---

## **3. H1 Title Tag** 🏷️
### **Analysis:**
- [analysis of title tag]
- [analysis of keyword usage]

### **Action Items:**
✅ [specific action item 1]
✅ [specific action item 2]

---

## **4. Internal Links** ↪️
### **Analysis:**
- [analysis of internal linking]
- [analysis of link structure]

### **Action Items:**
✅ [specific action item 1]
✅ [specific action item 2]

---

## **5. Meta Description** 📄
### **Analysis:**
- [analysis of meta description]
- [analysis of CTA effectiveness]

### **Action Items:**
✅ [specific action item 1]
✅ [specific action item 2]

---

## **6. Readability** 📖
### **Analysis:**
- [analysis of content readability]
- [analysis of content structure]

### **Action Items:**
✅ [specific action item 1]
✅ [specific action item 2]

---

## **🚀 Additional SEO & UX Recommendations**
1. [recommendation 1]
2. [recommendation 2]
3. [recommendation 3]
4. [recommendation 4]
5. [recommendation 5]

---

## **Semantic Keywords** 🔑
Based on the content and target keyword, here are the top 10 semantic keywords to consider:
- [semantic keyword 1]
- [semantic keyword 2]
- [semantic keyword 3]
- [semantic keyword 4]
- [semantic keyword 5]
- [semantic keyword 6]
- [semantic keyword 7]
- [semantic keyword 8]
- [semantic keyword 9]
- [semantic keyword 10]

---

### **Final Verdict** ✅
[summary of key findings and recommendations]

Would you like a deeper dive into **technical SEO** (e.g., crawlability, backlinks) or **content strategy**?`;

    return await callTogetherAPI(prompt);
  } catch (error) {
    console.error('Error in SEO analysis:', error);
    throw error;
  }
} 