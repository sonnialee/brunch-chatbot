export interface BrunchArticle {
  title: string;
  url: string;
  content: string;
  date?: string;
  thumbnail?: string | null;
  subTitle?: string;
}

export interface ArticleWithEmbedding extends BrunchArticle {
  embedding: number[];
}
