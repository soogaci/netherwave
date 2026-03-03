import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FeelReal",
    short_name: "FeelReal",
    description: "Музыкальная соцсеть",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#7b61ff",
    icons: [
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
