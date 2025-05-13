interface UnnownObject {
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    public override message: string,
    public override name: string,
    public statusCode: number,
    public override stack?: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.body = this.parse(body);
  }

  private parse(body: unknown): UnnownObject | undefined {
    if (typeof body === 'object' && isSerializable(body)) {
      return body as UnnownObject;
    }

    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        console.error('Error parsing body', body);
        return { body: '' };
      }
    } else if (body !== undefined) {
      return { body: String(body) };
    }

    return undefined;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.body ? { body: this.body } : {}),
    };
  }
}

function isSerializable(obj: unknown): boolean {
  try {
    JSON.stringify(obj);

    return true;
  } catch {
    return false;
  }
}
