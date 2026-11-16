import { useState } from 'react';

interface ImgProps {
  src?: string;
  alt: string;
  className?: string;
}

/** Картинка с заглушкой: если файла нет или он не загрузился — серый блок. */
export default function Img({ src, alt, className }: ImgProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`img-placeholder ${className ?? ''}`} role="img" aria-label={alt} />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
