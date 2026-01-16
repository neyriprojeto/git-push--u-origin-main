
export type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  date: string;
  imageUrl?: string;
};

export const posts: Post[] = [];
