import { NextResponse } from "next/server";
import { writeFile, mkdir, access, constants } from "fs/promises";
import { join } from "path";

const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY;

export const dynamic = "force-dynamic";

// Ensure uploads directory exists
async function ensureUploadsDir() {
  const uploadsDir = join(process.cwd(), "public", "uploads");
  try {
    await access(uploadsDir, constants.F_OK);
  } catch (error) {
    // Directory doesn't exist, create it
    await mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

export async function POST(request: Request) {
  try {
    // Check API key
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== UPLOAD_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing API key" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const extension = file.name.split(".").pop();
    const filename = `${crypto.randomUUID()}.${extension}`;

    // Ensure uploads directory exists
    const publicPath = await ensureUploadsDir();
    const filePath = join(publicPath, filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return the relative URL where the file can be accessed
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
