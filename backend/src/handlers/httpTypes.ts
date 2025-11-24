export interface HttpRequest {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  body: string | null;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
