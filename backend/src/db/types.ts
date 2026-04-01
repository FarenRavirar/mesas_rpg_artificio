import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export type UserRole = 'visitor' | 'player' | 'gm' | 'admin';

export interface UsersTable {
  id: Generated<string>;
  google_id: string;
  email: string;
  role: Generated<UserRole>;
  refresh_token: string | null;
  privacy_public: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export interface ProfilesTable {
  id: Generated<string>;
  user_id: string;
  display_name: string;
  bio: string | null;
  languages: Generated<string[]>;
  tags: Generated<string[]>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Profile = Selectable<ProfilesTable>;
export type NewProfile = Insertable<ProfilesTable>;

export interface GmProfilesTable {
  id: Generated<string>;
  user_id: string;
  slug: string;
  bio_long: string | null;
  avatar_url: string | null;
  avatar_deletehash: string | null;
  avatar_imgur_id: string | null;
  banner_url: string | null;
  banner_deletehash: string | null;
  banner_imgur_id: string | null;
  languages: Generated<string[]>;
  specialties: Generated<string[]>;
  badges: Generated<string[]>;
  tables_count: Generated<number>;
  avg_rating: number | null;
  reviews_count: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  profiles: ProfilesTable;
  gm_profiles: GmProfilesTable;
  // TODO: Add other tables from base_schema
}
