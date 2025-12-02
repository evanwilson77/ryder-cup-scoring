# Firebase Storage Setup for Media Integration

This document contains the Firebase Storage security rules you need to apply to enable photo and video uploads in your Ryder Cup application.

## Setup Steps

### 1. Enable Firebase Storage

If you haven't already enabled Firebase Storage for your project:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Storage" in the left sidebar
4. Click "Get Started"
5. Choose your storage location (closest to your users)
6. Click "Done"

### 2. Apply Security Rules

You need to update your Firebase Storage security rules to allow authenticated users to upload and manage media files.

#### How to Apply Rules:

1. In Firebase Console, go to **Storage → Rules**
2. Replace the existing rules with the rules below
3. Click **Publish**

#### Security Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read all tournament media
    match /tournaments/{tournamentId}/{allPaths=**} {
      allow read: if request.auth != null;

      // Allow authenticated users to upload photos and videos
      allow create: if request.auth != null
                    && (
                      // Photos: reasonable limit after compression
                      (request.resource.contentType.matches('image/.*')
                        && request.resource.size < 5 * 1024 * 1024)  // 5 MB max
                      ||
                      // Videos: strict limit for compressed videos
                      (request.resource.contentType.matches('video/.*')
                        && request.resource.size < 15 * 1024 * 1024)  // 15 MB max
                    );

      // Allow users to delete media (admin check can be added later)
      allow delete: if request.auth != null;

      // Allow users to update metadata
      allow update: if request.auth != null;
    }
  }
}
```

#### Explanation:

- **Read access**: Any authenticated user can view media
- **Photo uploads**: Max 5 MB (plenty of room for compressed photos)
- **Video uploads**: Max 15 MB (accommodates compressed videos up to 60 seconds)
- **Delete access**: Any authenticated user can delete (you can add admin-only checks later)
- **Update access**: Any authenticated user can update metadata

### 3. Update Firestore Security Rules

You also need to add rules for the new `media` collection in Firestore.

#### How to Apply:

1. In Firebase Console, go to **Firestore Database → Rules**
2. Add the rules below to your existing rules
3. Click **Publish**

#### Firestore Rules for Media Collection:

Add this to your existing Firestore rules:

```javascript
match /media/{mediaId} {
  // Allow authenticated users to read all media
  allow read: if request.auth != null;

  // Allow authenticated users to create media documents
  allow create: if request.auth != null
                && request.resource.data.tournamentId is string
                && request.resource.data.type in ['photo', 'video'];

  // Allow authenticated users to update media (e.g., captions)
  allow update: if request.auth != null;

  // Allow authenticated users to delete media
  // TODO: Add admin-only check later
  allow delete: if request.auth != null;
}
```

### 4. Create Required Indexes

The media gallery queries by tournament and sorts by upload date. You may need to create a composite index:

1. Try using the app - you'll get an error with a link if the index is needed
2. Click the link in the browser console error message
3. It will take you directly to Firebase Console with the index pre-configured
4. Click "Create Index"
5. Wait 1-2 minutes for the index to build

**Or manually create this index:**

- **Collection ID**: `media`
- **Fields to index**:
  - Field: `tournamentId`, Order: Ascending
  - Field: `uploadedAt`, Order: Descending
- **Query scope**: Collection

## Testing the Integration

After applying the rules:

1. **During a Round**: Open any scorecard scoring screen and tap the blue camera button (floating button at bottom-right)
2. **After Tournament**: Go to Leaderboard with a completed tournament and tap the camera button to upload awards photos
3. **View Gallery**: Open any tournament detail page and scroll down to see the Media Gallery section

## Security Enhancements (Optional)

For production use, consider adding:

### Admin-Only Deletes

```javascript
// In Storage rules, replace the delete rule with:
allow delete: if request.auth != null
              && request.auth.token.admin == true;

// In Firestore rules, replace the delete rule with:
allow delete: if request.auth != null
              && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
```

### File Type Restrictions

Already included in the rules above:
- Only image/* and video/* MIME types are allowed
- File size limits prevent abuse

### Rate Limiting

Consider implementing Cloud Functions to:
- Limit uploads per user per day
- Scan uploaded media for inappropriate content
- Generate thumbnails server-side
- Compress videos that are too large

## Cost Monitoring

Keep an eye on your Firebase Storage usage:

1. Go to Firebase Console → Usage and billing
2. Monitor Storage bytes stored
3. Monitor Download bandwidth
4. Set up budget alerts

**Expected costs with compression** (per tournament with 50 photos + 10 videos):
- Storage: ~165 MB = $0.004/month
- Very affordable for small tournaments

## Troubleshooting

### "Permission denied" errors

- Check that user is authenticated (logged in)
- Verify security rules are published
- Check file size doesn't exceed limits
- Verify MIME type is image/* or video/*

### "Index required" errors

- Click the link in the error message
- Or manually create the composite index as described above

### Photos not appearing

- Check browser console for errors
- Verify the media collection exists in Firestore
- Check that tournamentId matches correctly
- Try hard refresh (Ctrl+F5)

### Upload fails on mobile

- Check mobile data connection
- Verify camera permissions are granted
- Try smaller file or use the compression (automatic)
- Check browser console for errors

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify all security rules are correctly published
3. Check Firebase Console → Storage for uploaded files
4. Check Firebase Console → Firestore → media collection for documents
5. Review the MEDIA_INTEGRATION_PLAN.md for additional details

---

**Important**: These rules allow any authenticated user to upload/delete media. For production use with public access, add admin authentication checks!
