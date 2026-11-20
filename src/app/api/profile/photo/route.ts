import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, profilePhotos } from "@/db/schema";
import { getDashboard, validDate } from "@/lib/dashboard";
import { previewData } from "@/lib/gymrats";
import { MAX_PROFILE_PHOTO_MB, MAX_PROFILE_PHOTO_BYTES, MAX_PROFILE_PHOTO_PIXELS, PROFILE_PHOTO_PATH, PROFILE_PHOTO_TYPES } from "@/lib/photo";
import { cookies } from "next/headers";
import { checkPhotoOrigin, photoErrorResponse, ProfilePhotoError, readPhotoForm } from "@/lib/profile-photo";
import { resolveProfile } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function selectedDate(request: Request) {
  try { return validDate(new URL(request.url).searchParams.get("date")); }
  catch { throw new ProfilePhotoError("Escolha uma data válida e tente novamente."); }
}

export async function POST(request: Request) {
  try {
    checkPhotoOrigin(request);
    const jar = await cookies();
    const profile = await resolveProfile(request, jar);
    const date = selectedDate(request);
    const form = await readPhotoForm(request);
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) throw new ProfilePhotoError("Selecione uma foto para continuar.");
    if (file.size > MAX_PROFILE_PHOTO_BYTES) throw new ProfilePhotoError(`A foto deve ter no máximo ${MAX_PROFILE_PHOTO_MB} MB.`, 413);
    if (!PROFILE_PHOTO_TYPES.includes(file.type)) throw new ProfilePhotoError("Escolha uma foto JPG, PNG ou WebP.", 415);
    const input = Buffer.from(await file.arrayBuffer());
    let output: Buffer;
    try {
      const image = sharp(input, { limitInputPixels: MAX_PROFILE_PHOTO_PIXELS, failOn: "warning" });
      const metadata = await image.metadata();
      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
        throw new ProfilePhotoError("O arquivo precisa ser uma imagem JPG, PNG ou WebP válida.", 415);
      }
      if ((metadata.pages ?? 1) > 1) throw new ProfilePhotoError("Escolha uma foto estática, sem animação.");
      if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PROFILE_PHOTO_PIXELS) {
        throw new ProfilePhotoError("A resolução máxima é de 40 megapixels. Escolha uma imagem menor.");
      }
      // Auto-orient, crop to match the circular preview and re-encode without EXIF/GPS metadata.
      output = await image.rotate().resize(512, 512, { fit: "cover", position: "centre" }).webp({ quality: 86 }).toBuffer();
    } catch (error) {
      if (error instanceof ProfilePhotoError) throw error;
      throw new ProfilePhotoError("Não foi possível abrir essa imagem. Envie outra foto JPG, PNG ou WebP de até 40 megapixels.");
    }
    const avatar = `${PROFILE_PHOTO_PATH}${profile.id}?v=${randomUUID()}`;
    try {
      await db.transaction(async tx => {
        await tx.insert(profilePhotos).values({ profileId: profile.id, imageData: output.toString("base64") }).onConflictDoUpdate({
          target: profilePhotos.profileId,
          set: { imageData: output.toString("base64"), updatedAt: new Date() },
        });
        await tx.update(profiles).set({ avatar }).where(eq(profiles.id, profile.id));
      });
      return Response.json(await getDashboard(profile.id, date), { headers: { "Cache-Control": "no-store" } });
    } catch (dbErr) {
      console.warn("Database fallback in /api/profile/photo POST:", dbErr);
      const mock = previewData(date);
      mock.profile.avatar = `data:image/webp;base64,${output.toString("base64")}`;
      return Response.json(mock, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) { return photoErrorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    checkPhotoOrigin(request);
    const jar = await cookies();
    const profile = await resolveProfile(request, jar);
    const date = selectedDate(request);
    try {
      await db.transaction(async tx => {
        await tx.delete(profilePhotos).where(eq(profilePhotos.profileId, profile.id));
        await tx.update(profiles).set({ avatar: "initials" }).where(eq(profiles.id, profile.id));
      });
      return Response.json(await getDashboard(profile.id, date), { headers: { "Cache-Control": "no-store" } });
    } catch (dbErr) {
      console.warn("Database fallback in /api/profile/photo DELETE:", dbErr);
      const mock = previewData(date);
      mock.profile.avatar = "initials";
      return Response.json(mock, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) { return photoErrorResponse(error); }
}
