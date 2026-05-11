import { useCallback, useState } from 'react'
import { Upload, X, CheckCircle } from 'lucide-react'
import Spinner from './Spinner'

interface Props {
  onUpload: (files: File[]) => Promise<void>
  loading?: boolean
}

export default function FaceUploader({ onUpload, loading }: Props) {
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles]       = useState<File[]>([])
  const [done, setDone]         = useState(false)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    addFiles(Array.from(e.dataTransfer.files))
  }, [])

  const addFiles = (newFiles: File[]) => {
    const imgs = newFiles.filter((f) => f.type.startsWith('image/'))
    setFiles((prev) => [...prev, ...imgs])
    imgs.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target!.result as string])
      reader.readAsDataURL(f)
    })
  }

  const remove = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleUpload = async () => {
    await onUpload(files)
    setDone(true)
    setFiles([])
    setPreviews([])
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition hover:border-brand-500 hover:bg-brand-50"
        onClick={() => document.getElementById('face-input')?.click()}
      >
        <Upload className="mb-2 h-6 w-6 text-gray-400" />
        <p className="text-sm text-gray-500">Перетащите фото или <span className="text-brand-600 font-medium">выберите файлы</span></p>
        <p className="text-xs text-gray-400 mt-1">Рекомендуется 3–5 фото с разных углов</p>
        <input
          id="face-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} className="h-16 w-16 rounded-lg object-cover" />
              <button
                onClick={() => remove(i)}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? <Spinner className="h-4 w-4" /> : done ? <CheckCircle className="h-4 w-4" /> : null}
          {loading ? 'Загрузка...' : done ? 'Готово' : `Загрузить ${files.length} фото`}
        </button>
      )}
    </div>
  )
}
