import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
  };
}

export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'Internal server error'
): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message: process.env.NODE_ENV === 'production' ? defaultMessage : error.message,
          statusCode: 500,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: {
        message: defaultMessage,
        statusCode: 500,
      },
    },
    { status: 500 }
  );
}

export function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new ApiError(
      `Environment variable ${name} is not configured`,
      500,
      'ENV_VAR_MISSING'
    );
  }
  return value;
}