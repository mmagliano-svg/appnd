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
      people: {
        Row: {
          id: string
          owner_id: string
          name: string
          avatar_url: string | null
          status: 'ghost' | 'invited' | 'active'
          linked_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          avatar_url?: string | null
          status?: 'ghost' | 'invited' | 'active'
          linked_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          avatar_url?: string | null
          status?: 'ghost' | 'invited' | 'active'
          linked_user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      memory_people: {
        Row: {
          memory_id: string
          person_id: string
          added_by: string
          created_at: string
        }
        Insert: {
          memory_id: string
          person_id: string
          added_by: string
          created_at?: string
        }
        Update: {
          memory_id?: string
          person_id?: string
          added_by?: string
          created_at?: string
        }
        Relationships: []
      }
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
      memory_likes: {
        Row: {
          memory_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          memory_id: string
          user_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      memory_messages: {
        Row: {
          id: string
          memory_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      shared_stories: {
        Row: {
          id: string
          token: string
          user_id: string
          year: number
          month: number
          memory_ids: string[]
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          token?: string
          user_id: string
          year: number
          month: number
          memory_ids: string[]
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          user_id?: string
          year?: number
          month?: number
          memory_ids?: string[]
          title?: string
          created_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          type: string
          created_by: string
          invite_token: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string
          created_by: string
          invite_token?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_by?: string
          invite_token?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string | null
          invited_email: string | null
          joined_at: string | null
          role: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id?: string | null
          invited_email?: string | null
          joined_at?: string | null
          role?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string | null
          invited_email?: string | null
          joined_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      memories: {
        Row: {
          id: string
          title: string
          description: string | null
          happened_at: string
          start_date: string
          end_date: string | null
          parent_period_id: string | null
          location_name: string | null
          category: string | null
          categories: string[]
          tags: string[]
          is_anniversary: boolean
          is_first_time: boolean
          created_by: string
          created_at: string
          updated_at: string
          group_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          happened_at?: string
          start_date: string
          end_date?: string | null
          parent_period_id?: string | null
          location_name?: string | null
          category?: string | null
          categories?: string[]
          tags?: string[]
          is_anniversary?: boolean
          is_first_time?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          group_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          happened_at?: string
          start_date?: string
          end_date?: string | null
          parent_period_id?: string | null
          location_name?: string | null
          category?: string | null
          categories?: string[]
          tags?: string[]
          is_anniversary?: boolean
          is_first_time?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'memories_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memories_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
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
