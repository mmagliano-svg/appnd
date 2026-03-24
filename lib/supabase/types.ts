// Auto-generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
// Manual types based on schema until generation is available

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ContentType = 'text' | 'photo' | 'note'
export type MediaType = 'image' | 'video'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          id: string
          title: string
          description: string | null
          happened_at: string
          start_date: string
          end_date: string | null
          location_name: string | null
          category: string | null
          tags: string[]
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          happened_at?: string
          start_date: string
          end_date?: string | null
          location_name?: string | null
          category?: string | null
          tags?: string[]
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          happened_at?: string
          start_date?: string
          end_date?: string | null
          location_name?: string | null
          category?: string | null
          tags?: string[]
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memories_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      memory_participants: {
        Row: {
          id: string
          memory_id: string
          user_id: string | null
          invited_email: string | null
          invite_token: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          memory_id: string
          user_id?: string | null
          invited_email?: string | null
          invite_token: string
          joined_at?: string | null
        }
        Update: {
          id?: string
          memory_id?: string
          user_id?: string | null
          invited_email?: string | null
          invite_token?: string
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'memory_participants_memory_id_fkey'
            columns: ['memory_id']
            isOneToOne: false
            referencedRelation: 'memories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memory_participants_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      memory_contributions: {
        Row: {
          id: string
          memory_id: string
          author_id: string
          content_type: ContentType
          text_content: string | null
          media_url: string | null
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          author_id: string
          content_type: ContentType
          text_content?: string | null
          media_url?: string | null
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          author_id?: string
          content_type?: ContentType
          text_content?: string | null
          media_url?: string | null
          caption?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memory_contributions_memory_id_fkey'
            columns: ['memory_id']
            isOneToOne: false
            referencedRelation: 'memories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memory_contributions_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      memory_media: {
        Row: {
          id: string
          memory_id: string
          contribution_id: string | null
          uploaded_by: string
          storage_path: string
          media_type: MediaType
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          contribution_id?: string | null
          uploaded_by: string
          storage_path: string
          media_type: MediaType
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          contribution_id?: string | null
          uploaded_by?: string
          storage_path?: string
          media_type?: MediaType
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memory_media_memory_id_fkey'
            columns: ['memory_id']
            isOneToOne: false
            referencedRelation: 'memories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memory_media_contribution_id_fkey'
            columns: ['contribution_id']
            isOneToOne: false
            referencedRelation: 'memory_contributions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memory_media_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_type: ContentType
      media_type: MediaType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
