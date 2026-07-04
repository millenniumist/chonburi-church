import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { getBulletins, createBulletin, formatBulletinFilename, isSunday } from '@/lib/bulletins';
import { v2 as cloudinary } from 'cloudinary';
import { withLogging, logError } from '@/lib/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// GET - List all bulletins
async function getHandler(request) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const result = await getBulletins({ page, limit, activeOnly });

    return NextResponse.json(result);
  } catch (error) {
    logError(request, error, { operation: 'admin_fetch_bulletins' });
    return NextResponse.json(
      { error: 'Failed to fetch bulletins', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload new bulletin
async function postHandler(request) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const date = formData.get('date');
    const titleTh = formData.get('titleTh');
    const titleEn = formData.get('titleEn');

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate it's a Sunday
    if (!isSunday(date)) {
      return NextResponse.json({ error: 'Date must be a Sunday' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Generate filename
    const filename = formatBulletinFilename(date);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary (PRIMARY — serverless has no persistent disk)
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({
        error: 'Cloudinary is not configured',
        details: 'Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET'
      }, { status: 500 });
    }

    let cloudinaryUrl;
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'church-cms/bulletins',
              resource_type: 'raw',
              public_id: filename.replace('.pdf', ''),
              format: 'pdf'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });
      cloudinaryUrl = result.secure_url;
    } catch (error) {
      logError(request, error, { operation: 'cloudinary_upload_bulletin', filename });
      return NextResponse.json({
        error: 'Failed to store bulletin file',
        details: error.message
      }, { status: 500 });
    }

    // Create database record
    const bulletin = await createBulletin({
      title: {
        th: titleTh || `สูจิบัตร ${new Date(date).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`,
        en: titleEn || `Bulletin ${new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`
      },
      date: new Date(date),
      localPath: filename, // Store relative path
      cloudinaryUrl,
      fileSize: buffer.length,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      bulletin,
      storage: {
        local: false,
        cloudinary: true
      }
    });
  } catch (error) {
    logError(request, error, { operation: 'admin_upload_bulletin' });
    return NextResponse.json(
      { error: 'Failed to upload bulletin', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
export const POST = withLogging(postHandler);
