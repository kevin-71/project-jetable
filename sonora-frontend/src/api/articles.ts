import { request } from './client';

export interface CreateArticlePayload {
  articleUrl?: string;
  articleText?: string;
}

export interface CreateArticleResponse {
  job_id: string;
  status: 'pending';
}

export function createArticle(payload: CreateArticlePayload) {
  return request<CreateArticleResponse>('/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
