import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AquaMaster - Akıllı Dozaj Kontrolü",
    short_name: "AquaMaster",
    description: "IoT tabanlı otomatik pompa kalibrasyon, zamanlayıcı ve dozajlama kontrol sistemi.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#060b14",
    theme_color: "#060b14",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
