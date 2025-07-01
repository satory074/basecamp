import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export interface MicroblogPost {
  id: string
  content: string
  created_at: string
  updated_at: string
  tags: string[]
  has_code: boolean
  user_id?: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

// データベース型定義
export type Database = {
  public: {
    Tables: {
      microblogs: {
        Row: MicroblogPost
        Insert: Omit<MicroblogPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MicroblogPost, 'id' | 'created_at'>>
      }
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'created_at'>
        Update: Partial<Omit<Tag, 'id' | 'created_at'>>
      }
    }
  }
}