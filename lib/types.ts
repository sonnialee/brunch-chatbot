export interface BrunchArticle {
  title: string;
  url: string;
  content: string;
  date?: string;
}

export interface ArticleWithEmbedding extends BrunchArticle {
  embedding: number[];
}
