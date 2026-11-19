import { MAX_PROFILE_PHOTO_MB, MAX_PROFILE_PHOTO_BYTES } from "@/lib/photo";

export { PROFILE_ID_PATTERN } from "@/lib/photo";

export class ProfilePhotoError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "ProfilePhotoError";
  }
}

export function checkPhotoOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ProfilePhotoError("Requisição não autorizada.", 403);
  }
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || new URL(request.url).host;
    let originHost = "";
    try { originHost = new URL(origin).host; } catch { /* Reject malformed origins. */ }
    if (originHost !== host) throw new ProfilePhotoError("Requisição não autorizada.", 403);
  }
}

export async function readPhotoForm(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    throw new ProfilePhotoError("Envie uma imagem JPG, PNG ou WebP.", 415);
  }
  const maxBodyBytes = MAX_PROFILE_PHOTO_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length")) > maxBodyBytes) {
    throw new ProfilePhotoError(`A foto deve ter no máximo ${MAX_PROFILE_PHOTO_MB} MB.`, 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ProfilePhotoError("Selecione uma foto para continuar.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBodyBytes) {
        await reader.cancel();
        throw new ProfilePhotoError(`A foto deve ter no máximo ${MAX_PROFILE_PHOTO_MB} MB.`, 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    return await new Response(new Uint8Array(Buffer.concat(chunks)), { headers: { "Content-Type": contentType } }).formData();
  } catch {
    throw new ProfilePhotoError("Não foi possível ler o arquivo. Escolha a foto novamente.");
  }
}

export function photoErrorResponse(error: unknown) {
  if (error instanceof ProfilePhotoError) {
    return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("Health Runners: falha no processamento da foto", error instanceof Error ? error.name : "unknown");
  return Response.json({ error: "Não foi possível salvar sua foto agora. Tente novamente em instantes." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
