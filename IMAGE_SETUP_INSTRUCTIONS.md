# Instructions for adding your Google Drive image locally

## Option 1: Download the image locally (Recommended)

1. Open your Google Drive link: https://drive.google.com/file/d/1R0uBf3snHXs92ILvUktY4sseqrAb8TTQ/view?usp=sharing

2. Click "Download" to save the image to your computer

3. Rename the downloaded file to: `company-image.jpg` (or whatever extension it has)

4. Move the file to: `frontend/public/images/company-image.jpg`

5. Create the images directory if it doesn't exist:
   ```bash
   mkdir frontend/public/images
   ```

6. Update the image source in Home.tsx to use the local path:
   ```tsx
   src="/images/company-image.jpg"
   ```

## Option 2: Make Google Drive image publicly accessible

1. Right-click on your image in Google Drive
2. Select "Share"
3. Click "Change to anyone with the link"
4. Set permission to "Viewer"
5. Copy the new shareable link
6. Use this format: `https://drive.google.com/uc?export=view&id=YOUR_FILE_ID`

## Current Implementation

The current code tries multiple URL formats and falls back to a beautiful placeholder if the image fails to load. The placeholder shows:
- Car emoji (🚗)
- "Japan Lanka" title
- "Automobile Parts & Services" subtitle
- Green gradient background matching your theme

## Why Google Drive images might not work:

1. **CORS Policy**: Google Drive has restrictions on cross-origin requests
2. **Authentication**: The image might require Google account access
3. **File Permissions**: The file might not be set to public viewing
4. **URL Format**: Different formats work better for different scenarios

The current implementation will automatically show a professional-looking placeholder if the image fails to load, so your site will still look great!