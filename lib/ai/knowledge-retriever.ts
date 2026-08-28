import { MAMAAI_KNOWLEDGE_BASE, KnowledgeChunk } from './knowledge-base';

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s\u0900-\u097F\u0C80-\u0CFF]/gi, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 1);
}

export function retrieveKnowledgeChunks(query: string, maxResults = 3): KnowledgeChunk[] {
    const queryTokens = tokenize(query);
    if (!queryTokens.length) {
        return MAMAAI_KNOWLEDGE_BASE.slice(0, maxResults);
    }

    const scoredChunks = MAMAAI_KNOWLEDGE_BASE.map((chunk) => {
        let score = 0;
        const chunkKeywords = chunk.keywords.map((k) => k.toLowerCase());
        const chunkIntents = chunk.intents.map((i) => i.toLowerCase());
        const chunkContent = chunk.canonicalFacts.toLowerCase();

        queryTokens.forEach((token) => {
            if (chunkKeywords.some((k) => k.includes(token))) score += 4;
            if (chunkIntents.some((i) => i.includes(token))) score += 5;
            if (chunkContent.includes(token)) score += 2;
        });

        return { chunk, score };
    });

    return scoredChunks
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map((item) => item.chunk);
}