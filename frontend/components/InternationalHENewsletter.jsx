import React, { useState } from 'react';
import { Settings, Mail, RefreshCw, Copy, Download, X, Plus, Globe, Building2, Users, BookOpen, Briefcase, TrendingUp } from 'lucide-react';

export default function InternationalHENewsletter() {
  const [showSettings, setShowSettings] = useState(false);
  const [newsletter, setNewsletter] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState('');
  
  const [sources, setSources] = useState([
    { name: 'Times Higher Education', url: 'https://www.timeshighereducation.com', rss: 'https://www.timeshighereducation.com/news/rss.xml' },
    { name: 'British Council', url: 'https://www.britishcouncil.org', rss: null },
    { name: 'Universities UK', url: 'https://www.universitiesuk.ac.uk', rss: null },
    { name: 'CABS', url: 'https://charteredabs.org', rss: null },
    { name: 'Wonkhe', url: 'https://wonkhe.com', rss: 'https://wonkhe.com/feed/' }
  ]);
  
  const [emails, setEmails] = useState([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const categoryConfig = {
    'TNE Programmes': { icon: Globe, color: 'bg-blue-50 border-blue-500', textColor: 'text-blue-900' },
    'Overseas Campuses': { icon: Building2, color: 'bg-purple-50 border-purple-500', textColor: 'text-purple-900' },
    'International Partnerships': { icon: Users, color: 'bg-green-50 border-green-500', textColor: 'text-green-900' },
    'Policy & Guidance': { icon: BookOpen, color: 'bg-orange-50 border-orange-500', textColor: 'text-orange-900' },
    'Accreditation & Quality': { icon: Briefcase, color: 'bg-red-50 border-red-500', textColor: 'text-red-900' },
    'Market Trends': { icon: TrendingUp, color: 'bg-indigo-50 border-indigo-500', textColor: 'text-indigo-900' }
  };

  const addSource = () => {
    if (newSourceName && newSourceUrl && !sources.find(s => s.url === newSourceUrl)) {
      setSources([...sources, { name: newSourceName, url: newSourceUrl, rss: null }]);
      setNewSourceName('');
      setNewSourceUrl('');
    }
  };

  const removeSource = (url) => {
    setSources(sources.filter(s => s.url !== url));
  };

  const addEmail = () => {
    if (newEmail && !emails.includes(newEmail) && newEmail.includes('@')) {
      setEmails([...emails, newEmail]);
      setNewEmail('');
    }
  };

  const removeEmail = (email) => {
    setEmails(emails.filter(e => e !== email));
  };

  const analyzeContentWithClaude = async (content, sourceName) => {
    try {
      const anthropicApiKey =
        (typeof process !== 'undefined' &&
          (process.env?.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env?.REACT_APP_ANTHROPIC_API_KEY)) ||
        (typeof window !== 'undefined' ? window.ANTHROPIC_API_KEY : undefined);

      if (!anthropicApiKey) {
        console.warn('Anthropic API key not configured; skipping AI analysis.');
        return [];
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Analyze the following content from ${sourceName} and identify articles related to:
- Transnational education (TNE)
- Overseas/offshore campuses
- International educational partnerships
- Cross-border programme delivery
- Branch campus developments
- International validation and accreditation

Content:
${content.substring(0, 15000)}

Respond ONLY with valid JSON in this exact format (no markdown, no backticks):
{
  "articles": [
    {
      "title": "article title",
      "summary": "2-3 sentence summary focused on TNE/international aspects",
      "category": "one of: TNE Programmes, Overseas Campuses, International Partnerships, Policy & Guidance, Accreditation & Quality, Market Trends",
      "relevance": "high/medium/low"
    }
  ]
}

If no relevant articles found, return: {"articles": []}

DO NOT include anything except valid JSON. No explanations, no markdown formatting.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text.trim();
      
      // Strip markdown code blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const result = JSON.parse(responseText);
      return result.articles.filter(a => a.relevance === 'high' || a.relevance === 'medium');
    } catch (error) {
      console.error('Claude analysis error:', error);
      return [];
    }
  };

  const fetchFromSource = async (source) => {
    try {
      setProgress(`Fetching from ${source.name}...`);
      
      // Try RSS first if available
      if (source.rss) {
        const response = await fetch(source.rss);
        if (response.ok) {
          const text = await response.text();
          return { content: text, type: 'rss' };
        }
      }
      
      // Try main URL
      const response = await fetch(source.url);
      if (response.ok) {
        const text = await response.text();
        return { content: text, type: 'html' };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching ${source.name}:`, error);
      return null;
    }
  };

  const generateNewsletter = async () => {
    setIsGenerating(true);
    setProgress('Starting newsletter generation...');
    
    try {
      const allArticles = [];
      
      for (const source of sources) {
        setProgress(`Fetching content from ${source.name}...`);
        
        const fetchedData = await fetchFromSource(source);
        
        if (fetchedData) {
          setProgress(`Analyzing content from ${source.name} with AI...`);
          
          const articles = await analyzeContentWithClaude(fetchedData.content, source.name);
          
          articles.forEach(article => {
            allArticles.push({
              ...article,
              source: source.name,
              url: source.url,
              date: new Date().toISOString()
            });
          });
          
          setProgress(`Found ${articles.length} relevant articles from ${source.name}`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (allArticles.length === 0) {
        setProgress('No articles found. This might be due to website access restrictions.');
        
        // Provide sample data for demonstration
        allArticles.push(
          {
            title: "UK-Singapore Partnership Launches New TNE Framework",
            source: "Sample Data (Real fetch restricted)",
            url: "#",
            summary: "New collaborative framework establishes quality standards for transnational programme delivery between UK and Singaporean institutions, focusing on dual validation processes.",
            category: "TNE Programmes",
            date: new Date().toISOString()
          },
          {
            title: "British Council Reports 25% Growth in International Partnerships",
            source: "Sample Data (Real fetch restricted)",
            url: "#",
            summary: "Latest report shows significant increase in articulation agreements and joint degree programmes across Asia-Pacific region, particularly in business and engineering disciplines.",
            category: "International Partnerships",
            date: new Date().toISOString()
          },
          {
            title: "New Overseas Campus Opens in Dubai Knowledge Park",
            source: "Sample Data (Real fetch restricted)",
            url: "#",
            summary: "Leading UK business school establishes full branch campus offering MBA and undergraduate programmes, with local accreditation and UK degree validation.",
            category: "Overseas Campuses",
            date: new Date().toISOString()
          },
          {
            title: "QAA Publishes Updated TNE Quality Guidelines",
            source: "Sample Data (Real fetch restricted)",
            url: "#",
            summary: "Quality Assurance Agency releases comprehensive guidance on maintaining academic standards across international programme delivery and validation arrangements.",
            category: "Policy & Guidance",
            date: new Date().toISOString()
          }
        );
      }

      const categories = [...new Set(allArticles.map(a => a.category))];
      
      const generatedNewsletter = {
        date: new Date().toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        articles: allArticles,
        categories: categories,
        articleCount: allArticles.length
      };

      setNewsletter(generatedNewsletter);
      setProgress(`Newsletter generated with ${allArticles.length} articles!`);
      
    } catch (error) {
      console.error('Error generating newsletter:', error);
      setProgress('Error generating newsletter. Please try again.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress('');
      }, 2000);
    }
  };

  const copyToClipboard = async () => {
    const container = document.getElementById('newsletter-content');
    if (!container) {
      alert('Generate the newsletter before copying the HTML.');
      return;
    }

    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f9fafb; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
          .header h1 { margin: 0 0 5px 0; font-size: 28px; }
          .header p { margin: 0; opacity: 0.9; font-size: 14px; }
          .category-section { margin-bottom: 25px; }
          .category-title { font-size: 20px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
          .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
          .article-card { background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .article-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; line-height: 1.4; }
          .article-title a { color: #1e3a8a; text-decoration: none; }
          .article-source { color: #6b7280; font-size: 11px; margin-bottom: 8px; }
          .article-summary { font-size: 12px; line-height: 1.5; color: #374151; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px; }
        </style>
      </head>
      <body>
        ${container.innerHTML}
      </body>
      </html>
    `;

    if (!navigator || !navigator.clipboard || !navigator.clipboard.writeText) {
      alert('Clipboard API not available in this browser.');
      return;
    }

    try {
      await navigator.clipboard.writeText(fullHTML);
      alert('Newsletter HTML copied to clipboard!');
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      alert('Unable to copy HTML to clipboard.');
    }
  };

  const downloadHTML = () => {
    const container = document.getElementById('newsletter-content');
    if (!container) {
      alert('Generate the newsletter before downloading the HTML.');
      return;
    }

    const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:900px;margin:0 auto;padding:20px;background:#f9fafb}.header{background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:white;padding:30px;border-radius:8px;margin-bottom:20px}.header h1{margin:0 0 5px 0;font-size:28px}.header p{margin:0;opacity:0.9;font-size:14px}.category-section{margin-bottom:25px}.category-title{font-size:20px;font-weight:bold;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb}.articles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:15px}.article-card{background:white;padding:15px;border-radius:6px;border-left:3px solid #3b82f6;box-shadow:0 1px 3px rgba(0,0,0,0.1)}.article-title{font-weight:600;font-size:14px;margin-bottom:6px;line-height:1.4}.article-title a{color:#1e3a8a;text-decoration:none}.article-source{color:#6b7280;font-size:11px;margin-bottom:8px}.article-summary{font-size:12px;line-height:1.5;color:#374151}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:11px}</style></head><body>${container.innerHTML}</body></html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intl-he-newsletter-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
  };

  const sendNewsletter = () => {
    if (emails.length === 0) {
      alert('Please add email recipients in Settings first.');
      return;
    }

    setIsSending(true);
    
    const subject = `International HE Newsletter - ${newsletter.date}`;
    const body = `International Higher Education Newsletter\n\n${newsletter.articleCount} articles on TNE, overseas campuses, and international partnerships.\n\nView the full formatted newsletter in the attached HTML file.`;
    const mailtoLink = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
    
    setTimeout(() => {
      setIsSending(false);
      alert('Email client opened. For automated sending, deploy this app with an email service (instructions available).');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6" />
              International HE Newsletter
            </h1>
            <p className="text-blue-200 text-xs">TNE, Overseas Campuses & International Partnerships</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* News Sources */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">News Sources</h3>
                <div className="space-y-1 mb-2">
                  {sources.map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <div className="flex-1 truncate">
                        <div className="font-medium text-gray-900">{source.name}</div>
                        <div className="text-xs text-gray-500 truncate">{source.url}</div>
                      </div>
                      <button
                        onClick={() => removeSource(source.url)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Source name"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="Source URL"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addSource}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Recipients */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Email Recipients</h3>
                <div className="space-y-1 mb-2">
                  {emails.map((email, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        onClick={() => removeEmail(email)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {emails.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No recipients added</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addEmail}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Action Buttons */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={generateNewsletter}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 font-semibold shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Newsletter'}
          </button>
          
          {newsletter && (
            <>
              <button
                onClick={sendNewsletter}
                disabled={isSending || emails.length === 0}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 font-semibold shadow-md"
              >
                <Mail className="w-4 h-4" />
                {isSending ? 'Sending...' : 'Send Newsletter'}
              </button>
              
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2 font-semibold shadow-md"
              >
                <Copy className="w-4 h-4" />
                Copy HTML
              </button>
              
              <button
                onClick={downloadHTML}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2 font-semibold shadow-md"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </>
          )}
        </div>

        {/* Progress */}
        {progress && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            {progress}
          </div>
        )}

        {/* Newsletter Display */}
        {!newsletter && !isGenerating && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Ready to Generate</h2>
            <p className="text-sm text-gray-500">Click "Generate Newsletter" to fetch the latest international HE news</p>
          </div>
        )}

        {newsletter && (
          <div id="newsletter-content" className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Newsletter Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6">
              <h1 className="text-2xl font-bold mb-1">International Higher Education Newsletter</h1>
              <p className="text-sm text-blue-200">{newsletter.date} • {newsletter.articleCount} articles</p>
            </div>

            {/* Content */}
            <div className="p-4">
              {newsletter.categories.map(category => {
                const categoryArticles = newsletter.articles.filter(a => a.category === category);
                if (categoryArticles.length === 0) return null;
                
                const config = categoryConfig[category] || categoryConfig['International Partnerships'];
                const IconComponent = config.icon;
                
                return (
                  <div key={category} className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <IconComponent className={`w-5 h-5 ${config.textColor}`} />
                      <h2 className={`text-base font-bold ${config.textColor}`}>{category}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryArticles.map((article, idx) => (
                        <div key={idx} className={`p-3 ${config.color} border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                          <div className="font-semibold text-sm leading-tight mb-1">
                            <a href={article.url} className={`${config.textColor} hover:underline`}>
                              {article.title}
                            </a>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {article.source}
                          </div>
                          <p className="text-xs text-gray-700 leading-snug">
                            {article.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                Curated for transnational education and international partnerships
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
