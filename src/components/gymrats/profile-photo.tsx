"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, Check, CircleAlert, ImagePlus, LoaderCircle, Trash2, Upload, Users } from "lucide-react";
import { useGym } from "./context";
import { Avatar } from "./ui";
import { MAX_PROFILE_PHOTO_MB, MAX_PROFILE_PHOTO_BYTES, MAX_PROFILE_PHOTO_PIXELS, PROFILE_PHOTO_ACCEPT, PROFILE_PHOTO_TYPES } from "@/lib/photo";

type Selection = { file: File; url: string };

export function ProfilePhotoEditor({ close }: { close: () => void }) {
  const { data, busy, savePhoto } = useGym();
  const input = useRef<HTMLInputElement>(null);
  const attempt = useRef(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const hasPhoto = data.profile.avatar !== "initials";
  const disabled = busy || preparing;

  useEffect(() => () => { if (selection) URL.revokeObjectURL(selection.url); }, [selection]);
  useEffect(() => () => { attempt.current++; }, []);

  async function choosePhoto(file?: File) {
    if (!file || disabled) return;
    const currentAttempt = ++attempt.current;
    setError("");
    setConfirmRemove(false);
    if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
      setSelection(null);
      setError("Esse formato não é aceito. Escolha uma foto JPG, PNG ou WebP.");
      return;
    }
    if (!file.size || file.size > MAX_PROFILE_PHOTO_BYTES) {
      setSelection(null);
      setError(file.size ? `A foto deve ter no máximo ${MAX_PROFILE_PHOTO_MB} MB. Escolha uma imagem menor.` : "Esse arquivo está vazio. Escolha outra foto.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreparing(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > MAX_PROFILE_PHOTO_PIXELS) {
        throw new Error("A resolução máxima é de 40 megapixels. Escolha uma imagem menor.");
      }
      if (currentAttempt !== attempt.current) { URL.revokeObjectURL(url); return; }
      setSelection({ file, url });
    } catch (cause) {
      URL.revokeObjectURL(url);
      if (currentAttempt === attempt.current) {
        setSelection(null);
        setError(cause instanceof Error && cause.message.startsWith("A resolução") ? cause.message : "Não foi possível abrir essa imagem. Escolha outra foto.");
      }
    } finally { if (currentAttempt === attempt.current) setPreparing(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || disabled) return;
    setError("");
    if (await savePhoto(selection.file)) close();
    else setError("Não foi possível salvar. Confira o aviso e tente novamente ou escolha outra imagem.");
  }

  async function removePhoto() {
    setError("");
    if (await savePhoto(null)) close();
    else setError("Não foi possível remover sua foto agora. Tente novamente.");
  }

  return (
    <form className="profile-photo-editor" onSubmit={submit} aria-busy={disabled}>
      <div className="photo-preview-area">
        <div className="photo-preview-frame">
          <Avatar name={data.profile.name} avatar={selection?.url ?? data.profile.avatar} size={136} className="photo-editor-avatar" />
          {selection && <span className="photo-preview-check" aria-label="Nova foto selecionada"><Check size={16} /></span>}
          {preparing && <span className="photo-preview-loading"><LoaderCircle size={26} className="spin" /></span>}
        </div>
        <strong>{selection ? "Prévia da sua nova foto" : hasPhoto ? "Sua foto atual" : "Seu perfil, do seu jeito"}</strong>
        <p>A imagem será ajustada ao círculo automaticamente.</p>
      </div>

      <input ref={input} id="profile-photo-file" name="photo" type="file" accept={PROFILE_PHOTO_ACCEPT} hidden disabled={disabled} aria-label="Escolher foto de perfil" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void choosePhoto(file); }} />
      <div className={`photo-dropzone ${dragging ? "dragging" : ""}`} onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={event => { event.preventDefault(); setDragging(false); }} onDrop={event => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        if (event.dataTransfer.files.length > 1) { setSelection(null); setError("Escolha apenas uma foto por vez."); return; }
        void choosePhoto(event.dataTransfer.files[0]);
      }}>
        <span className="photo-upload-icon"><ImagePlus size={24} strokeWidth={1.6} /></span>
        <div className="photo-upload-copy">
          <strong>{selection ? selection.file.name : "Uma foto que tenha a sua cara"}</strong>
          <span>{selection ? `${Math.max(1, Math.round(selection.file.size / 1024)).toLocaleString("pt-BR")} KB · Pronta para salvar` : "Arraste uma imagem aqui ou escolha um arquivo."}</span>
        </div>
        <button className="button secondary" type="button" disabled={disabled} onClick={() => input.current?.click()}><Upload size={14} />{selection ? "Trocar imagem" : "Escolher foto"}</button>
        <small>JPG, PNG ou WebP · Até {MAX_PROFILE_PHOTO_MB} MB</small>
      </div>

      {error && <div className="photo-error" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}
      <div className="photo-visibility-note"><Users size={15} /><span>Sua foto aparece no perfil e no ranking do seu grupo.</span></div>

      {confirmRemove ? (
        <div className="photo-remove-confirm" role="alert">
          <strong>Remover a foto do perfil?</strong>
          <p>Suas iniciais aparecerão no lugar da foto. Seus registros e pontos não serão alterados.</p>
          <div><button type="button" className="button secondary" disabled={disabled} onClick={() => setConfirmRemove(false)}>Manter foto</button><button type="button" className="button danger" disabled={disabled} onClick={removePhoto}>{busy ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}Sim, remover</button></div>
        </div>
      ) : (
        <>
          <div className="photo-form-actions"><button type="button" className="button secondary" disabled={disabled} onClick={close}>Cancelar</button><button type="submit" className="button primary" disabled={!selection || disabled}>{busy ? <><LoaderCircle size={16} className="spin" />Salvando foto...</> : <><Camera size={16} />Salvar foto</>}</button></div>
          {!selection && hasPhoto && <button type="button" className="text-link photo-remove-link" disabled={disabled} onClick={() => setConfirmRemove(true)}><Trash2 size={13} />Remover foto atual</button>}
        </>
      )}
    </form>
  );
}
