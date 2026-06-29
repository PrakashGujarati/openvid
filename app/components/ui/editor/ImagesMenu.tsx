"use client";
import { Icon } from "@iconify/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TooltipAction } from "@/components/ui/tooltip-action";
import {
  getLibraryImageInfoList,
  deleteLibraryImage,
  formatImageFileSize,
} from "@/lib/images-library";
import type { LibraryImageInfo } from "@/lib/images-library";

interface ImagesMenuProps {
  onAddImageToTrack?: (imageId: string) => void;
  onImageUpload?: (file: File) => void;
  onImageDeleteFromLibrary?: (imageId: string) => void;
  imagesInTrackIds?: string[];
  refreshTrigger?: number;
  isUploading?: boolean;
}

export function ImagesMenu({
  onAddImageToTrack,
  onImageUpload,
  onImageDeleteFromLibrary,
  imagesInTrackIds = [],
  refreshTrigger,
  isUploading = false,
}: ImagesMenuProps) {
  const t = useTranslations("imagesMenu");
  const [images, setImages] = useState<LibraryImageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    try {
      setImages(await getLibraryImageInfoList());
    } catch (e) {
      console.error("Error loading images:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteLibraryImage(id);
      setImages((prev) => prev.filter((v) => v.id !== id));
      onImageDeleteFromLibrary?.(id);
    } catch (e) {
      console.error("Error deleting image:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = (id: string) => {
    onAddImageToTrack?.(id);
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImageUpload) onImageUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onImageUpload]
  );

  const triggerFileUpload = () => fileInputRef.current?.click();

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/") && onImageUpload) onImageUpload(file);
  };

  return (
    <div
      className="p-4 flex flex-col gap-5 h-full relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09090B]/90 backdrop-blur-sm border-2 border-blue-500 border-dashed rounded-xl m-2"
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-14 h-14 rounded-full bg-blue-500/20 border flex items-center justify-center border-blue-500/50 text-blue-400 mb-4 scale-110">
              <Icon icon="solar:upload-minimalistic-bold" className="text-2xl" />
            </div>
            <p className="text-blue-400 font-medium text-sm">{t("dropzone")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={handleFileSelect} className="hidden" />

      <div className="flex items-center gap-2 text-white font-medium">
        <Icon icon="solar:gallery-outline" width="20" aria-hidden="true" />
        <span>{t("title")}</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8" role="status">
            <Icon icon="svg-spinners:ring-resize" width="24" className="text-white/40" />
          </div>
        ) : images.length === 0 ? (
          <div
            onClick={triggerFileUpload}
            className="group bg-[#09090B] border border-dashed border-white/10 hover:border-white/30 hover:bg-white/3 squircle-element p-8 text-center cursor-pointer transition-colors"
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); triggerFileUpload(); } }}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <Icon icon="solar:gallery-add-outline" width="24" className="text-white/40 group-hover:text-white/70 transition-colors" />
            </div>
            <p className="text-sm font-medium text-white/70 mb-1">{t("emptyState.title")}</p>
            <p className="text-xs text-white/40 mb-5">{t("emptyState.instruction")}</p>
            <Button disabled={isUploading} variant="outline" className="w-full text-xs">
              <span>{t("upload.action")}</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={triggerFileUpload} disabled={isUploading} variant="outline" className="w-full text-xs mb-4 group">
              <Icon icon="solar:gallery-add-outline" width="16" className="group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-sm">{t("upload.button")}</span>
            </Button>

            <AnimatePresence mode="popLayout">
              {images.map((image) => (
                <motion.div
                  key={image.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  className={`group bg-[#09090B] border squircle-element overflow-hidden transition-colors ${
                    imagesInTrackIds.includes(image.id) ? "border-blue-500/50 bg-blue-500/5" : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex gap-3 p-2.5 items-center">
                    <div
                      className="relative w-20 h-12 rounded-md overflow-hidden bg-black/50 shrink-0 cursor-pointer"
                      onClick={() => handleAdd(image.id)}
                    >
                      <img src={image.thumbnailUrl} alt={image.fileName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center transition-all bg-black/60 opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-0.5 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                          <Icon icon="material-symbols:add-rounded" width="16" className="text-white" />
                          <span className="text-[9px] font-bold text-white tracking-wider">{t("actions.add")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-xs text-white/80 truncate" title={image.fileName}>{image.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/40">{formatImageFileSize(image.fileSize)}</span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-white/40">{image.width}×{image.height}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipAction label={t("actions.delete")}>
                        <button
                          onClick={() => handleDelete(image.id)}
                          disabled={deletingId === image.id}
                          className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === image.id ? <Icon icon="svg-spinners:ring-resize" width="16" /> : <Icon icon="solar:trash-bin-trash-outline" width="16" />}
                        </button>
                      </TooltipAction>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="text-[10px] text-white/25 text-center pt-2 border-t border-white/5 shrink-0">
        {t("footer")}
      </div>
    </div>
  );
}
