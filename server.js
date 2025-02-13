const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Configure multer for temporary file handling
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.use(express.static('public'));
app.use(express.json());

// Get all gallery items
app.get('/api/gallery', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

// Add new gallery item
app.post('/api/gallery', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to Supabase Storage
    const filename = `${Date.now()}-${req.file.originalname}`;
    const { data: fileData, error: uploadError } = await supabase
      .storage
      .from('gallery')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (uploadError) throw uploadError;

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('gallery')
      .getPublicUrl(filename);

    // Save item info to database
    const { data, error } = await supabase
      .from('gallery_items')
      .insert([{
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: publicUrl,
        name: req.body.name || 'Anonymous',
        message: req.body.message || ''
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});