import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const ImageCropper = ({ imageSrc, onConfirm, onCancel }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedImage) {
          onConfirm(croppedImage)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-[90vw] h-[80vh] bg-neutral-800 rounded-lg overflow-hidden flex flex-col">
        <div className="relative flex-1 bg-black">
            <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            // Optional: user could toggle aspect ratio? Let's genericize for now or default square for tokens
            // Actually tokens are often freeform. Let's not enforce aspect if possible,
            // but react-easy-crop enforces a view aspect.
            // We can leave aspect undefined to allow free movement BUT it crops to the box.
            // Let's force 1:1 for Tokens usually, but maybe give option?
            // "User isnt required to upload an image with the correct aspect ratio" implies they want to fix it.
            // Let's stick to 1:1 for generic tokens for now as they snap to square grid.
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            />
        </div>

        <div className="p-4 flex justify-between items-center bg-neutral-900 border-t border-neutral-700">
             <div className="flex gap-4">
                 <span className="text-white text-sm">Zoom</span>
                 <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-32"
                />
             </div>
             <div className="flex gap-2">
                 <button onClick={onCancel} className="px-4 py-2 hover:bg-neutral-700 rounded text-white font-medium">Cancel</button>
                 <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold">Crop & Import</button>
             </div>
        </div>
      </div>
    </div>
  )
}

// Helper to create the cropped blob
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/webp', 1)
  })
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

export default ImageCropper
