import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { ImageUp, Trash2 } from "lucide-react"
import "./ImageDropzone.css"

interface ImageDropzoneProps {
  imageUrl?: string | null
  onImageChange: (imageDataUrl: string) => void
  onImageRemove: () => void
  onError?: (message: string) => void
  disabled?: boolean
  maxFileSizeMb?: number
  helperText?: string
  emptyLabel?: string
  className?: string
}

const DEFAULT_MAX_SIZE_MB = 5
const DEFAULT_ACCEPT = "image/png,image/jpeg,image/jpg,image/svg+xml"

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader()

  reader.onload = () => {
    if (typeof reader.result === "string") {
      resolve(reader.result)
      return
    }
    reject(new Error("Não foi possível ler a imagem selecionada."))
  }

  reader.onerror = () => {
    reject(new Error("Não foi possível ler a imagem selecionada."))
  }

  reader.readAsDataURL(file)
})

export default function ImageDropzone({
  imageUrl,
  onImageChange,
  onImageRemove,
  onError,
  disabled = false,
  maxFileSizeMb = DEFAULT_MAX_SIZE_MB,
  helperText,
  emptyLabel = "SZ",
  className = "",
}: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const maxFileSizeBytes = useMemo(() => maxFileSizeMb * 1024 * 1024, [maxFileSizeMb])

  const processFile = async (file?: File) => {
    if (!file) return
    if (disabled) return

    if (!file.type.startsWith("image/")) {
      onError?.("Selecione um arquivo de imagem válido (PNG, JPG ou SVG).")
      return
    }

    if (file.size > maxFileSizeBytes) {
      onError?.(`A imagem excede ${maxFileSizeMb}MB. Escolha um arquivo menor.`)
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      onImageChange(dataUrl)
    } catch {
      onError?.("Não foi possível processar a imagem selecionada.")
    }
  }

  const openFileDialog = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files || [])
    await processFile(file)
    event.target.value = ""
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled) return

    setIsDragActive(false)
    const [file] = Array.from(event.dataTransfer.files || [])
    await processFile(file)
  }

  return (
    <div className={`image-dropzone-wrap ${className}`.trim()}>
      <div
        className={`image-dropzone ${isDragActive ? "drag-active" : ""} ${disabled ? "disabled" : ""}`.trim()}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragActive(false)
          }
        }}
        onDrop={handleDrop}
        role="presentation"
      >
        {imageUrl ? <img src={imageUrl} alt="Logotipo do condomínio" /> : <span>{emptyLabel}</span>}
      </div>

      <div className="image-dropzone-actions">
        <button type="button" onClick={openFileDialog} disabled={disabled}>
          <ImageUp size={14} />
        </button>
        <button type="button" className="danger" onClick={onImageRemove} disabled={disabled || !imageUrl}>
          <Trash2 size={14} />
        </button>
        {helperText ? <small>{helperText}</small> : null}
      </div>

      <input
        ref={inputRef}
        className="image-dropzone-input"
        type="file"
        accept={DEFAULT_ACCEPT}
        onChange={handleFileInputChange}
        disabled={disabled}
      />
    </div>
  )
}
