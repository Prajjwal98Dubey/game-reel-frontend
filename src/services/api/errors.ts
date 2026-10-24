import { ApiErrorBodySchema } from '@/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 4xx other than 401/408/429 will fail the same way again. */
  get isPermanent(): boolean {
    return this.status >= 400 && this.status < 500 && ![401, 408, 429].includes(this.status);
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // Non-JSON error (proxy, gateway); fall through to a generic error.
    }
    const parsed = ApiErrorBodySchema.safeParse(body);
    if (parsed.success) {
      const { code, message, requestId } = parsed.data.error;
      return new ApiError(res.status, code, message, requestId);
    }
    return new ApiError(res.status, `HTTP_${res.status}`, res.statusText || 'Request failed');
  }
}

/** The response did not match the shared schema. */
export class ContractError extends Error {
  constructor(path: string, issues: string) {
    super(`Response from ${path} did not match its schema: ${issues}`);
    this.name = 'ContractError';
  }
}
