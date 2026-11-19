import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profilePhotos } from "@/db/schema";
import { photoErrorResponse, ProfilePhotoError, PROFILE_ID_PATTERN } from "@/lib/profile-photo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Avatars are served by their unguessable per-profile URL (with a version token that
// changes on every upload). This keeps <img> tags working even when the browser blocks
// cookies inside an embedded iframe, while the raw URL stays private to the app.
export async function GET(_request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const { profileId } = await params;
    if (!PROFILE_ID_PATTERN.test(profileId)) throw new ProfilePhotoError("Foto não encontrada.", 404);
    const [photo] = await db.select({ imageData: profilePhotos.imageData }).from(profilePhotos).where(eq(profilePhotos.profileId, profileId));
    if (!photo) throw new ProfilePhotoError("Foto não encontrada.", 404);
    return new Response(new Uint8Array(Buffer.from(photo.imageData, "base64")), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) { return photoErrorResponse(error); }
}
