# Home Customization Web Application

## Storage Configuration

This application uses Supabase for file storage (3D models) and Firebase for authentication and database functionality.

### Supabase Setup

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Storage in the Supabase dashboard
4. Create a new bucket named `models` with the following settings:
   - Public access: OFF
   - File size limit: 50MB
5. Get your Supabase URL and anon key from the API settings
6. Add these values to your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Firebase Setup

The application continues to use Firebase for authentication and database functionality. Firebase configuration is already set up in the project.
