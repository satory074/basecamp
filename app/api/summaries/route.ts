import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET handler for fetching post summaries
 */
export async function GET() {
  try {
    const dataDirectory = path.join(process.cwd(), 'public', 'data');
    const filePath = path.join(dataDirectory, 'summaries.json');

    // Check if the summaries file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Summaries file not found' },
        { status: 404 }
      );
    }

    // Read the summaries file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const summaries = JSON.parse(fileContents);

    return NextResponse.json(summaries);
  } catch (error) {
    console.error('Error reading summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    );
  }
}
