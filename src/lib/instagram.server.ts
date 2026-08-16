/**
 * Server-only Instagram API functionality.
 * Handles connection validation and media container creation via Instagram API with Instagram Login.
 */

// Authoritative mapping of 12 Jyotirlinga Vite-generated production assets
export const JYOTIRLINGA_VITE_ASSET_MAP: Record<string, string> = {
  somnath: "jl-somnath-_E8HatTl.jpg",
  mallikarjuna: "jl-mallikarjuna-BEz29jN3.jpg",
  mahakaleshwar: "jl-mahakaleshwar-BKwTKcq5.jpg",
  omkareshwar: "jl-omkareshwar-C4da0vIX.jpg",
  kedarnath: "jl-kedarnath-CM_35SFT.jpg",
  bhimashankar: "jl-bhimashankar-BS2QbdnH.jpg",
  kashi: "jl-kashi-DFxseeu8.jpg",
  trimbakeshwar: "jl-trimbakeshwar-VyH_TWzx.jpg",
  baidyanath: "jl-baidyanath-DeQAzNE4.jpg",
  nageshwar: "jl-nageshwar-Cc6vrg5q.jpg",
  rameshwaram: "jl-rameshwaram-DpK7whjp.jpg",
  grishneshwar: "jl-grishneshwar-C6kKpUmO.jpg",
};

function getCanonicalBase(requestUrlStr?: string): string {
  const envUrl = process.env.APP_URL?.trim();
  if (
    envUrl &&
    !envUrl.includes("ais-dev-") &&
    !envUrl.includes("ais-pre-") &&
    !envUrl.includes("localhost")
  ) {
    return envUrl.replace(/\/$/, "");
  }

  if (requestUrlStr) {
    try {
      const parsed = new URL(requestUrlStr);
      if (
        !parsed.origin.includes("ais-dev-") &&
        !parsed.origin.includes("ais-pre-") &&
        !parsed.origin.includes("localhost")
      ) {
        return parsed.origin;
      }
    } catch {
      // ignore
    }
  }

  return "https://12-jyotirlingam-darshan.ai.studio";
}

// Resolves a canonical image URL using APP_URL and Vite-generated asset path
export function resolveCanonicalImageUrl(imagePathOrUrl: string, requestUrlStr?: string): string {
  if (!imagePathOrUrl) return "";

  // 0. If this is already a full public HTTPS URL (e.g., Supabase Storage URL), pass it directly through
  if (imagePathOrUrl.startsWith("https://")) {
    return imagePathOrUrl;
  }

  // 1. If this is a newly generated image in /generated/, preserve its exact path
  const isGenerated = imagePathOrUrl.includes("/generated/") || imagePathOrUrl.includes("gen-");

  let resolvedFilename = "";
  if (!isGenerated) {
    const hashedMatch = imagePathOrUrl.match(/jl-[a-z]+-[A-Za-z0-9_-]+\.jpg/);
    if (hashedMatch) {
      resolvedFilename = hashedMatch[0];
    } else {
      for (const [slug, filename] of Object.entries(JYOTIRLINGA_VITE_ASSET_MAP)) {
        if (imagePathOrUrl.toLowerCase().includes(slug)) {
          resolvedFilename = filename;
          break;
        }
      }
    }
  }

  let normalizedPath = "";
  if (resolvedFilename) {
    normalizedPath = `/assets/${resolvedFilename}`;
  } else {
    let pathname = imagePathOrUrl;
    if (imagePathOrUrl.startsWith("http://") || imagePathOrUrl.startsWith("https://")) {
      try {
        const parsed = new URL(imagePathOrUrl);
        pathname = parsed.pathname;
      } catch {
        pathname = imagePathOrUrl;
      }
    }
    normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  }

  const canonicalBase = getCanonicalBase(requestUrlStr);
  return `${canonicalBase}${normalizedPath}`;
}

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.instagram.com/${API_VERSION}`;

interface InstagramCredentials {
  userId: string;
  accessToken: string;
}

function getCredentials(): InstagramCredentials {
  const rawUserId = process.env.INSTAGRAM_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  // If handle username is passed instead of numeric ID from environment settings, resolve to the validated numeric Meta Graph API ID
  const userId = rawUserId === "__omnamahshivay__" ? "37495336300110131" : rawUserId;

  console.log("[RUNTIME DIAGNOSTIC: getCredentials]", {
    runtimeProcessEnvUserId: rawUserId,
    resolvedUserId: userId,
    typeofUserId: typeof userId,
    matchesExpectedNumericId: userId === "37495336300110131",
  });

  if (!userId) {
    throw new Error("Server misconfiguration: INSTAGRAM_USER_ID is missing.");
  }

  if (!accessToken) {
    throw new Error("Server misconfiguration: INSTAGRAM_ACCESS_TOKEN is missing.");
  }

  return { userId, accessToken };
}

/**
 * Validates the Instagram connection by requesting basic profile information.
 */
export async function validateInstagramConnection() {
  const { userId, accessToken } = getCredentials();

  try {
    const url = new URL(`${BASE_URL}/${userId}`);
    url.searchParams.append("fields", "id,username,name");
    url.searchParams.append("access_token", accessToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      // Do not expose access token in error message
      throw new Error(
        `Instagram API Error: ${data.error?.message || "Unknown error"} (Code: ${data.error?.code})`,
      );
    }

    return {
      success: true,
      data: {
        id: data.id,
        username: data.username,
        name: data.name,
      },
    };
  } catch (error) {
    console.error(
      "Failed to validate Instagram connection:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error(
      error instanceof Error ? error.message : "Failed to validate Instagram connection",
    );
  }
}

/**
 * Creates an Instagram media container for an image.
 * Note: This only creates the container; it does NOT publish it to the feed yet.
 */
export async function createInstagramMediaContainer(imageUrl: string, caption?: string) {
  const { userId, accessToken } = getCredentials();

  const endpointPath = `${BASE_URL}/${userId}/media`;
  console.log("[META CONTAINER DIAGNOSTIC: IMAGE]", {
    postType: "image",
    mediaType: "image",
    hasImageUrl: Boolean(imageUrl),
    hasVideoUrl: false,
    endpointPath,
  });

  if (!imageUrl.startsWith("https://")) {
    throw new Error("Invalid image URL: Must be an HTTPS URL.");
  }

  try {
    const url = new URL(endpointPath);

    const body = new URLSearchParams();
    body.append("image_url", imageUrl);
    if (caption) {
      body.append("caption", caption);
    }
    body.append("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      body: body,
    });

    const data = await response.json();

    if (!response.ok) {
      // Do not expose access token in error message
      throw new Error(
        `Instagram API Error: ${data.error?.message || "Unknown error"} (Code: ${data.error?.code})`,
      );
    }

    return {
      success: true,
      containerId: data.id,
    };
  } catch (error) {
    console.error(
      "Failed to create Instagram media container:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error(
      error instanceof Error ? error.message : "Failed to create Instagram media container",
    );
  }
}

/**
 * Creates an Instagram media container for a single carousel item (image or video).
 */
export async function createInstagramCarouselItemContainer(
  mediaUrl: string,
  mediaType: "image" | "video" = "image",
) {
  const { userId, accessToken } = getCredentials();
  const endpointPath = `${BASE_URL}/${userId}/media`;

  if (!mediaUrl.startsWith("https://")) {
    throw new Error("Invalid media URL: Must be an HTTPS URL.");
  }

  try {
    const url = new URL(endpointPath);
    const body = new URLSearchParams();

    if (mediaType === "video") {
      body.append("media_type", "VIDEO");
      body.append("video_url", mediaUrl);
    } else {
      body.append("image_url", mediaUrl);
    }
    body.append("is_carousel_item", "true");
    body.append("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      body: body,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Instagram Carousel Item Error: ${data.error?.message || "Unknown error"} (Code: ${data.error?.code})`,
      );
    }

    return {
      success: true,
      containerId: data.id,
    };
  } catch (error) {
    console.error(
      "Failed to create carousel item container:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error(
      error instanceof Error ? error.message : "Failed to create carousel item container",
    );
  }
}

/**
 * Creates an Instagram carousel container holding multiple child container IDs.
 */
export async function createInstagramCarouselContainer(
  childrenContainerIds: string[],
  caption?: string,
) {
  const { userId, accessToken } = getCredentials();
  const endpointPath = `${BASE_URL}/${userId}/media`;

  if (!childrenContainerIds || childrenContainerIds.length < 2) {
    throw new Error("Instagram Carousel requires at least 2 child media containers.");
  }

  try {
    const url = new URL(endpointPath);
    const body = new URLSearchParams();

    body.append("media_type", "CAROUSEL");
    body.append("children", childrenContainerIds.join(","));
    if (caption) {
      body.append("caption", caption);
    }
    body.append("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      body: body,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Instagram Carousel Container Error: ${data.error?.message || "Unknown error"} (Code: ${data.error?.code})`,
      );
    }

    return {
      success: true,
      containerId: data.id,
    };
  } catch (error) {
    console.error(
      "Failed to create carousel parent container:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error(
      error instanceof Error ? error.message : "Failed to create carousel parent container",
    );
  }
}

/**
 * Creates an Instagram media container for a Reel / Video.
 */
export async function createInstagramReelContainer(videoUrl: string, caption?: string) {
  const { userId, accessToken } = getCredentials();
  const endpointPath = `${BASE_URL}/${userId}/media`;

  if (!videoUrl.startsWith("https://")) {
    throw new Error("Invalid video URL: Must be an HTTPS URL.");
  }

  try {
    const url = new URL(endpointPath);
    const body = new URLSearchParams();

    body.append("media_type", "REELS");
    body.append("video_url", videoUrl);
    if (caption) {
      body.append("caption", caption);
    }
    body.append("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      body: body,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Instagram Reel Error: ${data.error?.message || "Unknown error"} (Code: ${data.error?.code})`,
      );
    }

    return {
      success: true,
      containerId: data.id,
    };
  } catch (error) {
    console.error(
      "Failed to create Instagram Reel container:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error(
      error instanceof Error ? error.message : "Failed to create Instagram Reel container",
    );
  }
}

/**
 * Publishes a previously created Instagram media container to the feed.
 */
export async function publishInstagramMedia(creationId: string) {
  const { userId, accessToken } = getCredentials();

  const endpointPath = `${BASE_URL}/${userId}/media_publish`;
  console.log("[RUNTIME DIAGNOSTIC: publishInstagramMedia]", {
    userId,
    endpointPathWithoutSecrets: endpointPath,
  });

  if (!creationId) {
    throw new Error("Invalid creation ID: Creation ID is required to publish media.");
  }

  try {
    const url = new URL(endpointPath);

    const body = new URLSearchParams();
    body.append("creation_id", creationId);
    body.append("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      body: body,
    });

    const data = await response.json();

    if (!response.ok) {
      // Do not expose access token in error message
      throw new Error(
        `Instagram API Error: ${data.error?.message || "Unknown error"} (Code: ${data.error?.code})`,
      );
    }

    return {
      success: true,
      mediaId: data.id,
    };
  } catch (error) {
    console.error(
      "Failed to publish Instagram media:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error(error instanceof Error ? error.message : "Failed to publish Instagram media");
  }
}

/**
 * Polls the Instagram media container until it reaches FINISHED status or encounters an error/timeout.
 */
export async function waitForInstagramMediaReady(
  creationId: string,
  maxWaitMs: number = 60000,
  pollIntervalMs: number = 3000,
): Promise<{ ready: boolean; statusCode: string }> {
  if (!creationId || typeof creationId !== "string" || creationId.trim().length === 0) {
    throw new Error("Invalid creation ID: Creation ID is required to check media status.");
  }

  const { accessToken } = getCredentials();
  const trimmedId = creationId.trim();
  const startTime = Date.now();
  let attempt = 0;

  console.log("[SOCIAL DEBUG] Waiting for container readiness", {
    creationId: trimmedId,
    maxWaitSeconds: maxWaitMs / 1000,
  });

  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    const statusUrl = new URL(`${BASE_URL}/${trimmedId}`);
    statusUrl.searchParams.append("fields", "status_code,status");
    statusUrl.searchParams.append("access_token", accessToken);

    let response: Response;
    try {
      response = await fetch(statusUrl.toString(), { method: "GET" });
    } catch (networkError) {
      console.error("[SOCIAL DEBUG] Network error polling container status:", networkError);
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      continue;
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || "Unknown error querying container status";
      const errCode = data.error?.code;
      throw new Error(`Instagram API Error: ${errMsg} (Code: ${errCode})`);
    }

    const statusCode = data.status_code;
    const statusDetail = data.status;

    if (statusCode === "FINISHED") {
      console.log("[SOCIAL DEBUG] Container status = FINISHED", {
        creationId: trimmedId,
        attempt,
        elapsedSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
      });
      return { ready: true, statusCode: "FINISHED" };
    }

    if (statusCode === "ERROR") {
      console.error("[SOCIAL DEBUG] Container status = ERROR", {
        creationId: trimmedId,
        status: statusDetail,
      });
      throw new Error(
        `Instagram media container processing failed with status: ${statusDetail || "ERROR"}`,
      );
    }

    if (statusCode === "EXPIRED") {
      console.error("[SOCIAL DEBUG] Container status = EXPIRED", {
        creationId: trimmedId,
      });
      throw new Error("Instagram media container expired before publishing.");
    }

    if (statusCode === "IN_PROGRESS") {
      console.log("[SOCIAL DEBUG] Container status = IN_PROGRESS", {
        creationId: trimmedId,
        attempt,
        elapsedSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
      });
    } else {
      console.log(`[SOCIAL DEBUG] Container status = ${statusCode || "UNKNOWN"}`, {
        creationId: trimmedId,
        attempt,
      });
    }

    const remainingTime = maxWaitMs - (Date.now() - startTime);
    if (remainingTime > 0) {
      const sleepTime = Math.min(pollIntervalMs, remainingTime);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
  }

  throw new Error(
    `Timeout waiting for Instagram media container ${trimmedId} to be ready after ${maxWaitMs / 1000}s. Post was NOT published.`,
  );
}
