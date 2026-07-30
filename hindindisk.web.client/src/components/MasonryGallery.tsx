export type MasonryImage = { url: string; title?: string };

type MasonryGalleryProps = {
  images: MasonryImage[];
  onImageClick?: (index: number) => void;
};

export function MasonryGallery({ images, onImageClick }: MasonryGalleryProps) {
  return (
    <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 lg:items-center">
      {images.map((img, i) => (
        <button
          key={`${img.url}-${i}`}
          type="button"
          data-tagid={`button-masonry-image-${i}`}
          onClick={() => onImageClick?.(i)}
          className="group relative flex w-full items-center justify-center break-inside-avoid overflow-hidden rounded-2xl shadow-soft transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-elegant"
        >
          <img src={img.url} alt={img.title || ""} className="w-full" loading="lazy" decoding="async" />
          {img.title && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-sm font-semibold text-white">{img.title}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
