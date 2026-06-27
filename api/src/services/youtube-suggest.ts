export interface TopicSuggestion {
  query: string;
  score: number;
}

export async function getYouTubeSuggestions(keyword: string): Promise<TopicSuggestion[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(keyword)}&callback=`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const text = await response.text();
  // Response is JSONP-like, parse the array
  const jsonStr = text.replace(/^[^[]*/, '').replace(/[^]]*$/, '');
  const data = JSON.parse(jsonStr);

  const suggestions: TopicSuggestion[] = [];
  if (Array.isArray(data) && Array.isArray(data[1])) {
    for (const item of data[1]) {
      const query = Array.isArray(item) ? item[0] : item;
      if (typeof query === 'string') {
        suggestions.push({ query, score: 1 });
      }
    }
  }

  return suggestions;
}
